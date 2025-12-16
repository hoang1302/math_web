import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: [true, 'Quiz ID is required']
  },
  // Score achieved
  score: {
    type: Number,
    required: true,
    min: 0
  },
  // Total possible score
  totalScore: {
    type: Number,
    required: true
  },
  // Percentage score
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  // Total number of questions
  totalQuestions: {
    type: Number,
    required: true
  },
  // Number of correct answers
  correctAnswers: {
    type: Number,
    required: true,
    min: 0
  },
  // Number of wrong answers
  wrongAnswers: {
    type: Number,
    required: true,
    min: 0
  },
  // Time spent (in seconds)
  timeSpent: {
    type: Number,
    required: true,
    min: 0
  },
  // Answers provided by user
  answers: [{
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true
    },
    userAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    points: {
      type: Number,
      default: 0
    }
  }],
  // Statistics by topic
  topicStats: [{
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic'
    },
    correct: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  }],
  // Completion date
  completedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
quizResultSchema.index({ userId: 1, completedAt: -1 });
quizResultSchema.index({ quizId: 1 });
quizResultSchema.index({ userId: 1, quizId: 1 });

const QuizResult = mongoose.model('QuizResult', quizResultSchema);

export default QuizResult;

