# Kế hoạch mở rộng từ Lớp 5 sang Lớp 1-5

## 1. Database Schema - Thêm trường `grade`

### Backend Models cần sửa:

**`Topic.js`** - Thêm field grade:
```js
grade: {
  type: Number,
  enum: [1, 2, 3, 4, 5],
  required: true
}
```

**`Lesson.js`** - Kế thừa grade từ Topic (không cần sửa)

**`Exercise.js`** - Kế thừa grade từ Lesson (không cần sửa)

**`Quiz.js`** - Thêm field grade:
```js
grade: {
  type: Number,
  enum: [1, 2, 3, 4, 5],
  required: true
}
```

**`User.js`** - Đã có `profile.grade` (mặc định = 5) ✅

## 2. Backend API - Filter theo grade

### Controllers cần cập nhật:

**`topicController.js`**:
- `getTopics()`: Lọc theo `req.query.grade` hoặc `req.user.profile.grade`

**`lessonController.js`**:
- `getLessonsByTopic()`: Kiểm tra topic.grade khớp với user.grade

**`quizController.js`**:
- `getQuizzes()`: Lọc theo grade

**`exerciseController.js`**:
- `getExercisesByLesson()`: Kiểm tra lesson → topic → grade

## 3. Frontend - UI đã sẵn sàng

**`GradeSelection.jsx`** - Đã có UI chọn lớp ✅
- Cập nhật `available: true` cho lớp 1-4
- Xóa logic `alert()` khi chọn lớp bị khóa

**`AuthContext.js`**:
- Đã có `selectedGrade` và `setGrade()` ✅
- Đảm bảo lưu vào `localStorage` và gửi lên server

## 4. Seed Data - Tạo nội dung cho lớp 1-4

**`seedData.js`**:
- Tạo Topics cho từng lớp (1-5)
- Tạo Lessons tương ứng
- Tạo Exercises cho mỗi lesson
- Tạo Quizzes cho từng lớp

**Ví dụ cấu trúc**:
```js
// Lớp 1: Số đến 20, phép cộng trừ cơ bản
// Lớp 2: Số đến 100, bảng nhân 2-5
// Lớp 3: Số đến 1000, bảng nhân đầy đủ
// Lớp 4: Phân số, đo lường, hình học cơ bản
// Lớp 5: Phân số phức tạp, tỉ lệ, diện tích thể tích
```

## 5. Migration Script (nếu có data cũ)

Tạo script `migrateGrade.js`:
- Cập nhật tất cả Topic hiện tại → `grade: 5`
- Cập nhật tất cả Quiz hiện tại → `grade: 5`

## 6. Admin Panel

**`admin/Topics.jsx`**:
- Thêm dropdown chọn Grade khi tạo/sửa Topic

**`admin/Quizzes.jsx`**:
- Thêm dropdown chọn Grade khi tạo/sửa Quiz

**`admin/Lessons.jsx`**:
- Hiển thị grade của Topic (read-only)

## 7. Testing Checklist

- [ ] User chọn lớp → Chỉ thấy Topics/Quizzes của lớp đó
- [ ] Admin tạo Topic/Quiz → Phải chọn Grade
- [ ] Seed data → Mỗi lớp có ít nhất 3-5 topics
- [ ] Migration → Data cũ vẫn hoạt động (grade = 5)
- [ ] UI GradeSelection → Tất cả lớp đều `available: true`

## 8. Thứ tự thực hiện

1. **Backend Models** (Topic, Quiz thêm grade)
2. **Migration Script** (cập nhật data cũ)
3. **Backend Controllers** (filter theo grade)
4. **Seed Data** (tạo nội dung lớp 1-4)
5. **Frontend GradeSelection** (mở khóa tất cả lớp)
6. **Admin Panel** (UI quản lý grade)
7. **Testing** (kiểm tra toàn bộ flow)

---

**Ước tính thời gian**: 2-3 ngày (nếu có nội dung bài học sẵn)
**Khó khăn chính**: Tạo nội dung bài học chất lượng cho 4 lớp còn lại
