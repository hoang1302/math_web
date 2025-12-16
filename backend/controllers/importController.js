import Papa from 'papaparse';

// @desc    Import questions from Google Sheets CSV
// @route   POST /api/import/questions
// @access  Private/Admin
export const importQuestionsFromCSV = async (req, res) => {
  try {
    const { csvData, lessonId, forQuiz } = req.body;

    if (!csvData) {
      return res.status(400).json({
        success: false,
        message: 'CSV data is required'
      });
    }

    // lessonId is required only for exercise import (not for quiz)
    if (!forQuiz && !lessonId) {
      return res.status(400).json({
        success: false,
        message: 'Lesson ID is required for exercise import'
      });
    }

    // Parse CSV
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Normalize Vietnamese headers
        const headerMap = {
          'STT': 'stt',
          'stt': 'stt',
          'Độ khó': 'difficulty',
          'độ khó': 'difficulty',
          'Difficulty': 'difficulty',
          'Điểm': 'points',
          'điểm': 'points',
          'Points': 'points',
          'Câu hỏi': 'question',
          'câu hỏi': 'question',
          'Question': 'question',
          'Đáp án A': 'optionA',
          'đáp án a': 'optionA',
          'Option A': 'optionA',
          'Đáp án B': 'optionB',
          'đáp án b': 'optionB',
          'Option B': 'optionB',
          'Đáp án C': 'optionC',
          'đáp án c': 'optionC',
          'Option C': 'optionC',
          'Đáp án D': 'optionD',
          'đáp án d': 'optionD',
          'Option D': 'optionD',
          'Đáp án đúng': 'correctAnswer',
          'đáp án đúng': 'correctAnswer',
          'Correct Answer': 'correctAnswer',
          'Giải thích': 'explanation',
          'giải thích': 'explanation',
          'Explanation': 'explanation'
        };
        return headerMap[header] || header.toLowerCase().trim();
      }
    });

    if (parsed.errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Error parsing CSV',
        errors: parsed.errors
      });
    }

    const questions = [];
    const errors = [];

    parsed.data.forEach((row, index) => {
      try {
        // Validate required fields
        if (!row.question || !row.optiona || !row.optionb || !row.correctanswer) {
          errors.push({
            row: index + 2, // +2 because index starts at 0 and row 1 is header
            message: 'Missing required fields'
          });
          return;
        }

        // Map difficulty
        const difficultyMap = {
          'dễ': 'easy',
          'de': 'easy',
          'easy': 'easy',
          'trung bình': 'medium',
          'tb': 'medium',
          'medium': 'medium',
          'khó': 'hard',
          'kho': 'hard',
          'hard': 'hard'
        };
        const difficulty = difficultyMap[row.difficulty?.toLowerCase()] || 'medium';

        // Map correct answer (A/B/C/D to option value)
        // Handle both Vietnamese and English format
        const correctAnswerKey = String(row.correctanswer || '').toLowerCase().trim();
        let correctAnswer = '';
        
        if (correctAnswerKey === 'a' || correctAnswerKey === 'đáp án a') {
          correctAnswer = row.optiona;
        } else if (correctAnswerKey === 'b' || correctAnswerKey === 'đáp án b') {
          correctAnswer = row.optionb;
        } else if (correctAnswerKey === 'c' || correctAnswerKey === 'đáp án c') {
          correctAnswer = row.optionc || '';
        } else if (correctAnswerKey === 'd' || correctAnswerKey === 'đáp án d') {
          correctAnswer = row.optiond || '';
        } else {
          // If correctAnswer is already the value itself, use it
          correctAnswer = row.correctanswer || row.optionb;
        }

        // Build options array
        const options = [
          row.optiona,
          row.optionb,
          row.optionc || '',
          row.optiond || ''
        ].filter(opt => opt && opt.trim() !== '');

        if (options.length < 2) {
          errors.push({
            row: index + 2,
            message: 'Need at least 2 options'
          });
          return;
        }

        const questionData = {
          type: 'multiple-choice',
          question: row.question.trim(),
          options: options,
          correctAnswer: correctAnswer.trim(),
          explanation: row.explanation?.trim() || '',
          difficulty: difficulty,
          points: parseInt(row.points) || 1
        };

        // Only add lessonId if importing for exercises (not for quiz)
        if (!forQuiz && lessonId) {
          questionData.lessonId = lessonId;
        }

        questions.push(questionData);
      } catch (error) {
        errors.push({
          row: index + 2,
          message: error.message || 'Error processing row'
        });
      }
    });

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid questions found',
        errors
      });
    }

    res.status(200).json({
      success: true,
      message: `Found ${questions.length} valid question(s)`,
      data: {
        questions,
        errors,
        totalRows: parsed.data.length,
        validQuestions: questions.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Fetch CSV from Google Sheets URL
// @route   POST /api/import/fetch-sheets
// @access  Private/Admin
export const fetchGoogleSheets = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Google Sheets URL is required'
      });
    }

    // Convert Google Sheets URL to CSV export URL
    // Format: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit#gid={GID}
    // CSV: https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}
    
    let csvUrl = url;
    
    // If it's a regular Google Sheets URL, convert to CSV export
    if (url.includes('/spreadsheets/d/')) {
      const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const gidMatch = url.match(/[#&]gid=(\d+)/);
      
      if (sheetIdMatch) {
        const sheetId = sheetIdMatch[1];
        const gid = gidMatch ? gidMatch[1] : '0';
        csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      }
    }

    // Fetch CSV data
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch Google Sheets. Make sure the sheet is publicly accessible or shared with view permission.'
      });
    }

    const csvData = await response.text();

    res.status(200).json({
      success: true,
      data: {
        csvData,
        url: csvUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

