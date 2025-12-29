import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Topic from '../models/Topic.js';
import Quiz from '../models/Quiz.js';

dotenv.config();

const migrateGrade = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all existing Topics to grade 5
    const topicResult = await Topic.updateMany(
      { grade: { $exists: false } },
      { $set: { grade: 5 } }
    );
    console.log(`✅ Updated ${topicResult.modifiedCount} topics to grade 5`);

    // Update all existing Quizzes to grade 5
    const quizResult = await Quiz.updateMany(
      { grade: { $exists: false } },
      { $set: { grade: 5 } }
    );
    console.log(`✅ Updated ${quizResult.modifiedCount} quizzes to grade 5`);

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateGrade();
