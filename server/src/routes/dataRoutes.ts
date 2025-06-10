import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { Request } from 'express';
import Ajv from 'ajv';

const router = Router();
const prisma = new PrismaClient();
const ajv = new Ajv();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, path.join(process.cwd(), 'data', 'raw'));
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Accept only JSON files
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Schema for data validation
const dataSchema = z.object({
  filename: z.string(),
  status: z.enum(['ready', 'processing', 'error']),
});

// JSONL validation schema
const trainingDataSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      prompt: { type: 'string' },
      completion: { type: 'string' }
    },
    required: ['prompt', 'completion']
  }
};
const validate = ajv.compile(trainingDataSchema);

// Get all data files
router.get('/', async (req, res) => {
  try {
    const data = await prisma.data.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Get a specific data file
router.get('/:id', async (req, res) => {
  try {
    const data = await prisma.data.findUnique({
      where: { id: req.params.id },
    });

    if (!data) {
      return res.status(404).json({ error: 'Data file not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Upload a new data file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create data entry
    const data = await prisma.data.create({
      data: {
        filename: req.file.filename,
        status: 'ready',
      },
    });

    res.status(201).json(data);
  } catch (error) {
    console.error('Error uploading data:', error);
    res.status(500).json({ error: 'Failed to upload data' });
  }
});

// Upload training data
router.post('/upload-training', async (req, res) => {
  try {
    const data = req.body;
    
    if (!validate(data)) {
      return res.status(400).json({ 
        error: 'Invalid data format',
        details: validate.errors 
      });
    }

    // Generate unique filename
    const filename = `data_${Date.now()}.jsonl`;
    const filepath = path.join(process.cwd(), 'data', 'raw', filename);

    // Ensure directory exists
    await fs.mkdir(path.dirname(filepath), { recursive: true });

    // Write data to file
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));

    res.json({ 
      message: 'Data uploaded successfully',
      filename 
    });
  } catch (error) {
    console.error('Failed to upload data:', error);
    res.status(500).json({ error: 'Failed to upload data' });
  }
});

// List uploaded datasets
router.get('/training-datasets', async (req, res) => {
  try {
    const rawDir = path.join(process.cwd(), 'data', 'raw');
    const files = await fs.readdir(rawDir);
    
    const datasets = await Promise.all(
      files
        .filter(file => file.endsWith('.jsonl'))
        .map(async file => {
          const stats = await fs.stat(path.join(rawDir, file));
          return {
            filename: file,
            size: stats.size,
            createdAt: stats.birthtime
          };
        })
    );

    res.json(datasets);
  } catch (error) {
    console.error('Failed to list datasets:', error);
    res.status(500).json({ error: 'Failed to list datasets' });
  }
});

// Delete a data file
router.delete('/:id', async (req, res) => {
  try {
    const data = await prisma.data.findUnique({
      where: { id: req.params.id },
    });

    if (!data) {
      return res.status(404).json({ error: 'Data file not found' });
    }

    // Delete the file from disk
    const filePath = path.join(process.cwd(), 'data', 'raw', data.filename);
    await fs.unlink(filePath);

    // Delete from database
    await prisma.data.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Data file deleted successfully' });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

// Delete a dataset
router.delete('/training-datasets/:filename', async (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(process.cwd(), 'data', 'raw', filename);

  try {
    await fs.unlink(filepath);
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete dataset:', error);
    res.status(500).json({ error: 'Failed to delete dataset' });
  }
});

// Validate a data file
router.post('/:id/validate', async (req, res) => {
  try {
    const data = await prisma.data.findUnique({
      where: { id: req.params.id },
    });

    if (!data) {
      return res.status(404).json({ error: 'Data file not found' });
    }

    // Read and validate the file
    const filePath = path.join(process.cwd(), 'data', 'raw', data.filename);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    // Basic validation
    if (!Array.isArray(jsonData)) {
      throw new Error('Data must be an array');
    }

    for (const item of jsonData) {
      if (!item.prompt || !item.completion) {
        throw new Error('Each item must have prompt and completion fields');
      }
    }

    // Update status
    await prisma.data.update({
      where: { id: req.params.id },
      data: { status: 'ready' },
    });

    res.json({ message: 'Data file validated successfully' });
  } catch (error: unknown) {
    console.error('Error validating data:', error);
    
    // Update status to error
    await prisma.data.update({
      where: { id: req.params.id },
      data: { status: 'error' },
    });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(400).json({ error: 'Invalid data file', details: errorMessage });
  }
});

export default router; 