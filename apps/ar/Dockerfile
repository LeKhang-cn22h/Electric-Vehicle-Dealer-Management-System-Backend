# ---------- STAGE 1: BUILD ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy file cấu hình & cài deps (dev + prod) để build
COPY package*.json nest-cli.json tsconfig*.json ./
RUN npm ci

# Copy toàn bộ mã nguồn và build app "users"
COPY . .
RUN npm run build apps/ar

# ---------- STAGE 2: RUNTIME ----------
FROM node:20-alpine
WORKDIR /app

# Chỉ cài prod deps để image nhẹ
COPY package*.json ./
RUN npm ci --omit=dev

# Copy output đã build
COPY --from=builder /app/dist ./dist
# (Nếu có assets riêng, .env mẫu, prisma schema, v.v... thì copy thêm tại đây)

ENV NODE_ENV=production
EXPOSE 4400
CMD ["node", "dist/apps/ar/main.js"]
