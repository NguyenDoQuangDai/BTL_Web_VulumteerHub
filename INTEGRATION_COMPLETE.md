# Volunteer Hub - Integration Guide

## Tổng quan
Đã tích hợp thành công frontend React với backend Spring Boot. Các thay đổi chính:

### ✅ Đã hoàn thành:

1. **Authentication System**
   - Loại bỏ Firebase Authentication
   - Tích hợp JWT authentication với backend
   - Tạo AuthContext để quản lý user state
   - Login/Registration forms kết nối với API

2. **API Integration**
   - Tạo service layer (`apiService.js`) để gọi backend APIs
   - Cấu hình proxy trong package.json
   - Error handling cho network requests
   - JWT token management

3. **Components Updated**
   - **Login**: Sử dụng backend authentication
   - **Tasks**: Fetch events từ backend thay vì fake data
   - **TaskItem**: Hiển thị event data structure mới
   - **TaskRegistration**: Đăng ký event qua backend API
   - **UserDashboard**: Hiển thị user registrations
   - **Header**: Logout functionality và user display
   - **PrivateRoute**: Sử dụng AuthContext

4. **Data Structures**
   - Cập nhật từ fake data structure sang backend API response
   - Event properties: `id`, `name`, `description`, `startDate`, `endDate`, `status`
   - Registration properties: `eventId`, `message`, `registrationDate`

## 🚀 Cách chạy:

### Backend (Spring Boot):
```bash
cd volumteer-hub-main
./mvnw spring-boot:run
```
Backend sẽ chạy trên: `http://localhost:8080`

### Frontend (React):
```bash
cd volunteer_network_client-master
npm install
npm start
```
Frontend sẽ chạy trên: `http://localhost:3000`

## 📋 API Endpoints được sử dụng:

- `POST /api/auth/login` - User login
- `POST /api/users` - Create new user (registration)
- `GET /api/events` - Get events list (với pagination)
- `GET /api/events/{id}` - Get event details
- `POST /api/registrations` - Register for event
- `GET /api/registrations` - Get user's registrations

## 🔧 Cấu hình cần thiết:

### Backend:
- Database: PostgreSQL
- Port: 8080
- CORS: Cho phép frontend port 3000

### Frontend:
- Proxy: `http://localhost:8080` (đã cấu hình)
- Dependencies: Đã loại bỏ Firebase

## 🐛 Troubleshooting:

1. **Backend không kết nối được:**
   - Kiểm tra PostgreSQL đang chạy
   - Kiểm tra application.properties
   - Xem logs backend

2. **Frontend không load được events:**
   - Kiểm tra backend API `/api/events` 
   - Kiểm tra CORS configuration
   - Xem Network tab trong DevTools

3. **Authentication issues:**
   - Kiểm tra JWT configuration
   - Xem token trong localStorage
   - Kiểm tra `/api/auth/login` endpoint

## 🔄 Workflow típico:

1. User mở `http://localhost:3000`
2. Xem danh sách events từ backend
3. Click "Login" để đăng nhập
4. Hoặc tạo account mới
5. Đăng ký events
6. Xem registrations trong Dashboard

## 📝 Lưu ý quan trọng:

- **Token expiry**: Cần handle JWT token refresh nếu backend implement
- **Error handling**: Đã có basic error handling, có thể cần refine thêm
- **Loading states**: Đã implement cho major operations
- **Responsive design**: Giữ nguyên CSS từ template gốc

## 🎯 Next Steps (Optional):

1. Implement JWT refresh token
2. Add more detailed error messages
3. Add loading spinners cho all API calls  
4. Implement search functionality
5. Add admin panel integration
6. Add file upload for event images
7. Add email notifications

Integration đã hoàn tất! Frontend và backend giờ đã kết nối được với nhau.