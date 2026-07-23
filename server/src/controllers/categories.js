import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const categorySchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['income', 'expense']),
  icon: z.string().max(8).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function listCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    const data = categorySchema.parse(req.body);
    const category = await prisma.category.create({
      data: { ...data, userId: req.userId },
    });
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const data = categorySchema.partial().parse(req.body);
    const { count } = await prisma.category.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data,
    });
    if (count === 0) return res.status(404).json({ error: 'Category not found' });
    const category = await prisma.category.findUnique({ where: { id: req.params.id } });
    res.json({ category });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const inUse = await prisma.transaction.count({
      where: { categoryId: req.params.id, userId: req.userId },
    });
    if (inUse > 0) {
      return res.status(409).json({ error: 'Category has transactions. Reassign or delete them first.' });
    }
    const { count } = await prisma.category.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    if (count === 0) return res.status(404).json({ error: 'Category not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
