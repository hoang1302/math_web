import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Topic title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  grade: {
    type: Number,
    enum: [1, 2, 3, 4, 5],
    required: [true, 'Grade is required'],
    default: 5
  },
  order: {
    type: Number,
    required: [true, 'Topic order is required']
  },
  icon: {
    type: String,
    default: ''
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
topicSchema.index({ grade: 1 });
// Compound unique index: order must be unique within each grade (only for active topics)
topicSchema.index(
  { grade: 1, order: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { isActive: true }
  }
);

const Topic = mongoose.model('Topic', topicSchema);

export default Topic;

