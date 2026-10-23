# Production Dockerfile for Google Cloud Run
FROM node:22-bookworm-slim

# Set working directory
WORKDIR /usr/src/app

# Default to production mode and Cloud Run standard port 8080
ENV NODE_ENV=production
ENV PORT=8080

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

# Install only production dependencies deterministically
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code (respecting .dockerignore)
COPY --chown=node:node . .

# Run as non-root user for container security
USER node

EXPOSE 8080

# Start the Express server
CMD ["node", "index.js"]
