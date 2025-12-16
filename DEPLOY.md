## Deploy hướng dẫn nhanh (Frontend Vercel, Backend Render, MongoDB Atlas)

### 1. Chuẩn bị
- Tài khoản Vercel (frontend).
- Tài khoản Render (backend).
- MongoDB Atlas đã có `MONGO_URI` (SRV string).
- Các biến môi trường cần dùng:
  - `MONGO_URI` (Atlas)
  - `JWT_SECRET`
  - `JWT_EXPIRE` (ví dụ `30d`)
  - `PORT` (Render tự set, dùng biến `PORT` do Render cấp)

### 2. Backend lên Render
1) Push code lên GitHub (hoặc GitLab).
2) Vào Render → **New +** → **Web Service** → chọn repo.
3) Thiết lập:
   - **Branch**: `main` (hoặc branch bạn dùng).
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (hoặc `node src/server.js` nếu cần)
   - **Runtime**: Node 18+.
4) Environment variables (tab **Environment**):
   - `MONGO_URI=<chuỗi Atlas>`
   - `JWT_SECRET=<chuỗi bí mật>`
   - `JWT_EXPIRE=30d`
   - (Render sẽ tự cung cấp `PORT`, không cần set)
5) Deploy. Render sẽ tạo URL dạng `https://<app-name>.onrender.com`.

### 3. Frontend lên Vercel (Vite/React)
1) Push code lên GitHub.
2) Vào Vercel → **New Project** → chọn repo.
3) Thiết lập:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4) Environment variables (Vercel Project Settings → Environment Variables):
   - `VITE_API_BASE_URL=https://<backend-render>.onrender.com/api`
5) Deploy. Sau khi build, Vercel sẽ cấp domain dạng `https://<project>.vercel.app`.

### 4. Cấu hình CORS (nếu cần)
- Nếu backend đang bật CORS giới hạn, đảm bảo cho phép domain của Vercel (và domain custom nếu có).
- Nếu CORS mở rộng rồi thì không cần đổi.

### 5. Kiểm tra sau deploy
- Mở frontend Vercel URL, thử đăng nhập/đăng ký.
- Kiểm tra network: API trỏ về Render URL `/api`.
- Render logs: vào Render → Service → Logs để xem lỗi (nếu có).

### 6. Dùng domain tùy chỉnh (tuỳ chọn)
- Frontend: add custom domain trên Vercel, trỏ DNS CNAME theo hướng dẫn Vercel.
- Backend: Render hỗ trợ custom domain → add domain và trỏ CNAME / A theo hướng dẫn Render.
- Cập nhật `VITE_API_BASE_URL` nếu đổi domain backend.

### 7. Triển khai lại (redeploy)
- Frontend: push code lên branch, Vercel tự redeploy.
- Backend: push code, Render tự redeploy; có thể “Manual Deploy” từ dashboard.

### 8. Ghi chú bảo mật
- Không commit `.env`. Thiết lập env trực tiếp trên Vercel/Render.
- Đặt `JWT_SECRET` đủ mạnh.


