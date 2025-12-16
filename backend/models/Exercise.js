import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: [true, 'Lesson ID is required']
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'fill-blank', 'essay'],
    required: [true, 'Exercise type is required']
  },
  question: {
    type: String,
    required: [true, 'Question is required']
  },
  // For multiple-choice questions
  options: {
    type: [String],
    default: []
  },
  // Correct answer (can be string, number, or array for multiple correct answers)
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Correct answer is required']
  },
  // Explanation for the answer
  explanation: {
    type: String,
    default: ''
  },
  // Hint for students
  hint: {
    type: String,
    default: ''
  },
  // Difficulty level
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  // Points for this exercise
  points: {
    type: Number,
    default: 1
  },
  // For fill-blank: positions of blanks
  blankPositions: {
    type: [Number],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
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

// Index for faster queries
exerciseSchema.index({ lessonId: 1, difficulty: 1 });
exerciseSchema.index({ lessonId: 1 });
exerciseSchema.index({ type: 1, difficulty: 1 });

const Exercise = mongoose.model('Exercise', exerciseSchema);

export default Exercise;

