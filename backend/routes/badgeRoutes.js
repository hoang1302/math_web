import express from 'express';
import {
  getBadges,
  getUserBadges,
  checkBadges
} from '../controllers/badgeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getBadges);

// Protected routes
router.get('/user', protect, getUserBadges);
router.post('/check', protect, checkBadges);

export default router;

