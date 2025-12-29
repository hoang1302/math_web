import Lesson from '../models/Lesson.js';
import Topic from '../models/Topic.js';
import Exercise from '../models/Exercise.js';

// @desc    Get all lessons
// @route   GET /api/lessons
// @access  Public
export const getLessons = async (req, res) => {
  try {
    const { topicId, grade } = req.query;
    
    let query = { isActive: true };
    
    if (topicId) {
      query.topicId = topicId;
    }
    
    // If grade is provided, first get topics for that grade
    if (grade && !topicId) {
      const topics = await Topic.find({ grade: parseInt(grade), isActive: true }).select('_id');
      const topicIds = topics.map(t => t._id);
      query.topicId = { $in: topicIds };
    }

    const lessons = await Lesson.find(query)
      .populate('topicId', 'title order grade')
      .sort({ order: 1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: lessons.length,
      data: lessons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get single lesson
// @route   GET /api/lessons/:id
// @access  Public
export const getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('topicId', 'title order');

    if (!lesson || !lesson.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Get exercises count for this lesson
    const exercisesCount = await Exercise.countDocuments({ 
      lessonId: lesson._id, 
      isActive: true 
    });

    res.status(200).json({
      success: true,
      data: {
        ...lesson.toObject(),
        exercisesCount
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Create new lesson
// @route   POST /api/lessons
// @access  Private/Admin
export const createLesson = async (req, res) => {
  try {
    // Verify topic exists
    const topic = await Topic.findById(req.body.topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    const lesson = await Lesson.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: lesson
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

// @desc    Update lesson
// @route   PUT /api/lessons/:id
// @access  Private/Admin
export const updateLesson = async (req, res) => {
  try {
    let lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // If topicId is being updated, verify it exists
    if (req.body.topicId && req.body.topicId !== lesson.topicId.toString()) {
      const topic = await Topic.findById(req.body.topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: 'Topic not found'
        });
      }
    }

    lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Lesson updated successfully',
      data: lesson
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
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

// @desc    Delete lesson
// @route   DELETE /api/lessons/:id
// @access  Private/Admin
export const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Soft delete - set isActive to false
    lesson.isActive = false;
    await lesson.save();

    res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

