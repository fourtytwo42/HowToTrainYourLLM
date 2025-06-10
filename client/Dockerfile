FROM node:18.16.1-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Install serve to run the built app
RUN npm install -g serve

# Expose port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev"] 