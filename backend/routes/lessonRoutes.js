import express from 'express';
import {
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson
} from '../controllers/lessonController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getLessons);
router.get('/:id', getLesson);

// Admin routes
router.post('/', protect, authorize('admin'), createLesson);
router.put('/:id', protect, authorize('admin'), updateLesson);
router.delete('/:id', protect, authorize('admin'), deleteLesson);

export default router;

