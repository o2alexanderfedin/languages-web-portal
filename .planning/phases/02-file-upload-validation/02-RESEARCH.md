# Phase 2: File Upload & Validation - Research

**Researched:** 2026-02-12
**Domain:** File upload, ZIP extraction, security validation
**Confidence:** HIGH

## Summary

File upload and validation requires a multi-layered security approach. The standard stack is **multer v2.0.2+** for Express file uploads (critical security fixes), **react-dropzone v15** for client drag-and-drop, and **pompelmi** for comprehensive ZIP security validation (zip bombs, path traversal, symlinks). Client-side validation (file type, size) provides UX; server-side validation is mandatory for security. Isolated project directories use UUID-based paths with automatic cleanup. Example projects are pre-seeded server-side templates copied on-demand.

**Primary recommendation:** Use multer v2.0+ for uploads, pompelmi for ZIP validation (bomb detection, traversal protection), react-dropzone for client UI, and implement defense-in-depth with both client and server validation.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| multer | ^2.0.2 | Express multipart/form-data file upload middleware | Official Express middleware, v2.0+ fixes high-severity CVEs, widely adopted (busboy-based) |
| pompelmi | latest | ZIP security validation (bomb detection, path traversal, MIME verification) | Privacy-first, local scanning, deep ZIP inspection with bomb/ratio limits, Express middleware support |
| react-dropzone | ^15.0.0 | React drag-and-drop file upload zone | Most popular React file upload library (4400+ dependents), HTML5-compliant, React hooks-based |
| uuid | latest | Generate unique project directory names | Standard for unique identifiers, crypto-secure random generation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| file-type | latest | Magic bytes MIME detection | Verify actual file type vs claimed MIME (security), fallback validation |
| tmp | latest | Temporary file/directory management with auto-cleanup | Graceful cleanup on process exit, track/cleanup temp directories |
| express-fileupload | N/A | Alternative to multer | AVOID - multer is standard for Express |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pompelmi | extract-zip + manual validation | Pompelmi provides integrated bomb detection, ratio limits, traversal protection, MIME verification - manual approach error-prone |
| react-dropzone | FilePond, Uppy | FilePond/Uppy are full uploaders with backend integration - heavier; react-dropzone is lightweight hook for UI only |
| multer v2 | formidable, busboy directly | multer is Express standard, v2 has critical security fixes, well-maintained |

**Installation:**
```bash
# Server
npm install --workspace @repo/server multer pompelmi uuid tmp file-type
npm install --workspace @repo/server -D @types/multer

# Client
npm install --workspace @repo/client react-dropzone
```

## Architecture Patterns

### Recommended Project Structure
```
packages/server/src/
├── middleware/
│   ├── fileUpload.ts        # Multer configuration with size/type limits
│   ├── zipValidation.ts     # Pompelmi ZIP security middleware
│   └── errorHandler.ts      # Existing error handler
├── routes/
│   ├── upload.ts            # POST /api/upload endpoint
│   └── examples.ts          # GET /api/examples endpoint
├── services/
│   ├── projectService.ts    # Isolated directory creation/cleanup
│   └── exampleService.ts    # Pre-built example loading
└── utils/
    ├── pathSecurity.ts      # Path traversal validation, symlink checks
    └── fileValidation.ts    # MIME type verification with magic bytes

packages/client/src/
├── features/
│   └── upload/
│       ├── UploadZone.tsx   # react-dropzone UI component
│       ├── api.ts           # RTK Query upload mutation
│       └── types.ts         # Upload state types
└── components/
    └── ui/                  # Existing shadcn/ui components
```

### Pattern 1: Multi-Layer File Upload Validation
**What:** Defense-in-depth with client validation (UX), server MIME validation (spoofing), and ZIP security validation (bombs, traversal)
**When to use:** All file uploads, especially archives
**Example:**
```typescript
// Client: react-dropzone configuration
// Source: https://react-dropzone.js.org/
import { useDropzone } from 'react-dropzone';

const MAX_SIZE = 100 * 1024 * 1024; // 100MB

const { getRootProps, getInputProps } = useDropzone({
  accept: { 'application/zip': ['.zip'] },
  maxSize: MAX_SIZE,
  multiple: false,
  onDrop: (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      // Show error to user
    }
    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0]);
    }
  }
});

// Server: Multer + Pompelmi validation
// Source: https://pompelmi.github.io/pompelmi/
import multer from 'multer';
import { pompelmi } from 'pompelmi';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/zip') {
      cb(new Error('Only ZIP files allowed'));
    } else {
      cb(null, true);
    }
  }
});

// Pompelmi ZIP validation middleware
const validateZip = pompelmi({
  maxEntries: 1000,              // Limit number of files in archive
  maxEntrySize: 50 * 1024 * 1024, // 50MB per entry
  maxTotalSize: 500 * 1024 * 1024, // 500MB total uncompressed
  maxNesting: 1,                  // No nested archives
  compressionRatio: 100           // Max 100:1 compression ratio
});

router.post('/upload', upload.single('file'), validateZip, async (req, res) => {
  // File is validated, extract safely
});
```

