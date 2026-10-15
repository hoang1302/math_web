import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Topic from '../models/Topic.js';
import Lesson from '../models/Lesson.js';
import Exercise from '../models/Exercise.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/math_web_grade5';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Parse noi_dung.md file
function parseContentFile() {
  const filePath = path.join(__dirname, '../../noi_dung.md');
  const content = fs.readFileSync(filePath, 'utf-8');

  const topics = [];
  let currentTopic = null;
  let currentLesson = null;
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for topic (starts with emoji and "Chủ đề")
    if (line.match(/^[📚🌎📐].*Chủ đề \d+:/u)) {
      // Save previous lesson if exists
      if (currentLesson && currentTopic) {
        currentTopic.lessons.push(currentLesson);
        currentLesson = null;
      }

      // Save previous topic if exists
      if (currentTopic) {
        topics.push(currentTopic);
      }

      // Extract topic number and title
      const match = line.match(/Chủ đề (\d+):\s*(.+)/);
      if (match) {
        currentTopic = {
          order: parseInt(match[1]),
          title: match[2].trim(),
          description: '',
          lessons: []
        };
      }
    }
    // Check for lesson (starts with "Bài")
    else if (line.match(/^Bài \d+:/)) {
      // Save previous lesson if exists
      if (currentLesson && currentTopic) {
        currentTopic.lessons.push(currentLesson);
      }

      // Extract lesson number and title
      const match = line.match(/Bài (\d+):\s*(.+)/);
      if (match) {
        currentLesson = {
          order: parseInt(match[1]),
          title: match[2].trim(),
          content: '',
          exercises: []
        };
      }
    }
    // Collect lesson content
    else if (currentLesson && (line.includes('Nội dung kiến thức') || line.includes('Nội dung kiến thức và ví dụ'))) {
      // Start collecting content
      let contentLines = [];
      i++; // Skip the header line
      while (i < lines.length && !lines[i].trim().startsWith('Bài tập luyện tập:')) {
        const contentLine = lines[i];
        // Stop if we hit a new lesson or topic
        const trimmedLine = contentLine.trim();
        if (trimmedLine.match(/^Bài \d+:/) || trimmedLine.match(/^[📚🌎📐].*Chủ đề/u)) {
          i--; // Go back one line
          break;
        }
        // Keep the line (even if empty, to preserve formatting)
        if (trimmedLine || contentLines.length > 0) {
          contentLines.push(contentLine);
        }
        i++;
      }
      // Join with newlines to preserve formatting
      currentLesson.content = contentLines.join('\n').trim();
      if (!currentLesson.content) {
        console.warn(`⚠️  Warning: No content found for lesson "${currentLesson.title}"`);
      }
      i--; // Go back one line
    }
    // Collect exercises
    else if (currentLesson && line.startsWith('Bài tập luyện tập:')) {
      // Collect exercise content
      let exerciseContent = [];
      i++; // Skip the header line
      while (i < lines.length) {
        const exerciseLine = lines[i].trim();
        // Stop if we hit a new lesson or topic
        if (exerciseLine.match(/^Bài \d+:/) || exerciseLine.match(/^[📚🌎📐].*Chủ đề/u)) {
          i--; // Go back one line
          break;
        }
        if (exerciseLine) {
          exerciseContent.push(exerciseLine);
        }
        i++;
      }

      // Parse exercises from content
      // Split by common patterns to create multiple exercises
      const exerciseText = exerciseContent.join('\n');

      // Try to split exercises by common patterns
      const exercisePatterns = [
        /(?:^|\n)([A-Z][^:]+:)/g, // Lines starting with capital letter followed by colon
        /(?:^|\n)(Tính[^:]*:)/g,  // "Tính..." patterns
        /(?:^|\n)(Tìm[^:]*:)/g,   // "Tìm..." patterns
        /(?:^|\n)(Giải[^:]*:)/g,  // "Giải..." patterns
        /(?:^|\n)(Sắp xếp[^:]*:)/g, // "Sắp xếp..." patterns
        /(?:^|\n)(Nhận biết[^:]*:)/g, // "Nhận biết..." patterns
        /(?:^|\n)(Viết[^:]*:)/g,  // "Viết..." patterns
        /(?:^|\n)(So sánh[^:]*:)/g, // "So sánh..." patterns
        /(?:^|\n)(Chuyển[^:]*:)/g, // "Chuyển..." patterns
        /(?:^|\n)(Làm tròn[^:]*:)/g // "Làm tròn..." patterns
      ];

      // Split exercises by these patterns
      let exercises = [];

      // Find all exercise starts
      const exerciseStarts = [];
      for (const pattern of exercisePatterns) {
        let match;
        pattern.lastIndex = 0; // Reset regex
        while ((match = pattern.exec(exerciseText)) !== null) {
          exerciseStarts.push({ index: match.index, text: match[1] });
        }
      }

      // Sort by index
      exerciseStarts.sort((a, b) => a.index - b.index);

      // Extract exercises
      const fullExerciseText = exerciseContent.join('\n');
      if (exerciseStarts.length > 0) {
        for (let j = 0; j < exerciseStarts.length; j++) {
          const start = exerciseStarts[j];
          const end = j < exerciseStarts.length - 1
            ? exerciseStarts[j + 1].index
            : fullExerciseText.length;
          const exerciseQuestion = fullExerciseText.substring(start.index, end).trim();

          if (exerciseQuestion.length > 10) { // Minimum length
            exercises.push({
              type: determineExerciseType(exerciseQuestion),
              question: exerciseQuestion,
              correctAnswer: 'Đáp án sẽ được cập nhật',
              explanation: '',
              difficulty: 'medium'
            });
          }
        }
      }

      // If no exercises found, create one with all content
      if (exercises.length === 0 && exerciseContent.length > 0) {
        exercises.push({
          type: 'essay',
          question: exerciseContent.join('\n'),
          correctAnswer: 'Đáp án sẽ được cập nhật',
          explanation: '',
          difficulty: 'medium'
        });
      }

      currentLesson.exercises = exercises;
    }
  }

  // Save last lesson and topic
  if (currentLesson && currentTopic) {
    currentTopic.lessons.push(currentLesson);
  }
  if (currentTopic) {
    topics.push(currentTopic);
  }

  return topics;
}

