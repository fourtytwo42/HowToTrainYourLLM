import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { QueueService } from '../services/queueService';
import { ollamaService } from '../services/ollamaService';

const router = Router();
const queueService = new QueueService();
const prisma = new PrismaClient();

// Schema for job operations
const jobSchema = z.object({
  baseModel: z.string(),
  dataPath: z.string(),
  outputDir: z.string(),
  batchSize: z.number().int().positive(),
  epochs: z.number().int().positive(),
  learningRate: z.number().positive(),
  loraRank: z.number().int().positive(),
  loraAlpha: z.number().positive(),
  dropout: z.number().min(0).max(1),
  quantization: z.enum(['none', 'q4_0', 'q4_1']),
  earlyStopPatience: z.number().int().positive(),
  earlyStopThreshold: z.number().positive(),
});

// Schema for training job
const trainingJobSchema = z.object({
  modelId: z.string(),
  hyperparameters: z.object({
    batchSize: z.number().min(1).max(32),
    epochs: z.number().min(1).max(10),
    learningRate: z.number().min(1e-6).max(1e-2),
    gradientAccumulation: z.number().min(1).max(16),
    loraRank: z.number().min(1).max(64),
    loraAlpha: z.number().min(1).max(64),
    dropout: z.number().min(0).max(0.5),
    quantization: z.enum(['none', 'q4_0', 'q4_1']),
    earlyStop: z.object({
      patience: z.number().min(1).max(10),
      minDelta: z.number().min(0).max(0.1)
    })
  }),
  trainingData: z.array(z.object({
    prompt: z.string(),
    completion: z.string()
  }))
});

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get a specific job
router.get('/:id', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Create a new job
router.post('/', async (req, res) => {
  try {
    const config = jobSchema.parse(req.body);

    const job = await prisma.job.create({
      data: {
        type: 'training',
        status: 'pending',
        modelId: config.baseModel,
        config: JSON.stringify(config),
      },
    });

    // Start training in the background
    // TODO: Implement training service
    console.log('Training job created:', job.id);

    res.status(201).json(job);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid job configuration', details: error.errors });
    }
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Start a training job
router.post('/train', async (req, res) => {
  try {
    const data = trainingJobSchema.parse(req.body);
    const jobId = await queueService.addJob({
      type: 'TRAIN',
      modelId: data.modelId,
      config: data
    });
    res.json({ jobId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to start training job' });
  }
});

// Get job status
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    // TODO: Implement getJob method in queueService
    res.json({ status: 'pending' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

// Get job logs
router.get('/:jobId/logs', async (req, res) => {
  try {
    const { jobId } = req.params;
    // TODO: Implement getLogs method in queueService
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get job logs' });
  }
});

// Test a trained model
router.post('/:jobId/test', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { prompt, modelId } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Use the provided modelId or default to llama3.1:8b for testing
    const testModelId = modelId || 'llama3.1:8b';
    
    // Stream response from Ollama
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    try {
      for await (const chunk of ollamaService.runModel(testModelId, prompt)) {
        res.write(chunk);
      }
      res.end();
    } catch (modelError: any) {
      res.status(500).json({ error: `Failed to run model: ${modelError.message}` });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to test model' });
  }
});

// Cancel a job
router.post('/:jobId/cancel', async (req, res) => {
  try {
    const { jobId } = req.params;
    // TODO: Implement cancelJob method in queueService
    res.json({ message: 'Job cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

// Delete a job
router.delete('/:id', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status === 'running') {
      return res.status(400).json({ error: 'Cannot delete a running job' });
    }

    await prisma.job.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

export default router; 