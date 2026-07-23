import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const transactionSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.coerce.number().positive().max(999999999999),
  type: z.enum(['income', 'expense']),
  description: z.string().max(255).optional().default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
});

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: z.string().uuid().optional(),
  type: z.enum(['income', 'expense']).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

function serialize(tx) {
  return { ...tx, amount: Number(tx.amount), date: tx.date.toISOString().slice(0, 10) };
}

async function assertOwnCategory(userId, categoryId, type) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) return 'Category not found';
  if (category.type !== type) return `Category "${category.name}" is a ${category.type} category`;
  return null;
}

export async function listTransactions(req, res, next) {
  try {
    const q = querySchema.parse(req.query);
    const where = {
      userId: req.userId,
      ...(q.type && { type: q.type }),
      ...(q.category && { categoryId: q.category }),
      ...((q.from || q.to) && {
        date: {
          ...(q.from && { gte: new Date(q.from) }),
          ...(q.to && { lte: new Date(q.to) }),
        },
      }),
      ...(q.search && { description: { contains: q.search, mode: 'insensitive' } }),
    };
    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);
    res.json({
      transactions: transactions.map(serialize),
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    });
  } catch (err) {
    next(err);
  }
}

export async function createTransaction(req, res, next) {
  try {
    const data = transactionSchema.parse(req.body);
    const catError = await assertOwnCategory(req.userId, data.categoryId, data.type);
    if (catError) return res.status(400).json({ error: catError });
    const tx = await prisma.transaction.create({
      data: { ...data, date: new Date(data.date), userId: req.userId },
      include: { category: true },
    });
    res.status(201).json({ transaction: serialize(tx) });
  } catch (err) {
    next(err);
  }
}

export async function updateTransaction(req, res, next) {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Transaction not found' });

    const data = transactionSchema.parse(req.body);
    const catError = await assertOwnCategory(req.userId, data.categoryId, data.type);
    if (catError) return res.status(400).json({ error: catError });

    const tx = await prisma.transaction.update({
      where: { id: existing.id },
      data: { ...data, date: new Date(data.date) },
      include: { category: true },
    });
    res.json({ transaction: serialize(tx) });
  } catch (err) {
    next(err);
  }
}

export async function deleteTransaction(req, res, next) {
  try {
    const { count } = await prisma.transaction.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    if (count === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
