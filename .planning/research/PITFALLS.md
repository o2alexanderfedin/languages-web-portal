# Pitfalls Research

**Domain:** Web Portal for CLI Tool Execution on User-Uploaded Files
**Researched:** 2026-02-12
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Zip Bomb / Decompression Bomb

**What goes wrong:**
Malicious archive files (42.zip, nested zips) that appear as a few kilobytes expand into terabytes upon extraction, exhausting disk space and crashing the server. A 42KB file can expand to 4.5 petabytes across 5 nested layers.

**Why it happens:**
Developers trust file size validation on the compressed archive but don't validate extracted size. Decompression libraries extract recursively without size limits, and no monitoring catches exponential expansion before disk fills.

**How to avoid:**
- Set strict limits on uncompressed file sizes (e.g., 100MB max extracted size)
- Monitor ratio between compressed and uncompressed sizes (reject if ratio > 100:1)
- Limit nested archive depth (max 2 levels deep)
- Set decompression time limits (abort after 5 seconds)
- Always decompress in sandboxed environments with disk quotas
- Use streaming extraction with size tracking, abort when limit exceeded

**Warning signs:**
- Disk usage spikes during extraction
- Extraction processes running for extended periods
- Small uploaded files (< 10KB) that take seconds to decompress
- Server becomes unresponsive during file extraction
- Multiple extraction processes consuming CPU/memory simultaneously

**Phase to address:**
Phase 1 (File Upload/Extraction) - implement before accepting first user upload

---

### Pitfall 2: Path Traversal via Archive Entries

**What goes wrong:**
Archive files containing entries with paths like `../../etc/passwd` or absolute paths extract files outside the intended directory, allowing attackers to overwrite system files, read sensitive data, or write executables to startup directories.

