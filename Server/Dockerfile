FROM node:18-alpine

# Add additional security headers and required build tools
RUN apk add --no-cache dumb-init python3 make g++ curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and nodemon globally
RUN npm install && \
    npm install -g nodemon && \
    npm cache clean --force

# Copy application files
COPY . .

# Security hardening
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

# Set environment configurations
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=2048" \
    NPM_CONFIG_LOGLEVEL=info \
    PATH=/app/node_modules/.bin:$PATH

# Use dumb-init as PID 1
ENTRYPOINT ["dumb-init", "--"]

USER appuser

EXPOSE 5000

# Update healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Use different commands for dev and prod
CMD ["sh", "-c", "\
    if [ \"$NODE_ENV\" = \"production\" ]; then \
        node index.js; \
    else \
        nodemon --legacy-watch index.js; \
    fi"]