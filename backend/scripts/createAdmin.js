import mongoose from 'mongoose';
import '../config/env.js';
import connectDB from '../config/database.js';
import User from '../models/User.js';

try {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME = 'admin' } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in backend/.env');
  }
  await connectDB();
  const existingUser = await User.findOne({ $or: [{ email: ADMIN_EMAIL }, { username: ADMIN_USERNAME }] });
  if (existingUser) {
    throw new Error('This email or username already exists; no account was changed');
  }
  await User.create({
    username: ADMIN_USERNAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
    role: 'admin', profile: { fullName: 'Administrator' },
  });
  console.log('Admin account created successfully');
} catch (error) {
  console.error('Cannot create admin: ' + error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
