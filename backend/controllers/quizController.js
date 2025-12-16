import Quiz from '../models/Quiz.js';
import Exercise from '../models/Exercise.js';
import QuizResult from '../models/QuizResult.js';
import { checkAndAwardBadges } from './badgeController.js';

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Public
export const getQuizzes = async (req, res) => {
  try {
    const { topicId } = req.query;
    let query = { isActive: true };

    // Filter by topicId if provided
    if (topicId) {
      query.topics = topicId;
    }

    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'username email')
      .populate('topics', 'title')
      .select('-questions') // Don't send questions list
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Public
export const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('topics', 'title')
      .populate('questions', '-correctAnswer -explanation'); // Don't send answers

    if (!quiz || !quiz.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Start quiz (get questions without answers)
// @route   POST /api/quizzes/:id/start
// @access  Private
export const startQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('questions', '-correctAnswer -explanation');

    if (!quiz || !quiz.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Return quiz with questions (without answers)
    res.status(200).json({
      success: true,
      message: 'Quiz started',
      data: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        totalQuestions: quiz.questions.length,
        totalPoints: quiz.totalPoints,
        questions: quiz.questions,
        startedAt: new Date()
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Submit quiz
// @route   POST /api/quizzes/:id/submit
// @access  Private
export const submitQuiz = async (req, res) => {
  try {
    const { answers, timeSpent } = req.body; // answers: [{ exerciseId, userAnswer }]

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide answers array'
      });
    }

    const quiz = await Quiz.findById(req.params.id).populate('questions');

    if (!quiz || !quiz.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Get all exercises with correct answers
    const exerciseIds = quiz.questions.map(q => q._id);
    const exercises = await Exercise.find({ _id: { $in: exerciseIds } });

    // Create exercise map for quick lookup
    const exerciseMap = new Map();
    exercises.forEach(ex => {
      exerciseMap.set(ex._id.toString(), ex);
    });

    // Check answers and calculate score
    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    const checkedAnswers = [];
    const topicStatsMap = new Map();

    for (const answer of answers) {
      const exercise = exerciseMap.get(answer.exerciseId);
      if (!exercise) continue;

      let isCorrect = false;
      const correctAnswer = exercise.correctAnswer;

      // Compare answers (similar logic to checkAnswer)
      if (Array.isArray(correctAnswer)) {
        isCorrect = Array.isArray(answer.userAnswer) && 
          correctAnswer.length === answer.userAnswer.length &&
          correctAnswer.every((ans, idx) => {
            if (typeof ans === 'number') {
              return parseFloat(answer.userAnswer[idx]) === ans;
            }
            return String(ans).toLowerCase().trim() === String(answer.userAnswer[idx]).toLowerCase().trim();
          });
      } else if (typeof correctAnswer === 'number') {
        isCorrect = Math.abs(parseFloat(answer.userAnswer) - correctAnswer) < 0.0001;
      } else {
        isCorrect = String(correctAnswer).toLowerCase().trim() === 
                    String(answer.userAnswer).toLowerCase().trim();
      }

      const points = isCorrect ? exercise.points : 0;
      totalScore += points;

      if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      checkedAnswers.push({
        exerciseId: exercise._id,
        userAnswer: answer.userAnswer,
        isCorrect,
        points
      });

      // Track topic stats (if lesson has topicId)
      if (exercise.lessonId) {
        const lesson = await Exercise.populate(exercise, { path: 'lessonId', select: 'topicId' });
        if (lesson.lessonId && lesson.lessonId.topicId) {
          const topicId = lesson.lessonId.topicId.toString();
          if (!topicStatsMap.has(topicId)) {
            topicStatsMap.set(topicId, { correct: 0, total: 0 });
          }
          const stats = topicStatsMap.get(topicId);
          stats.total++;
          if (isCorrect) stats.correct++;
        }
      }
    }

    const percentage = quiz.totalPoints > 0 ? Math.round((totalScore / quiz.totalPoints) * 100) : 0;

    // Create quiz result
    const quizResult = await QuizResult.create({
      userId: req.user.id,
      quizId: quiz._id,
      score: totalScore,
      totalScore: quiz.totalPoints,
      percentage,
      totalQuestions: quiz.questions.length,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      timeSpent: timeSpent || 0,
      answers: checkedAnswers,
      topicStats: Array.from(topicStatsMap.entries()).map(([topicId, stats]) => ({
        topicId,
        correct: stats.correct,
        total: stats.total
      }))
    });

    // Check and award badges after quiz completion
    const badgeResult = await checkAndAwardBadges(req.user.id);
    const newlyEarnedBadges = badgeResult.newlyEarned || [];

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: quizResult,
      newlyEarnedBadges: newlyEarnedBadges.length > 0 ? newlyEarnedBadges : undefined
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get quiz results
// @route   GET /api/quizzes/:id/results
// @access  Private
export const getQuizResults = async (req, res) => {
  try {
    const { userId } = req.query;
    let query = { quizId: req.params.id };

    // If not admin, only show own results
    if (req.user.role !== 'admin' || !userId) {
      query.userId = req.user.id;
    } else if (userId) {
      query.userId = userId;
    }

    const results = await QuizResult.find(query)
      .populate('userId', 'username email')
      .populate('quizId', 'title')
      .sort({ completedAt: -1 });

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Create new quiz
// @route   POST /api/quizzes
// @access  Private/Admin
export const createQuiz = async (req, res) => {
  try {
    // Verify all exercises exist
    if (req.body.questions && req.body.questions.length > 0) {
      const exercises = await Exercise.find({ _id: { $in: req.body.questions } });
      if (exercises.length !== req.body.questions.length) {
        return res.status(400).json({
          success: false,
          message: 'Some exercises not found'
        });
      }
    }

    const quiz = await Quiz.create({
      ...req.body,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private/Admin
export const updateQuiz = async (req, res) => {
  try {
    let quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Verify all exercises exist if questions are being updated
    if (req.body.questions && req.body.questions.length > 0) {
      const exerciseIds = req.body.questions.map(q => q._id || q);
      const exercises = await Exercise.find({ _id: { $in: exerciseIds } });
      if (exercises.length !== exerciseIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some exercises not found'
        });
      }
    }

    quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Quiz updated successfully',
      data: quiz
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private/Admin
export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Soft delete
    quiz.isActive = false;
    await quiz.save();

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
