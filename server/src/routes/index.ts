import { Express } from 'express';
import { logger } from '../utils/logger';
import { QueueService } from '../services/queueService';
import { z } from 'zod';

const queueService = new QueueService();

// Validation schemas
const trainingJobSchema = z.object({
  modelName: z.string(),
  dataPath: z.string(),
  outputPath: z.string(),
  hyperparameters: z.object({
    batchSize: z.number().min(1).max(32),
    epochs: z.number().min(1).max(10),
    learningRate: z.number().min(1e-6).max(1e-3),
    loraRank: z.number().min(1).max(64),
    loraAlpha: z.number().min(1).max(64),
    dropout: z.number().min(0).max(0.5),
    quantization: z.enum(['none', 'q4_0', 'q4_1'])
  })
});

export function setupRoutes(app: Express) {
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // List available models
  app.get('/api/models', async (req, res) => {
    try {
      // TODO: Implement Ollama model listing
      res.json({ models: [] });
    } catch (error) {
      logger.error('Error listing models:', error);
      res.status(500).json({ error: 'Failed to list models' });
    }
  });

  // Pull a model
  app.post('/api/models/pull', async (req, res) => {
    try {
      const { modelName } = req.body;
      const jobId = await queueService.addJob({
        type: 'PULL',
        modelId: modelName
      });
      res.json({ jobId });
    } catch (error) {
      logger.error('Error pulling model:', error);
      res.status(500).json({ error: 'Failed to pull model' });
    }
  });

  // Start training
  app.post('/api/jobs/train', async (req, res) => {
    try {
      const data = trainingJobSchema.parse(req.body);
      const jobId = await queueService.addJob({
        type: 'TRAIN',
        modelId: data.modelName,
        dataPath: data.dataPath,
        outputPath: data.outputPath,
        hyperparameters: data.hyperparameters
      });
      res.json({ jobId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request data', details: error.errors });
      } else {
        logger.error('Error starting training:', error);
        res.status(500).json({ error: 'Failed to start training' });
      }
    }
  });

  // Get job status
  app.get('/api/jobs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const job = await queueService.getJob(id);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const state = await job.getState();
      const progress = await job.progress;

      res.json({
        id: job.id,
        state,
        progress,
        data: job.data
      });
    } catch (error) {
      logger.error('Error getting job status:', error);
      res.status(500).json({ error: 'Failed to get job status' });
    }
  });
} 