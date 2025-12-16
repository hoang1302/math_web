# Data Seeding Scripts

## seedData.js

Script để import dữ liệu từ file `noi_dung.md` vào MongoDB.

### Cách sử dụng:

```bash
cd backend
npm run seed
```

### Chức năng:

1. **Parse file noi_dung.md**
   - Đọc và parse file `noi_dung.md` từ thư mục root
   - Extract topics (chủ đề)
   - Extract lessons (bài học) trong mỗi topic
   - Extract exercises (bài tập) trong mỗi lesson

2. **Import vào MongoDB**
   - Xóa dữ liệu cũ (topics, lessons, exercises)
   - Tạo topics mới
   - Tạo lessons mới và link với topics
   - Tạo exercises mới và link với lessons

### Cấu trúc dữ liệu được parse:

- **Topics**: Được nhận diện bởi pattern `📚 Chủ đề X: Title`
- **Lessons**: Được nhận diện bởi pattern `Bài X: Title`
- **Content**: Phần "Nội dung kiến thức và ví dụ"
- **Exercises**: Phần "Bài tập luyện tập"

### Lưu ý:

- Script sẽ **xóa tất cả dữ liệu cũ** trước khi import
- Exercises được tự động phân loại type (multiple-choice, fill-blank, essay) dựa trên nội dung
- Đáp án đúng sẽ được set là "Đáp án sẽ được cập nhật" - cần cập nhật thủ công sau
- Script tạo placeholder exercises nếu không tìm thấy bài tập trong lesson

### Output:

Script sẽ hiển thị:
- Số lượng topics, lessons, exercises đã tạo
- ID của từng item được tạo
- Tổng kết cuối cùng

### Troubleshooting:

- **Lỗi kết nối MongoDB**: Kiểm tra `MONGODB_URI` trong file `.env`
- **Lỗi parse file**: Kiểm tra format của file `noi_dung.md`
- **Lỗi duplicate**: Script sẽ xóa dữ liệu cũ trước, nên không lo duplicate

