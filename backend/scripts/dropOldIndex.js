import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dropOldIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // List all current indexes
    console.log('📋 Current indexes on topics collection:');
    const indexes = await db.collection('topics').indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });
    
    console.log('\n🗑️  Dropping old indexes...\n');
    
    // Drop old unique index on order field
    try {
      await db.collection('topics').dropIndex('order_1');
      console.log('✅ Dropped index "order_1"');
    } catch (err) {
      if (err.code === 27) {
        console.log('ℹ️  Index "order_1" does not exist');
      } else {
        console.error('Error dropping order_1:', err.message);
      }
    }
    
    // Drop compound index (will be recreated with partial filter)
    try {
      await db.collection('topics').dropIndex('grade_1_order_1');
      console.log('✅ Dropped index "grade_1_order_1"');
    } catch (err) {
      if (err.code === 27) {
        console.log('ℹ️  Index "grade_1_order_1" does not exist');
      }
    }
    
    console.log('\n📋 Remaining indexes:');
    const remainingIndexes = await db.collection('topics').indexes();
    remainingIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });
    
    console.log('\n🎉 Index cleanup completed!');
    console.log('⚠️  IMPORTANT: Please restart your backend server to create new compound unique index.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

dropOldIndex();
