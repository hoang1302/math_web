import Exercise from '../models/Exercise.js';
import Lesson from '../models/Lesson.js';

// @desc    Get all exercises
// @route   GET /api/exercises
// @access  Public
export const getExercises = async (req, res) => {
  try {
    const { lessonId, difficulty, type, topicId, includeAnswers, search } = req.query;
    
    let query = { isActive: true };
    
    if (lessonId) {
      query.lessonId = lessonId;
    } else if (topicId) {
      // Only filter by topicId if lessonId is not provided
      const lessonIds = await Lesson.find({ topicId, isActive: true }).distinct('_id');
      query.lessonId = { $in: lessonIds };
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    if (type) {
      query.type = type;
    }

    // Add search functionality for question content
    if (search) {
      query.question = { $regex: search, $options: 'i' }; // case-insensitive search
    }

    const exercises = await Exercise.find(query)
      .populate({
        path: 'lessonId',
        select: 'title topicId order',
        populate: {
          path: 'topicId',
          select: 'title icon'
        }
      })
      .sort({ createdAt: -1 });

    // Select fields based on includeAnswers flag (for admin)
    const exercisesData = exercises.map(ex => {
      const exerciseObj = ex.toObject();
      if (includeAnswers !== 'true') {
        delete exerciseObj.correctAnswer;
        delete exerciseObj.explanation;
      }
      return exerciseObj;
    });

    res.status(200).json({
      success: true,
      count: exercisesData.length,
      data: exercisesData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get random exercises
// @route   GET /api/exercises/random
// @access  Public
export const getRandomExercises = async (req, res) => {
  try {
    const { lessonId, difficulty, limit = 5 } = req.query;
    
    let query = { isActive: true };
    
    if (lessonId) {
      query.lessonId = lessonId;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Get random exercises
    const exercises = await Exercise.aggregate([
      { $match: query },
      { $sample: { size: parseInt(limit) } }
    ]);

    // Populate lessonId
    const populatedExercises = await Exercise.populate(exercises, {
      path: 'lessonId',
      select: 'title topicId'
    });

    // Remove correct answers
    const exercisesWithoutAnswers = populatedExercises.map(ex => {
      const { correctAnswer, explanation, ...rest } = ex;
      return rest;
    });

    res.status(200).json({
      success: true,
      count: exercisesWithoutAnswers.length,
      data: exercisesWithoutAnswers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get single exercise (with answer for checking)
// @route   GET /api/exercises/:id
// @access  Public
export const getExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id)
      .populate('lessonId', 'title topicId');

    if (!exercise || !exercise.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    // By default, hide correct answer/explanation. Allow showing when explicitly requested.
    const exerciseData = exercise.toObject();
    if (req.query.includeAnswers === 'true') {
      return res.status(200).json({
        success: true,
        data: exerciseData
      });
    }

    const { correctAnswer, explanation, ...safeData } = exerciseData;

    res.status(200).json({
      success: true,
      data: safeData
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Check exercise answer
// @route   POST /api/exercises/check
// @access  Public
export const checkAnswer = async (req, res) => {
  try {
    const { exerciseId, userAnswer } = req.body;

    if (!exerciseId || userAnswer === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide exerciseId and userAnswer'
      });
    }

    const exercise = await Exercise.findById(exerciseId);

    if (!exercise || !exercise.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    // Compare answers
    let isCorrect = false;
    const correctAnswer = exercise.correctAnswer;

    // Handle different answer types
    if (Array.isArray(correctAnswer)) {
      // For multiple correct answers
      isCorrect = Array.isArray(userAnswer) && 
        correctAnswer.length === userAnswer.length &&
        correctAnswer.every((ans, idx) => {
          if (typeof ans === 'number') {
            return parseFloat(userAnswer[idx]) === ans;
          }
          return String(ans).toLowerCase().trim() === String(userAnswer[idx]).toLowerCase().trim();
        });
    } else if (typeof correctAnswer === 'number') {
      // For numeric answers, allow some tolerance
      isCorrect = Math.abs(parseFloat(userAnswer) - correctAnswer) < 0.0001;
    } else {
      // For string answers, case-insensitive comparison
      isCorrect = String(correctAnswer).toLowerCase().trim() === 
                  String(userAnswer).toLowerCase().trim();
    }

    res.status(200).json({
      success: true,
      isCorrect,
      correctAnswer: exercise.correctAnswer,
      explanation: exercise.explanation,
      hint: exercise.hint,
      points: isCorrect ? exercise.points : 0
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Create new exercise
// @route   POST /api/exercises
// @access  Private/Admin
export const createExercise = async (req, res) => {
  try {
    // Verify lesson exists
    const lesson = await Lesson.findById(req.body.lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    const exercise = await Exercise.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Exercise created successfully',
      data: exercise
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

// @desc    Update exercise
// @route   PUT /api/exercises/:id
// @access  Private/Admin
export const updateExercise = async (req, res) => {
  try {
    let exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    // If lessonId is being updated, verify it exists
    if (req.body.lessonId && req.body.lessonId !== exercise.lessonId.toString()) {
      const lesson = await Lesson.findById(req.body.lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }
    }

    exercise = await Exercise.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Exercise updated successfully',
      data: exercise
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
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

// @desc    Delete exercise
// @route   DELETE /api/exercises/:id
// @access  Private/Admin
export const deleteExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    // Soft delete
    exercise.isActive = false;
    await exercise.save();

    res.status(200).json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

