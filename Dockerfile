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
# Note: java-fv source currently has a compilation issue (FormulaAdapter.adaptForIncremental
# missing). Use the pre-built jar directly from the repository.
FROM eclipse-temurin:25-jdk AS java-builder

WORKDIR /build

# Copy pre-built Java FV CLI jar (jar-with-dependencies, built separately from java-fv project)
COPY java-fv/compiler-plugin/cli/target/cli-1.1.0-jar-with-dependencies.jar /build/cli-1.1.0-jar-with-dependencies.jar

# Stage 3: Solver Builder
FROM ubuntu:noble AS solver-builder
ARG TARGETARCH

RUN apt-get update && \
    apt-get install -y curl unzip && \
    rm -rf /var/lib/apt/lists/*

# CVC5 1.3.2 — static binary, no dynamic deps
RUN case "$TARGETARCH" in \
      amd64) CVC5_ARCH=x86_64 ;; \
      arm64) CVC5_ARCH=arm64  ;; \
      *) echo "Unsupported TARGETARCH: $TARGETARCH" && exit 1 ;; \
    esac && \
    curl -fsSL \
      "https://github.com/cvc5/cvc5/releases/download/cvc5-1.3.2/cvc5-Linux-${CVC5_ARCH}-static.zip" \
      -o /tmp/cvc5.zip && \
    unzip -q /tmp/cvc5.zip -d /tmp/cvc5 && \
    install -m 0755 \
      "/tmp/cvc5/cvc5-Linux-${CVC5_ARCH}-static/bin/cvc5" \
      /usr/local/bin/cvc5 && \
    rm -rf /tmp/cvc5.zip /tmp/cvc5

# Z3 4.16.0 — dynamic binary; glibc 2.38 (arm64) / 2.39 (x64) — both satisfied by Noble
RUN case "$TARGETARCH" in \
      amd64) Z3_ARCH=x64;   Z3_GLIBC=glibc-2.39 ;; \
      arm64) Z3_ARCH=arm64; Z3_GLIBC=glibc-2.38  ;; \
      *) echo "Unsupported TARGETARCH: $TARGETARCH" && exit 1 ;; \
    esac && \
    curl -fsSL \
      "https://github.com/Z3Prover/z3/releases/download/z3-4.16.0/z3-4.16.0-${Z3_ARCH}-${Z3_GLIBC}.zip" \
      -o /tmp/z3.zip && \
    unzip -q /tmp/z3.zip -d /tmp/z3 && \
    install -m 0755 \
      "/tmp/z3/z3-4.16.0-${Z3_ARCH}-${Z3_GLIBC}/bin/z3" \
      /usr/local/bin/z3 && \
    rm -rf /tmp/z3.zip /tmp/z3

# Stage 4: .NET Builder
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0-noble AS dotnet-builder
ARG TARGETARCH

# Copy cs-fv source (build context is monorepo root /hapyy/)
COPY cs-fv/ /build/cs-fv/
WORKDIR /build/cs-fv

# NuGet global packages location (will be COPYed to production)
ENV NUGET_PACKAGES=/nuget-packages

# MinVer requires git tags; skip in Docker context
# Publish framework-dependent net8.0 binary
RUN dotnet publish src/CsFv.Cli/CsFv.Cli.csproj \
      --configuration Release \
      --framework net8.0 \
      --output /publish/cs-fv \
      --no-self-contained \
      -p:MinVerSkip=true

# Stage 5: Production
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

# Install Java FV wrapper script
COPY languages-web-portal/scripts/hupyy-java-verify.sh /usr/local/bin/hupyy-java-verify
RUN chmod +x /usr/local/bin/hupyy-java-verify

# Install C# FV wrapper script
COPY languages-web-portal/scripts/hupyy-csharp-verify.sh /usr/local/bin/hupyy-csharp-verify
RUN chmod +x /usr/local/bin/hupyy-csharp-verify

# Copy Java FV CLI jar from java-builder stage
COPY --from=java-builder /build/cli-1.1.0-jar-with-dependencies.jar /usr/local/lib/java-fv-cli.jar

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

# Install .NET 8 runtime (Ubuntu Noble built-in apt feed — supports amd64 AND arm64, no Microsoft feed needed)
RUN apt-get update && \
    apt-get install -y dotnet-runtime-8.0 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy solver binaries from solver-builder (no curl/unzip tools in production)
COPY --from=solver-builder /usr/local/bin/cvc5 /usr/local/bin/cvc5
COPY --from=solver-builder /usr/local/bin/z3   /usr/local/bin/z3

# Copy cs-fv CLI from dotnet-builder (framework-dependent; requires dotnet-runtime-8.0 above)
COPY --from=dotnet-builder /publish/cs-fv /usr/local/lib/cs-fv

# Copy pre-seeded NuGet packages from dotnet-builder (enables offline dotnet invocation at request time)
COPY --from=dotnet-builder /nuget-packages /home/nodejs/.nuget/packages

# NuGet global packages path — must match the directory owned by nodejs below
ENV NUGET_PACKAGES=/home/nodejs/.nuget/packages

# Create uploads directory before switching to non-root user
RUN mkdir -p /app/uploads && \
    groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/false nodejs && \
    chown nodejs:nodejs /app/uploads && \
    chown -R nodejs:nodejs /home/nodejs

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
