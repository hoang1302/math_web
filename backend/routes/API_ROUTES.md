# API Routes Documentation

Base URL: `http://localhost:5000/api`

## 📚 Topics API

### GET /api/topics
Lấy danh sách tất cả chủ đề (active)

**Access:** Public

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [...]
}
```

### GET /api/topics/:id
Lấy chi tiết một chủ đề

**Access:** Public

---

## 📖 Lessons API

### GET /api/lessons
Lấy danh sách bài học

**Query params:**
- `topicId` - Filter theo chủ đề

**Access:** Public

### GET /api/lessons/:id
Lấy chi tiết một bài học

**Access:** Public

### POST /api/lessons
Tạo bài học mới

**Access:** Private/Admin

**Body:**
```json
{
  "topicId": "...",
  "title": "...",
  "content": "...",
  "order": 1
}
```

### PUT /api/lessons/:id
Cập nhật bài học

**Access:** Private/Admin

### DELETE /api/lessons/:id
Xóa bài học (soft delete)

**Access:** Private/Admin

---

## ✏️ Exercises API

### GET /api/exercises
Lấy danh sách bài tập

**Query params:**
- `lessonId` - Filter theo bài học
- `difficulty` - Filter theo độ khó (easy/medium/hard)
- `type` - Filter theo loại (multiple-choice/fill-blank/essay)

**Access:** Public

**Note:** Không trả về đáp án đúng

### GET /api/exercises/random
Lấy bài tập ngẫu nhiên

**Query params:**
- `lessonId` - Filter theo bài học
- `difficulty` - Filter theo độ khó
- `limit` - Số lượng (default: 5)

**Access:** Public

### GET /api/exercises/:id
Lấy chi tiết một bài tập

**Access:** Public

**Note:** Không trả về đáp án đúng

### POST /api/exercises/check
Kiểm tra đáp án

**Access:** Public

**Body:**
```json
{
  "exerciseId": "...",
  "userAnswer": "answer"
}
```

**Response:**
```json
{
  "success": true,
  "isCorrect": true,
  "correctAnswer": "...",
  "explanation": "...",
  "points": 1
}
```

### POST /api/exercises
Tạo bài tập mới

**Access:** Private/Admin

---

## 📝 Quiz API

### GET /api/quizzes
Lấy danh sách quiz

**Access:** Public

### GET /api/quizzes/:id
Lấy chi tiết quiz (không có đáp án)

**Access:** Public

### POST /api/quizzes/:id/start
Bắt đầu làm quiz

**Access:** Private

**Response:** Quiz với questions (không có đáp án)

### POST /api/quizzes/:id/submit
Nộp bài quiz

**Access:** Private

**Body:**
```json
{
  "answers": [
    { "exerciseId": "...", "userAnswer": "..." }
  ],
  "timeSpent": 300
}
```

**Response:** QuizResult với điểm số và chi tiết

### GET /api/quizzes/:id/results
Lấy kết quả quiz

**Query params:**
- `userId` - Filter theo user (admin only)

**Access:** Private

### POST /api/quizzes
Tạo quiz mới

**Access:** Private/Admin

---

## 📊 Progress API

### GET /api/progress
Lấy tiến độ học tập của user

**Access:** Private

### GET /api/progress/stats
Lấy thống kê tổng quan (dashboard)

**Access:** Private

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "completionPercentage": 75,
      "completedLessons": 15,
      "totalLessons": 20,
      "averageScore": 85,
      "quizCount": 5,
      "quizAverageScore": 80,
      "totalStudyTime": 120
    },
    "topicProgress": [...],
    "recentBadges": [...]
  }
}
```

### GET /api/progress/lessons/:lessonId
Lấy tiến độ của một bài học

**Access:** Private

### POST /api/progress/lessons/:lessonId
Cập nhật tiến độ bài học

**Access:** Private

**Body:**
```json
{
  "completed": true,
  "completionPercentage": 100,
  "score": 90,
  "timeSpent": 15
}
```

---

## 🏆 Badges API

### GET /api/badges
Lấy danh sách tất cả huy hiệu

**Access:** Public

### GET /api/badges/user
Lấy huy hiệu của user hiện tại

**Access:** Private

**Response:** Danh sách badges với trạng thái earned/not earned

### POST /api/badges/check
Kiểm tra và cấp huy hiệu tự động

**Access:** Private

**Response:**
```json
{
  "success": true,
  "message": "Earned 2 new badge(s)!",
  "newlyEarned": [...],
  "count": 2
}
```

---

## 🔐 Authentication

Tất cả routes có **Private** access cần JWT token trong header:

```
Authorization: Bearer <token>
```

Routes có **Private/Admin** chỉ dành cho user có role `admin`.

---

## 📝 Response Format

Tất cả responses đều có format:

**Success:**
```json
{
  "success": true,
  "data": {...},
  "message": "..." (optional)
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error message"
}
```

---

## 🔢 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

