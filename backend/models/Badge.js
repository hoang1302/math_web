import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Badge name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Badge description is required'],
    trim: true
  },
  icon: {
    type: String,
    required: [true, 'Badge icon is required'],
    default: '🏆'
  },
  // Condition to earn this badge (stored as JSON)
  condition: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Badge condition is required']
  },
  // Examples of conditions:
  // { type: 'exercises_completed', value: 50 }
  // { type: 'quiz_score', value: 90, timeLimit: 10 }
  // { type: 'lessons_completed', value: 10 }
  // { type: 'streak', value: 7 }
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
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

const Badge = mongoose.model('Badge', badgeSchema);

export default Badge;

