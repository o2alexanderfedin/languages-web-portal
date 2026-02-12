# Architecture Research

**Domain:** CLI Tool Execution Web Portal
**Researched:** 2026-02-12
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐            │
│  │   Upload    │  │  Terminal   │  │   Download   │            │
│  │  Component  │  │  Component  │  │   Component  │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘            │
│         │                │                │                     │
│         └────────────────┴────────────────┘                     │
│                          │                                      │
│                ┌─────────┴─────────┐                            │
│                │  State Manager    │                            │
│                │  (React Hooks)    │                            │
│                └─────────┬─────────┘                            │
│                          │                                      │
├──────────────────────────┼──────────────────────────────────────┤
│                          │                                      │
│           HTTP           │         WebSocket                    │
│           (REST)         │         (bidirectional)              │
│                          │                                      │
├──────────────────────────┴──────────────────────────────────────┤
│                    Backend (Node.js + Express)                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐            │
│  │   Upload    │  │   Process   │  │   Download   │            │
│  │   Handler   │  │   Manager   │  │   Handler    │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘            │
│         │                │                │                     │
│         └────────────────┴────────────────┘                     │
│                          │                                      │
│                ┌─────────┴─────────┐                            │
│                │  WebSocket Server │                            │
│                │  (express-ws)     │                            │
│                └─────────┬─────────┘                            │
│                          │                                      │
├──────────────────────────┼──────────────────────────────────────┤
│                          │                                      │
│                ┌─────────┴─────────┐                            │
│                │   Job Scheduler   │                            │
│                │   (node-cron)     │                            │
│                └─────────┬─────────┘                            │
│                          │                                      │
├──────────────────────────┴──────────────────────────────────────┤
│                    Process Layer                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐       │
│  │            CLI Process Spawner                        │       │
│  │        (child_process.spawn with streams)             │       │
│  └──────────────────────────────────────────────────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                     File System Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Project    │  │    Temp      │  │    Output    │          │
│  │ Directories  │  │   Upload     │  │     Zip      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Upload Handler** | Receives zip files, validates size/type, extracts to ephemeral project directory | Multer middleware with file-type validation, unzipper library for extraction |
| **Process Manager** | Spawns CLI tool processes, manages stdout/stderr streams, tracks process lifecycle | child_process.spawn() with stream piping to WebSocket |
| **WebSocket Server** | Maintains persistent connections, broadcasts process output in real-time, handles reconnection | express-ws or Socket.IO with connection registry |
| **Terminal Component** | Renders streamed output, handles ANSI codes, provides scrolling and interaction | react-console-emulator or custom component with ANSI parser |
| **Job Scheduler** | Schedules cleanup of ephemeral directories 5-15 minutes after completion | node-cron with metadata-driven cleanup policies |
| **Download Handler** | Zips output files, streams to client, schedules cleanup | archiver library with streaming response |
| **State Manager** | Coordinates frontend state (upload status, process running, output ready) | React hooks (useState, useEffect, useReducer) with WebSocket integration |

## Recommended Project Structure

