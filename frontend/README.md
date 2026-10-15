# Frontend MathVui

React 18, Vite, Tailwind CSS, React Router và KaTeX.

Chạy từ thư mục gốc repository:

```bash
npm ci
npm run dev:frontend
npm run build
```

Frontend chạy tại http://localhost:3000 và proxy `/api`, `/uploads` tới backend cổng 5000.
Khi triển khai riêng domain, đặt `VITE_API_URL` với hậu tố `/api` trước khi build.
Xem `env.example` và README tại thư mục gốc.

`/login`, `/register` là trang công khai. Các trang học yêu cầu đăng nhập;
`/select-grade` chọn lớp; `/admin/*` yêu cầu role admin.
Lỗi 401 từ login/register được hiển thị tại form. Lỗi 401 của yêu cầu có token xóa phiên
và cập nhật AuthContext để route chuyển về trang đăng nhập.
