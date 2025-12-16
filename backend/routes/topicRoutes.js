import express from 'express';
import { getTopics, getTopic, createTopic, updateTopic, deleteTopic } from '../controllers/topicController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getTopics);
router.get('/:id', getTopic);

// Admin routes
router.post('/', protect, authorize('admin'), createTopic);
router.put('/:id', protect, authorize('admin'), updateTopic);
router.delete('/:id', protect, authorize('admin'), deleteTopic);

export default router;

