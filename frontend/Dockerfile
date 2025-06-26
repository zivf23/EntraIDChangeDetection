# frontend/Dockerfile (Correct, Production-Ready Version)

# --- שלב 1: בניית אפליקציית ה-React ---
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- שלב 2: הגשת האפליקציה עם Nginx ---
FROM nginx:stable-alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]