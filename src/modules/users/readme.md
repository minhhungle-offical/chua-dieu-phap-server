## Những chức năng của User Module

| Chức năng              | Mô tả ngắn                                         | Phương thức & Route          |
| ---------------------- | -------------------------------------------------- | ---------------------------- |
| 🔍 Lấy danh sách User  | Lọc, phân trang theo vai trò, trạng thái...        | `GET /users`                 |
| 📄 Lấy chi tiết User   | Theo ID hoặc username/slug                         | `GET /users/:id`             |
| ✏️ Cập nhật User       | Cập nhật thông tin cá nhân hoặc do Admin chỉnh sửa | `PUT /users/:id`             |
| ❌ Xoá User            | Xoá mềm hoặc xoá vĩnh viễn người dùng              | `DELETE /users/:id`          |
| 🔄 Đổi mật khẩu        | Người dùng thay đổi mật khẩu                       | `PUT /users/change-password` |
| 👤 Cập nhật hồ sơ      | Người dùng chỉnh sửa thông tin của chính mình      | `PUT /users/profile`         |
| 🛡️ Cập nhật quyền      | Quản trị viên thay đổi vai trò người dùng          | `PUT /users/:id/role`        |
| 🚫 Khoá / Mở khoá User | Khoá tài khoản vi phạm hoặc kích hoạt lại          | `PATCH /users/:id/block`     |
| 🖼️ Upload avatar       | Cập nhật ảnh đại diện                              | `POST /users/:id/avatar`     |
| 📜 Xem log hoạt động   | Xem lịch sử thao tác hoặc đăng nhập của người dùng | `GET /users/:id/logs`        |
