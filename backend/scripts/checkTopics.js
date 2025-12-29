import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Topic from '../models/Topic.js';

dotenv.config();

const checkTopics = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    // Get all topics grouped by grade
    for (let grade = 1; grade <= 5; grade++) {
      const topics = await Topic.find({ grade, isActive: true }).sort({ order: 1 });
      console.log(`\n📚 Lớp ${grade}: ${topics.length} topics`);
      topics.forEach(topic => {
        console.log(`  - Order ${topic.order}: ${topic.title}`);
      });
    }
    
    // Check for duplicates
    console.log('\n\n🔍 Checking for duplicate order within same grade...');
    const allTopics = await Topic.find({ isActive: true });
    const gradeOrderMap = new Map();
    
    allTopics.forEach(topic => {
      const key = `${topic.grade}-${topic.order}`;
      if (gradeOrderMap.has(key)) {
        console.log(`❌ DUPLICATE: Grade ${topic.grade}, Order ${topic.order}`);
        console.log(`   - ${gradeOrderMap.get(key).title} (${gradeOrderMap.get(key)._id})`);
        console.log(`   - ${topic.title} (${topic._id})`);
      } else {
        gradeOrderMap.set(key, topic);
      }
    });
    
    if (gradeOrderMap.size === allTopics.length) {
      console.log('✅ No duplicates found!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkTopics();
