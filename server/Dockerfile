FROM node:18.16.1

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Install dependencies
RUN npm install

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "run", "dev"] 