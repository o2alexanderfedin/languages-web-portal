# Technology Stack Research

**Project:** Hapyy Languages Web Portal
**Domain:** CLI-based formal verification demo web portal
**Researched:** 2026-02-12
**Overall Confidence:** HIGH

## Executive Summary

For a TypeScript + Node.js full-stack web portal with file upload, real-time CLI process streaming, and ephemeral project management, the recommended stack is:

- **Runtime:** Node.js v24 LTS (Krypton) with TypeScript 5.9/6.0
- **Backend Framework:** Express.js 5.x (newly released, production-ready)
- **Frontend:** React 19.2 + Vite 7+ + Tailwind CSS + shadcn/ui
- **Real-time Communication:** Server-Sent Events (SSE) for unidirectional stdout streaming (simpler than WebSocket for this use case)
- **File Handling:** Multer for uploads, Archiver for creating zips, Unzipper/AdmZip for extracting zips
- **Process Management:** Native Node.js child_process.spawn() with stream piping
- **Temporary Storage:** tmp package for ephemeral directory management

This stack prioritizes:
1. **Stability:** LTS versions and production-proven libraries
2. **TypeScript-first:** Strong typing throughout the stack
3. **Developer Experience:** Modern tooling with hot reload and fast builds
4. **Simplicity:** Minimal dependencies, avoiding over-engineering for 5-20 concurrent users
5. **Deployment-ready:** Docker-compatible, suitable for Digital Ocean

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Node.js** | v24 (Krypton) LTS | Runtime environment | Current Active LTS (released May 2025), 30-month support guarantee, production-stable. v22 (Jod) is acceptable if already deployed but v24 is preferred for new projects. | **HIGH** - Official Node.js documentation |
| **TypeScript** | 5.9.3 (stable) or 6.0 beta | Type system | TypeScript 5.9.3 is current stable release. TypeScript 6.0 beta was announced Feb 2026 as the final JS-based release before TS 7.0 (Go rewrite). Use 5.9.3 for maximum stability, 6.0 beta if you want latest features. | **HIGH** - Official releases |
| **Express.js** | 5.x | Backend web framework | Express 5.0.0 released Jan 2025 after 10 years, now production-ready with improved async error handling, security fixes (path-to-regexp 8.x), and automatic error forwarding. Mature ecosystem, 200M+ weekly downloads. Note: slightly slower than Express 4 in raw throughput but acceptable for 5-20 users. | **HIGH** - Official documentation and benchmarks |
| **React** | 19.2.4 | Frontend UI library | Current stable (Jan 26, 2026), includes Activity component for conditional rendering, DoS mitigations, DevTools improvements. Ecosystem fully supports React 19. | **HIGH** - Official React documentation |
| **Vite** | 7.x+ | Frontend build tool | Vite 7 is stable (Vite 8 in beta as of Feb 2026). 40x faster builds than CRA, first-class TypeScript support, HMR with state preservation, ESM-native. Use Vite 7 for stability or 8 beta for cutting-edge (uses Rolldown/Oxc). | **HIGH** - Official Vite releases |

### Backend Framework & Middleware

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| **Multer** | 1.4.5-lts.1 | Multipart file upload | Always - de facto standard for handling multipart/form-data in Node.js. Built on busboy for efficiency. Has TypeScript types via @types/multer. | **HIGH** - Express official middleware |
| **Archiver** | Latest (7.x+) | ZIP file creation | Always - streaming-based zip creation for downloadable results. Low memory footprint, handles large files via streams. | **HIGH** - Widely adopted, 3M+ weekly downloads |
| **Unzipper** or **AdmZip** | Latest | ZIP extraction | Always - for extracting uploaded zip files. Unzipper is stream-based (better for large files), AdmZip is simpler API (better for small files <100MB). Use Unzipper for this project. | **MEDIUM** - Multiple options available |
| **cors** | Latest | CORS middleware | Always - enables cross-origin requests if frontend served separately | **HIGH** - Express standard |
| **helmet** | Latest | Security headers | Always - sets security-related HTTP headers | **HIGH** - Express standard |
| **express-rate-limit** | Latest | Rate limiting | Recommended - prevents abuse of file upload/CLI execution endpoints | **MEDIUM** - Best practice for public APIs |