```
languages-web-portal/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── upload/        # File upload UI
│   │   │   ├── terminal/      # Console output viewer
│   │   │   └── download/      # Results download UI
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useWebSocket.ts  # WebSocket connection hook
│   │   │   ├── useFileUpload.ts # Upload state management
│   │   │   └── useProcess.ts    # Process status tracking
│   │   ├── services/          # API client layer
│   │   │   ├── api.ts         # REST API calls
│   │   │   └── websocket.ts   # WebSocket client
│   │   └── types/             # TypeScript types/interfaces
│   └── package.json
│
├── server/                    # Backend Node.js application
│   ├── src/
│   │   ├── routes/            # Express routes
│   │   │   ├── upload.ts      # File upload endpoint
│   │   │   ├── process.ts     # Process management endpoints
│   │   │   └── download.ts    # Download endpoint
│   │   ├── services/          # Business logic
│   │   │   ├── projectManager.ts    # Ephemeral directory management
│   │   │   ├── processRunner.ts     # CLI tool execution
│   │   │   ├── streamHandler.ts     # Output streaming coordination
│   │   │   └── cleanupScheduler.ts  # Cleanup job scheduler
│   │   ├── websocket/         # WebSocket handlers
│   │   │   ├── server.ts      # WebSocket server setup
│   │   │   └── handlers.ts    # Message handlers
│   │   ├── middleware/        # Express middleware
│   │   │   ├── upload.ts      # File upload validation
│   │   │   ├── auth.ts        # Authentication (if needed)
│   │   │   └── errorHandler.ts # Error handling
│   │   ├── utils/             # Utilities
│   │   │   ├── fileValidator.ts   # File type/size validation
│   │   │   ├── zipHandler.ts      # Zip extraction/creation
│   │   │   └── pathSanitizer.ts   # Path security utilities
│   │   └── types/             # TypeScript types/interfaces
│   └── package.json
│
├── shared/                    # Shared types between client/server
│   └── types/
│       ├── api.ts             # API request/response types
│       ├── process.ts         # Process status types
│       └── websocket.ts       # WebSocket message types
│
└── tools/                     # CLI tools (8 formal verification tools)
    ├── tool1/
    ├── tool2/
    └── ...
```

### Structure Rationale

- **client/ and server/:** Clear separation of concerns, allows independent deployment if needed later
- **shared/:** Ensures type safety across client-server boundary, eliminates type drift
- **services/:** Isolates business logic from routes, makes testing easier and promotes reusability
- **middleware/:** Modular request processing pipeline, each middleware has single responsibility
- **websocket/:** Separate from REST routes because WebSocket lifecycle differs significantly from HTTP
- **tools/:** External CLI executables kept separate from application code for security and maintainability

## Architectural Patterns

### Pattern 1: Stream-Driven Process Output

**What:** Pipe child process stdout/stderr directly to WebSocket connections without buffering entire output

**When to use:** When CLI tools produce significant output (logs, compilation results, verification traces) and users need real-time feedback

**Trade-offs:**
- **Pros:** Low memory footprint, immediate user feedback, scales to large outputs
- **Cons:** Requires careful error handling, connection interruptions need reconnection logic

**Example:**
```typescript
import { spawn } from 'child_process';
import { WebSocket } from 'ws';

function executeToolWithStreaming(
  toolPath: string,
  args: string[],
  projectDir: string,
  ws: WebSocket
) {
  const process = spawn(toolPath, args, {
    cwd: projectDir,
    env: { ...process.env, FORCE_COLOR: '0' } // Disable ANSI if desired
  });

  // Stream stdout chunks directly to WebSocket
  process.stdout.on('data', (chunk: Buffer) => {
    ws.send(JSON.stringify({
      type: 'stdout',
      data: chunk.toString('utf-8')
    }));
  });

  // Stream stderr chunks directly to WebSocket
  process.stderr.on('data', (chunk: Buffer) => {
    ws.send(JSON.stringify({
      type: 'stderr',
      data: chunk.toString('utf-8')
    }));
  });

  // Notify completion
  process.on('close', (code: number) => {
    ws.send(JSON.stringify({
      type: 'exit',
      code: code
    }));
  });

  return process;
}
```

### Pattern 2: Ephemeral Directory Lifecycle

**What:** Create temporary isolated directories per execution request, track with metadata, schedule cleanup based on completion time

**When to use:** When users upload files for processing and outputs need temporary storage before download

**Trade-offs:**
- **Pros:** Isolation prevents cross-contamination, automatic cleanup prevents disk bloat, simple to implement
- **Cons:** Requires careful path sanitization, cleanup scheduling adds complexity, disk space must be monitored

**Example:**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface ProjectMetadata {
  id: string;
  created: Date;
  completed?: Date;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  cleanupScheduledAt?: Date;
}

