# ===============================
# Stage 1: Build NestJS app
# ===============================
FROM node:20-alpine AS builder

# Làm việc trong thư mục /app
WORKDIR /app

# Copy file cấu hình và cài dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ source code vào container
COPY . .

# Build code NestJS sang thư mục dist
RUN npm run build


# ===============================
# Stage 2: Run production
# ===============================
FROM node:20-alpine

WORKDIR /app

# Copy chỉ phần cần thiết từ build stage
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Cài đặt dependencies cho production
RUN npm install --omit=dev

# Mở port cho container
EXPOSE 3001

# Lệnh khởi chạy app
CMD ["node", "dist/main.js"]