### Real-Time Communication

| Technology | Purpose | Why Chosen | When NOT to Use | Confidence |
|------------|---------|------------|-----------------|------------|
| **Server-Sent Events (SSE)** | Streaming CLI stdout to browser | Simpler than WebSocket for unidirectional server-to-client streaming. Native HTTP/S, automatic reconnection, lower overhead. Use native Node.js implementation or `better-sse` library. | Don't use if you need bidirectional communication (client sending commands during execution). For this project, commands are initiated by HTTP POST, then stdout streams via SSE. | **HIGH** - Architecture pattern match |
| **WebSocket (ws library)** | Alternative for bidirectional communication | If you need to support interactive CLI tools (user input during execution), use `ws` (low-level, 3KB per connection) instead of SSE. | Overkill for unidirectional stdout streaming. Adds complexity. | **MEDIUM** - Alternative path |
| **Socket.IO** | Higher-level WebSocket wrapper | Only if you need automatic reconnection, room-based broadcasting, and fallback mechanisms. Much heavier (15KB per connection vs ws 3KB). | Overkill for this project's requirements. Use SSE or ws instead. | **HIGH** - Explicit anti-recommendation for this use case |

**Recommendation:** Use **SSE** for streaming CLI stdout. It's the simplest solution that meets requirements.

### Frontend Stack

| Library | Version | Purpose | Why Recommended | Confidence |
|---------|---------|---------|-----------------|------------|
| **Tailwind CSS** | v4+ | Utility-first CSS | Industry standard for rapid UI development. v4 released 2025, smaller runtime, improved performance. | **HIGH** - Ecosystem standard |
| **shadcn/ui** | Latest | Component library | Copy-paste components (not npm dependency), built on Radix UI + Tailwind. Full code ownership, customizable, accessible. Updated for React 19 and Tailwind v4. | **HIGH** - Best practice for modern React |
| **Radix UI** | Latest | Headless UI primitives | Unstyled, accessible components. Dependency of shadcn/ui but can also be used directly. | **HIGH** - Accessibility foundation |
| **React Router** or **TanStack Router** | Latest | Client-side routing | React Router is stable standard. TanStack Router is newer, type-safe alternative. Either works; use React Router for familiarity. | **MEDIUM** - Multiple good options |
| **TanStack Query** | Latest | Server state management | Optional but recommended for managing API calls, caching, and invalidation. Especially useful for polling job status. | **MEDIUM** - Quality of life improvement |
| **Zod** | Latest | Runtime validation | TypeScript-first schema validation for API requests/responses. Pairs well with Express and React Hook Form. | **HIGH** - Best practice for type-safe APIs |

### Process & File Management

| Library | Purpose | Implementation Notes | Confidence |
|---------|---------|---------------------|------------|
| **child_process.spawn()** | Execute CLI tools | Native Node.js module. Use spawn() not exec() because spawn() provides stream-based stdout/stderr access without buffering. Listen to 'data' events on stdout/stderr streams. | **HIGH** - Native Node.js API |
| **tmp** | Ephemeral directories | Create temporary directories for uploaded projects. Configure cleanup policies: age-based expiration, size caps. Use `tmp.dir()` with `unsafeCleanup: true` for recursive deletion. | **HIGH** - 5.8K projects using it |
| **fs.promises** | File system operations | Native Node.js module. Use promises API for async/await syntax. For writing CLI output to files before zipping. | **HIGH** - Native Node.js API |

### Development Tools

