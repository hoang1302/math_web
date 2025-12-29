import Topic from '../models/Topic.js';
import Lesson from '../models/Lesson.js';

// @desc    Create topic (Admin)
// @route   POST /api/topics
// @access  Private/Admin
export const createTopic = async (req, res) => {
  try {
    const { title, description, order, icon, grade } = req.body;

    // Check if order already exists within the same grade (only active topics)
    const existingTopic = await Topic.findOne({ order, grade: grade || 5, isActive: true });
    if (existingTopic) {
      return res.status(400).json({
        success: false,
        message: `Topic with order ${order} already exists in grade ${grade || 5}`
      });
    }

    const topic = await Topic.create({
      title,
      description: description || '',
      order,
      icon: icon || '📚',
      grade: grade || 5
    });

    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      data: topic
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Topic order must be unique within the same grade'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update topic (Admin)
// @route   PUT /api/topics/:id
// @access  Private/Admin
export const updateTopic = async (req, res) => {
  try {
    const { title, description, order, icon, grade } = req.body;

    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    // Check if order or grade is being changed and if it conflicts (only active topics)
    const newGrade = grade !== undefined ? grade : topic.grade;
    const newOrder = order !== undefined ? order : topic.order;
    
    if ((order !== undefined && order !== topic.order) || (grade !== undefined && grade !== topic.grade)) {
      const existingTopic = await Topic.findOne({ 
        order: newOrder, 
        grade: newGrade,
        isActive: true,
        _id: { $ne: topic._id } 
      });
      if (existingTopic) {
        return res.status(400).json({
          success: false,
          message: `Topic with order ${newOrder} already exists in grade ${newGrade}`
        });
      }
    }

    // Update fields
    if (title !== undefined) topic.title = title;
    if (description !== undefined) topic.description = description;
    if (order !== undefined) topic.order = order;
    if (icon !== undefined) topic.icon = icon;
    if (grade !== undefined) topic.grade = grade;

    await topic.save();

    res.status(200).json({
      success: true,
      message: 'Topic updated successfully',
      data: topic
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Topic order must be unique within the same grade'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete topic (Admin)
// @route   DELETE /api/topics/:id
// @access  Private/Admin
export const deleteTopic = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    // Check if topic has lessons
    const lessonsCount = await Lesson.countDocuments({ topicId: topic._id, isActive: true });
    if (lessonsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete topic. It has ${lessonsCount} active lesson(s). Please delete or move lessons first.`
      });
    }

    // Soft delete
    topic.isActive = false;
    await topic.save();

    res.status(200).json({
      success: true,
      message: 'Topic deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all topics
// @route   GET /api/topics
// @access  Public
export const getTopics = async (req, res) => {
  try {
    const { grade } = req.query;
    let query = { isActive: true };
    
    // Filter by grade if provided
    if (grade) {
      query.grade = parseInt(grade);
    }
    
    const topics = await Topic.find(query)
      .sort({ order: 1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: topics.length,
      data: topics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get single topic
// @route   GET /api/topics/:id
// @access  Public
export const getTopic = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic || !topic.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    // Get lessons count for this topic
    const lessonsCount = await Lesson.countDocuments({ 
      topicId: topic._id, 
      isActive: true 
    });

    res.status(200).json({
      success: true,
      data: {
        ...topic.toObject(),
        lessonsCount
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

