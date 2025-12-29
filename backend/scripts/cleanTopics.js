import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Topic from '../models/Topic.js';

dotenv.config();

const cleanTopics = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    const topics = await Topic.find({});
    console.log(`Found ${topics.length} topics\n`);
    
    // Show all topics
    topics.forEach(topic => {
      console.log(`- Grade ${topic.grade}, Order ${topic.order}: ${topic.title} (${topic._id})`);
    });
    
    console.log('\n⚠️  This will DELETE ALL topics!');
    console.log('Run this only if you want to start fresh.\n');
    
    // Uncomment the line below to actually delete
    // await Topic.deleteMany({});
    // console.log('✅ All topics deleted!');
    
    console.log('To delete, uncomment the deleteMany line in the script.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

cleanTopics();
