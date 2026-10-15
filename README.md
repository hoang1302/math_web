# MathVui — Học Toán lớp 1–5

Nền tảng học Toán với bài học, luyện tập, quiz, tiến độ, huy hiệu và trang quản trị.

Tác giả: Nguyễn Văn Hoàng, Nguyễn Công Anh Nguyên, Nguyễn Văn Nhật.

## Yêu cầu

- Node.js >= 22.12 và npm >= 10.
- MongoDB local hoặc MongoDB Atlas để chạy các tính năng có dữ liệu.

## Cài đặt

Clone repo và cài một lần tại thư mục gốc; npm workspaces quản lý cả frontend và backend.

```bash
git clone https://github.com/hoang1302/math_web.git
cd math_web
npm ci
```

Sao chép `backend/env.example` thành `backend/.env` và đặt `MONGODB_URI`, `JWT_SECRET` riêng.
Backend luôn đọc file này theo vị trí thư mục backend, kể cả khi khởi động từ thư mục gốc.
Khi phát triển, nếu không đặt MongoDB URI, backend dùng `mongodb://127.0.0.1:27017/math_web_grade5`.
Trong production, `MONGODB_URI` bắt buộc. Server chỉ lắng nghe sau khi kết nối MongoDB thành công.

Chạy hai terminal từ thư mục gốc:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

Frontend: http://localhost:3000. Backend: http://localhost:5000.
Vite chuyển tiếp `/api` và `/uploads` đến backend.

## Cấu hình frontend và triển khai

Development không cần file môi trường frontend. Khi frontend và backend khác domain,
sao chép `frontend/env.example` thành `frontend/.env` rồi đặt:

```dotenv
VITE_API_URL=https://your-backend.example.com/api
```

Biến này được đưa vào lúc build. Build bằng `npm run build`, xuất bản `frontend/dist`.
Production cùng domain cần reverse proxy cho `/api` và `/uploads`; Vite proxy chỉ hoạt động khi development.
Nếu dùng tunnel khi phát triển, khai báo hostname cụ thể trong `VITE_ALLOWED_HOSTS`, phân cách bằng dấu phẩy.

## Tạo admin

Đặt `ADMIN_EMAIL`, `ADMIN_USERNAME` và `ADMIN_PASSWORD` (ít nhất 12 ký tự) trong `backend/.env`, rồi chạy:

```bash
npm run create-admin --workspace backend
```

Script tạo tài khoản mới và báo lỗi nếu email hoặc username đã tồn tại.
Không đặt lại mật khẩu hoặc ghi đè tài khoản đang có.

## Kiểm tra

```bash
npm run lint
npm test
npm run build
# Hoặc chạy cả ba:
npm run check
```

Test tự động dùng Node.js test runner, không cần MongoDB.
Các test controller thay thế thao tác model bằng stub; kiểm tra tích hợp với MongoDB thực cần chạy riêng.
Xem `TESTING_GUIDE.md` cho các luồng kiểm tra thủ công và `CLEANUP_REPORT.md` cho phạm vi thay đổi.

## Cấu trúc

- `backend/app.js`: ứng dụng Express, routes và xử lý lỗi; có thể import để test.
- `backend/server.js`: kiểm tra cấu hình, kết nối database và khởi động server.
- `backend/controllers/`, `models/`, `routes/`, `middleware/`: API và dữ liệu.
- `backend/utils/answers.js`: logic chấm đáp án dùng chung cho bài tập và quiz.
- `frontend/src/App.jsx`: routes lồng nhau theo layout, tải trang khi cần.
- `frontend/src/context/`: đăng nhập và lựa chọn lớp.
- `frontend/src/utils/`: API, chuẩn hóa URL và lưu phiên đăng nhập.
- `backend/tests/`, `frontend/tests/`: test hồi quy.

## Dữ liệu mẫu và migration

Script `seed` hiện cần `noi_dung.md`, file chưa có trong repo. Script này xóa topics,
lessons và exercises trước khi seed, vì vậy chỉ dùng với database phát triển đã sao lưu.
Các script migration trong `backend/scripts` sửa dữ liệu; xem hướng dẫn trong thư mục trước khi chạy.
