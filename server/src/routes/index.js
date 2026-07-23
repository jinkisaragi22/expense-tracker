import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { register, login, me, googleAuth } from '../controllers/auth.js';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categories.js';
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from '../controllers/transactions.js';
import { summary, byCategory, trend, balance } from '../controllers/analytics.js';

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

router.get('/analytics/summary', requireAuth, summary);
router.get('/analytics/balance', requireAuth, balance);
router.get('/analytics/by-category', requireAuth, byCategory);
router.get('/analytics/trend', requireAuth, trend);
