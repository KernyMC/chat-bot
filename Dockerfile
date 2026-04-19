# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory to project root first
WORKDIR /project

# Copy .env from root to project root
COPY .env .env

# Now set working directory to /project/front-end for build
WORKDIR /project/front-end

# Copy package files from front-end directory
COPY front-end/package.json front-end/package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy front-end source code
COPY front-end/ .

# Build the application (Vite will read .env from parent dir)
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy built files from builder stage (from /project/front-end/dist)
COPY --from=builder /project/front-end/dist /usr/share/nginx/html

# Copy nginx configuration from front-end directory
COPY front-end/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
