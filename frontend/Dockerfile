# frontend/Dockerfile
FROM node:18-alpine
WORKDIR /app

# Copy dependency definitions and install
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Configure the React development server to listen on all interfaces and port 80
ENV HOST=0.0.0.0
ENV PORT=80
EXPOSE 80

# Start the React development server
CMD ["npm", "start"]
