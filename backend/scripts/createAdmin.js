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

    // Check if admin already exists (search by old or new credentials)
    const existingAdmin = await User.findOne({
      $or: [
        { email: 'admin@gmail.com' },
        { email: 'admin@mathweb.com' },
        { username: 'admin' },
        { role: 'admin' }
      ]
    });
    
    if (existingAdmin) {
      // Update existing admin
      existingAdmin.username = 'admin';
      existingAdmin.email = 'admin@gmail.com';
      existingAdmin.password = '123456';
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully');
      console.log('👤 Username: admin');
      console.log('📧 Email: admin@gmail.com');
      console.log('🔑 Password: 123456');
    } else {
      // Create new admin user
      const admin = await User.create({
        username: 'admin',
        email: 'admin@gmail.com',
        password: '123456',
        role: 'admin',
        profile: {
          fullName: 'Administrator'
        }
      });

      console.log('✅ Admin user created successfully!');
      console.log('👤 Username: admin');
      console.log('📧 Email: admin@gmail.com');
      console.log('🔑 Password: 123456');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();

