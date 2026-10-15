# Testing Guide - Multi-Grade Support (Lớp 1-5)

Chạy `npm run check` từ thư mục gốc để lint, test hồi quy và build. Các test tự động không cần database.

Các bước bên dưới dùng database phát triển riêng. Migration sửa dữ liệu và chỉ cần chạy khi dữ liệu cũ thiếu grade; sao lưu trước khi chạy.

## Chuẩn bị

### 1. Chạy Migration Script

Trước khi test, cần chạy migration để cập nhật dữ liệu cũ:

```bash
cd backend
node scripts/migrateGrade.js
```

Script này sẽ:
- Cập nhật tất cả Topics hiện tại → `grade: 5`
- Cập nhật tất cả Quizzes hiện tại → `grade: 5`

### 2. Khởi động Backend & Frontend

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Test Cases

### ✅ Test 1: Grade Selection Page

**Mục tiêu:** Kiểm tra tất cả lớp đều có thể chọn được

**Các bước:**
1. Truy cập `/select-grade`
2. Kiểm tra 5 card lớp (1-5) đều hiển thị
3. Kiểm tra không có badge "🔒 Sắp ra mắt"
4. Click vào từng lớp → Không có alert "đang được phát triển"
5. Chọn lớp 3 → Chuyển đến trang Home
6. Kiểm tra localStorage: `selectedGrade` = 3

**Kết quả mong đợi:**
- Tất cả 5 lớp đều available
- Màu sắc khác nhau cho mỗi lớp
- Chuyển trang thành công

---

### ✅ Test 2: Topics Filter by Grade (Frontend)

**Mục tiêu:** Topics chỉ hiển thị theo lớp đã chọn

**Các bước:**
1. Đăng nhập với user bất kỳ
2. Chọn Lớp 1 từ Grade Selection
3. Vào trang Topics → Chỉ thấy topics của Lớp 1
4. Quay lại `/select-grade`, chọn Lớp 5
5. Vào trang Topics → Chỉ thấy topics của Lớp 5

**Kết quả mong đợi:**
- API call: `GET /api/topics?grade=1` hoặc `grade=5`
- Topics hiển thị đúng theo grade

---

### ✅ Test 3: Quizzes Filter by Grade (Frontend)

**Mục tiêu:** Quizzes chỉ hiển thị theo lớp đã chọn

**Các bước:**
1. Chọn Lớp 2 từ Grade Selection
2. Vào trang Exam/Quiz List
3. Kiểm tra chỉ hiển thị quizzes của Lớp 2

**Kết quả mong đợi:**
- API call: `GET /api/quizzes?grade=2`
- Quizzes hiển thị đúng theo grade

---

### ✅ Test 4: Admin - Create Topic with Grade

**Mục tiêu:** Admin có thể tạo topic cho từng lớp

**Các bước:**
1. Đăng nhập với tài khoản admin
2. Vào `/admin/topics`
3. Click "Tạo chủ đề mới"
4. Điền:
   - Tên: "Số đến 20"
   - Lớp: Lớp 1
   - Order: 1
5. Submit → Kiểm tra topic được tạo
6. Kiểm tra table có cột "Lớp" hiển thị badge "Lớp 1"

**Kết quả mong đợi:**
- Topic được tạo với `grade: 1`
- Hiển thị đúng trong table

---

### ✅ Test 5: Admin - Edit Topic Grade

**Mục tiêu:** Admin có thể sửa grade của topic

**Các bước:**
1. Vào `/admin/topics`
2. Click "Sửa" một topic
3. Thay đổi Lớp từ 5 → 3
4. Submit
5. Kiểm tra badge trong table đã đổi thành "Lớp 3"

**Kết quả mong đợi:**
- Topic được cập nhật grade thành công

---

### ✅ Test 6: Admin - Create Quiz with Grade

**Mục tiêu:** Admin có thể tạo quiz cho từng lớp

**Các bước:**
1. Vào `/admin/quizzes`
2. Click "Tạo bài thi mới"
3. Điền:
   - Tên: "Kiểm tra Lớp 2 - Chương 1"
   - Lớp: Lớp 2
   - Thời gian: 30 phút
4. Thêm câu hỏi (nếu có)
5. Submit
6. Kiểm tra table có cột "Lớp" hiển thị "Lớp 2"

