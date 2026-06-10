import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import schoolsRouter from './routes/schools.js';
import studentsRouter from './routes/students.js';
import resultsRouter from './routes/results.js';
import adminsRouter from './routes/admins.js';
import reportsRouter from './routes/reports.js';
import settingsRouter from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/schools', schoolsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/results', resultsRouter);
app.use('/api/admins', adminsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/settings', settingsRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 ANW Server running on http://localhost:${PORT}`);
  console.log(`   Supabase: ${process.env.SUPABASE_URL || '⚠️  Not configured'}`);
});