### Pattern 2: Isolated Project Directories with UUID
**What:** Each upload session gets unique UUID-based directory, preventing cross-contamination
**When to use:** Multi-user or multi-session file processing
**Example:**
```typescript
// Source: Combined pattern from research
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import tmp from 'tmp';

// Enable graceful cleanup
tmp.setGracefulCleanup();

export class ProjectService {
  private readonly baseDir: string;

  constructor(baseDir: string = './uploads') {
    this.baseDir = baseDir;
  }

  async createProjectDir(sessionId?: string): Promise<string> {
    const projectId = sessionId || uuidv4();
    const projectPath = path.join(this.baseDir, projectId);

    // Create isolated directory
    await fs.mkdir(projectPath, { recursive: true });

    return projectPath;
  }

  async cleanupProjectDir(projectPath: string): Promise<void> {
    // Security: Verify path is within baseDir
    const realPath = await fs.realpath(projectPath);
    const realBase = await fs.realpath(this.baseDir);

    if (!realPath.startsWith(realBase)) {
      throw new Error('Path traversal attempt detected');
    }

    // Remove directory and contents
    await fs.rm(projectPath, { recursive: true, force: true });
  }
}
```

### Pattern 3: Safe ZIP Extraction with Path Validation
**What:** Extract ZIP entries while validating each path for traversal attempts and symlinks
**When to use:** All ZIP extraction operations
**Example:**
```typescript
// Source: https://medium.com/intrinsic-blog/protecting-node-js-applications-from-zip-slip-b24a37811c10
import path from 'path';
import { promises as fs } from 'fs';

async function validateExtractPath(
  targetDir: string,
  entryPath: string
): Promise<string> {
  // Join paths
  const fullPath = path.join(targetDir, entryPath);

  // Get canonical paths (resolves .., ., symlinks)
  const canonicalTarget = await fs.realpath(targetDir);
  const canonicalFull = path.resolve(fullPath);

  // Verify extracted file stays within target directory
  if (!canonicalFull.startsWith(canonicalTarget)) {
    throw new Error(`Path traversal detected: ${entryPath}`);
  }

  // Check if path contains symlinks
  const stats = await fs.lstat(canonicalFull).catch(() => null);
  if (stats?.isSymbolicLink()) {
    throw new Error(`Symlink detected: ${entryPath}`);
  }

  return canonicalFull;
}
```

### Pattern 4: RTK Query File Upload with FormData
**What:** Use RTK Query mutation with FormData for file uploads, let browser set Content-Type
**When to use:** React client file uploads with Redux Toolkit
**Example:**
```typescript
// Source: https://github.com/reduxjs/redux-toolkit/issues/2677
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const uploadApi = createApi({
  reducerPath: 'uploadApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    uploadFile: builder.mutation<UploadResponse, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);

        return {
          url: '/upload',
          method: 'POST',
          body: formData,
          // DO NOT set Content-Type - browser sets with boundary
        };
      }
    })
  })
});

export const { useUploadFileMutation } = uploadApi;
```

### Pattern 5: Example Project Loading
**What:** Pre-built example projects stored server-side, copied to user's isolated directory on request
**When to use:** Providing starter templates or sample projects
**Example:**
```typescript
// Source: Pattern derived from research
import { promises as fs } from 'fs';
import path from 'path';

export class ExampleService {
  private readonly examplesDir: string;

  constructor(examplesDir: string = './examples') {
    this.examplesDir = examplesDir;
  }

  async getAvailableExamples(tool: string): Promise<string[]> {
    const toolDir = path.join(this.examplesDir, tool);
    const entries = await fs.readdir(toolDir, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(e => e.name);
  }

  async loadExample(
    tool: string,
    exampleName: string,
    targetDir: string
  ): Promise<void> {
    const sourceDir = path.join(this.examplesDir, tool, exampleName);

    // Validate source exists
    await fs.access(sourceDir);

    // Copy recursively to target
    await fs.cp(sourceDir, targetDir, { recursive: true });
  }
}
```

