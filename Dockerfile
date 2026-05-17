# ============================================================
# Frontend Dockerfile
# Unit 5: Docker - Containerizing the React App
# ============================================================

# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx (lightweight production server)
FROM nginx:alpine

# Copy built React app to Nginx's serve directory
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom Nginx config for React Router support
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