**Kết quả mong đợi:**
- Quiz được tạo với `grade: 2`
- Hiển thị đúng trong table

---

### ✅ Test 7: Backend API - Topics Filter

**Mục tiêu:** API trả về đúng topics theo grade

**Test với Postman/curl:**

```bash
# Get all topics
GET http://localhost:5000/api/topics

# Get topics for grade 1
GET http://localhost:5000/api/topics?grade=1

# Get topics for grade 5
GET http://localhost:5000/api/topics?grade=5
```

**Kết quả mong đợi:**
- Không có grade param → Trả về tất cả topics
- Có grade param → Chỉ trả về topics của lớp đó

---

### ✅ Test 8: Backend API - Quizzes Filter

**Mục tiêu:** API trả về đúng quizzes theo grade

**Test với Postman/curl:**

```bash
# Get all quizzes
GET http://localhost:5000/api/quizzes

# Get quizzes for grade 3
GET http://localhost:5000/api/quizzes?grade=3

# Get quizzes for grade 5
GET http://localhost:5000/api/quizzes?grade=5
```

**Kết quả mong đợi:**
- Không có grade param → Trả về tất cả quizzes
- Có grade param → Chỉ trả về quizzes của lớp đó

---

### ✅ Test 9: Lessons Inherit Grade from Topic

**Mục tiêu:** Lessons tự động lọc theo grade của topic

**Các bước:**
1. Tạo Topic "Phép cộng" cho Lớp 1
2. Tạo Lesson thuộc Topic đó
3. User chọn Lớp 1
4. Vào trang Lessons → Chỉ thấy lessons của topics Lớp 1

**Kết quả mong đợi:**
- API call: `GET /api/lessons?grade=1`
- Lessons được lọc đúng qua topic.grade

---

### ✅ Test 10: User Profile Grade Sync

**Mục tiêu:** Grade được lưu vào user profile và localStorage

**Các bước:**
1. Đăng nhập
2. Chọn Lớp 4 từ Grade Selection
3. Kiểm tra localStorage: `selectedGrade` = 4
4. Refresh trang
5. Kiểm tra grade vẫn là 4

**Kết quả mong đợi:**
- Grade được persist qua localStorage
- AuthContext.selectedGrade đúng

---

## Checklist Tổng Hợp

- [ ] Migration script chạy thành công
- [ ] Tất cả 5 lớp đều available trong GradeSelection
- [ ] Topics filter theo grade (Frontend)
- [ ] Quizzes filter theo grade (Frontend)
- [ ] Lessons filter theo grade qua topic (Frontend)
- [ ] Admin có thể tạo Topic với grade
- [ ] Admin có thể sửa grade của Topic
- [ ] Admin có thể tạo Quiz với grade
- [ ] Admin có thể sửa grade của Quiz
- [ ] Backend API `/topics?grade=X` hoạt động
- [ ] Backend API `/quizzes?grade=X` hoạt động
- [ ] Backend API `/lessons?grade=X` hoạt động
- [ ] Grade được lưu vào localStorage
- [ ] Grade được sync với AuthContext

---

## Lỗi Thường Gặp

### 1. Topics không filter theo grade

**Nguyên nhân:** Frontend chưa gửi param `grade`

**Giải pháp:** Kiểm tra `Topics.jsx` có gọi `api.get('/topics', { params: { grade: selectedGrade } })`

### 2. Migration script lỗi

**Nguyên nhân:** MongoDB connection string sai hoặc models chưa được import

**Giải pháp:** Kiểm tra `.env` và import đúng models

### 3. Admin form không hiển thị dropdown Grade

**Nguyên nhân:** Chưa cập nhật `AdminTopics.jsx` hoặc `AdminQuizzes.jsx`

**Giải pháp:** Kiểm tra code đã thêm dropdown grade chưa

### 4. Grade không persist sau khi refresh

**Nguyên nhân:** localStorage không được set hoặc AuthContext không đọc

**Giải pháp:** Kiểm tra `setGrade()` function trong AuthContext

---

## Kết Luận

Sau khi hoàn thành tất cả test cases trên, hệ thống đã sẵn sàng hỗ trợ đa lớp (1-5). 

**Bước tiếp theo:** Tạo nội dung bài học (Topics, Lessons, Exercises, Quizzes) cho lớp 1-4.
