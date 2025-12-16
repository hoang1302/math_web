import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { importQuestionsFromCSV, fetchGoogleSheets } from '../controllers/importController.js';

const router = express.Router();

// Admin routes
router.post('/fetch-sheets', protect, authorize('admin'), fetchGoogleSheets);
router.post('/questions', protect, authorize('admin'), importQuestionsFromCSV);

export default router;

