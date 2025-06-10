import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';
import { ollamaService } from '../services/ollamaService';

const router = Router();
const prisma = new PrismaClient();

// Schema for test requests
const testSchema = z.object({
  prompt: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().positive().default(2048),
});

// Schema for batch test requests
const batchTestSchema = z.object({
  prompts: z.array(z.string().min(1)),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().positive().default(2048),
});

// Schema for model comparison requests
const comparisonSchema = z.object({
  prompt: z.string().min(1),
  modelIds: z.array(z.string().min(1)),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().positive().default(2048),
});

// Schema for saving test results
const saveTestSchema = z.object({
  modelId: z.string().min(1),
  prompt: z.string().min(1),
  response: z.string(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().positive(),
  metrics: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
});

// Test a model
router.post('/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const config = testSchema.parse(req.body);

    // Get model info
    const model = await prisma.model.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    if (model.status !== 'READY') {
      return res.status(400).json({ error: 'Model is not ready for testing' });
    }

    // Run inference
    const response = await ollamaService.runInference(model.name, config.prompt, {
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    res.json({ response });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid test configuration', details: error.errors });
    }
    console.error('Error testing model:', error);
    res.status(500).json({ error: 'Failed to test model' });
  }
});

// Stream test a model
router.post('/:modelId/stream', async (req, res) => {
  try {
    const { modelId } = req.params;
    const config = testSchema.parse(req.body);

    // Get model info
    const model = await prisma.model.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    if (model.status !== 'READY') {
      return res.status(400).json({ error: 'Model is not ready for testing' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response
    await ollamaService.streamTestModel(model.name, config.prompt, (chunk) => {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    });

    res.end();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid test configuration', details: error.errors });
    }
    console.error('Error streaming test:', error);
    res.status(500).json({ error: 'Failed to stream test' });
  }
});

// Batch test a model
router.post('/:modelId/batch', async (req, res) => {
  try {
    const { modelId } = req.params;
    const config = batchTestSchema.parse(req.body);

    // Get model info
    const model = await prisma.model.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    if (model.status !== 'READY') {
      return res.status(400).json({ error: 'Model is not ready for testing' });
    }

    // Run inference for each prompt
    const results = await Promise.all(
      config.prompts.map(async (prompt) => {
        try {
          const response = await ollamaService.runInference(model.name, prompt, {
            temperature: config.temperature,
            maxTokens: config.maxTokens,
          });
          return { prompt, response, error: null };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          return { prompt, response: null, error: errorMessage };
        }
      })
    );

    res.json({ results });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid test configuration', details: error.errors });
    }
    console.error('Error batch testing model:', error);
    res.status(500).json({ error: 'Failed to batch test model' });
  }
});

// Compare multiple models
router.post('/compare', async (req, res) => {
  try {
    const config = comparisonSchema.parse(req.body);

    // Get all models
    const models = await prisma.model.findMany({
      where: {
        id: { in: config.modelIds },
      },
    });

    if (models.length !== config.modelIds.length) {
      return res.status(404).json({ error: 'One or more models not found' });
    }

    // Check if all models are ready
    const notReadyModels = models.filter(model => model.status !== 'READY');
    if (notReadyModels.length > 0) {
      return res.status(400).json({
        error: 'One or more models are not ready for testing',
        models: notReadyModels.map(model => model.name),
      });
    }

    // Run inference for each model
    const results = await Promise.all(
      models.map(async (model) => {
        try {
          const response = await ollamaService.runInference(model.name, config.prompt, {
            temperature: config.temperature,
            maxTokens: config.maxTokens,
          });
          return {
            modelId: model.id,
            modelName: model.name,
            response,
            error: null,
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          return {
            modelId: model.id,
            modelName: model.name,
            response: null,
            error: errorMessage,
          };
        }
      })
    );

    res.json({ results });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid comparison configuration', details: error.errors });
    }
    console.error('Error comparing models:', error);
    res.status(500).json({ error: 'Failed to compare models' });
  }
});

// Stream compare multiple models
router.post('/compare/stream', async (req, res) => {
  try {
    const config = comparisonSchema.parse(req.body);

    // Get all models
    const models = await prisma.model.findMany({
      where: {
        id: { in: config.modelIds },
      },
    });

    if (models.length !== config.modelIds.length) {
      return res.status(404).json({ error: 'One or more models not found' });
    }

    // Check if all models are ready
    const notReadyModels = models.filter(model => model.status !== 'READY');
    if (notReadyModels.length > 0) {
      return res.status(400).json({
        error: 'One or more models are not ready for testing',
        models: notReadyModels.map(model => model.name),
      });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream responses from all models
    await Promise.all(
      models.map(async (model) => {
        try {
          await ollamaService.streamTestModel(model.name, config.prompt, (chunk) => {
            res.write(
              `data: ${JSON.stringify({
                modelId: model.id,
                modelName: model.name,
                chunk,
              })}\n\n`
            );
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          res.write(
            `data: ${JSON.stringify({
              modelId: model.id,
              modelName: model.name,
              error: errorMessage,
            })}\n\n`
          );
        }
      })
    );

    res.end();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid comparison configuration', details: error.errors });
    }
    console.error('Error streaming model comparison:', error);
    res.status(500).json({ error: 'Failed to stream model comparison' });
  }
});

// Get test history
router.get('/history', async (req, res) => {
  try {
    const tests = await prisma.job.findMany({
      where: { type: 'test' },
      orderBy: { createdAt: 'desc' },
      include: {
        model: true,
      },
    });
    res.json(tests);
  } catch (error) {
    console.error('Error fetching test history:', error);
    res.status(500).json({ error: 'Failed to fetch test history' });
  }
});

// Get a specific test
router.get('/:id', async (req, res) => {
  try {
    const test = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        model: true,
      },
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json(test);
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ error: 'Failed to fetch test' });
  }
});

// Save test result
router.post('/save', async (req, res) => {
  try {
    const data = saveTestSchema.parse(req.body);

    // Get model info
    const model = await prisma.model.findUnique({
      where: { id: data.modelId },
    });

    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    // Create test job
    const jobData: Prisma.JobUncheckedCreateInput = {
      type: 'test',
      status: 'COMPLETED',
      modelId: data.modelId,
      config: JSON.stringify({
        prompt: data.prompt,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
      }),
      metrics: data.metrics ? JSON.stringify(data.metrics) : null,
      completedAt: new Date(),
    };

    const test = await prisma.job.create({
      data: jobData,
      include: {
        model: true,
      },
    });

    res.json(test);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid test data', details: error.errors });
    }
    console.error('Error saving test result:', error);
    res.status(500).json({ error: 'Failed to save test result' });
  }
});

export default router; 