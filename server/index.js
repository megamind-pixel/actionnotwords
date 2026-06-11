import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import schoolsRouter from './routes/schools.js';
import studentsRouter from './routes/students.js';
import resultsRouter from './routes/results.js';
import adminsRouter from './routes/admins.js';
import reportsRouter from './routes/reports.js';
import settingsRouter from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/schools', schoolsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/results', resultsRouter);
app.use('/api/admins', adminsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/settings', settingsRouter);

// Serve Static Frontend in Production
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Catch-all to serve index.html for React Router
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 ANW Monolith running on port ${PORT}`);
});
