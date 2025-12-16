import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: [true, 'Lesson ID is required']
  },
  // Whether the lesson is completed
  completed: {
    type: Boolean,
    default: false
  },
  // Completion percentage (0-100)
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Best score achieved
  bestScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Number of attempts
  attempts: {
    type: Number,
    default: 0
  },
  // Time spent on this lesson (in minutes)
  timeSpent: {
    type: Number,
    default: 0
  },
  // Last attempt date
  lastAttemptAt: {
    type: Date
  },
  // First completion date
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one progress record per user per lesson
userProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
userProgressSchema.index({ userId: 1, completed: 1 });

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

export default UserProgress;

