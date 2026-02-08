# Multi-stage build for production-ready image
FROM node:22-alpine AS builder

# Install build dependencies for native modules (better-sqlite3)
# python3, make, g++ for compilation
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and rebuild native modules
# Use --omit=dev to only install production dependencies from the start
RUN npm ci --omit=dev && \
    npm rebuild better-sqlite3 && \
    npm cache clean --force

# Copy application files
COPY . .

# Remove development files
RUN rm -rf tests/ *.test.js *.spec.js

# ===================================
# Production stage
# ===================================
FROM node:22-alpine

# Install runtime dependencies
# dumb-init for proper signal handling
# sqlite-libs for better-sqlite3 runtime
RUN apk add --no-cache \
    dumb-init \
    sqlite-libs

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application files
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs migrations ./migrations
COPY --chown=nodejs:nodejs run-migrations.js ./
COPY --chown=nodejs:nodejs docker-entrypoint.sh ./

# Make entrypoint executable and create necessary directories
USER root
RUN chmod +x docker-entrypoint.sh && \
    mkdir -p logs data && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set database path to writable directory
ENV DATABASE_PATH=/app/data/behavioural_hub.db

# Expose port
EXPOSE 4000

# Health check - increased start period to allow for database initialization
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]

# Start application
CMD ["node", "src/server.js"]