**Why it happens:**
Extraction libraries restore file paths from archive without validating that resolved paths stay within extraction root. Developers assume extraction libraries sanitize paths by default (they don't). Validation occurs after extraction (too late) rather than during extraction.

**How to avoid:**
- Validate each entry's target path BEFORE extraction
- Reject archives with absolute paths (starting with `/` or `C:\`)
- Reject archives with `..` path components
- After resolving symlinks, verify final path is child of extraction directory
- Use path normalization/canonicalization before comparison
- Reject archives entirely if any entry violates constraints (don't skip)

**Warning signs:**
- Files appearing in unexpected directories outside workspace
- Permission denied errors during extraction
- Archive entries with suspicious paths visible in logs
- System files modified after extraction
- Unexpected files in temp directories or system paths

**Phase to address:**
Phase 1 (File Upload/Extraction) - implement before accepting first user upload

---

### Pitfall 3: Symlink Attacks via Archive Extraction

**What goes wrong:**
Archive contains symlink entry pointing outside extraction directory, followed by regular file with same name. Extraction creates symlink first, then follows it when writing the file, causing arbitrary file write. Attackers can overwrite sensitive files or plant executables in critical locations.

**Why it happens:**
Extraction libraries restore symlinks without validating targets. Applications follow symlinks when writing subsequent files. Developers don't realize symlinks in archives are attack vectors. Archive format allows symlinks to precede target files.

**How to avoid:**
- Skip/reject symlink entries entirely (formal verification demos don't need symlinks)
- If symlinks required, validate targets stay within extraction directory
- Extract to isolated directory with no sensitive files
- Use extraction options that don't follow symlinks
- Scan archive metadata before extraction to detect symlinks
- Reject archives containing hardlinks (similar attack vector)

**Warning signs:**
- Symlinks appearing in extracted directories
- Files written outside extraction directory
- System files modified after extraction
- Unexpected files in system directories
- Archive contains both symlink and regular file entries with same name

**Phase to address:**
Phase 1 (File Upload/Extraction) - implement before accepting first user upload

---

### Pitfall 4: Arbitrary Code Execution via Malicious File Content

**What goes wrong:**
User uploads file containing malicious code that exploits vulnerabilities in CLI tools (Z3, CVC5, transpilers). Tools parse untrusted input files, triggering buffer overflows, format string bugs, or logic flaws that allow code execution. Even "safe" formal verification tools have parsing vulnerabilities.

**Why it happens:**
CLI tools aren't designed to handle adversarial input. Developers assume formal verification tools are "safe" because they analyze code (false assumption). Tools run with same privileges as web server. No sandboxing isolates tool execution.

**How to avoid:**
- Run ALL CLI tools in strict sandboxes (gVisor minimum, microVMs preferred)
- Use Linux namespaces, seccomp-bpf, and cgroups
- Drop privileges before executing tools (run as nobody/www-data)
- Disable network access for tool processes (no egress)
- Mount filesystems read-only except workspace
- Set resource limits (CPU, memory, file descriptors, processes)
- Update tools regularly to patch known vulnerabilities

**Warning signs:**
- Tool processes spawning unexpected child processes
- Network connections from tool processes
- Processes attempting to access files outside workspace
- Unusual CPU/memory usage patterns
- Crashes or segfaults in CLI tools
- Unexpected files created in system directories

**Phase to address:**
Phase 2 (Tool Execution/Sandboxing) - critical before production deployment

---

### Pitfall 5: Resource Exhaustion / Denial of Service

**What goes wrong:**
Single user or tool execution consumes all server resources (CPU, memory, disk, processes), making portal unavailable to other users. Formal verification tools can run indefinitely on complex problems. No limits allow one process to starve others.

**Why it happens:**
Formal verification tools have worst-case exponential complexity. No per-process resource limits enforced. No per-user rate limiting. No queuing system prioritizes requests. Concurrent execution not bounded by CPU cores.

**How to avoid:**
- Limit concurrent executions to CPU core count (not more)
- Enforce strict timeouts per tool (30-60 seconds max for demo)
- Use cgroups to limit CPU (% share), memory (hard limit), and processes
- Implement per-IP rate limiting (max 5 concurrent jobs, 20/hour)
- Queue requests when at capacity (don't reject immediately)
- Monitor resource usage and kill runaway processes
- Set disk quotas per workspace (10MB max)
- Limit file descriptor count per process

**Warning signs:**
- Server becomes unresponsive with 5-10 concurrent users
- Process table fills up
- Memory exhaustion / OOM killer activating
- Disk fills from temp files
- CPU pegged at 100% for extended periods
- Response times degrade under load
- Tool processes running longer than expected timeout

**Phase to address:**
Phase 2 (Tool Execution/Sandboxing) - implement before load testing

---

### Pitfall 6: Process Leaks / Zombie Processes

**What goes wrong:**
CLI tool processes don't terminate properly, becoming orphans or zombies that accumulate over time. Process table fills, preventing new process creation. Server requires restart to recover. Memory/file descriptors leak with each orphaned process.

**Why it happens:**
Parent process exits before child terminates. SIGTERM ignored by tool, parent doesn't escalate to SIGKILL. Process exit handlers not registered. No process tracking/cleanup on shutdown. Timeout kills parent but child continues running.

**How to avoid:**
- Track all spawned process PIDs in memory/Redis
- Register `process.on('exit')` handler to kill tracked processes
- Use process groups (detached: true) and kill group with negative PID
- Escalate termination: SIGTERM (wait 2s) → SIGKILL (wait 1s) → force cleanup
- Use libraries like `tree-kill` to kill entire process tree
- Set timeout on child processes, send SIGKILL on expiry
- Monitor for zombie processes (defunct state), reap regularly
- Clean up process table on graceful shutdown and crashes

**Warning signs:**
- `ps aux | grep Z` shows zombie processes
- Process count grows over time without bound
- Unable to spawn new processes (process table full)
- File descriptor count grows continuously
- Memory usage increases even when idle
- Processes in defunct state accumulating

**Phase to address:**
Phase 2 (Tool Execution/Sandboxing) - implement before production deployment

---

### Pitfall 7: Temporary File Cleanup Failures / Race Conditions

**What goes wrong:**
Ephemeral workspace directories not deleted after execution, filling disk over time. Race conditions in multi-worker environments cause cleanup to delete active workspaces. Symlink manipulation allows deletion of unintended files.

**Why it happens:**
Cleanup happens in finally block but process crashes before reaching it. No cleanup on crashes or unhandled errors. Shared temp directory names across workers. Cleanup doesn't validate paths before deletion. Process killed before cleanup executes.

**How to avoid:**
- Use unique temp directory names (PID + timestamp + random)
- Register cleanup handlers for uncaught exceptions and SIGTERM
- Use advisory lock files to prevent concurrent cleanup
- Validate cleanup paths resolve to temp directory before delete
- Implement periodic cleanup job (delete workspaces > 1 hour old)
- Set disk quotas to prevent unbounded growth
- Use atomic operations for cleanup (rename, then delete)
- Track active workspaces in Redis/memory, mark when done
- Never follow symlinks during cleanup (lstat, not stat)

**Warning signs:**
- Disk usage grows continuously
- Old workspace directories accumulating in temp
- Race condition errors in logs during cleanup
- Files deleted while still in use errors
- Temp directory size exceeds expected bounds
- Cleanup errors appearing in logs

**Phase to address:**
Phase 2 (Tool Execution/Sandboxing) - implement before production deployment

---

### Pitfall 8: WebSocket Memory Leaks / Connection Handling

**What goes wrong:**
WebSocket connections for stdout/stderr streaming not properly closed, accumulating in memory. Server memory exhausts after hundreds of connections. Disconnected clients remain in connection pool. Event listeners not removed.

**Why it happens:**
Connection tracking arrays never remove disconnected clients. Event listeners registered but not cleaned up. Buffered data not flushed/cleared on disconnect. No maximum connection limit enforced. High-volume stdout causes buffer buildup.

**How to avoid:**
- Remove connections from tracking structures on 'close' event
- Set maximum concurrent WebSocket connections (100-200)
- Implement heartbeat/ping-pong to detect dead connections
- Set aggressive timeouts for inactive connections (60 seconds)
- Clean up event listeners explicitly on disconnect
- Limit buffer size for stdout/stderr (drop oldest if full)
- Monitor connection count and memory usage
- Use weak references where appropriate
- Test with realistic connection churn (connect/disconnect cycles)

**Warning signs:**
- Memory usage grows with connection count and doesn't decrease
- Connection pool size increases monotonically
- Memory doesn't recover after clients disconnect
- Server exhausts memory after high connection volume
- Event listener count grows unbounded
- Heap snapshots show leaked connection objects

**Phase to address:**
Phase 3 (Real-time Streaming) - implement before WebSocket integration

---

### Pitfall 9: Inadequate Error Context for Users

**What goes wrong:**
Tool crashes or fails with cryptic error messages. Users don't know if problem is their input, server issue, or tool limitation. No guidance on fixing issues. Users abandon portal, assuming it's broken.

**Why it happens:**
Errors caught generically (catch all) and reported as "Internal server error". Tool stdout/stderr not captured/parsed for meaningful errors. No distinction between user errors vs system errors. Security mindset of "hide all errors" applied inappropriately.

**How to avoid:**
- Capture and parse tool stdout/stderr for error messages
- Classify errors: user input error vs tool limitation vs system error
- Provide actionable error messages ("Input file too large: 5MB exceeds 1MB limit")
- Include example valid inputs in error messages
- Show tool output when safe (formal verification output usually safe)
- Implement graceful degradation (show partial results if available)
- Log full error details server-side, show sanitized version to user
- Test error scenarios explicitly during development

**Warning signs:**
- User support requests asking "what does this error mean?"
- High bounce rate after first error
- Generic error messages in UI ("Something went wrong")
- Errors missing context about what failed
- Users retrying same failing operation repeatedly
- No telemetry distinguishing error types

**Phase to address:**
Phase 4 (Error Handling/UX) - implement iteratively with user testing

---

### Pitfall 10: No Graceful Degradation Under Load

**What goes wrong:**
Portal completely fails when resource limits hit. All users see errors instead of queuing or reduced functionality. No communication about temporary capacity issues. Server crashes instead of rejecting new requests gracefully.

**Why it happens:**
No circuit breaker pattern implemented. Hard failures propagate to all requests. No queue for pending executions. No health checks or backpressure signaling. Developers assume infrastructure will scale infinitely.

**How to avoid:**
- Implement request queue with maximum depth (100 pending)
- Return "at capacity" message with retry-after header
- Show queue position to waiting users
- Implement circuit breaker for external dependencies
- Degrade to cached examples when tools unavailable
- Disable non-essential features under load (rate limit upload UI)
- Monitor load and proactively shed when approaching limits
- Communicate estimated wait times clearly
- Test load scenarios explicitly (10x expected concurrent users)

**Warning signs:**
- Server crashes when concurrent users exceed threshold
- All requests fail together when one dependency fails
- No queuing mechanism for overflow requests
- Error rates spike suddenly under load
- No visibility into current capacity/utilization
- Users see hard errors instead of "please wait" messages

**Phase to address:**
Phase 4 (Error Handling/UX) - implement before production deployment

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Synchronous file extraction | Simpler code, fewer async issues | Blocks event loop, portal unresponsive during extraction | Never - extraction must be async |
| No sandboxing in dev | Faster iteration, simpler setup | Exploits work locally, security issues found late | Acceptable for localhost-only dev, never for public demo |
| Running tools as same user as web server | No privilege separation complexity | Single exploit compromises entire server | Never - always drop privileges |
| Trusting file extension for validation | Simple validation logic | Bypass via renamed files, security bypass | Never - validate content, not names |
| Skipping cleanup on error paths | Simpler error handling | Disk fills with orphaned workspaces | Never - cleanup must happen in finally blocks |
| No rate limiting in demo | Fewer moving parts | Single user can DOS portal | Never for public portal - acceptable for internal demos only |
| Fixed timeout for all tools | Single configuration value | Fast tools wait unnecessarily, slow tools timeout early | Acceptable for MVP - customize per tool later |
| In-memory job queue | No Redis dependency | Lost on restart, can't scale horizontally | Acceptable for single-instance MVP (<100 concurrent users) |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| CLI Tool Execution | Using shell=true to run tools, enabling shell injection | Use array form with explicit args, never shell=true |
| Archive Extraction | Using system `unzip` command via shell | Use native libraries (unzipper, tar-stream) with validation |
| File Upload | Storing entire upload in memory before writing | Stream directly to disk with size limits |
| Process Timeout | Setting timeout after spawn, parent continues if child ignores signal | Escalate SIGTERM → SIGKILL, use tree-kill for entire process group |
| WebSocket Streaming | Buffering all stdout before sending | Stream line-by-line or chunk-by-chunk with backpressure |
| Temp Directory Creation | Reusing predictable paths (temp123) | Generate unique paths per request (crypto.randomUUID()) |
| Tool Installation | Running tools from /usr/local/bin shared with server | Isolate tool binaries in dedicated directory, verify checksums |
| Error Detection | Checking exit code only | Parse stdout/stderr for tool-specific error patterns |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unbounded concurrent executions | CPU pegged at 100%, high context switching | Limit to CPU core count, queue extras | >8-10 concurrent users |
| No process pooling for tools | Slow startup latency for every request | Pre-warm tool processes (if stateless) or optimize cold start | >50 requests/minute |
| Synchronous archive extraction | Event loop blocked, all requests stall | Use streaming extraction, worker threads, or child processes | Archives >1MB |
| In-memory result storage | Memory exhaustion, GC pauses | Stream results to client, don't buffer entirely | Results >10MB total |
| No stdout/stderr size limits | Memory exhaustion from verbose tools | Cap output size (1MB max), truncate/summarize | Tools with debug output |
| Polling for process completion | High CPU from poll loops | Use event-driven process.on('exit') callbacks | >10 concurrent processes |
| No connection pooling (if DB added) | Connection exhaustion, high latency | Use connection pool (pg-pool, mysql2/pool) | >100 requests/minute |
| Linear scan of active jobs | High CPU with many concurrent jobs | Use Map/Set for O(1) lookup, index by job ID | >100 concurrent jobs |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting filename extension for validation | Malicious files bypass checks (evil.exe renamed to evil.z3) | Validate content with magic bytes, not extension |
| Running tools with network access | Tools can exfiltrate data, download payloads | Block egress with iptables/seccomp, no network namespace |
| Reusing workspace directories | User A sees User B's files, cross-contamination | Unique directory per request, delete after completion |
| Logging sensitive file content | User IP addresses leak, file content exposed | Sanitize logs, log metadata only, not content |
| No input size validation before extraction | Zip bomb fills disk | Validate compressed size (<10MB) AND extraction ratio |
| Exposing tool version information | Attackers target known vulnerabilities | Don't expose versions in errors/headers, update regularly |
| Allowing arbitrary file names in workspace | Command injection via filenames with special chars | Sanitize/reject filenames with `$()`, backticks, semicolons |
| No rate limiting by IP | Single attacker can DOS portal | Implement per-IP rate limiting (express-rate-limit) |
| Trusting tool exit code | Tools may exit 0 on certain errors | Parse stdout/stderr for error keywords, don't rely solely on exit code |
| No CSRF protection for uploads | Attacker tricks user into uploading malicious file | Use CSRF tokens even for public portal (prevent clickjacking) |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No progress indicator for tool execution | Users don't know if portal is working or frozen | Stream "working..." updates, show spinner, estimated time |
| Cryptic tool error messages shown verbatim | Users don't understand formal verification terminology | Parse/translate errors to plain language, provide examples |
| No example inputs provided | Users don't know valid input format | Embed example projects for each tool, one-click load |
| Requiring exact file structure | Users struggle with zip structure requirements | Accept flat zips, nested zips, single files - normalize internally |
| No syntax highlighting in output | Hard to read verification results | Syntax highlight based on tool output format (ANSI codes) |
| Losing output on browser refresh | Users lose results if they navigate away | Store results server-side briefly (1 hour), provide shareable links |
| No timeout warnings | Tool times out suddenly with no warning | Show "still running..." after 10 seconds, warn before timeout |
| Generic "file too large" errors | Users don't know the limit or how to fix | Specific message: "File 5MB exceeds 1MB limit. Try smaller example." |
| No discoverability of available tools | Users don't know which tools are available | Clear tool selector with descriptions, logos, version info |
| Poor error recovery | Single error requires full page reload | Allow retry without re-uploading file |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **File Upload:** Often missing client-side size validation before upload - verify size checked in browser to save bandwidth
- [ ] **Archive Extraction:** Often missing nested archive depth limits - verify recursive extraction bounded
- [ ] **Tool Execution:** Often missing escalated kill (SIGTERM → SIGKILL) - verify zombie processes cleaned up
- [ ] **WebSocket Streaming:** Often missing disconnect cleanup - verify memory doesn't leak after client disconnects
- [ ] **Error Handling:** Often missing error classification (user vs system) - verify appropriate messages for each error type
- [ ] **Resource Limits:** Often missing cgroup enforcement - verify limits actually applied (test with resource bomb)
- [ ] **Temp Cleanup:** Often missing crash cleanup - verify workspaces deleted even on unexpected exit
- [ ] **Rate Limiting:** Often missing per-IP tracking - verify same IP can't bypass via multiple connections
- [ ] **Path Validation:** Often missing symlink resolution before check - verify resolved path validated
- [ ] **Tool Sandboxing:** Often missing seccomp/apparmor profiles - verify syscall restrictions enforced
- [ ] **Input Validation:** Often missing on backend even with frontend validation - verify server validates independently
- [ ] **Progress Feedback:** Often missing for slow operations - verify user sees activity indicators

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Zip bomb fills disk | MEDIUM | Kill extraction process, delete workspace, clear disk space, restore service |
| Path traversal writes to system | HIGH | Identify written files from logs, restore from backup, audit for persistence, patch extraction code |
| Process leak exhausts table | LOW | Kill orphaned processes (pkill), restart service if needed, add cleanup handlers |
| WebSocket memory leak | LOW | Restart service, memory released, add cleanup on disconnect |
| Resource exhaustion DOS | LOW | Kill runaway processes (identify via CPU/memory), reject new requests until recovered, add limits |
| Temp cleanup failure fills disk | LOW | Manual cleanup script (delete >1 hour old), schedule periodic cleanup cron |
| Malicious file exploits tool | HIGH | Isolate server, audit logs for exfiltration, restore from clean state, add sandboxing |
| Symlink attack modifies files | HIGH | Identify scope from logs, restore affected files, reject archives with symlinks |
| Connection pool exhaustion | LOW | Restart service, connections released, add connection limits |
| No graceful degradation crash | MEDIUM | Restart service, add circuit breakers and queue to prevent recurrence |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Zip bomb | Phase 1 (Upload/Extract) | Test with 42.zip, verify rejection under size/ratio limits |
| Path traversal | Phase 1 (Upload/Extract) | Test with archive containing ../../../etc/passwd, verify rejection |
| Symlink attack | Phase 1 (Upload/Extract) | Test with symlink archive, verify rejection or symlink skipping |
| Arbitrary code execution | Phase 2 (Tool Sandboxing) | Test with malicious input, verify sandboxing prevents escape |
| Resource exhaustion | Phase 2 (Tool Sandboxing) | Load test with 20 concurrent users, verify limits enforced |
| Process leaks | Phase 2 (Tool Sandboxing) | Kill parent process during execution, verify child cleaned up |
| Temp cleanup failures | Phase 2 (Tool Sandboxing) | Crash server during execution, verify workspaces cleaned on restart |
| WebSocket memory leak | Phase 3 (Streaming) | Connect/disconnect 1000 times, verify memory stable |
| Inadequate error context | Phase 4 (Error/UX) | Trigger each error type, verify user-friendly messages |
| No graceful degradation | Phase 4 (Error/UX) | Exceed capacity, verify queue/rejection instead of crash |

---

## Sources

### Critical Vulnerabilities (2026)
- [Critical n8n Vulnerability (CVSS 10.0) Allows Unauthenticated Attackers to Take Full Control](https://thehackernews.com/2026/01/critical-n8n-vulnerability-cvss-100.html)
- [Node.js Mitigating Denial-of-Service Vulnerability from Unrecoverable Stack Space Exhaustion](https://nodejs.org/en/blog/vulnerability/january-2026-dos-mitigation-async-hooks)
- [Critical Node.js Vulnerability Can Cause Server Crashes via async_hooks Stack Overflow](https://thehackernews.com/2026/01/critical-nodejs-vulnerability-can-cause.html)
- [Node.js January 13, 2026 Security Releases](https://nodejs.org/en/blog/vulnerability/december-2025-security-releases)

### Zip Bomb Attacks
- [What is a Zip Bomb? | Mimecast](https://www.mimecast.com/content/what-is-a-zip-bomb/)
- [Attacks with Zip Files and Mitigations - The Security Vault](https://thesecurityvault.com/attacks-with-zip-files-and-mitigations/)
- [File Upload - OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)

### Path Traversal Attacks
- [Binary ZIP extraction allows arbitrary file write via path traversal (Zip Slip) - pnpm Advisory](https://github.com/pnpm/pnpm/security/advisories/GHSA-6pfh-p556-v868)
- [Zip Slip, Path Traversal Vulnerability during File Decompression - ASEC](https://asec.ahnlab.com/en/89890/)
- [Securing ZIP File Operations: Understanding and Preventing Path Traversal Attacks](https://medium.com/@contactomyna/securing-zip-file-operations-understanding-and-preventing-path-traversal-attacks-74d79f696c46)
- [Zip Path Traversal | Security | Android Developers](https://developer.android.com/privacy-and-security/risks/zip-path-traversal)

### Symlink Attacks
- [CVE-2026-24046: Backstage has a Possible Symlink Path Traversal in Scaffolder Actions](https://advisories.gitlab.com/pkg/npm/@backstage/backend-defaults/CVE-2026-24046/)
- [CVE-2026-23745: node-tar Link Path File Write](https://www.miggo.io/vulnerability-database/cve/CVE-2026-23745)
- [Symlink Attacks: When File Operations Betray Your Trust](https://medium.com/@instatunnel/symlink-attacks-when-file-operations-betray-your-trust-986d5c761388)

### Process Isolation & Sandboxing
- [How to sandbox AI agents in 2026: MicroVMs, gVisor & isolation strategies](https://northflank.com/blog/how-to-sandbox-ai-agents)
- [Practical Security Guidance for Sandboxing Agentic Workflows and Managing Execution Risk](https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows-and-managing-execution-risk/)

### Process Management
- [5 Tips for Cleaning Orphaned Node.js Processes](https://medium.com/@arunangshudas/5-tips-for-cleaning-orphaned-node-js-processes-196ceaa6d85e)
- [What Is a Zombie Process and How to Avoid it When Spawning Node.js Child Processes](https://saturncloud.io/blog/what-is-a-zombie-process-and-how-to-avoid-it-when-spawning-nodejs-child-processes-on-cloud-foundry/)
- [Child process | Node.js v25.6.1 Documentation](https://nodejs.org/api/child_process.html)

### Temporary File Security
- [Node.js File System in Practice: A Production-Grade Guide for 2026](https://thelinuxcode.com/nodejs-file-system-in-practice-a-production-grade-guide-for-2026/)
- [Secure tempfiles in NodeJS without dependencies](https://advancedweb.hu/secure-tempfiles-in-nodejs-without-dependencies/)

### WebSocket & Streaming
- [Kubernetes 1.31: Streaming Transitions from SPDY to WebSockets](https://kubernetes.io/blog/2024/08/20/websockets-transition/)
- [Master Node.js stdin/stdout: Build Powerful CLIs](https://kitemetric.com/blogs/mastering-stdin-stdout-and-stderr-in-node-js-building-robust-cli-tools)

### Error Handling & UX
- [Graceful Failure: How Smart Error Handling Turns Crashes into Customer Trust](https://www.bettrsw.com/blogs/graceful-error-handling-software-failure-recovery-trust)
- [Graceful Degradation: Handling Errors Without Disrupting User Experience](https://medium.com/@satyendra.jaiswal/graceful-degradation-handling-errors-without-disrupting-user-experience-fd4947a24011)
- [6 things developer tools must have in 2026 to earn trust and adoption](https://evilmartians.com/chronicles/six-things-developer-tools-must-have-to-earn-trust-and-adoption)

### File Upload Best Practices
- [How to Build File Upload APIs with Express and Multer](https://oneuptime.com/blog/post/2026-01-27-express-multer-file-upload/view)
- [Multipart file uploads: Scaling large file transfers](https://uploadcare.com/blog/multipart-file-uploads-scaling-large-file-transfers/)

---

*Pitfalls research for: Hapyy Languages Web Portal*
*Researched: 2026-02-12*
