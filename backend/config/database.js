import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    // Debug: Check if env variable is set
    if (!mongoURI) {
      console.error('❌ MONGODB_URI environment variable is not set!');
      console.error('Please set MONGODB_URI in Render Environment Variables');
      process.exit(1);
    }
    
    console.log(`🔗 Attempting to connect to MongoDB...`);
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

