
# Blur 🌫️ - Social Media

Blur là một ứng dụng mạng xã hội fullstack được phát triển với mục tiêu học tập, thực hành microservices, realtime chat, file upload (Cloudinary), và kiến trúc hiện đại. Ứng dụng bao gồm các tính năng như đăng bài, bình luận, like, story, chat riêng tư, thông báo và xác thực người dùng.

## 🚀 Tính năng chính

- 🔐 **Xác thực OAuth2 + JWT** (Đăng ký, đăng nhập, quên mật khẩu)
- 📝 **Đăng bài** với ảnh/video (upload Cloudinary)
- ❤️ **Like / Comment** realtime
- 📷 **Story** ẩn sau 24h
- 💬 **Nhắn tin riêng** realtime (WebSocket)
- 🔔 **Thông báo** (Realtime + Kafka)
- 📂 **Quản lý tài khoản cá nhân**
- 🖼️ **Trang cá nhân** hiển thị post, story
- 🧩 **Kiến trúc Microservices**

## 🧱 Kiến trúc hệ thống

- **Frontend:** React.js + Tailwind CSS
- **Backend:** Java Spring Boot (Microservices)
  - `identity-service`: Quản lý người dùng và xác thực
  - `post-service`: Quản lý bài viết
  - `chat-service`: Quản lý tin nhắn realtime
  - `story-service`: Quản lý story
  - `notification-service`: Gửi thông báo qua WebSocket/Kafka
  - `api-gateway`: Quản lý routing giữa các service
- **API Gateway:** Spring Cloud Gateway
- **Service Registry:** Spring Eureka
- **Message Broker:** Apache Kafka
- **Realtime:** WebSocket (SockJS + STOMP)
- **Database:** MongoDB, Redis
- **Cloudinary:** Lưu trữ media
- **Docker:** Container hóa từng service

## 📦 Cài đặt và chạy project

### Yêu cầu

- Java 17+
- Node.js 18+
- Docker + Docker Compose
- MongoDB, Redis
- Cloudinary Account

### Clone repo

```bash
git clone https://github.com/vansy204/Blur.git
cd Blur
```

### Cấu trúc thư mục

```bash
Blur/
├── backend/
│   ├── identity-service/
│   ├── post-service/
│   ├── chat-service/
│   ├── story-service/
│   ├── notification-service/
│   └── api-gateway/
├── frontend/
│   └── blur-client/
├── docker-compose.yml
└── README.md
```

### Chạy backend

> Cấu hình `.env` hoặc `application.yml` cho Cloudinary, MongoDB, Kafka, Redis trước khi chạy.

```bash
cd backend
./mvnw clean install
docker-compose up
```

### Chạy frontend

```bash
cd frontend/blur-client
npm install
npm run dev
```

## 🧠 Kiến thức áp dụng

- Spring Boot Microservices
- RESTful APIs & WebSocket
- MongoDB document design
- Kafka for async processing
- OAuth2 + JWT security
- React hooks + Zustand
- Tailwind responsive UI
- Docker & Docker Compose

## 📌 TODO trong tương lai

- [ ] Gợi ý kết bạn / theo dõi
- [ ] Ghim bài viết
- [ ] Tùy chỉnh theme
- [ ] Story highlight
- [ ] Thông báo push (web notification)

## 👨‍💻 Tác giả

> Project được xây dựng bởi [Văn Sỹ (vansy204)](https://github.com/vansy204) như một bài thực hành cá nhân fullstack + microservice.

---

### ⭐ Đừng quên Star nếu bạn thấy dự án hữu ích!