// Seed data to database
async function seedData() {
  try {
    console.log('📖 Parsing noi_dung.md...');
    const topicsData = parseContentFile();

    console.log(`Found ${topicsData.length} topics`);

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');

    // Drop problematic indexes if they exist
    try {
      const topicCollection = mongoose.connection.collection('topics');
      const indexes = await topicCollection.indexes();
      for (const index of indexes) {
        if (index.name === 'topicId_1' || (index.key && index.key.topicId)) {
          console.log('  🔧 Dropping problematic index: topicId_1');
          await topicCollection.dropIndex('topicId_1').catch(() => {});
        }
      }
    } catch (err) {
      // Ignore errors when dropping indexes
      console.log('  ℹ️  No problematic indexes to drop');
    }

    await Topic.deleteMany({});
    await Lesson.deleteMany({});
    await Exercise.deleteMany({});

    // Seed topics and lessons
    for (const topicData of topicsData) {
      console.log(`\n📚 Creating topic: ${topicData.title} (Order: ${topicData.order})`);

      // Create topic
      const topic = await Topic.create({
        title: topicData.title,
        description: topicData.description,
        order: topicData.order,
        icon: getTopicIcon(topicData.order)
      });

      console.log(`  ✅ Topic created: ${topic._id}`);

      // Create lessons for this topic
      for (const lessonData of topicData.lessons) {
        console.log(`  📖 Creating lesson: ${lessonData.title} (Order: ${lessonData.order})`);

        // Check if content exists
        const lessonContent = lessonData.content && lessonData.content.trim()
          ? lessonData.content.trim()
          : 'Nội dung bài học sẽ được cập nhật.';

        if (!lessonData.content || !lessonData.content.trim()) {
          console.warn(`    ⚠️  Warning: Lesson "${lessonData.title}" has no content`);
        } else {
          console.log(`    📄 Content length: ${lessonData.content.length} characters`);
        }

        const lesson = await Lesson.create({
          topicId: topic._id,
          title: lessonData.title,
          content: lessonContent,
          order: lessonData.order,
          estimatedTime: 15
        });

        console.log(`    ✅ Lesson created: ${lesson._id}`);

        // Create exercises for this lesson
        // For now, create a simple exercise from practice content
        if (lessonData.exercises && lessonData.exercises.length > 0) {
          for (let idx = 0; idx < lessonData.exercises.length; idx++) {
            const exerciseData = lessonData.exercises[idx];
            const exercise = await Exercise.create({
              lessonId: lesson._id,
              type: exerciseData.type || 'essay',
              question: exerciseData.question,
              correctAnswer: exerciseData.correctAnswer || 'Đáp án sẽ được cập nhật',
              explanation: exerciseData.explanation || '',
              difficulty: exerciseData.difficulty || 'medium',
              points: 1
            });
            console.log(`      ✅ Exercise ${idx + 1} created: ${exercise._id}`);
          }
        } else {
          // Create a placeholder exercise
          const exercise = await Exercise.create({
            lessonId: lesson._id,
            type: 'essay',
            question: 'Bài tập luyện tập cho bài học này sẽ được cập nhật.',
            correctAnswer: 'Đáp án sẽ được cập nhật',
            explanation: '',
            difficulty: 'medium',
            points: 1
          });
          console.log(`      ✅ Placeholder exercise created: ${exercise._id}`);
        }
      }
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    const topicCount = await Topic.countDocuments();
    const lessonCount = await Lesson.countDocuments();
    const exerciseCount = await Exercise.countDocuments();
    console.log(`  - Topics: ${topicCount}`);
    console.log(`  - Lessons: ${lessonCount}`);
    console.log(`  - Exercises: ${exerciseCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Helper function to determine exercise type from question text
function determineExerciseType(questionText) {
  const text = questionText.toLowerCase();

  if (text.includes('chọn') || text.includes('đáp án đúng') || text.includes('?')) {
    return 'multiple-choice';
  } else if (text.includes('điền') || text.includes('ô trống') || text.includes('?') && text.includes('=')) {
    return 'fill-blank';
  } else {
    return 'essay';
  }
}

// Helper function to get icon for topic
function getTopicIcon(order) {
  const icons = {
    1: '📚',
    2: '🌎',
    3: '🔢',
    4: '📐',
    5: '📐'
  };
  return icons[order] || '📖';
}

// Run seed
seedData();

