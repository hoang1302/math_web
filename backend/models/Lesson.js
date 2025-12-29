import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Topic ID is required']
  },
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  slides: {
    type: [String],
    default: []
  },
  pdfUrl: {
    type: String,
    default: ''
  },
  pdfFileName: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    required: [true, 'Lesson order is required']
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
lessonSchema.index({ topicId: 1, order: 1 });
lessonSchema.index({ topicId: 1 });

const Lesson = mongoose.model('Lesson', lessonSchema);

export default Lesson;

