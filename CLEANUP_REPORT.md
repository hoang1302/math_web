# Báo cáo cleanup MathVui

## Phạm vi

Dọn cấu trúc và sửa các lỗi thấy khi review; giữ React/Express/MongoDB và các luồng học hiện có.

- Gom routes theo layout, bảo vệ admin trước khi render layout và lazy-load các trang.
- Dùng chung thao tác đăng nhập/đăng ký, khôi phục phiên an toàn, xóa lớp cũ khi đổi tài khoản.
- Giữ thông báo sai mật khẩu tại form; lỗi hết phiên cập nhật context và redirect qua router.
- Dùng URL API tương đối khi development, chuẩn hóa hậu tố URL và proxy cả uploads.
- Tách Express app khỏi server, dùng một cấu hình MongoDB và kiểm tra biến môi trường khi khởi động.
- Dùng chung bộ so đáp án; chuỗi số có ký tự thừa không được chấm đúng.
- Quiz từ chối câu hỏi ngoài đề, ID trùng, answer lỗi và timeSpent không hợp lệ; câu bỏ trống được tính sai.
- Chấm theo thứ tự câu hỏi và số điểm hiện tại; gom populate chủ đề để tránh truy vấn từng câu.
- Sửa timer dùng thời hạn thực, gửi bài ngoài state updater và chặn gửi trùng khi click/hết giờ đồng thời.
- Kết quả quiz tìm câu hỏi theo ID, dùng đáp án lưu trong kết quả và bỏ các request lấy đáp án thừa.
- Yêu cầu admin cho tham số includeAnswers; endpoint kiểm tra đáp án luyện tập vẫn giữ hành vi hiện có.
- Cập nhật state luyện tập theo giá trị trước đó, đợi kết quả chấm trước khi đánh dấu hoàn thành.
- Script tạo admin dùng biến môi trường, không ghi đè tài khoản hay in mật khẩu.
- Sửa Link thiếu import, xóa import/state/code thừa, sửa hook dependencies và regex Unicode.
- Thay các đường dẫn ảnh nền thiếu bằng ảnh có sẵn, bỏ hostname tunnel cá nhân.
- Chuẩn hóa lệnh npm workspaces, thêm lint toàn repo, test runner, quy tắc editor và dòng kết thúc.
- Cập nhật lockfile trong phạm vi phiên bản tương thích; bỏ nodemon và react-katex không dùng.

## Kiểm tra

- Lint frontend/backend đạt, không có warning.
- Test hồi quy cho đáp án, quiz controller, HTTP health/auth/JSON, phiên đăng nhập và URL API.
- Build production với Vite.
- Kiểm tra trình duyệt bằng API fixture local; không ghi dữ liệu vào MongoDB.

## Giới hạn và việc tiếp theo

- Chưa có cấu hình MongoDB/tài khoản thử nghiệm thực, nên chưa kiểm tra CRUD, upload và migration với database thực.
- npm audit giảm từ 37 xuống 10 cảnh báo: 5 high, 4 moderate, 1 low; không còn critical.
  Các mục còn lại liên quan chuỗi dependency Tailwind 3 (braces/PostCSS), React Router 6 và KaTeX.
  Cần một đợt nâng phiên bản lớn và kiểm tra giao diện riêng; không dùng audit fix --force.
- Script seed cần noi_dung.md chưa có trong repository.
- MathRenderer hiện hỗ trợ HTML bằng innerHTML; cần bổ sung sanitization nếu cho phép nội dung không tin cậy.
- Thời gian làm quiz còn do client báo; nếu dùng thi chính thức cần lưu phiên thi/thời hạn ở server.

Kết quả lượt kiểm tra cuối: 50/50 test đạt. Trình duyệt với API fixture local xác nhận sai mật khẩu hiển thị tại form, đăng nhập đến trang chọn lớp, học sinh truy cập admin chuyển về trang chủ và quiz tự nộp sau thời hạn 6 giây.