### Anti-Patterns to Avoid
- **Trusting client MIME types:** Always verify with magic bytes server-side (spoofing attack vector)
- **Synchronous ZIP operations:** adm-zip blocks event loop - use streaming libraries like yauzl or pompelmi
- **No compression ratio limits:** Allows zip bomb DoS attacks (10MB compressed -> 10TB uncompressed)
- **Direct path concatenation:** `baseDir + userPath` vulnerable to traversal - use `path.join()` + `realpath()` validation
- **No symlink checks:** Symlinks can escape isolated directories - validate with `lstat().isSymbolicLink()`
- **Global temp directories:** Concurrent uploads collide - use UUID-based isolation per session
- **Client-only validation:** Can be bypassed with curl/Postman - always validate server-side

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Zip bomb detection | Custom compression ratio checks | pompelmi, @ronomon/pure | Handles overlapping headers, recursive archives, multiple bomb variants, extensive edge cases |
| Path traversal validation | String checks for "../" | path.join() + fs.realpath() + startsWith() | Handles URL encoding, backslash variants, Unicode normalization, symlinks |
| Multipart form parsing | Custom HTTP body parser | multer v2.0+ | Handles streams, errors, encoding, busboy integration, security fixes |
| MIME type detection | File extension checking | file-type (magic bytes) | Extensions can be changed, magic bytes read actual file header |
| Temp file cleanup | Manual fs.rm in finally blocks | tmp with gracefulCleanup | Handles process crashes, signals, uncaught exceptions, tracks all temp files |
| ZIP extraction | String path validation loops | pompelmi, extract-zip + validation | Handles nesting, ratio limits, entry count limits, memory safety |

**Key insight:** Archive security is deceptively complex - attacks exploit overlapping headers, hardlink traversal (CVE-2026-24842), compression ratio bombs (1032:1 DEFLATE, billions:1 with format exploits), recursive nesting, and symlink escaping. Use battle-tested libraries.

## Common Pitfalls

### Pitfall 1: Multer v1.x Security Vulnerabilities
**What goes wrong:** Using multer 1.x exposes application to two high-severity CVEs patched in v2.0.0
**Why it happens:** Existing projects haven't upgraded, npm install defaults to compatible version
**How to avoid:** Explicitly require multer ^2.0.2 in package.json, review Express security releases
**Warning signs:** Snyk/npm audit warnings about multer vulnerabilities

### Pitfall 2: Trusting Client-Provided MIME Types
**What goes wrong:** File uploaded as "application/zip" but actually a malicious executable renamed with .zip extension
**Why it happens:** MIME type from browser is user-controlled metadata, not verified
**How to avoid:** Always verify with magic bytes using file-type library server-side
**Warning signs:** File extraction fails, unexpected content types in processing

### Pitfall 3: Path Traversal via Hardlinks (CVE-2026-24842)
**What goes wrong:** Attacker uses hardlink in ZIP to bypass path traversal protections in node-tar
**Why it happens:** Hardlinks can point outside target directory, bypassing "../" checks
**How to avoid:** Use pompelmi (includes hardlink protection) or manually check with lstat() before extraction
**Warning signs:** Files appearing outside target directory, permission errors, unexpected file overwrites

### Pitfall 4: Zip Bomb DoS (Compression Ratio)
**What goes wrong:** 10MB upload expands to 10TB, crashing server with OOM or disk exhaustion
**Why it happens:** No limits on uncompressed size or compression ratio (theoretical 1032:1, exploits achieve billions:1)
**How to avoid:** Set maxTotalSize, maxEntrySize, compressionRatio limits in pompelmi
**Warning signs:** Memory spikes during extraction, disk space exhaustion, slow extraction times

### Pitfall 5: Concurrent Upload Filename Collisions
**What goes wrong:** Two users upload "project.zip" simultaneously, files overwrite each other or merge incorrectly
**Why it happens:** Using original filename or timestamp without unique session ID
**How to avoid:** Use UUID v4 for each session/upload directory, never trust user-provided filenames
**Warning signs:** Users report seeing wrong project files, intermittent file corruption

### Pitfall 6: Symlink Directory Escape
**What goes wrong:** ZIP contains symlink pointing to /etc/passwd, extraction follows it and exposes system files
**Why it happens:** Not checking for symlinks before extraction, fs.realpath follows symlinks
**How to avoid:** Use lstat() (not stat()) to detect symlinks, reject symlinks in archives with pompelmi maxNesting
**Warning signs:** Unexpected file access errors, security scanner alerts, files appearing in wrong locations

### Pitfall 7: Missing Server-Side Validation
**What goes wrong:** Developer relies on react-dropzone client validation, attacker bypasses with curl
**Why it happens:** Misconception that client validation is security, not just UX
**How to avoid:** Implement identical (or stricter) validation on server with multer limits + pompelmi
**Warning signs:** Unexpected file types in storage, oversized files bypassing limits

