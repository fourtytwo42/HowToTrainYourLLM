import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { ApiError } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

const presetSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  config: z.object({
    batchSize: z.number().int().positive(),
    epochs: z.number().int().positive(),
    learningRate: z.number().positive(),
    gradientAccumulation: z.number().int().positive(),
    loraRank: z.number().int().positive(),
    loraAlpha: z.number().int().positive(),
    dropout: z.number().min(0).max(1),
    quantization: z.string(),
    earlyStopPatience: z.number().int().positive(),
    earlyStopThreshold: z.number().positive(),
  }),
});

// Get all presets
router.get('/', async (req, res) => {
  try {
    const presets = await prisma.preset.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // Parse the config JSON string back to an object
    const parsedPresets = presets.map(preset => ({
      ...preset,
      config: JSON.parse(preset.config),
    }));
    res.json(parsedPresets);
  } catch (error) {
    console.error('Failed to fetch presets:', error);
    res.status(500).json({ error: 'Failed to fetch presets' });
  }
});

// Get preset details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const preset = await prisma.preset.findUnique({
      where: { id },
    });

    if (!preset) {
      throw new ApiError(404, 'Preset not found');
    }

    res.json(preset);
  } catch (error) {
    next(error);
  }
});

// Create a new preset
router.post('/', async (req, res) => {
  try {
    const validatedData = presetSchema.parse(req.body);
    const preset = await prisma.preset.create({
      data: {
        ...validatedData,
        config: JSON.stringify(validatedData.config),
      },
    });
    // Parse the config JSON string back to an object
    const parsedPreset = {
      ...preset,
      config: JSON.parse(preset.config),
    };
    res.status(201).json(parsedPreset);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Failed to create preset:', error);
      res.status(500).json({ error: 'Failed to create preset' });
    }
  }
});

// Update a preset
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = presetSchema.parse(req.body);
    const preset = await prisma.preset.update({
      where: { id },
      data: {
        ...validatedData,
        config: JSON.stringify(validatedData.config),
      },
    });
    // Parse the config JSON string back to an object
    const parsedPreset = {
      ...preset,
      config: JSON.parse(preset.config),
    };
    res.json(parsedPreset);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Failed to update preset:', error);
      res.status(500).json({ error: 'Failed to update preset' });
    }
  }
});

// Delete a preset
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.preset.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete preset:', error);
    res.status(500).json({ error: 'Failed to delete preset' });
  }
});

export default router; 