export const STATUS_CODES = {
  // 1xx Informational - Thông tin
  CONTINUE: 100, // Continue - Tiếp tục
  SWITCHING_PROTOCOLS: 101, // Switching Protocols - Đang chuyển giao thức
  PROCESSING: 102, // Processing - Đang xử lý
  EARLY_HINTS: 103, // Early Hints - Gợi ý sớm

  // 2xx Success - Thành công
  OK: 200, // OK - Thành công
  CREATED: 201, // Created - Đã tạo tài nguyên mới
  ACCEPTED: 202, // Accepted - Đã nhận và chấp nhận xử lý
  NON_AUTHORITATIVE_INFORMATION: 203, // Non-Authoritative Information - Thông tin không chính thức
  NO_CONTENT: 204, // No Content - Không có nội dung trả về
  RESET_CONTENT: 205, // Reset Content - Yêu cầu đặt lại nội dung
  PARTIAL_CONTENT: 206, // Partial Content - Nội dung trả về một phần
  MULTI_STATUS: 207, // Multi-Status - Trạng thái nhiều phần
  ALREADY_REPORTED: 208, // Already Reported - Đã báo cáo rồi
  IM_USED: 226, // IM Used - Đã sử dụng

  // 3xx Redirection - Chuyển hướng
  MULTIPLE_CHOICES: 300, // Multiple Choices - Nhiều lựa chọn
  MOVED_PERMANENTLY: 301, // Moved Permanently - Di chuyển vĩnh viễn
  FOUND: 302, // Found - Tìm thấy (chuyển hướng tạm thời)
  SEE_OTHER: 303, // See Other - Xem trang khác
  NOT_MODIFIED: 304, // Not Modified - Không thay đổi
  USE_PROXY: 305, // Use Proxy - Sử dụng proxy
  TEMPORARY_REDIRECT: 307, // Temporary Redirect - Chuyển hướng tạm thời
  PERMANENT_REDIRECT: 308, // Permanent Redirect - Chuyển hướng vĩnh viễn

  // 4xx Client Error - Lỗi phía client
  BAD_REQUEST: 400, // Bad Request - Yêu cầu không hợp lệ
  UNAUTHORIZED: 401, // Unauthorized - Chưa xác thực
  PAYMENT_REQUIRED: 402, // Payment Required - Cần thanh toán
  FORBIDDEN: 403, // Forbidden - Cấm truy cập
  NOT_FOUND: 404, // Not Found - Không tìm thấy
  METHOD_NOT_ALLOWED: 405, // Method Not Allowed - Phương thức không được phép
  NOT_ACCEPTABLE: 406, // Not Acceptable - Không chấp nhận
  PROXY_AUTHENTICATION_REQUIRED: 407, // Proxy Authentication Required - Cần xác thực proxy
  REQUEST_TIMEOUT: 408, // Request Timeout - Hết thời gian chờ
  CONFLICT: 409, // Conflict - Xung đột
  GONE: 410, // Gone - Đã bị xóa
  LENGTH_REQUIRED: 411, // Length Required - Cần độ dài
  PRECONDITION_FAILED: 412, // Precondition Failed - Tiền điều kiện thất bại
  PAYLOAD_TOO_LARGE: 413, // Payload Too Large - Dữ liệu quá lớn
  URI_TOO_LONG: 414, // URI Too Long - URI quá dài
  UNSUPPORTED_MEDIA_TYPE: 415, // Unsupported Media Type - Loại phương tiện không hỗ trợ
  RANGE_NOT_SATISFIABLE: 416, // Range Not Satisfiable - Phạm vi không hợp lệ
  EXPECTATION_FAILED: 417, // Expectation Failed - Mong đợi thất bại
  IM_A_TEAPOT: 418, // I'm a teapot - Tôi là một bình trà (Easter egg)
  MISDIRECTED_REQUEST: 421, // Misdirected Request - Yêu cầu sai hướng
  UNPROCESSABLE_ENTITY: 422, // Unprocessable Entity - Thực thể không thể xử lý
  LOCKED: 423, // Locked - Bị khóa
  FAILED_DEPENDENCY: 424, // Failed Dependency - Phụ thuộc thất bại
  TOO_EARLY: 425, // Too Early - Quá sớm
  UPGRADE_REQUIRED: 426, // Upgrade Required - Cần nâng cấp
  PRECONDITION_REQUIRED: 428, // Precondition Required - Cần tiền điều kiện
  TOO_MANY_REQUESTS: 429, // Too Many Requests - Quá nhiều yêu cầu
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431, // Request Header Fields Too Large - Trường header yêu cầu quá lớn
  UNAVAILABLE_FOR_LEGAL_REASONS: 451, // Unavailable For Legal Reasons - Không khả dụng do lý do pháp lý

  // 5xx Server Error - Lỗi phía server
  INTERNAL_SERVER_ERROR: 500, // Internal Server Error - Lỗi máy chủ nội bộ
  NOT_IMPLEMENTED: 501, // Not Implemented - Chức năng chưa được triển khai
  BAD_GATEWAY: 502, // Bad Gateway - Gateway không hợp lệ
  SERVICE_UNAVAILABLE: 503, // Service Unavailable - Dịch vụ không khả dụng
  GATEWAY_TIMEOUT: 504, // Gateway Timeout - Hết thời gian chờ gateway
  HTTP_VERSION_NOT_SUPPORTED: 505, // HTTP Version Not Supported - Phiên bản HTTP không hỗ trợ
  VARIANT_ALSO_NEGOTIATES: 506, // Variant Also Negotiates - Biến thể cũng đàm phán
  INSUFFICIENT_STORAGE: 507, // Insufficient Storage - Không đủ dung lượng lưu trữ
  LOOP_DETECTED: 508, // Loop Detected - Phát hiện vòng lặp
  NOT_EXTENDED: 510, // Not Extended - Không mở rộng
  NETWORK_AUTHENTICATION_REQUIRED: 511, // Network Authentication Required - Cần xác thực mạng
}
