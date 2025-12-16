import mongoose from 'mongoose';

const userBadgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  badgeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge',
    required: [true, 'Badge ID is required']
  },
  // Date when badge was earned
  earnedAt: {
    type: Date,
    default: Date.now
  },
  // Additional metadata (e.g., score achieved, time taken)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index to ensure one badge record per user per badge
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
userBadgeSchema.index({ userId: 1, earnedAt: -1 });

const UserBadge = mongoose.model('UserBadge', userBadgeSchema);

export default UserBadge;

