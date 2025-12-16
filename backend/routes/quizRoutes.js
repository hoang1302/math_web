import express from 'express';
import {
  getQuizzes,
  getQuiz,
  startQuiz,
  submitQuiz,
  getQuizResults,
  createQuiz,
  updateQuiz,
  deleteQuiz
} from '../controllers/quizController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getQuizzes);
router.get('/:id', getQuiz);

// Protected routes
router.post('/:id/start', protect, startQuiz);
router.post('/:id/submit', protect, submitQuiz);
router.get('/:id/results', protect, getQuizResults);

// Admin routes
router.post('/', protect, authorize('admin'), createQuiz);
router.put('/:id', protect, authorize('admin'), updateQuiz);
router.delete('/:id', protect, authorize('admin'), deleteQuiz);

export default router;

