# Database Models

Tài liệu mô tả các Mongoose models trong hệ thống.

## 📋 Danh sách Models

### 1. User Model (`User.js`)
Quản lý thông tin người dùng (học sinh và admin).

**Schema:**
- `username`: String (unique, required, 3-30 chars)
- `email`: String (unique, required, validated)
- `password`: String (required, min 6 chars, hashed với bcrypt)
- `role`: Enum ['student', 'admin'], default: 'student'
- `profile`: Object
  - `fullName`: String
  - `avatar`: String
  - `grade`: Number (default: 5)
- `createdAt`, `updatedAt`: Date

**Methods:**
- `comparePassword(candidatePassword)`: So sánh password
- `toJSON()`: Trả về user object không có password

**Indexes:**
- `username`: unique
- `email`: unique

---

### 2. Topic Model (`Topic.js`)
Quản lý các chủ đề học tập.

**Schema:**
- `title`: String (required)
- `description`: String
- `order`: Number (required, unique) - Thứ tự hiển thị
- `icon`: String - Icon cho chủ đề
- `isActive`: Boolean (default: true)
- `createdAt`, `updatedAt`: Date

**Indexes:**
- `order`: unique

---

### 3. Lesson Model (`Lesson.js`)
Quản lý các bài học trong mỗi chủ đề.

**Schema:**
- `topicId`: ObjectId (ref: Topic, required)
- `title`: String (required)
- `content`: String (required) - Nội dung lý thuyết
- `videoUrl`: String - Link video (nếu có)
- `order`: Number (required) - Thứ tự trong chủ đề
- `estimatedTime`: Number (default: 15) - Thời gian ước tính (phút)
- `isActive`: Boolean (default: true)
- `createdAt`, `updatedAt`: Date

**Indexes:**
- `topicId`, `order`: compound index
- `topicId`: index

---

### 4. Exercise Model (`Exercise.js`)
Quản lý các bài tập/câu hỏi.

**Schema:**
- `lessonId`: ObjectId (ref: Lesson, required)
- `type`: Enum ['multiple-choice', 'fill-blank', 'essay'] (required)
- `question`: String (required) - Nội dung câu hỏi
- `options`: [String] - Các lựa chọn (cho multiple-choice)
- `correctAnswer`: Mixed (required) - Đáp án đúng
- `explanation`: String - Giải thích đáp án
- `hint`: String - Gợi ý
- `difficulty`: Enum ['easy', 'medium', 'hard'] (default: 'medium')
- `points`: Number (default: 1) - Điểm số
- `blankPositions`: [Number] - Vị trí chỗ trống (cho fill-blank)
- `isActive`: Boolean (default: true)
- `createdAt`, `updatedAt`: Date

**Indexes:**
- `lessonId`, `difficulty`: compound index
- `lessonId`: index
- `type`, `difficulty`: compound index

---

### 5. Quiz Model (`Quiz.js`)
Quản lý các bài kiểm tra/quiz.

**Schema:**
- `title`: String (required)
- `description`: String
- `questions`: [ObjectId] (ref: Exercise) - Danh sách câu hỏi
- `timeLimit`: Number (required, min: 1) - Thời gian làm bài (phút)
- `topics`: [ObjectId] (ref: Topic) - Các chủ đề được kiểm tra
- `totalPoints`: Number (default: 0) - Tổng điểm, tự động tính
- `createdBy`: ObjectId (ref: User) - Người tạo quiz
- `isActive`: Boolean (default: true)
- `createdAt`, `updatedAt`: Date

**Pre-save hook:**
- Tự động tính `totalPoints` từ tổng điểm của các exercises

**Indexes:**
- `createdBy`: index
- `isActive`: index

---

### 6. UserProgress Model (`UserProgress.js`)
Theo dõi tiến độ học tập của học sinh.

