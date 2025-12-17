import express from 'express';
import { generateExercises } from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Admin routes - require authentication and admin role
router.post('/generate-exercises', protect, authorize('admin'), generateExercises);

export default router;