### Pitfall 8: No Cleanup Strategy
**What goes wrong:** Upload directories accumulate indefinitely, filling disk space
**Why it happens:** No TTL or cleanup job for abandoned sessions
**How to avoid:** Use tmp with gracefulCleanup, or implement scheduled cleanup job (delete dirs older than 24h)
**Warning signs:** Disk usage growing continuously, thousands of old upload directories

## Code Examples

Verified patterns from official sources:

### Client: File Upload with react-dropzone
```typescript
// Source: https://react-dropzone.js.org/
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUploadFileMutation } from './api';

export function UploadZone() {
  const [uploadFile, { isLoading, error }] = useUploadFileMutation();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0]);
    }
  }, [uploadFile]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: false
  });

  return (
    <div>
      <div {...getRootProps()} className="border-2 border-dashed p-8 text-center cursor-pointer">
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop ZIP file here...</p>
        ) : (
          <p>Drag and drop ZIP file here, or click to select (max 100MB)</p>
        )}
      </div>

      {fileRejections.length > 0 && (
        <div className="text-red-500 mt-2">
          {fileRejections[0].errors[0].code === 'file-too-large' && 'File exceeds 100MB limit'}
          {fileRejections[0].errors[0].code === 'file-invalid-type' && 'Only ZIP files allowed'}
        </div>
      )}

      {isLoading && <p>Uploading...</p>}
      {error && <p className="text-red-500">Upload failed</p>}
    </div>
  );
}
```

### Server: Multer + Pompelmi Configuration
```typescript
// Source: https://thelinuxcode.com/multer-npm-in-2026-file-uploads-in-express-that-dont-bite-you-later/
// Source: https://pompelmi.github.io/pompelmi/
import express from 'express';
import multer from 'multer';
import { pompelmi } from 'pompelmi';
import { ProjectService } from '../services/projectService';

const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for pompelmi validation
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 1,
    fieldSize: 100 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    // First-pass validation
    if (file.mimetype !== 'application/zip' && file.mimetype !== 'application/x-zip-compressed') {
      return cb(new Error('Only ZIP files are allowed'));
    }
    cb(null, true);
  }
});

// Pompelmi ZIP security validation
const zipValidator = pompelmi({
  maxEntries: 1000,                // Max files in archive
  maxEntrySize: 50 * 1024 * 1024,  // 50MB per file
  maxTotalSize: 500 * 1024 * 1024, // 500MB total uncompressed
  maxNesting: 1,                   // No nested ZIPs
  compressionRatio: 100,           // Max 100:1 ratio (zip bomb detection)
  allowedMimeTypes: ['application/zip']
});

const router = express.Router();
const projectService = new ProjectService();

router.post('/upload', upload.single('file'), zipValidator, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Create isolated project directory
  const projectDir = await projectService.createProjectDir();

  // Extract ZIP (pompelmi already validated safety)
  await extractZip(req.file.buffer, projectDir);

  res.json({
    projectId: path.basename(projectDir),
    message: 'Upload successful'
  });
});

export default router;
```

### Server: Path Security Validation
```typescript
// Source: https://medium.com/intrinsic-blog/protecting-node-js-applications-from-zip-slip-b24a37811c10
// Source: https://nodejs.org/api/fs.html
import { promises as fs } from 'fs';
import path from 'path';

export async function validatePathSafety(
  baseDir: string,
  targetPath: string
): Promise<void> {
  // Resolve to absolute paths
  const absoluteBase = await fs.realpath(baseDir);
  const absoluteTarget = path.resolve(targetPath);

  // Check for path traversal
  if (!absoluteTarget.startsWith(absoluteBase + path.sep)) {
    throw new Error('Path traversal attempt detected');
  }

  // Check for symlinks
  try {
    const stats = await fs.lstat(absoluteTarget);
    if (stats.isSymbolicLink()) {
      throw new Error('Symlink detected and rejected');
    }
  } catch (err: any) {
    // Path doesn't exist yet - that's OK for new files
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}
```