**Schema:**
- `userId`: ObjectId (ref: User, required)
- `lessonId`: ObjectId (ref: Lesson, required)
- `completed`: Boolean (default: false)
- `completionPercentage`: Number (0-100, default: 0)
- `bestScore`: Number (0-100, default: 0)
- `attempts`: Number (default: 0) - Số lần thử
- `timeSpent`: Number (default: 0) - Thời gian học (phút)
- `lastAttemptAt`: Date
- `completedAt`: Date
- `createdAt`, `updatedAt`: Date

**Indexes:**
- `userId`, `lessonId`: compound unique index
- `userId`, `completed`: compound index

---

### 7. QuizResult Model (`QuizResult.js`)
Lưu kết quả làm quiz của học sinh.

**Schema:**
- `userId`: ObjectId (ref: User, required)
- `quizId`: ObjectId (ref: Quiz, required)
- `score`: Number (required, min: 0)
- `totalScore`: Number (required)
- `percentage`: Number (required, 0-100)
- `totalQuestions`: Number (required)
- `correctAnswers`: Number (required, min: 0)
- `wrongAnswers`: Number (required, min: 0)
- `timeSpent`: Number (required, min: 0) - Thời gian làm (giây)
- `answers`: [Object] - Chi tiết từng câu trả lời
  - `exerciseId`: ObjectId (ref: Exercise)
  - `userAnswer`: Mixed
  - `isCorrect`: Boolean
  - `points`: Number
- `topicStats`: [Object] - Thống kê theo chủ đề
  - `topicId`: ObjectId (ref: Topic)
  - `correct`: Number
  - `total`: Number
- `completedAt`: Date
- `createdAt`: Date

**Indexes:**
- `userId`, `completedAt`: compound index (descending)
- `quizId`: index
- `userId`, `quizId`: compound index

---

### 8. Badge Model (`Badge.js`)
Quản lý các huy hiệu/achievements.

**Schema:**
- `name`: String (required, unique)
- `description`: String (required)
- `icon`: String (required, default: '🏆')
- `condition`: Mixed (required) - Điều kiện để đạt huy hiệu
  - Ví dụ: `{ type: 'exercises_completed', value: 50 }`
  - Ví dụ: `{ type: 'quiz_score', value: 90, timeLimit: 10 }`
- `rarity`: Enum ['common', 'rare', 'epic', 'legendary'] (default: 'common')
- `isActive`: Boolean (default: true)
- `createdAt`, `updatedAt`: Date

---

### 9. UserBadge Model (`UserBadge.js`)
Lưu huy hiệu mà học sinh đã đạt được.

**Schema:**
- `userId`: ObjectId (ref: User, required)
- `badgeId`: ObjectId (ref: Badge, required)
- `earnedAt`: Date (default: now)
- `metadata`: Mixed - Thông tin bổ sung (điểm số, thời gian, etc.)
- `createdAt`, `updatedAt`: Date

**Indexes:**
- `userId`, `badgeId`: compound unique index
- `userId`, `earnedAt`: compound index (descending)

---

## 📦 Import Models

Tất cả models được export từ `index.js`:

```javascript
import { User, Topic, Lesson, Exercise, Quiz, UserProgress, QuizResult, Badge, UserBadge } from './models/index.js';
```

Hoặc import từng model:

```javascript
import User from './models/User.js';
import Topic from './models/Topic.js';
// ...
```

---

## 🔗 Relationships

```
User
  ├── UserProgress (1:N)
  ├── QuizResult (1:N)
  ├── UserBadge (1:N)
  └── Quiz.createdBy (1:N)

Topic
  ├── Lesson (1:N)
  └── Quiz.topics (N:M)

Lesson
  ├── Exercise (1:N)
  └── UserProgress (1:N)

Exercise
  └── Quiz.questions (N:M)

Quiz
  └── QuizResult (1:N)

Badge
  └── UserBadge (1:N)
```

---

## ✅ Validation

Tất cả models đều có:
- Required fields validation
- Type validation
- Custom validators (email, enum, etc.)
- Indexes cho performance
- Timestamps (createdAt, updatedAt)

---

## 🔐 Security

- User password được hash bằng bcrypt (10 rounds)
- Password không được trả về trong JSON response
- Unique constraints để tránh duplicate data

