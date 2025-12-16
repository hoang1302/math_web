# Frontend - Math Web Grade 5

## Cấu trúc dự án

```
src/
├── components/        # React components
│   ├── Layout.jsx    # Layout với Header, Navigation, Footer
│   └── ProtectedRoute.jsx  # Component bảo vệ routes
├── context/          # React Context
│   └── AuthContext.jsx  # Authentication context
├── pages/            # Page components
│   ├── Home.jsx      # Trang chủ
│   ├── Login.jsx     # Trang đăng nhập
│   └── Register.jsx  # Trang đăng ký
├── utils/            # Utility functions
│   └── api.js        # Axios instance và API calls
└── App.jsx           # Main app component với routing
```

## Environment Variables

Tạo file `.env` trong thư mục `frontend`:

```env
# Local backend (mặc định)
VITE_API_URL=http://localhost:5000/api

# Khi share qua ngrok: đặt URL backend (đã tunnel) kèm /api
# VITE_API_URL=https://your-backend-ngrok.ngrok-free.app/api
```

## Tính năng đã hoàn thành

### 2.1. Layout & Navigation ✅
- **Layout Component**: Header với logo, navigation menu, user menu
- **Navigation**: Menu chính (Trang chủ, Bài học, Luyện tập, Quiz, Tiến độ)
- **Responsive**: Mobile-friendly với mobile navigation
- **Footer**: Footer đơn giản

### 2.2. Authentication Pages ✅
- **Login Page**: Form đăng nhập với email và password
- **Register Page**: Form đăng ký với validation
- **Auth Context**: Quản lý authentication state
- **Protected Routes**: Bảo vệ routes cần đăng nhập
- **API Integration**: Kết nối với backend API

## Cách chạy

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## Routing

- `/` - Trang chủ (public)
- `/login` - Đăng nhập (public)
- `/register` - Đăng ký (public)
- `/lessons` - Bài học (protected)
- `/practice` - Luyện tập (protected)
- `/quiz` - Quiz (protected)
- `/progress` - Tiến độ (protected)

## Components

### Layout
- Header với logo và navigation
- User menu (hiển thị khi đã đăng nhập)
- Mobile navigation
- Footer

### ProtectedRoute
- Kiểm tra authentication
- Redirect đến `/login` nếu chưa đăng nhập
- Hiển thị loading state

### AuthContext
- Quản lý user state
- Login/Register/Logout functions
- Auto-check authentication on mount

## API Integration

Sử dụng `utils/api.js` để gọi API:
- Tự động thêm JWT token vào headers
- Handle 401 errors (auto logout)
- Base URL từ environment variable