class ProjectManager {
  private baseDir: string;
  private projects = new Map<string, ProjectMetadata>();

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  async createProject(): Promise<string> {
    const projectId = uuidv4();
    const projectDir = path.join(this.baseDir, projectId);

    await fs.mkdir(projectDir, { recursive: true });

    this.projects.set(projectId, {
      id: projectId,
      created: new Date(),
      status: 'uploading'
    });

    return projectId;
  }

  async markCompleted(projectId: string): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) throw new Error('Project not found');

    project.completed = new Date();
    project.status = 'completed';

    // Schedule cleanup for 5-15 minutes later
    const cleanupDelay = Math.random() * 10 + 5; // 5-15 minutes
    project.cleanupScheduledAt = new Date(Date.now() + cleanupDelay * 60 * 1000);
  }

  getProjectsForCleanup(): string[] {
    const now = new Date();
    return Array.from(this.projects.values())
      .filter(p => p.cleanupScheduledAt && p.cleanupScheduledAt <= now)
      .map(p => p.id);
  }

  async cleanupProject(projectId: string): Promise<void> {
    const projectDir = path.join(this.baseDir, projectId);
    await fs.rm(projectDir, { recursive: true, force: true });
    this.projects.delete(projectId);
  }
}
```

### Pattern 3: Type-Based WebSocket Message Routing

**What:** All WebSocket messages carry a "type" field that determines handler dispatch on both client and server

**When to use:** When multiple message types flow over same WebSocket connection (stdout, stderr, status updates, errors)

**Trade-offs:**
- **Pros:** Extensible (add new types easily), type-safe with TypeScript discriminated unions, clear message intent
- **Cons:** Requires agreement on message schema, slightly more overhead than raw data

**Example:**
```typescript
// shared/types/websocket.ts
export type WebSocketMessage =
  | { type: 'stdout'; data: string }
  | { type: 'stderr'; data: string }
  | { type: 'exit'; code: number }
  | { type: 'error'; message: string }
  | { type: 'status'; status: 'starting' | 'running' | 'completed' };

// server/websocket/handlers.ts
export function handleMessage(ws: WebSocket, message: WebSocketMessage) {
  switch (message.type) {
    case 'stdout':
      // Handle stdout
      break;
    case 'stderr':
      // Handle stderr
      break;
    case 'exit':
      // Handle process exit
      break;
    case 'error':
      // Handle error
      break;
    case 'status':
      // Handle status update
      break;
  }
}

