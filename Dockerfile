# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files for all packages (layer caching optimization)
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/server/package*.json ./packages/server/
COPY packages/client/package*.json ./packages/client/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy TypeScript config and source code
COPY tsconfig.json ./
COPY packages/ ./packages/

# Build: TypeScript compilation (shared + server) + Vite build (client)
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

# Copy package files for all packages
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/server/package*.json ./packages/server/
COPY packages/client/package*.json ./packages/client/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built artifacts from builder stage
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/client/dist ./packages/client/dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 3000

# Environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start server
CMD ["node", "packages/server/dist/index.js"]