| Tool | Purpose | Configuration Notes | Confidence |
|------|---------|---------------------|------------|
| **ESLint** | Code linting | Use ESLint 9+ with flat config (eslint.config.js). Include @typescript-eslint/parser and @typescript-eslint/eslint-plugin. | **HIGH** - TypeScript standard |
| **Prettier** | Code formatting | Integrate with ESLint via eslint-config-prettier (disables conflicting rules) and eslint-plugin-prettier. | **HIGH** - Ecosystem standard |
| **tsx** | TypeScript execution | Development runtime for running TypeScript directly. Faster than ts-node. Use for dev scripts. | **MEDIUM** - Modern alternative to ts-node |
| **Vitest** | Testing framework | Vite-native test runner. Fast, ESM-first, compatible with Jest API. Use for both unit and integration tests. | **HIGH** - Vite ecosystem standard |
| **Playwright** | E2E testing | Browser automation for testing full workflows (upload → stream → download). Better DX than Selenium. | **MEDIUM** - Best practice for E2E |
| **Docker** | Containerization | Multi-stage builds: build stage (compile TS) + production stage (Node 24 Alpine, compiled JS only). Use node:24-alpine base image. | **HIGH** - Production deployment standard |

---

## Installation

### Backend

```bash
# Core dependencies
npm install express@5 cors helmet express-rate-limit
npm install multer archiver unzipper
npm install zod

# Real-time streaming (choose one)
npm install better-sse  # For SSE approach (recommended)
# npm install ws @types/ws  # For WebSocket approach (if needed)

# Temporary file management
npm install tmp

# TypeScript and types
npm install -D typescript @types/node @types/express @types/multer
npm install -D @types/cors @types/tmp

# Development tools
npm install -D tsx nodemon
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
npm install -D vitest @vitest/ui
```

### Frontend

```bash
# Create Vite project
npm create vite@latest frontend -- --template react-ts

cd frontend

# Core dependencies
npm install react@19 react-dom@19 react-router-dom
npm install @tanstack/react-query zod

# UI dependencies
npm install tailwindcss@latest postcss autoprefixer
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu  # etc.

# Development tools (should be included by Vite template)
npm install -D @vitejs/plugin-react
npm install -D eslint eslint-plugin-react-hooks eslint-plugin-react-refresh
npm install -D prettier
npm install -D vitest @vitest/ui
npm install -D playwright @playwright/test
```

### Monorepo Option (Optional)

If you want backend + frontend in one repo:

```bash
# Use npm workspaces
# package.json root:
{
  "workspaces": ["backend", "frontend"]
}
```

---

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative | Confidence |
|----------|-------------|-------------|------------------------|------------|
| **Backend Framework** | Express 5 | **Fastify** | If raw performance is critical (Fastify handles 40K+ req/s vs Express ~30K). But Express has larger ecosystem and your use case (5-20 users) won't hit limits. | **HIGH** |
| **Backend Framework** | Express 5 | **Hono** | If deploying to edge (Cloudflare Workers, Deno Deploy). Hono is cross-runtime and lightweight. Not needed for Digital Ocean VPS. | **MEDIUM** |
| **Backend Framework** | Express 5 | **NestJS** | If building large-scale enterprise application with 100+ endpoints. NestJS enforces architecture but adds complexity. Overkill for this project. | **HIGH** |
| **Real-time** | SSE | **WebSocket (ws)** | If CLI tools require interactive input (user types during execution). Your tools are non-interactive, so SSE is simpler. | **HIGH** |
| **Real-time** | SSE | **Socket.IO** | Never for this project. Too heavy, unnecessary features. Only use if you need room-based broadcasting to multiple users. | **HIGH** |
| **ZIP Creation** | Archiver | **JSZip** | If you need to create zips in browser (client-side). JSZip works in browser + Node. Archiver is Node-only but better streaming. | **MEDIUM** |
| **ZIP Extraction** | Unzipper | **AdmZip** | If all uploaded zips are small (<100MB). AdmZip has simpler API but loads entire zip into memory. Unzipper is stream-based. | **MEDIUM** |
| **Frontend Framework** | React 19 | **Vue 3** or **Svelte** | Personal preference. React has largest ecosystem and job market. Vue is gentler learning curve. Svelte has smallest bundle size. | **MEDIUM** |
| **Build Tool** | Vite 7 | **Webpack** | Never for new projects. Vite is 40x faster and has better DX. Only use Webpack if maintaining legacy project. | **HIGH** |
| **CSS Framework** | Tailwind CSS | **vanilla CSS** or **CSS Modules** | If you prefer full control and don't mind writing more CSS. Tailwind accelerates development. | **MEDIUM** |
| **Component Library** | shadcn/ui | **Material UI (MUI)** | If you need pre-built complex components (data grids, date pickers). MUI is heavier but has more batteries included. shadcn/ui is lighter and more customizable. | **MEDIUM** |
| **Component Library** | shadcn/ui | **Chakra UI** | If you prefer component props API over Tailwind utility classes. Chakra is more opinionated. | **LOW** |
| **Temp Directory** | tmp | **fs.mkdtemp** | If you want zero dependencies and don't mind manual cleanup logic. `tmp` handles cleanup automatically. | **MEDIUM** |

