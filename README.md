MathVui – Nền tảng học Toán lớp 5
==================================
By: Nguyễn Văn Hoàng
    Nguyễn Công Anh Nguyên
    Nguyễn Văn Nhật 

### 🧮 Giới thiệu

**MathVui** là một nền tảng web giúp học sinh (đặc biệt là lớp 5) ôn luyện Toán thông qua:
- **Bài học** (tài liệu/PDF) theo chủ đề
- **Bài tập luyện tập** có chấm điểm
- **Bài kiểm tra/quiz** theo chương
- **Theo dõi tiến độ** học tập
- **Huy hiệu / gamification** để tạo động lực
- **Trang quản trị** cho giáo viên/quản trị viên quản lý nội dung và người dùng

---

### 🏗 Kiến trúc hệ thống

- **Backend** (`backend/`)
  - Node.js + Express
  - MongoDB (qua Mongoose)
  - Xác thực JWT, phân quyền cơ bản (user/admin)
  - Quản lý: người dùng, chủ đề, bài học, bài tập, quiz, kết quả, huy hiệu, tiến độ

- **Frontend** (`frontend/`)
  - React + Vite
  - Tailwind CSS cho giao diện hiện đại
  - React Router cho điều hướng nhiều trang (học sinh & admin)
  - Hiển thị công thức toán với **KaTeX / react-katex**

---

### ⚙️ Yêu cầu hệ thống

- Node.js >= 18
- npm >= 9
- Tài khoản **MongoDB Atlas** (hoặc MongoDB cài local)

---

### 🚀 Cài đặt & chạy nhanh (development)

1. **Clone project**

```bash
git clone <repo_url>
cd math_web
```

2. **Cài đặt backend**

```bash
cd backend
npm install
cp env.example .env   # Windows có thể copy thủ công
```

Sau đó sửa file `.env`:
- **MONGODB_URI**: connection string MongoDB
- **JWT_SECRET**: chuỗi bí mật bất kỳ (dùng cho JWT)

Khởi tạo dữ liệu mẫu & admin (tuỳ chọn, nếu có script):

```bash
npm run seed
npm run create-admin
```

Chạy server backend:

```bash
npm run dev
# Mặc định: http://localhost:5000
```

3. **Cài đặt frontend**

```bash
cd ../frontend
npm install
npm run dev
```

Frontend sẽ chạy với Vite, thường là `http://localhost:5173` (hoặc cổng Vite hiển thị trên terminal).

---

### 📁 Cấu trúc thư mục chính

- `backend/`
  - `controllers/` – xử lý logic cho API (auth, bài học, bài tập, quiz, huy hiệu, tiến độ, người dùng,…)
  - `models/` – định nghĩa schema MongoDB (User, Lesson, Topic, Exercise, Quiz, Badge,…)
  - `routes/` – định nghĩa các endpoint API
  - `middleware/` – middleware xác thực, upload file,…
  - `scripts/` – script seed dữ liệu & tạo admin
  - `server.js` – điểm vào của ứng dụng backend

- `frontend/`
  - `src/pages/` – các trang như `Home`, `Dashboard`, `Practice`, `Exam`, `Lessons`, `Topics`, `Profile`, `admin/*`
  - `src/components/` – layout, bảo vệ route, hiển thị slide/bài học, render công thức toán
  - `src/context/` – `AuthContext` quản lý trạng thái đăng nhập
  - `src/utils/api.js` – cấu hình axios & gọi API

---

### 👤 Các luồng người dùng chính

- **Học sinh**
  - Đăng ký / đăng nhập
  - Xem bài học theo chủ đề
  - Làm bài tập, bài kiểm tra, xem điểm
  - Xem tiến độ, huy hiệu đạt được

- **Admin**
  - Đăng nhập trang quản trị
  - Quản lý chủ đề, bài học, bài tập, quiz
  - Quản lý người dùng, xem tiến độ & kết quả

---

### 🧩 Hướng phát triển tiếp theo (gợi ý)

- Thêm ngân hàng câu hỏi phong phú hơn (nhiều dạng bài)
- Thêm thống kê chi tiết hơn cho giáo viên/phụ huynh
- Hỗ trợ nhiều khối lớp (không chỉ lớp 5)
- Đa ngôn ngữ giao diện

---

### 🤝 Đóng góp

Pull Request / Issue rất hoan nghênh.  
Nếu bạn muốn triển khai thực tế cho học sinh, có thể fork repo, tùy chỉnh nội dung bài học và giao diện cho phù hợp.

