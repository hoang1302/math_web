import express from 'express';
import {
  getExercises,
  getRandomExercises,
  getExercise,
  checkAnswer,
  createExercise,
  updateExercise,
  deleteExercise
} from '../controllers/exerciseController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getExercises);
router.get('/random', getRandomExercises);
router.get('/:id', getExercise);
router.post('/check', checkAnswer);

// Admin routes
router.post('/', protect, authorize('admin'), createExercise);
router.put('/:id', protect, authorize('admin'), updateExercise);
router.delete('/:id', protect, authorize('admin'), deleteExercise);

export default router;

