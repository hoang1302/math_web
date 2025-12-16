import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { uploadPDF } from '../middleware/upload.js';
import Lesson from '../models/Lesson.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// @desc    Upload PDF for lesson
// @route   POST /api/upload/lesson/:lessonId/pdf
// @access  Private/Admin
router.post('/lesson/:lessonId/pdf', protect, authorize('admin'), uploadPDF.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF file'
      });
    }

    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Update lesson with PDF info
    lesson.pdfUrl = `/uploads/pdfs/${req.file.filename}`;
    lesson.pdfFileName = req.file.originalname;
    await lesson.save();

    res.status(200).json({
      success: true,
      message: 'PDF uploaded successfully',
      data: {
        pdfUrl: lesson.pdfUrl,
        pdfFileName: lesson.pdfFileName
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Serve uploaded PDFs
// @route   GET /api/upload/pdfs/:filename
// @access  Public
router.get('/pdfs/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/pdfs', filename);
  
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
  });
});

export default router;

