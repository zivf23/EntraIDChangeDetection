# format: Dockerfile

# ===================================================================
# STAGE 1: The "Builder" Stage
# Purpose: To build the optimized, static React application.
# ===================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application source code
COPY . .

# Build the production-ready static files
# This creates a 'build' folder with the optimized assets.
RUN npm run build

# ===================================================================
# STAGE 2: The "Server" Stage
# Purpose: To serve the static files using a lightweight Nginx server.
# ===================================================================
FROM nginx:stable-alpine

# Remove the default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx configuration
# This file is crucial for a Single Page Application (SPA) to work correctly.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static files from the "builder" stage
# This is the magic of multi-stage builds. We only take the final 'build' folder.
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80 to the outside world
EXPOSE 80

# Start the Nginx server in the foreground
CMD ["nginx", "-g", "daemon off;"]
