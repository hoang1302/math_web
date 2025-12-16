import express from 'express';
import {
  getUserProgress,
  getLessonProgress,
  updateLessonProgress,
  getUserStats
} from '../controllers/progressController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getUserProgress);
router.get('/stats', getUserStats);
router.get('/lessons/:lessonId', getLessonProgress);
router.post('/lessons/:lessonId', updateLessonProgress);

export default router;

