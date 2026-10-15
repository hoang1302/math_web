import mongoose from 'mongoose';
import { config } from './env.js';

const connectDB = () => mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });

export default connectDB;
