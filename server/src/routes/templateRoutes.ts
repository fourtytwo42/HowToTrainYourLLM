import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  template: z.string().min(1),
  variables: z.array(z.string()),
  category: z.string(),
});

// Get all templates
router.get('/', async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // Parse the variables JSON string back to an array
    const parsedTemplates = templates.map(template => ({
      ...template,
      variables: JSON.parse(template.variables),
    }));
    res.json(parsedTemplates);
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create a new template
router.post('/', async (req, res) => {
  try {
    const validatedData = templateSchema.parse(req.body);
    const template = await prisma.template.create({
      data: {
        ...validatedData,
        variables: JSON.stringify(validatedData.variables),
      },
    });
    // Parse the variables JSON string back to an array
    const parsedTemplate = {
      ...template,
      variables: JSON.parse(template.variables),
    };
    res.status(201).json(parsedTemplate);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Failed to create template:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  }
});

// Update a template
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = templateSchema.parse(req.body);
    const template = await prisma.template.update({
      where: { id },
      data: {
        ...validatedData,
        variables: JSON.stringify(validatedData.variables),
      },
    });
    // Parse the variables JSON string back to an array
    const parsedTemplate = {
      ...template,
      variables: JSON.parse(template.variables),
    };
    res.json(parsedTemplate);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Failed to update template:', error);
      res.status(500).json({ error: 'Failed to update template' });
    }
  }
});

// Delete a template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.template.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router; 