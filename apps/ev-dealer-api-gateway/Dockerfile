# apps/ev-dealer-api-gateway/Dockerfile
FROM node:18-alpine

# 1️⃣ Đặt thư mục làm việc
WORKDIR /app

# 2️⃣ Copy file cấu hình chung từ root
COPY package*.json nest-cli.json tsconfig*.json ./

# 3️⃣ Cài đặt dependencies ở root
RUN npm install

# 4️⃣ Copy toàn bộ source code vào container
COPY apps ./apps
COPY libs ./libs

# 5️⃣ Build toàn bộ project (Nest sẽ tìm tsconfig.json ở đây)
RUN npm run build

# 6️⃣ Mở port cho gateway
EXPOSE 3000

# 7️⃣ Chạy gateway
CMD ["node", "dist/apps/ev-dealer-api-gateway/main.js"]
