# API Documentation - Authentication

## Base URL
```
http://localhost:5000/api
```

## Authentication Endpoints

### 1. Register User
Đăng ký tài khoản mới.

**Endpoint:** `POST /api/auth/register`

**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username" (optional),
  "fullName": "Full Name" (optional)
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "user@example.com",
    "role": "student",
    "profile": {
      "fullName": "Full Name",
      "avatar": "",
      "grade": 5
    }
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Please provide email and password"
}
```

**Validation:**
- Email: Required, must be valid email format
- Password: Required, minimum 6 characters
- Username: Optional, auto-generated from email if not provided
- FullName: Optional

---

### 2. Login User
Đăng nhập với email và password.

**Endpoint:** `POST /api/auth/login`

**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "user@example.com",
    "role": "student",
    "profile": {
      "fullName": "Full Name",
      "avatar": "",
      "grade": 5
    }
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### 3. Get Current User
Lấy thông tin user hiện tại (đã đăng nhập).

**Endpoint:** `GET /api/auth/me`

**Access:** Private (Requires JWT Token)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "user@example.com",
    "role": "student",
    "profile": {
      "fullName": "Full Name",
      "avatar": "",
      "grade": 5
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

---

### 4. Logout User
Đăng xuất (client-side token removal).

**Endpoint:** `POST /api/auth/logout`

**Access:** Private (Requires JWT Token)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Note:** Vì sử dụng JWT stateless, logout được xử lý ở client-side bằng cách xóa token khỏi storage.

---

## Authentication Flow

1. **Register/Login** → Nhận JWT token
2. **Store token** → Lưu token vào localStorage/sessionStorage
3. **Use token** → Gửi token trong header `Authorization: Bearer <token>` cho các request protected
4. **Logout** → Xóa token khỏi storage

## Example Usage

### Register
```javascript
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    fullName: 'John Doe'
  })
});

const data = await response.json();
localStorage.setItem('token', data.token);
```

### Login
```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();
localStorage.setItem('token', data.token);
```

### Get Current User
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:5000/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.user);
```

---

## Error Codes

- **400**: Bad Request - Validation error
- **401**: Unauthorized - Invalid credentials or missing/invalid token
- **403**: Forbidden - Insufficient permissions
- **500**: Internal Server Error - Server error

---

## JWT Token

- **Expiration**: 30 days (có thể cấu hình qua `JWT_EXPIRE` trong `.env`)
- **Secret**: Được lưu trong `JWT_SECRET` trong `.env`
- **Format**: `Bearer <token>` trong Authorization header

