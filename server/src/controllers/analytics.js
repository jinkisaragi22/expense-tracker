import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const monthSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Expected YYYY-MM').optional(),
});

function monthRange(month) {
  const m = month || new Date().toISOString().slice(0, 7);
  const [y, mo] = m.split('-').map(Number);
  return { from: new Date(Date.UTC(y, mo - 1, 1)), to: new Date(Date.UTC(y, mo, 0)), month: m };
}

export async function summary(req, res, next) {
  try {
    const { month } = monthSchema.parse(req.query);
    const { from, to, month: m } = monthRange(month);
    const groups = await prisma.transaction.groupBy({
      by: ['type'],
      where: { userId: req.userId, date: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: true,
    });
    const income = Number(groups.find((g) => g.type === 'income')?._sum.amount ?? 0);
    const expense = Number(groups.find((g) => g.type === 'expense')?._sum.amount ?? 0);
    const count = groups.reduce((acc, g) => acc + g._count, 0);
    const mb = await prisma.monthlyBalance.findUnique({
      where: { userId_month: { userId: req.userId, month: m } },
    });
    const startingBalance = Number(mb?.amount ?? 0);
    res.json({
      month: m,
      income,
      expense,
      balance: income - expense,
      startingBalance,
      hasStartingBalance: mb !== null,
      endingBalance: startingBalance + income - expense,
      transactionCount: count,
    });
  } catch (err) {
    next(err);
  }
}

const startingBalanceSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Expected YYYY-MM'),
  amount: z.coerce.number().min(0).max(999999999999),
});

export async function setStartingBalance(req, res, next) {
  try {
    const { month, amount } = startingBalanceSchema.parse(req.body);
    const mb = await prisma.monthlyBalance.upsert({
      where: { userId_month: { userId: req.userId, month } },
      update: { amount },
      create: { userId: req.userId, month, amount },
    });
    res.json({ month, startingBalance: Number(mb.amount) });
  } catch (err) {
    next(err);
  }
}

export async function balance(req, res, next) {
  try {
    const groups = await prisma.transaction.groupBy({
      by: ['type'],
      where: { userId: req.userId },
      _sum: { amount: true },
    });
    const income = Number(groups.find((g) => g.type === 'income')?._sum.amount ?? 0);
    const expense = Number(groups.find((g) => g.type === 'expense')?._sum.amount ?? 0);
    res.json({ income, expense, balance: income - expense });
  } catch (err) {
    next(err);
  }
}

export async function byCategory(req, res, next) {
  try {
    const { month } = monthSchema.parse(req.query);
    const { from, to, month: m } = monthRange(month);
    const type = req.query.type === 'income' ? 'income' : 'expense';
    const groups = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId: req.userId, type, date: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: true,
    });
    const categories = await prisma.category.findMany({
      where: { id: { in: groups.map((g) => g.categoryId) } },
    });
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
    const data = groups
      .map((g) => ({
        categoryId: g.categoryId,
        name: catMap[g.categoryId]?.name ?? 'Unknown',
        icon: catMap[g.categoryId]?.icon ?? '📦',
        color: catMap[g.categoryId]?.color ?? '#64748b',
        total: Number(g._sum.amount ?? 0),
        count: g._count,
      }))
      .sort((a, b) => b.total - a.total);
    res.json({ month: m, type, categories: data });
  } catch (err) {
    next(err);
  }
}

export async function trend(req, res, next) {
  try {
    const months = Math.min(Number(req.query.months) || 6, 24);
    const now = new Date();
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
    const txs = await prisma.transaction.findMany({
      where: { userId: req.userId, date: { gte: from } },
      select: { amount: true, type: true, date: true },
    });
    const buckets = {};
    for (let i = 0; i < months; i++) {
      const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + i, 1));
      buckets[d.toISOString().slice(0, 7)] = { month: d.toISOString().slice(0, 7), income: 0, expense: 0 };
    }
    for (const tx of txs) {
      const key = tx.date.toISOString().slice(0, 7);
      if (buckets[key]) buckets[key][tx.type] += Number(tx.amount);
    }
    res.json({ trend: Object.values(buckets) });
  } catch (err) {
    next(err);
  }
}
