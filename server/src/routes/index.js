import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { register, login, me, googleAuth } from '../controllers/auth.js';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categories.js';
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from '../controllers/transactions.js';
import { summary, byCategory, trend, balance, setStartingBalance } from '../controllers/analytics.js';
import { listSplits, createSplit, updateSplit, deleteSplit, setParticipantPaid, sharedSplit } from '../controllers/splits.js';

export const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/google', googleAuth);
router.get('/auth/me', requireAuth, me);

router.get('/categories', requireAuth, listCategories);
router.post('/categories', requireAuth, createCategory);
router.put('/categories/:id', requireAuth, updateCategory);
router.delete('/categories/:id', requireAuth, deleteCategory);

router.get('/transactions', requireAuth, listTransactions);
router.post('/transactions', requireAuth, createTransaction);
router.put('/transactions/:id', requireAuth, updateTransaction);
router.delete('/transactions/:id', requireAuth, deleteTransaction);

router.get('/splits', requireAuth, listSplits);
router.post('/splits', requireAuth, createSplit);
router.put('/splits/:id', requireAuth, updateSplit);
router.delete('/splits/:id', requireAuth, deleteSplit);
router.patch('/splits/:id/participants/:pid', requireAuth, setParticipantPaid);
router.get('/splits/shared/:token', sharedSplit);

router.get('/analytics/summary', requireAuth, summary);
router.get('/analytics/balance', requireAuth, balance);
router.put('/analytics/starting-balance', requireAuth, setStartingBalance);
router.get('/analytics/by-category', requireAuth, byCategory);
router.get('/analytics/trend', requireAuth, trend);
