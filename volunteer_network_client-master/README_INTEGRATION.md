# Volunteer Hub - Frontend

Đây là frontend của hệ thống Volunteer Hub, được tích hợp với backend Spring Boot.

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Đảm bảo backend Spring Boot đang chạy trên port 8080

3. Khởi chạy frontend:
```bash
npm start
```

Frontend sẽ chạy trên http://localhost:3000

## Thay đổi so với version gốc

### Đã loại bỏ:
- Firebase Authentication
- Fake data từ tasksData.js
- Google Sign-in
- Firebase config

### Đã thay thế:
- Sử dụng JWT authentication với backend Spring Boot
- API calls trực tiếp đến backend
- AuthContext để quản lý authentication state
- Event structure theo backend API

### Các API endpoints được sử dụng:
- `POST /api/auth/login` - Đăng nhập
- `GET /api/events` - Lấy danh sách events
- `GET /api/events/{id}` - Lấy chi tiết event
- `POST /api/registrations` - Đăng ký event
- `GET /api/registrations` - Lấy danh sách registrations của user
- `POST /api/users` - Tạo user mới

### Cấu trúc dữ liệu Event:
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string", 
  "startDate": "ISO date",
  "endDate": "ISO date",
  "dateDeadline": "ISO date",
  "status": "DRAFT|SUBMITTED|APPROVED|REJECTED",
  "ownerId": "uuid"
}
```

### Cấu trúc dữ liệu Registration:
```json
{
  "id": "uuid",
  "eventId": "uuid", 
  "message": "string",
  "registrationDate": "ISO date",
  "status": "PENDING|APPROVED|REJECTED",
  "event": {...} // Event object
}
```

## Lưu ý
- Backend cần chạy trước frontend
- Authentication sử dụng JWT token được lưu trong localStorage
- Proxy được cấu hình để forward API calls đến localhost:8080