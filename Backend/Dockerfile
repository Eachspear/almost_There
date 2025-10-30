# Use the official Node.js 18 LTS image
FROM node:18

# Create and set working directory inside the container
WORKDIR /app

# Copy package files and install dependencies first (for caching)
COPY package*.json ./
RUN npm install --production

# Copy all source files (controllers, routes, models, etc.)
COPY . .

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Start the backend using index.js
CMD ["npm", "start"]
