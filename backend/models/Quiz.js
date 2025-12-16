import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  // Array of exercise IDs
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise'
  }],
  // Time limit in minutes
  timeLimit: {
    type: Number,
    required: [true, 'Time limit is required'],
    min: [1, 'Time limit must be at least 1 minute']
  },
  // Topics covered in this quiz
  topics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }],
  // Total points
  totalPoints: {
    type: Number,
    default: 0
  },
  // Created by (admin/parent)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Calculate total points before saving
quizSchema.pre('save', async function(next) {
  if (this.questions && this.questions.length > 0) {
    const Exercise = mongoose.model('Exercise');
    try {
      const exercises = await Exercise.find({ _id: { $in: this.questions } });
      this.totalPoints = exercises.reduce((sum, ex) => sum + (ex.points || 1), 0);
    } catch (error) {
      // If exercises not found, set to 0
      this.totalPoints = 0;
    }
  }
  next();
});

// Index for faster queries
quizSchema.index({ createdBy: 1 });
quizSchema.index({ isActive: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;

