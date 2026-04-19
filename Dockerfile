# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for API keys (passed from Dokploy)
ARG VITE_GROQ_API_KEY
ARG VITE_OPENAI_API_KEY
ARG VITE_DEEPSEEK_API_KEY
ARG VITE_CHAT_PROVIDER=groq

# Set as environment variables for Vite build
ENV VITE_GROQ_API_KEY=$VITE_GROQ_API_KEY
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY
ENV VITE_DEEPSEEK_API_KEY=$VITE_DEEPSEEK_API_KEY
ENV VITE_CHAT_PROVIDER=$VITE_CHAT_PROVIDER

# Copy package files from front-end directory
COPY front-end/package.json front-end/package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy front-end source code
COPY front-end/ .

# Build the application (Vite will embed the env vars)
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration from front-end directory
COPY front-end/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