// client/hooks/useWebSocket.ts
export function useWebSocket(projectId: string) {
  const [messages, setMessages] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('idle');

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3000/ws/${projectId}`);

    ws.onmessage = (event) => {
      const msg: WebSocketMessage = JSON.parse(event.data);

      switch (msg.type) {
        case 'stdout':
        case 'stderr':
          setMessages(prev => [...prev, msg.data]);
          break;
        case 'exit':
          setStatus(msg.code === 0 ? 'completed' : 'failed');
          break;
        case 'status':
          setStatus(msg.status);
          break;
        case 'error':
          setStatus('error');
          console.error(msg.message);
          break;
      }
    };

    return () => ws.close();
  }, [projectId]);

  return { messages, status };
}
```

### Pattern 4: Metadata-Driven Cleanup Scheduler

**What:** Store project metadata (creation time, completion time, status) in-memory or lightweight database, run periodic job to identify and delete expired projects

**When to use:** When ephemeral resources need reliable cleanup without manual intervention

**Trade-offs:**
- **Pros:** Predictable cleanup, handles server restarts gracefully if persisted, prevents disk bloat
- **Cons:** Requires scheduler (node-cron), adds complexity, must handle cleanup failures idempotently

**Example:**
```typescript
import cron from 'node-cron';

class CleanupScheduler {
  private projectManager: ProjectManager;

  constructor(projectManager: ProjectManager) {
    this.projectManager = projectManager;
  }

  start() {
    // Run cleanup every minute
    cron.schedule('* * * * *', async () => {
      const projectsToClean = this.projectManager.getProjectsForCleanup();

      for (const projectId of projectsToClean) {
        try {
          await this.projectManager.cleanupProject(projectId);
          console.log(`Cleaned up project: ${projectId}`);
        } catch (error) {
          // Log but don't throw - cleanup should be idempotent
          console.error(`Failed to cleanup project ${projectId}:`, error);
        }
      }
    });

    console.log('Cleanup scheduler started');
  }
}
```

### Pattern 5: Layered Architecture (Routes → Services → Utils)

**What:** Separate concerns into distinct layers: routes handle HTTP/WebSocket protocol, services contain business logic, utils provide pure functions

**When to use:** Almost always - improves maintainability, testability, and separates concerns in Node.js APIs

**Trade-offs:**
- **Pros:** Easy to test (mock services in route tests), clear responsibilities, promotes code reuse
- **Cons:** More files to navigate, may feel like overkill for tiny projects

**Example:**
```typescript
// server/routes/process.ts
import { Router } from 'express';
import { ProcessService } from '../services/processRunner';

const router = Router();
const processService = new ProcessService();

router.post('/process/:projectId/:toolName', async (req, res) => {
  try {
    const { projectId, toolName } = req.params;
    const result = await processService.startTool(projectId, toolName);
    res.json({ success: true, processId: result.processId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

// server/services/processRunner.ts
import { spawn } from 'child_process';
import { WebSocketServer } from '../websocket/server';

export class ProcessService {
  private wsServer: WebSocketServer;

  constructor() {
    this.wsServer = WebSocketServer.getInstance();
  }

  async startTool(projectId: string, toolName: string) {
    const toolPath = this.getToolPath(toolName);
    const projectDir = this.getProjectDir(projectId);

    const process = spawn(toolPath, [], { cwd: projectDir });

    // Stream to WebSocket clients subscribed to this project
    this.wsServer.streamToProject(projectId, process);

    return { processId: process.pid };
  }

  private getToolPath(toolName: string): string {
    // Business logic for resolving tool paths
    return `/tools/${toolName}/bin/${toolName}`;
  }

  private getProjectDir(projectId: string): string {
    // Business logic for resolving project directories
    return `/tmp/projects/${projectId}`;
  }
}
```

## Data Flow

### Upload and Extract Flow

```
User selects zip file
    ↓
[Upload Component] → POST /api/upload
    ↓
[Upload Handler] → Validate file (size, type, MIME)
    ↓
[Multer Middleware] → Save to temp location
    ↓
[Project Manager] → Create ephemeral directory
    ↓
[Zip Handler] → Extract to project directory
    ↓
Response: { projectId, uploadedFiles }
```

### Process Execution and Streaming Flow

```
User selects tool
    ↓
[Frontend] → POST /api/process/{projectId}/{toolName}
    ↓
[Process Handler] → Spawn child process
    ↓
[Process Manager] → pipe stdout/stderr
    ↓
[WebSocket Server] → Broadcast chunks to client
    ↓
[Terminal Component] → Render output in real-time
    ↓
Process exits → Mark project as completed
    ↓
[Job Scheduler] → Schedule cleanup (5-15 min)
```

### Download and Cleanup Flow

```
User clicks download
    ↓
[Download Component] → GET /api/download/{projectId}
    ↓
[Download Handler] → Create zip of outputs
    ↓
[Archiver] → Stream zip to response
    ↓
Client receives file
    ↓
[Job Scheduler] → Execute scheduled cleanup
    ↓
[Project Manager] → Delete ephemeral directory
```

### WebSocket Connection Lifecycle

```
Frontend initializes
    ↓
[useWebSocket hook] → Connect to ws://server/ws/{projectId}
    ↓
[WebSocket Server] → Register connection in project room
    ↓
Process starts → Stream chunks to all connections in room
    ↓
Connection lost → Frontend attempts reconnection
    ↓
Component unmounts → Close connection
    ↓
No connections left → Remove empty room
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **5-20 users (initial)** | Single Node.js process handles everything. Ephemeral directories on local disk. WebSocket connections managed in-memory. Simple node-cron for cleanup. No additional infrastructure needed. |
| **20-100 users** | Consider moving ephemeral storage to shared volume (NFS/EFS) if multiple server instances needed. Add Redis for WebSocket connection registry if load balancing across instances. Implement rate limiting per user/IP. Monitor disk space usage and adjust cleanup frequency. |
| **100-1000 users** | Move to horizontal scaling with multiple server instances behind load balancer. Use Redis Pub/Sub for cross-instance WebSocket broadcasting. Implement job queue (BullMQ) for process execution instead of direct spawning. Consider cloud storage (S3) for ephemeral projects with lifecycle policies. Add monitoring and alerting for disk space, memory, and active processes. |

### Scaling Priorities

1. **First bottleneck: Concurrent process execution**
   - **What breaks:** Too many simultaneous CLI processes consume CPU/memory
   - **How to fix:** Implement job queue with concurrency limit (e.g., BullMQ with maxConcurrency: 10), queue overflow requests, show queue position to users

2. **Second bottleneck: WebSocket connection scaling**
   - **What breaks:** Single server instance can't handle all WebSocket connections
   - **How to fix:** Use Redis Pub/Sub for cross-instance communication, enable sticky sessions on load balancer, or consider Socket.IO's built-in Redis adapter

3. **Third bottleneck: Disk space from ephemeral directories**
   - **What breaks:** Projects accumulate faster than cleanup runs, disk fills
   - **How to fix:** More aggressive cleanup (reduce retention time), implement disk space monitoring with alerts, add manual cleanup endpoint for emergencies

## Anti-Patterns

### Anti-Pattern 1: Buffering Entire Process Output in Memory

**What people do:** Collect all stdout/stderr into string/array, then send once complete

```typescript
// DON'T DO THIS
let output = '';
process.stdout.on('data', (chunk) => {
  output += chunk.toString();
});
process.on('close', () => {
  ws.send(output); // Send all at once
});
```

**Why it's wrong:** Large outputs (verification traces, compilation logs) exhaust memory, users see no feedback until completion, defeats real-time streaming purpose

**Do this instead:** Stream chunks directly to WebSocket as they arrive (see Pattern 1)

### Anti-Pattern 2: Trusting Client-Provided File Paths

**What people do:** Use uploaded filenames or user-provided paths directly in file system operations

```typescript
// DON'T DO THIS
app.post('/upload', (req, res) => {
  const userPath = req.body.extractPath; // User controls this!
  extractZip(uploadedFile, `/tmp/${userPath}`); // Path traversal risk
});
```

**Why it's wrong:** Path traversal attacks (../../etc/passwd), overwriting system files, security vulnerabilities

**Do this instead:** Generate all paths server-side using UUIDs, sanitize and validate any user input, never trust client data

```typescript
// DO THIS
app.post('/upload', (req, res) => {
  const projectId = uuidv4(); // Server-generated
  const projectDir = path.join(SAFE_BASE_DIR, projectId); // Controlled base
  extractZip(uploadedFile, projectDir);
});
```

### Anti-Pattern 3: Not Cleaning Up on Process Failure

**What people do:** Only schedule cleanup on successful completion, ignore failed/crashed processes

```typescript
// DON'T DO THIS
process.on('close', (code) => {
  if (code === 0) {
    scheduleCleanup(projectId); // Only cleanup if successful
  }
  // Failed processes never cleaned!
});
```

**Why it's wrong:** Failed processes leave directories forever, disk fills with orphaned projects, no way to recover

**Do this instead:** Always schedule cleanup regardless of exit code, cleanup is about resource management not success indication

```typescript
// DO THIS
process.on('close', (code) => {
  markProjectCompleted(projectId, code); // Always mark completed
  scheduleCleanup(projectId); // Always cleanup
});
```

### Anti-Pattern 4: Synchronous File Operations in Request Handlers

**What people do:** Use fs.readFileSync, fs.writeFileSync in async request handlers

```typescript
// DON'T DO THIS
app.get('/download/:projectId', (req, res) => {
  const zip = fs.readFileSync(`/tmp/${req.params.projectId}/output.zip`); // Blocks!
  res.send(zip);
});
```

**Why it's wrong:** Blocks event loop, freezes server for all users during I/O, kills performance under load

**Do this instead:** Use fs.promises or streaming for all file operations

```typescript
// DO THIS
app.get('/download/:projectId', async (req, res) => {
  const zipPath = `/tmp/${req.params.projectId}/output.zip`;
  res.download(zipPath); // Streams automatically
});
```

### Anti-Pattern 5: Using vm2 or Similar for Sandboxing

**What people do:** Attempt to sandbox CLI tool execution with JavaScript VM sandboxes (vm2, vm module)

```typescript
// DON'T DO THIS
import vm from 'vm2';
const sandbox = new vm.VM();
sandbox.run(userCode); // Multiple known sandbox escape vulnerabilities
```

**Why it's wrong:** vm2 has critical CVE-2026-22709 (CVSS 9.8) with sandbox escape, JavaScript-level sandboxing fundamentally flawed, new bypasses discovered regularly

**Do this instead:** Use OS-level isolation (Docker containers, separate user permissions), process isolation with restricted environments, or cloud sandboxing services

```typescript
// DO THIS
import { spawn } from 'child_process';
// Run in isolated environment with limited permissions
const process = spawn('docker', [
  'run',
  '--rm',
  '--network=none', // No network access
  '--memory=512m', // Memory limit
  '--cpus=1', // CPU limit
  '--read-only', // Read-only filesystem
  'tool-image',
  'tool-command'
]);
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **CLI Tools** | Child process spawn with stdio pipes | Tools run as separate processes, isolated from Node.js runtime. Ensure tools are statically compiled or dependencies bundled. |
| **File Storage (optional)** | Cloud storage SDK (AWS S3, DO Spaces) | For production, consider moving ephemeral directories to object storage with lifecycle policies. Local disk sufficient for initial deployment. |
| **Monitoring (optional)** | APM agents (New Relic, Datadog) or custom metrics | Track: active processes, disk usage, WebSocket connections, request rates. Essential before scaling beyond 100 users. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Frontend ↔ Backend REST** | HTTP JSON API | Standard REST for request/response patterns (upload, download, status queries). Use shared TypeScript types for type safety. |
| **Frontend ↔ Backend WebSocket** | WebSocket with JSON messages | Real-time streaming for process output. Use type-based message routing (Pattern 3). Handle reconnection on client side. |
| **Routes ↔ Services** | Direct function calls | Routes are thin HTTP/WebSocket adapters. Services contain business logic. Services don't know about Express req/res. |
| **Services ↔ Process Manager** | Event emitters or callbacks | Process Manager emits events (stdout, stderr, exit). Services subscribe and relay to WebSocket clients. |
| **Job Scheduler ↔ Project Manager** | Direct function calls | Scheduler queries Project Manager for cleanup candidates, calls cleanup methods. Idempotent cleanup operations. |

## Security Considerations

### File Upload Security

1. **Validation layers:**
   - File size limits (enforce at Multer and nginx/reverse proxy level)
   - MIME type validation (use file-type library to verify actual content)
   - Extension whitelist (only .zip allowed)
   - Malware scanning for production (Pompelmi or ClamAV)

2. **Archive extraction safety:**
   - Limit recursion depth during extraction (prevent zip bombs)
   - Cap total extracted size (prevent decompression bombs)
   - Sanitize extracted file paths (prevent path traversal)
   - Extract to isolated project directories only

3. **Input sanitization:**
   - Never trust client-provided paths or filenames
   - Validate tool names against whitelist
   - Generate all project IDs server-side (UUID v4)
   - Use path.join with controlled base directories

### Process Isolation

1. **Avoid JavaScript sandboxing:**
   - Do NOT use vm2 (CVE-2026-22709 with CVSS 9.8)
   - Do NOT rely on Node.js permission model for untrusted code

2. **Recommended isolation (choose based on requirements):**
   - **Minimal (sufficient for trusted users):** Run CLI tools as separate processes with limited environment
   - **Medium (recommended):** Use Docker containers with network isolation, memory/CPU limits, read-only filesystems
   - **Maximum (for untrusted code):** Cloud sandboxing services or VMs with full isolation

3. **Resource limits:**
   - Process timeout (kill if exceeds 5 minutes)
   - Memory limits per process
   - CPU usage limits
   - Concurrent process cap (prevent fork bombs)

### WebSocket Security

1. **Connection validation:**
   - Validate projectId exists before establishing WebSocket
   - Implement rate limiting (max messages per connection)
   - Timeout idle connections (close after 30 minutes)

2. **Message validation:**
   - Validate message structure (TypeScript helps)
   - Sanitize any user-provided data in messages
   - Limit message size

## Build Order Implications

Based on component dependencies, recommended implementation order:

### Phase 1: Core Infrastructure (Foundation)
**Build order:** File system → Process spawning → Basic streaming
1. Project Manager (ephemeral directory creation/deletion)
2. CLI Process Spawner (child_process.spawn with basic stdout capture)
3. Simple Express server with health check endpoint

**Why first:** Other components depend on these primitives. Validates CLI tools execute correctly before building UI.

### Phase 2: Upload and Extraction
**Build order:** Upload endpoint → Validation → Extraction
1. File upload endpoint with Multer
2. File validation (size, type, MIME checks)
3. Zip extraction to project directories

**Why second:** Establishes data flow into system. Blocks testing of full workflow until files can enter.

### Phase 3: Real-Time Streaming
**Build order:** WebSocket server → Stream integration → Frontend connection
1. WebSocket server setup (express-ws)
2. Connect process stdout/stderr to WebSocket
3. Basic frontend WebSocket client

**Why third:** Most complex component. Requires working upload/process flow to test effectively.

### Phase 4: Frontend Terminal UI
**Build order:** Terminal component → Upload UI → Download UI
1. Terminal/console component (render streamed output)
2. Upload interface (file picker, progress)
3. Download interface (button, status)

**Why fourth:** UI can develop in parallel once APIs stable. Terminal needs working WebSocket stream to test.

### Phase 5: Cleanup and Lifecycle
**Build order:** Completion tracking → Scheduler → Cleanup logic
1. Mark projects as completed after process exits
2. Job scheduler setup (node-cron)
3. Cleanup job implementation

**Why fifth:** Less critical for initial testing. Can develop after core workflow proven. Essential before production deployment.

### Phase 6: Download and Zip Creation
**Build order:** Output zip creation → Download endpoint → Frontend integration
1. Zip creation from project outputs (archiver)
2. Download endpoint with streaming
3. Frontend download trigger

**Why sixth:** Depends on completed processes with output. Can be tested manually until UI ready.

### Dependency Graph

```
Project Manager (1)
    ↓
Process Spawner (1) ──→ Upload Handler (2)
    ↓                         ↓
WebSocket Server (3) ←── Extraction (2)
    ↓                         ↓
Terminal Component (4)    Completion Tracking (5)
    ↓                         ↓
Upload/Download UI (4)    Cleanup Scheduler (5)
    ↓                         ↓
Output Zip Creation (6) ←─────┘
```

Numbers indicate suggested phase order. Arrows show dependencies (A → B means B depends on A).

## Sources

**Architecture and Patterns:**
- [Building real-time applications with WebSockets](https://render.com/articles/building-real-time-applications-with-websockets) - MEDIUM confidence
- [Building Real-Time APIs: WebSockets, SSE, WebRTC](https://dasroot.net/posts/2026/01/building-real-time-apis-webscokets-sse-webrtc/) - MEDIUM confidence
- [Realtime at Scale with Node.js, WebSocket & SSE](https://medium.com/@bhagyarana80/realtime-at-scale-with-node-js-websocket-sse-74fd7f3e79ed) - MEDIUM confidence
- [Why Server-Sent Events Beat WebSockets for 95% of Real-Time Cloud Applications](https://medium.com/codetodeploy/why-server-sent-events-beat-websockets-for-95-of-real-time-cloud-applications-830eff5a1d7c) - MEDIUM confidence

**Process Management:**
- [Express / node / socket.io code to stream unix child process output over websockets](https://gist.github.com/foogoof/978488) - MEDIUM confidence
- [Child process | Node.js v25.6.1 Documentation](https://nodejs.org/api/child_process.html) - HIGH confidence (official docs)
- [How To Launch Child Processes in Node.js | DigitalOcean](https://www.digitalocean.com/community/tutorials/how-to-launch-child-processes-in-node-js) - MEDIUM confidence

**File Management and Cleanup:**
- [Node.js File System in Practice: A Production-Grade Guide for 2026](https://thelinuxcode.com/nodejs-file-system-in-practice-a-production-grade-guide-for-2026/) - MEDIUM confidence
- [Running Scheduled Tasks in Node.js (Cron Jobs) | Lead With Skills](https://www.leadwithskills.com/blogs/running-scheduled-tasks-nodejs-cron) - MEDIUM confidence
- [File Storage | Supabase Docs](https://supabase.com/docs/guides/functions/ephemeral-storage) - MEDIUM confidence (official docs)

**Frontend Integration:**
- [How to Use WebSockets in React for Real-Time Applications](https://oneuptime.com/blog/post/2026-01-15-websockets-react-real-time-applications/view) - MEDIUM confidence
- [Real-time State Management in React Using WebSockets](https://moldstud.com/articles/p-real-time-state-management-in-react-using-websockets-boost-your-apps-performance) - LOW confidence
- [GitHub - linuswillner/react-console-emulator](https://github.com/linuswillner/react-console-emulator) - MEDIUM confidence

**ZIP Processing:**
- [How To Work With Zip Files in Node.js | DigitalOcean](https://www.digitalocean.com/community/tutorials/how-to-work-with-zip-files-in-node-js) - MEDIUM confidence
- [Best methods for unzipping files in Node.js - LogRocket Blog](https://blog.logrocket.com/best-methods-unzipping-files-node-js/) - MEDIUM confidence
- [unzipper - npm](https://www.npmjs.com/package/unzipper) - HIGH confidence (official package docs)

**Security:**
- [Critical vm2 Node.js Flaw Allows Sandbox Escape](https://thehackernews.com/2026/01/critical-vm2-nodejs-flaw-allows-sandbox.html) - HIGH confidence
- [Node.js January 2026 Security Release](https://nodesource.com/blog/nodejs-security-release-january-2026) - HIGH confidence
- [Secure File Uploads in Node.js: Validation, Limits & S3 Storage](https://prateeksha.com/blog/file-uploads-nodejs-safe-validation-limits-s3) - MEDIUM confidence
- [Best Practices for Secure File Uploads in Web Applications](https://webpenetrationtesting.com/best-practices-for-secure-file-uploads-in-web-applications/) - MEDIUM confidence
- [Pompelmi: Open-source secure file upload scanning for Node.js](https://www.helpnetsecurity.com/2026/02/02/pompelmi-open-source-secure-file-upload-scanning-node-js/) - MEDIUM confidence

**Design Patterns:**
- [Top Node.js Design Patterns You Should Know in 2026](https://nareshit.com/blogs/top-nodejs-design-patterns-2026) - MEDIUM confidence
- [Getting Started with Express WebSockets | Better Stack Community](https://betterstack.com/community/guides/scaling-nodejs/express-websockets/) - MEDIUM confidence
- [Worker Threads vs Queuing Systems in Node.js](https://dev-aditya.medium.com/worker-threads-vs-queuing-systems-in-node-js-44695d902ca1) - MEDIUM confidence

---
*Architecture research for: CLI Tool Execution Web Portal*
*Researched: 2026-02-12*
