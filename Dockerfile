# Stage 1: Node.js Builder
FROM node:22-alpine AS node-builder

WORKDIR /app

# Copy package files for all packages (layer caching optimization)
COPY languages-web-portal/package*.json ./
COPY languages-web-portal/packages/shared/package*.json ./packages/shared/
COPY languages-web-portal/packages/server/package*.json ./packages/server/
COPY languages-web-portal/packages/client/package*.json ./packages/client/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy TypeScript config and source code
COPY languages-web-portal/tsconfig.json ./
COPY languages-web-portal/packages/ ./packages/

# Build: TypeScript compilation (shared + server) + Vite build (client)
RUN npm run build

# Stage 2: Java Builder
FROM eclipse-temurin:25-jdk AS java-builder

WORKDIR /build

# Install Maven
RUN apt-get update && \
    apt-get install -y maven && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy Java FV parent POM and all modules
COPY java-fv/pom.xml /build/pom.xml
COPY java-fv/compiler-plugin /build/compiler-plugin

# Install root POM to local Maven repo so sub-modules can resolve parent
# (Sub-modules declare java-fv-parent as parent but relativePath resolves to
# compiler-plugin-parent; installing root POM fixes resolution)
RUN mvn install -N

# Build Java FV CLI jar (skip tests for faster Docker build)
RUN mvn clean package -pl compiler-plugin/cli -am -DskipTests

# Stage 3: Production
FROM eclipse-temurin:25-jre-noble AS production

WORKDIR /app

# Install Node.js 22 runtime using NodeSource repository
RUN apt-get update && \
    apt-get install -y ca-certificates curl gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy Java FV CLI jar from java-builder stage
COPY --from=java-builder /build/compiler-plugin/cli/target/cli-1.1.0-jar-with-dependencies.jar /usr/local/lib/java-fv-cli.jar

# Copy package files for all packages
COPY languages-web-portal/package*.json ./
COPY languages-web-portal/packages/shared/package*.json ./packages/shared/
COPY languages-web-portal/packages/server/package*.json ./packages/server/
COPY languages-web-portal/packages/client/package*.json ./packages/client/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built artifacts from node-builder stage
COPY --from=node-builder /app/packages/server/dist ./packages/server/dist
COPY --from=node-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=node-builder /app/packages/client/dist ./packages/client/dist

# Copy examples directory for example projects endpoint
COPY --from=node-builder /app/packages/server/examples ./packages/server/examples

# Create uploads directory before switching to non-root user
RUN mkdir -p /app/uploads && \
    groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/false nodejs && \
    chown nodejs:nodejs /app/uploads

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
