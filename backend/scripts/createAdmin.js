import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/math_web_grade5';

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@mathweb.com' });
    
    if (existingAdmin) {
      // Update existing admin
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully');
      console.log('📧 Email: admin@mathweb.com');
      console.log('🔑 Password: (your existing password)');
    } else {
      // Create new admin user
      const admin = await User.create({
        username: 'admin',
        email: 'admin@mathweb.com',
        password: 'admin123', // Default password - change this!
        role: 'admin',
        profile: {
          fullName: 'Administrator'
        }
      });

      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@mathweb.com');
      console.log('🔑 Password: admin123');
      console.log('⚠️  IMPORTANT: Please change the password after first login!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();