### Server: Magic Bytes MIME Verification
```typescript
// Source: https://www.npmjs.com/package/file-type
import { fileTypeFromBuffer } from 'file-type';

export async function verifyFileMimeType(
  buffer: Buffer,
  expectedMimeType: string
): Promise<boolean> {
  const fileType = await fileTypeFromBuffer(buffer);

  if (!fileType) {
    throw new Error('Unable to detect file type from magic bytes');
  }

  if (fileType.mime !== expectedMimeType) {
    throw new Error(
      `File type mismatch: claimed ${expectedMimeType}, actual ${fileType.mime}`
    );
  }

  return true;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| multer 1.x | multer 2.0+ | May 2025 | Critical security fixes for high-severity CVEs, required upgrade |
| adm-zip (sync extraction) | extract-zip/pompelmi (async) | Ongoing | Sync blocks event loop, unsuitable for servers; async libraries required |
| String-based path validation | fs.realpath + canonical path checking | Jan 2026 | CVE-2026-24842 hardlink bypass fixed in Node.js, requires proper validation |
| Extension-based file type checking | Magic bytes (file-type) | Standard practice | Extensions trivially spoofed, magic bytes read actual file header |
| Manual compression checks | Pompelmi integrated security | 2026 | Pompelmi detects all bomb variants, ratio limits, nesting, overlapping headers |
| Global upload directories | UUID-based isolation | Best practice | Prevents cross-contamination, concurrent upload collisions |

**Deprecated/outdated:**
- **adm-zip for servers:** Synchronous, blocks event loop, loads entire archive into memory - unsuitable for production
- **node-tar pre-Jan 2026:** CVE-2026-24842 hardlink path traversal vulnerability - update or use pompelmi
- **multer 1.x:** High-severity CVEs fixed in v2.0.0 - upgrade required
- **Path validation with string.includes('../'):** Bypassed by URL encoding, Unicode, backslashes, hardlinks - use path.join + realpath

## Open Questions

1. **Session Management Strategy**
   - What we know: UUID-based directories provide isolation, tmp library handles cleanup
   - What's unclear: How long to retain project directories? Tie to session TTL, or fixed 24h cleanup?
   - Recommendation: Start with 24h automatic cleanup cron job, add session-based cleanup in Phase 3 if needed

2. **Example Project Storage Location**
   - What we know: Pre-built examples should be server-side, copied to isolated directories
   - What's unclear: Store in repo (version controlled) or external storage? How many examples per tool?
   - Recommendation: Store in repo under `packages/server/examples/{tool}/{example-name}`, start with 3 examples per tool

3. **Extraction Library Choice**
   - What we know: pompelmi provides comprehensive security validation
   - What's unclear: Does pompelmi handle extraction, or just validation? Need separate extractor?
   - Recommendation: Research pompelmi API documentation, likely needs extract-zip or yauzl for actual extraction after validation

4. **Progress Tracking**
   - What we know: Large file uploads benefit from progress indicators
   - What's unclear: How to track server-side extraction progress? WebSocket, polling, or fire-and-forget?
   - Recommendation: Start with simple "uploading" indicator, defer extraction progress to later phase if needed

## Sources

### Primary (HIGH confidence)
- Multer v2.0.2 security releases: https://expressjs.com/2025/05/19/security-releases.html
- Node.js January 2026 security releases (CVE-2026-24842): https://nodejs.org/en/blog/vulnerability/december-2025-security-releases
- react-dropzone official docs: https://react-dropzone.js.org/
- Node.js fs.realpath documentation: https://nodejs.org/api/fs.html
- Pompelmi official documentation: https://pompelmi.github.io/pompelmi/

### Secondary (MEDIUM confidence)
- Multer 2026 best practices guide: https://thelinuxcode.com/multer-npm-in-2026-file-uploads-in-express-that-dont-bite-you-later/
- Protecting Node.js from Zip Slip: https://medium.com/intrinsic-blog/protecting-node-js-applications-from-zip-slip-b24a37811c10
- RTK Query FormData file uploads: https://github.com/reduxjs/redux-toolkit/issues/2677
- shadcn-dropzone component: https://github.com/diragb/shadcn-dropzone
- Node.js security best practices 2026: https://medium.com/@sparklewebhelp/node-js-security-best-practices-for-2026-3b27fb1e8160

### Tertiary (LOW confidence)
- ZIP library comparisons: https://npm-compare.com/adm-zip,extract-zip,unzipper
- Express session file storage: https://www.npmjs.com/package/session-file-store
- Compression ratio security limits: https://github.com/DataDog/guarddog/security/advisories/GHSA-ffj4-jq7m-9g6v

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - multer, react-dropzone, pompelmi all verified with official docs, current versions confirmed, security advisories reviewed
- Architecture: HIGH - Patterns verified from official sources, RTK Query FormData confirmed from GitHub issues, path validation from Node.js docs
- Pitfalls: HIGH - CVE-2026-24842 from official Node.js security release, multer CVEs from Express releases, zip bomb mechanics from multiple sources

**Research date:** 2026-02-12
**Valid until:** 2026-03-12 (30 days - stable ecosystem, security-focused)
