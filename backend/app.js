import './config/env.js';
import './models/index.js';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/authRoutes.js';
import topicRoutes from './routes/topicRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import exerciseRoutes from './routes/exerciseRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import badgeRoutes from './routes/badgeRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import importRoutes from './routes/importRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(fileURLToPath(new URL('./uploads', import.meta.url))));

app.get('/', (_req, res) => {
  res.json({ message: 'MathVui API', status: 'running', version: '1.0.0' });
});
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const routes = {
  auth: authRoutes, topics: topicRoutes, lessons: lessonRoutes,
  exercises: exerciseRoutes, quizzes: quizRoutes, progress: progressRoutes,
  badges: badgeRoutes, upload: uploadRoutes, import: importRoutes, users: userRoutes,
};
for (const [path, router] of Object.entries(routes)) {
  app.use('/api/' + path, router);
}

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Express identifies error middleware by its four arguments.
app.use((err, _req, res, _next) => {
  const status = err instanceof multer.MulterError ? 400 : (err.status || 500);
  if (status >= 500) console.error(err);
  res.status(status).json({
    success: false,
    message: status < 500 ? err.message : 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
});

export default app;
