import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const participantSchema = z.object({
  name: z.string().min(1).max(50),
  amount: z.coerce.number().min(0).max(999999999999),
  paid: z.boolean().optional().default(false),
});

const splitSchema = z.object({
  title: z.string().min(1).max(100),
  note: z.string().max(255).optional().default(''),
  total: z.coerce.number().positive().max(999999999999),
  participants: z.array(participantSchema).min(1).max(50),
});

function serialize(split) {
  return {
    ...split,
    total: Number(split.total),
    participants: split.participants.map((p) => ({ ...p, amount: Number(p.amount) })),
  };
}

const fullInclude = { participants: { orderBy: { name: 'asc' } } };

export async function listSplits(req, res, next) {
  try {
    const splits = await prisma.splitBill.findMany({
      where: { userId: req.userId },
      include: fullInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ splits: splits.map(serialize) });
  } catch (err) {
    next(err);
  }
}

export async function createSplit(req, res, next) {
  try {
    const data = splitSchema.parse(req.body);
    const split = await prisma.splitBill.create({
      data: {
        userId: req.userId,
        title: data.title,
        note: data.note,
        total: data.total,
        participants: { create: data.participants },
      },
      include: fullInclude,
    });
    res.status(201).json({ split: serialize(split) });
  } catch (err) {
    next(err);
  }
}

export async function updateSplit(req, res, next) {
  try {
    const existing = await prisma.splitBill.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Split bill not found' });

    const data = splitSchema.parse(req.body);
    const split = await prisma.$transaction(async (tx) => {
      await tx.splitParticipant.deleteMany({ where: { splitBillId: existing.id } });
      return tx.splitBill.update({
        where: { id: existing.id },
        data: {
          title: data.title,
          note: data.note,
          total: data.total,
          participants: { create: data.participants },
        },
        include: fullInclude,
      });
    });
    res.json({ split: serialize(split) });
  } catch (err) {
    next(err);
  }
}

export async function deleteSplit(req, res, next) {
  try {
    const { count } = await prisma.splitBill.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    if (count === 0) return res.status(404).json({ error: 'Split bill not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function setParticipantPaid(req, res, next) {
  try {
    const { paid } = z.object({ paid: z.boolean() }).parse(req.body);
    const participant = await prisma.splitParticipant.findFirst({
      where: { id: req.params.pid, splitBill: { id: req.params.id, userId: req.userId } },
    });
    if (!participant) return res.status(404).json({ error: 'Participant not found' });
    const updated = await prisma.splitParticipant.update({
      where: { id: participant.id },
      data: { paid },
    });
    res.json({ participant: { ...updated, amount: Number(updated.amount) } });
  } catch (err) {
    next(err);
  }
}

export async function sharedSplit(req, res, next) {
  try {
    const split = await prisma.splitBill.findUnique({
      where: { shareToken: req.params.token },
      include: { ...fullInclude, user: { select: { name: true } } },
    });
    if (!split) return res.status(404).json({ error: 'Split bill not found' });
    res.json({
      split: {
        title: split.title,
        note: split.note,
        total: Number(split.total),
        createdAt: split.createdAt,
        ownerName: split.user.name,
        participants: split.participants.map((p) => ({
          name: p.name,
          amount: Number(p.amount),
          paid: p.paid,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}
