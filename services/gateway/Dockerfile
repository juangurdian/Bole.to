# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory in the container
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S gateway -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY src/ ./src/

# Create necessary directories
RUN mkdir -p logs && \
    chown -R gateway:nodejs /app

# Set security headers and limits
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/healthz', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# Switch to non-root user
USER gateway

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "src/index.js"]