import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { router } from './routes/index.js';
import { errorHandler } from './middleware/error.js';

export const app = express();

app.use(cors({ origin: ['http://localhost:5173'] }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', router);
app.use(errorHandler);
