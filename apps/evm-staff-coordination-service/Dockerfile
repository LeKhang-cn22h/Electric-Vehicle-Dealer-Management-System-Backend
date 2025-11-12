# Dockerfile cho service evm-staff-coordination

# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g typescript

COPY . .
RUN npm run build

# Stage 2: production image
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm install --omit=dev

CMD ["node", "dist/main.js"]