---

## What NOT to Use

| Avoid | Why | Use Instead | Confidence |
|-------|-----|-------------|------------|
| **Create React App (CRA)** | Deprecated by React team in 2023. Slow builds (40x slower than Vite), outdated dependencies. | **Vite** or **Next.js** (but Next.js is overkill for this project) | **HIGH** |
| **ts-node** (for development) | Slow. Transpiles on every run. | **tsx** - faster, better caching | **MEDIUM** |
| **body-parser** (standalone) | Now built into Express 5. Redundant dependency. | **express.json()** and **express.urlencoded()** middleware (built-in) | **HIGH** |
| **Express 4** | Superseded by Express 5 (Jan 2025). Missing async error handling improvements. | **Express 5** | **HIGH** |
| **request** (HTTP client) | Deprecated since 2020. | **node-fetch** or **axios** (if you need HTTP client for external APIs) | **HIGH** |
| **Socket.IO** (for this project) | Overkill. 5x larger memory footprint than ws, unnecessary features for unidirectional streaming. | **SSE** (simpler) or **ws** (if bidirectional needed) | **HIGH** |
| **PM2** (in Docker) | Docker already provides process management and restarts. Adding PM2 is redundant. | **Docker restart policies** (restart: unless-stopped) | **MEDIUM** |
| **Webpack** | Slow builds, complex configuration. | **Vite** | **HIGH** |
| **Bootstrap** | Dated design language, jQuery legacy, heavier than modern alternatives. | **Tailwind CSS + shadcn/ui** | **MEDIUM** |
| **Gulp/Grunt** | Task runners from 2014. Replaced by npm scripts and build tools. | **npm scripts** + **Vite** | **HIGH** |
| **Mocha/Chai** | Older testing frameworks. Vitest has better TypeScript support and speed. | **Vitest** | **MEDIUM** |

---

## Stack Patterns by Variant

### Monorepo Pattern

**If you want backend + frontend in one repository:**

```
languages-web-portal/
├── backend/
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
├── package.json (workspace root)
├── docker-compose.yml
└── .github/workflows/
```

- Use **npm workspaces** (native, no tools needed)
- Shared TypeScript types in `backend/src/types` exported to frontend
- Single Docker Compose with backend + frontend services
- Pros: Atomic commits, shared types, unified CI/CD
- Cons: Larger repo, tighter coupling

### Separate Repos Pattern

**If you want backend and frontend in separate repositories:**

```
languages-web-portal-backend/
└── (backend code)

languages-web-portal-frontend/
└── (frontend code)
```

- Separate package.json, separate deployments
- Share types via npm package or API schema (OpenAPI)
- Independent versioning and CI/CD
- Pros: Team separation, independent deploy cadence
- Cons: Type sync overhead, more repos to manage

