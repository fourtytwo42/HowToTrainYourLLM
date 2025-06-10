import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { ollamaService } from '../services/ollamaService';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'models');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${originalName}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.gguf', '.bin', '.safetensors'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .gguf, .bin, and .safetensors files are allowed.'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 * 1024 // 50GB limit
  }
});

// Search models from Ollama registry
router.post('/search', async (req, res) => {
  const { query, modelType = 'all', limit = 20 } = req.body;
  
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    console.log('🔍 Backend search request:', { query, modelType, limit });
    
    const params = new URLSearchParams({
      search: query.trim(),
      limit: limit.toString(),
      sort_by: 'pulls',
      order: 'desc'
    });

    if (modelType !== 'all') {
      params.append('model_type', modelType);
    }

    const searchUrl = `https://ollamadb.dev/api/v1/models?${params}`;
    console.log('🌐 Backend fetching from:', searchUrl);

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ModelWorkshop/1.0'
      }
    });

    console.log('📡 Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend API error:', response.status, errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data: any = await response.json();
    console.log('✅ Backend search successful, found:', data.models?.length || 0, 'models');
    
    res.json(data);
  } catch (error) {
    console.error('💥 Backend search error:', error);
    res.status(500).json({ 
      error: 'Failed to search models',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all models
router.get('/', async (req, res) => {
  try {
    const ollamaResponse = await ollamaService.listModels();
    
    // Transform Ollama response to match frontend expectations
    const models = ollamaResponse.models?.map((model: any) => ({
      id: model.name,
      name: model.name,
      context: model.details?.context_length || 4096,
      size: formatBytes(model.size)
    })) || [];
    
    res.json({ models });
  } catch (error) {
    console.error('Failed to list models:', error);
    res.status(500).json({ error: 'Failed to list models' });
  }
});

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Pull a model
router.post('/pull', async (req, res) => {
  const { model } = req.body;
  if (!model) {
    return res.status(400).json({ error: 'Model name is required' });
  }

  try {
    const jobId = await ollamaService.pullModel(model);
    res.json({ jobId, message: `Started downloading ${model}` });
  } catch (error) {
    console.error('Failed to pull model:', error);
    res.status(500).json({ error: 'Failed to pull model' });
  }
});

// Upload a model
router.post('/upload', upload.single('model'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No model file provided' });
    }

    const filePath = req.file.path;
    const modelName = `custom-${Date.now()}`;
    
    // Create a Modelfile for Ollama
    const modelfilePath = path.join(path.dirname(filePath), `${modelName}.Modelfile`);
    const modelfileContent = `FROM ${filePath}\n`;
    
    await fs.writeFile(modelfilePath, modelfileContent);
    
    // Create the model in Ollama
    await ollamaService.createModel(modelName, modelfilePath);
    
    res.json({ 
      message: 'Model uploaded successfully',
      modelName,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error('Failed to upload model:', error);
    res.status(500).json({ error: 'Failed to upload model' });
  }
});

// Generate text with a model
router.post('/:modelId/generate', async (req, res) => {
  const { modelId } = req.params;
  const { prompt, temperature = 0.7, maxTokens = 512 } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    let fullResponse = '';
    const startTime = Date.now();
    
    for await (const chunk of ollamaService.runModel(modelId, prompt, {
      temperature,
      maxTokens
    })) {
      fullResponse += chunk;
    }
    
    const endTime = Date.now();
    
    res.json({
      response: fullResponse,
      eval_duration: (endTime - startTime) * 1000000, // Convert to nanoseconds for compatibility
      model: modelId
    });
  } catch (error) {
    console.error('Failed to generate text:', error);
    res.status(500).json({ error: 'Failed to generate text' });
  }
});

// Delete a model
router.delete('/:modelId', async (req, res) => {
  const { modelId } = req.params;
  try {
    await ollamaService.deleteModel(modelId);
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete model:', error);
    res.status(500).json({ error: 'Failed to delete model' });
  }
});

export default router; 