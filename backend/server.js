import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import models
import './models/index.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

// Debug: Check if environment variable is set
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is NOT SET!');
  console.error('⚠️  Please set MONGODB_URI in Render Environment Variables');
  console.error('⚠️  Falling back to localhost (this will fail on Render)');
}

const mongoURI = MONGODB_URI || 'mongodb://localhost:27017/math_web_grade5';
console.log(`🔗 Attempting to connect to MongoDB...`);
console.log(`📝 MONGODB_URI is ${MONGODB_URI ? 'SET' : 'NOT SET'}`);

mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    if (!MONGODB_URI) {
      console.error('💡 SOLUTION: Set MONGODB_URI in Render Environment Variables');
      console.error('💡 Get connection string from MongoDB Atlas → Connect → Connect your application');
    }
  });

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'MathVui API',
    status: 'running',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// API Routes
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
import aiRoutes from './routes/aiRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/import', importRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