**Recommendation for this project:** **Monorepo** - you're solo developer, shared types are valuable, simpler deployment.

---

## Version Compatibility Matrix

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| Node.js | v24 LTS | TypeScript 5.9+, Express 5.x | Recommended for production |
| Node.js | v22 LTS | TypeScript 5.9+, Express 5.x | Acceptable if already deployed |
| TypeScript | 5.9.3 | All listed packages | Current stable |
| TypeScript | 6.0 beta | All listed packages | Beta release, testing phase |
| Express | 5.x | Node.js 18+ | Requires migration from Express 4 |
| React | 19.2.4 | Vite 7+, TypeScript 5+ | Current stable |
| Vite | 7.x | React 19, TypeScript 5+ | Production-ready |
| Vite | 8.x beta | React 19, TypeScript 5+ | Beta with Rolldown/Oxc |
| Tailwind CSS | v4 | Vite 7+, PostCSS 8 | Latest, smaller runtime |
| shadcn/ui | Latest | React 19, Tailwind v4, Radix UI | Updated for latest dependencies |
| ESLint | 9.x | TypeScript 5+ | Requires flat config migration |

### Known Compatibility Issues

- **Express 5 + @types/express**: Ensure @types/express version matches Express 5. Some types may lag behind.
- **ESLint 9**: Plugin ecosystem still catching up to flat config. Some plugins may not support ESLint 9 yet. Check plugin compatibility before upgrading.
- **Tailwind v4**: PostCSS configuration changed. Use `@theme` directive instead of tailwind.config.js.

---

## Production Deployment Configuration

### Docker Multi-Stage Build

**Dockerfile (Backend)**

```dockerfile
# Build stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build  # Compile TypeScript to /dist

# Production stage
FROM node:24-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy compiled code and production dependencies
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --production

# Security: run as non-root
USER nodejs

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Dockerfile (Frontend)**

```dockerfile
# Build stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build  # Vite build to /dist

# Production stage (serve via nginx)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Digital Ocean Deployment

**Droplet Size:**
- Start with **1GB RAM / 1 CPU** ($6/month) for 5-20 users
- Upgrade to **2GB RAM / 2 CPU** ($12/month) if running multiple CLI processes concurrently

**Services:**
- Backend: Node.js app on port 3000
- Frontend: Nginx serving static files on port 80/443
- Reverse proxy: Nginx forwarding `/api/*` to backend

**Environment Variables:**
```bash
NODE_ENV=production
PORT=3000
UPLOAD_LIMIT=50mb
TMP_DIR=/tmp/hapyy-projects
MAX_CONCURRENT_JOBS=5
CORS_ORIGIN=https://yourdomain.com
```

---

## Security Considerations

### File Upload Security

1. **File size limits:** Use Multer limits (max 50MB recommended)
2. **File type validation:** Whitelist .zip only, validate magic bytes
3. **Zip bomb protection:** Limit extraction size, timeout extraction after 30s
4. **Path traversal:** Sanitize filenames in uploaded zips, reject `../` paths
5. **Temporary file cleanup:** Auto-delete project directories after 1 hour or on job completion

### Process Execution Security

1. **Command injection:** Never interpolate user input into shell commands. Use spawn() with argument array.
2. **Resource limits:** Set timeouts (5 min max per CLI execution), memory limits via Docker
3. **Sandboxing:** Consider running CLI tools in Docker containers (container-in-container) for isolation
4. **Rate limiting:** Max 10 job submissions per IP per hour

### Network Security

1. **CORS:** Whitelist frontend origin only
2. **Helmet:** Enable CSP, HSTS, X-Frame-Options
3. **HTTPS:** Use Let's Encrypt SSL certificate (free via Certbot)
4. **Rate limiting:** Apply to upload and execute endpoints

---

## Performance Optimization

### Backend

- **Streaming:** Use stream-based processing for files (Archiver, Unzipper) to keep memory low
- **Concurrency:** Queue CLI jobs if >5 concurrent executions (use `p-queue` library)
- **Caching:** Cache CLI tool binaries in Docker image, don't download at runtime
- **Compression:** Enable gzip middleware for API responses

### Frontend

- **Code splitting:** Vite automatically splits by route
- **Lazy loading:** Use React.lazy() for heavy components (file preview)
- **Bundle size:** shadcn/ui is tree-shakeable, only bundle used components
- **CDN:** Serve static assets from Digital Ocean Spaces (S3-compatible) if needed

### Database (Optional)

This project doesn't require a database (ephemeral workloads), but if you add job history:

- **SQLite:** Simplest, file-based, no separate server needed. Use `better-sqlite3` library.
- **PostgreSQL:** If you need multi-user job tracking, persistence. Deploy via Digital Ocean Managed Database.

---

## Monitoring & Logging

### Logging

- **Backend:** Use `pino` (fast, structured JSON logs)
- **Frontend:** Use `console.error()` with error boundaries, send to backend via `/api/errors` endpoint
- **Docker:** Logs to stdout/stderr, collected by Docker logs

### Monitoring

- **Health checks:** Add `/health` endpoint (GET /api/health returns 200 OK)
- **Metrics:** Optional - Prometheus + Grafana if you want graphs
- **Uptime:** UptimeRobot (free, pings /health every 5 minutes)
- **Errors:** Sentry (optional, tracks frontend + backend errors)

---

## CI/CD Pipeline

### GitHub Actions

```yaml
name: CI/CD

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Digital Ocean
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DO_HOST }}
          username: ${{ secrets.DO_USER }}
          key: ${{ secrets.DO_SSH_KEY }}
          script: |
            cd /opt/hapyy
            git pull
            docker compose build
            docker compose up -d
```

---

## Migration Paths

### If Starting from Express 4

See [Express 5 Migration Guide](https://expressjs.com/en/guide/migrating-5.html). Key changes:
- `req.acceptsCharset()` → `req.acceptsCharsets()`
- `res.json()` rejects non-objects (use `res.send()` for primitives)
- Regex route patterns now use path-to-regexp v8 (security improvement)

### If Starting from Create React App

1. Create new Vite project: `npm create vite@latest -- --template react-ts`
2. Copy `src/` components
3. Update imports: `import.meta.env` instead of `process.env`
4. Remove `react-scripts` dependencies
5. Update `package.json` scripts to use `vite` commands

---

## Sources & References

### High Confidence (Official Documentation & Releases)

- [Node.js v24 LTS Release](https://nodejs.org/en/about/previous-releases) - Official Node.js releases page
- [TypeScript Releases](https://github.com/microsoft/typescript/releases) - Official TypeScript GitHub releases
- [Express 5 Release](https://github.com/expressjs/express/releases) - Official Express.js releases
- [Express 5 Migration Guide](https://expressjs.com/en/guide/migrating-5.html) - Official migration documentation
- [React 19.2 Release](https://react.dev/blog/2025/10/01/react-19-2) - Official React blog
- [Vite 7 Release](https://vite.dev/blog/announcing-vite7) - Official Vite blog
- [Socket.IO v4 Documentation](https://socket.io/docs/v4/) - Official Socket.IO docs
- [Node.js Child Process API](https://nodejs.org/api/child_process.html) - Official Node.js documentation
- [Multer GitHub](https://github.com/expressjs/multer) - Official Express middleware

### Medium Confidence (Community & Comparison Guides)

- [Best TypeScript Backend Frameworks in 2026](https://encore.dev/articles/best-typescript-backend-frameworks) - Framework comparison
- [Express 5.0 Released, Focuses on Stability and Security](https://www.infoq.com/news/2025/01/express-5-released/) - InfoQ analysis
- [SSE vs WebSockets: Comparing Real-Time Communication Protocols](https://softwaremill.com/sse-vs-websockets-comparing-real-time-communication-protocols/) - Protocol comparison
- [Archiver vs JSZip vs AdmZip](https://npm-compare.com/adm-zip,archiver,jszip,zip-local) - Library comparison
- [Fastify vs Express vs Hono: Choosing the Right Node.js Framework](https://medium.com/@arifdewi/fastify-vs-express-vs-hono-choosing-the-right-node-js-framework-for-your-project-da629adebd4e) - Framework comparison
- [React + Vite + TypeScript Best Practices 2026](https://medium.com/@robinviktorsson/complete-guide-to-setting-up-react-with-typescript-and-vite-2025-468f6556aaf2) - Setup guide
- [shadcn/ui Official Website](https://ui.shadcn.com/) - Component library documentation
- [ESLint 9 Flat Config Tutorial](https://medium.com/@madhan.gannarapu/how-to-set-up-eslint-9-with-prettier-in-node-js-flat-config-typescript-0eb1755f83cd) - Configuration guide
- [Docker Multi-Stage Builds for Node.js + TypeScript](https://medium.com/@robinviktorsson/containerizing-a-typescript-node-js-application-with-docker-a-step-by-step-guide-be7fc87191f8) - Docker guide

### Ecosystem Discovery (WebSearch Verified)

- [Node.js File System Production Guide 2026](https://thelinuxcode.com/nodejs-file-system-in-practice-a-production-grade-guide-for-2026/) - Temporary file management
- [Real-Time Data Streaming with SSE](https://medium.com/@serifcolakel/real-time-data-streaming-with-server-sent-events-sse-9424c933e094) - SSE implementation
- [Benchmarking Express 4 vs Express 5](https://www.repoflow.io/blog/express-4-vs-express-5-benchmark-node-18-24) - Performance comparison

---

## Confidence Assessment Summary

| Area | Confidence Level | Rationale |
|------|------------------|-----------|
| **Node.js Runtime** | HIGH | Official LTS documentation, clear versioning policy |
| **TypeScript Version** | HIGH | Official releases, clear migration path |
| **Backend Framework (Express 5)** | HIGH | Production release Jan 2025, official migration guide, benchmarks available |
| **Frontend Stack (React + Vite)** | HIGH | Both at stable major versions, widespread adoption |
| **Real-time (SSE)** | HIGH | Well-established protocol, perfect fit for unidirectional streaming use case |
| **File Upload (Multer)** | HIGH | De facto Express standard, 8M+ weekly downloads |
| **ZIP Handling** | MEDIUM | Multiple good options (Archiver/JSZip/AdmZip), no clear winner, choice depends on constraints |
| **Component Library (shadcn/ui)** | HIGH | Rapidly growing adoption, React 19 + Tailwind v4 support confirmed |
| **Development Tools (ESLint 9, Prettier)** | MEDIUM | ESLint 9 flat config is new (2025), plugin ecosystem catching up |
| **Deployment (Docker)** | HIGH | Standard practice, well-documented patterns for Node.js + TypeScript |

---

## Open Questions & Future Research Needs

1. **Interactive CLI Tools:** If any of the 8 tools require user input during execution, SSE won't work. Will need to research WebSocket implementation or pty.js for terminal emulation.

2. **Heavy CLI Output:** If CLI tools output >100MB of logs, streaming may overwhelm browser. May need pagination or log truncation strategy.

3. **Concurrent Job Limits:** For >20 concurrent users, need job queue (Bull/BullMQ with Redis). Research needed if scaling beyond 20 users.

4. **CLI Tool Isolation:** If tools have conflicting dependencies, Docker-in-Docker or Kubernetes pods may be needed. Research sandboxing strategies if required.

5. **Persistent Job History:** If adding user accounts and job history, need to choose database (SQLite, PostgreSQL) and design schema. Not needed for MVP.

---

*Stack research for: Hapyy Languages Web Portal*
*Researched: 2026-02-12*
*Researcher: GSD Project Researcher (gsd-project-researcher)*
*Quality Gate: All versions verified with official documentation or releases*
