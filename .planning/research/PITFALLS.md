# Pitfalls Research

**Domain:** Web Portal for CLI Tool Execution on User-Uploaded Files
**Researched:** 2026-02-12 (general portal); 2026-02-20 (C# FV v1.3 addition)
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

## C# Formal Verification — v1.3 Pitfalls

The following pitfalls are specific to adding C# FV (Roslyn analyzer + `dotnet build`) to the existing portal. They supplement the general pitfalls above and are the primary concern for roadmap phases in v1.3.

---

### C# Pitfall 1: .NET SDK Docker Image Bloat — Hundreds of MB Added to Production Image

**What goes wrong:**
Adding `mcr.microsoft.com/dotnet/sdk` to the production stage balloons the final image by 600-900 MB. The SDK includes MSBuild, NuGet client, compilers, templates, and SDK tooling that are never needed at runtime. This inflates pull times, increases attack surface, and burns Digital Ocean bandwidth on every deploy.

**Why it happens:**
Developers copy the Java FV pattern (single JRE in production stage) but mistake "dotnet build must run at request time" for "SDK must be in production image." The C# FV tool invokes `dotnet build` on user-submitted C# projects at runtime — which genuinely requires the SDK — but the entire SDK is heavier than the Java runtime by 3-5x. The instinct is to treat this like JRE vs JDK when the difference is far more severe.

**How to avoid:**
- Accept that the SDK must be in the production stage (unlike Java FV where only JRE was needed): there is no build-time pre-compilation of user projects.
- Use `mcr.microsoft.com/dotnet/sdk:9.0-alpine` (Alpine-based) to minimize image size. Alpine SDK images are roughly 40-50% smaller than Debian-based variants.
- Do NOT add the full SDK in the existing `eclipse-temurin:25-jre-noble` stage. Add a new `dotnet-production` or keep C# execution in a separate sidecar if image size is a hard constraint.
- Use `mcr.microsoft.com/dotnet/sdk:9.0-alpine` as the base for a new C# stage, then copy only Node.js artifacts in from the existing node-builder stage. This reverses the current pattern (JRE as base, Node.js added on top).
- Accept ~350 MB compressed image size increase. This is unavoidable when `dotnet build` must run at request time.
- Benchmark: `mcr.microsoft.com/dotnet/sdk:9.0-alpine` compressed is ~210 MB vs `mcr.microsoft.com/dotnet/sdk:9.0` (Debian) ~400 MB.

**Warning signs:**
- Docker build produces an image >1.5 GB uncompressed
- `docker images` shows the production image grew by >800 MB after adding dotnet
- Pull time from registry exceeds 2 minutes on average connection

**Phase to address:**
Phase 1 (Docker Image + .NET SDK Integration) — Dockerfile architecture decision must be made first, before writing any other code. Wrong base image choice is expensive to undo.

---

### C# Pitfall 2: NuGet Global Package Cache Crossing Concurrent User Boundaries

**What goes wrong:**
Multiple concurrent `dotnet build` processes from different users share the same NuGet global package cache (default: `~/.nuget/packages` or `/root/.nuget/packages`). Race conditions in NuGet's plugins-cache directory cause file move operations to fail with access errors. Two builds restoring the same package version simultaneously corrupt the cache entry, causing random build failures for concurrent users.

**Why it happens:**
NuGet's `PluginCacheEntry.UpdateCacheFileAsync` is not concurrency-safe — specifically the file move operation has a known race condition (NuGet/Home #8129). With 5-20 concurrent portal users, each invoking `dotnet build`, the probability of collision is non-negligible. The Java FV tool does not use a shared package cache, so this problem has no Java analog.

**How to avoid:**
- Set `NUGET_PACKAGES` environment variable to a per-execution temp directory inside the user's isolated workspace: `export NUGET_PACKAGES=/tmp/workspace-<jobId>/.nuget`. This completely eliminates cross-user cache sharing.
- Set `DOTNET_NUGET_SIGNATURE_VERIFICATION=false` and `NUGET_HTTP_CACHE_PATH` similarly to avoid shared HTTP cache collisions.
- Pre-populate packages during Docker build (restore with known csproj before switching to non-root user). This seeds a read-only reference cache. At runtime, set `NUGET_PACKAGES` to a per-job writable copy, and point `--source` at the pre-populated cache for speed.
- In the wrapper script (`hupyy-csharp-verify`), export `NUGET_PACKAGES` before invoking `dotnet build`.
- Do NOT rely on the global cache for correctness: always test concurrent execution with 10+ simultaneous `dotnet build` processes before declaring the integration complete.

**Warning signs:**
- Intermittent build failures that succeed on retry (classic race condition signature)
- "Access to the path ... is denied" errors in NuGet restore output
- Build failures correlated with concurrent user count (fail under load, succeed alone)
- Errors containing "plugins-cache" in the path

**Phase to address:**
Phase 1 (Docker Image + Wrapper Script) — the wrapper script must set `NUGET_PACKAGES` on first implementation; retrofitting is error-prone.

---

### C# Pitfall 3: Non-Root User Cannot Write to Default NuGet Scratch Directory

**What goes wrong:**
The portal runs as `nodejs` (UID 1001), a non-root user. NuGet's restore process writes to `/tmp/NuGetScratch` (old behavior) and `$HOME/.nuget/packages` (current behavior). If the `nodejs` user has no writable `$HOME`, or `$HOME` is not set, `dotnet restore` (implicitly invoked by `dotnet build`) fails with permission errors. This is a known, recurring issue in the dotnet-docker repository (issue #78, #84).

**Why it happens:**
The current Dockerfile creates `nodejs` user with `-s /bin/false` (no shell). The user's `$HOME` is likely `/` or unset. When `dotnet build` invokes NuGet restore, it tries to create `$HOME/.nuget/packages`, which fails. The Java FV tool (a JAR) does not have this behavior — it does not write to the home directory. This is a new failure mode specific to the dotnet toolchain.

**How to avoid:**
- Create a dedicated home directory for `nodejs` user: `useradd -u 1001 -g nodejs -m -d /home/nodejs -s /bin/false nodejs`
- Or set `HOME` explicitly in the wrapper script: `export HOME=/home/nodejs`
- Set `NUGET_PACKAGES=/home/nodejs/.nuget/packages` (or per-job path as in Pitfall 2 above) and `chown` that directory to `nodejs` before switching users.
- Ensure `DOTNET_CLI_TELEMETRY_OPTOUT=1` and `DOTNET_NOLOGO=1` are set to prevent dotnet CLI from trying to write telemetry or first-run markers to `$HOME`.
- Test: run `dotnet build` as `nodejs` user in the container interactively and confirm no permission errors before integration.

**Warning signs:**
- `dotnet build` exits with code 1 and no useful output when run as `nodejs`
- Errors mentioning `/tmp/NuGetScratch` or `/.nuget/packages`
- Permission denied errors from NuGet during the restore phase
- Build succeeds as root in container but fails as `nodejs`

**Phase to address:**
Phase 1 (Docker Image + Wrapper Script) — must be verified in the Dockerfile before declaring the Docker stage complete.

---

### C# Pitfall 4: `dotnet build` Output Is MSBuild Format — Not Line-by-Line Streaming

**What goes wrong:**
Unlike `java -jar fv-cli.jar verify`, which streams results line-by-line to stdout in a predictable format, `dotnet build` emits MSBuild-formatted output. By default, build output interleaves project restore progress, compiler messages, and analyzer diagnostics in a non-linear order. Roslyn analyzer warnings and errors appear inline with compile output, not as a clean summary. The portal's streaming console shows raw MSBuild chatter, which is confusing to users.

**Why it happens:**
`dotnet build` uses MSBuild under the hood. MSBuild's default verbosity ("normal") includes project targets, restore steps, and compiler invocations — not just verification results. The portal's `executionService` streams all stdout/stderr via `subprocess.all`, which faithfully forwards this noise. There is no post-processing of MSBuild output before it reaches the SSE stream.

**How to avoid:**
- Run `dotnet build` with `-v:minimal` or `-v:quiet` verbosity to reduce noise: `dotnet build --verbosity minimal`
- Use `--nologo` to suppress the MSBuild header banner
- Use `-consoleLoggerParameters:Summary` to show only errors/warnings summary
- In the wrapper script, parse exit code: exit 0 = success, exit non-zero = failure. The exact diagnostics will already be in the streamed output.
- Do NOT attempt to parse MSBuild XML or structured log (`--binaryLogger`): adds complexity without benefit for a demo portal.
- Recommended command: `dotnet build --verbosity minimal --nologo --no-restore` (after an explicit `dotnet restore` step for cache priming) or `dotnet build --verbosity minimal --nologo` for simplicity.
- Accept that some MSBuild output is unavoidable; the streaming console is a developer-facing tool, not an end-user report.

**Warning signs:**
- Console shows 50+ lines of "Restore" and "Target" output before any verification result appears
- Users complain the output is "confusing" or looks like a build error even on success
- Verification results (Roslyn diagnostic messages) appear buried in the middle of unrelated build output

**Phase to address:**
Phase 2 (Wrapper Script + Output Parsing) — set verbosity in the initial wrapper script implementation; changing output format later breaks E2E tests that assert on console content.

---

### C# Pitfall 5: Roslyn Analyzer Diagnostics Appear as Warnings — Exit Code 0 Even on Verification Failure

**What goes wrong:**
The C# FV Roslyn analyzer reports formal verification contract violations as compiler warnings (severity `Warning`) by default. `dotnet build` exits with code 0 even when warnings exist. The portal's `executionService` uses exit code to determine `status: 'completed'` vs `status: 'failed'`. A verification failure that should show `failed` shows `completed` instead, silently misleading users.

**Why it happens:**
In Roslyn's analyzer severity model, `Warning` diagnostics do not cause build failure and do not affect exit code. Only `Error` severity diagnostics fail the build. The Java FV CLI was purpose-built for the portal and exits non-zero on verification failure. The Roslyn analyzer follows the standard MSBuild convention, which differs from the portal's assumptions.

**How to avoid:**
- Confirm with the C# FV tool team: do their Roslyn analyzer diagnostics use `Error` or `Warning` severity?
- If `Warning` severity is used, add `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` to the example project `.csproj` files, or pass `-warnaserror` to `dotnet build`. This makes exit code non-zero on any diagnostic.
- Alternatively, have the wrapper script parse stdout for known diagnostic patterns (e.g., `CSFV001`, `HUPYY`) and exit non-zero if found, regardless of `dotnet build` exit code.
- Do NOT rely on exit code alone to determine verification status — always also scan output for diagnostic patterns.
- Verify behavior: run `dotnet build` on a project with known violations and check exit code. If 0, implement one of the mitigations above.

**Warning signs:**
- Portal shows `status: 'completed'` for a C# project with known contract violations
- E2E tests for "verification failure" case always pass (green) regardless of input
- `dotnet build` output shows analyzer warnings but exits 0

**Phase to address:**
Phase 2 (Wrapper Script + Output Parsing) — must be caught in E2E test design; add a test case with a known-bad C# project and assert status is `failed`.

---

### C# Pitfall 6: `dotnet build` Timeout Is Too Short — First-Run NuGet Restore Takes 60-120 Seconds

**What goes wrong:**
The current `csharp-verification` tool config sets `maxExecutionTimeMs: 60000` (60 seconds). The first `dotnet build` invocation after container start triggers a full NuGet restore from the network (or pre-seeded cache). On a cold container, restore alone can take 30-90 seconds before compilation begins. The job times out during the restore phase, showing `status: 'timeout'` to the user, even though the tool is functioning correctly.

**Why it happens:**
60 seconds was chosen as a default for tools not yet implemented. The Java FV tool required 120 seconds and was explicitly adjusted. C# compilation + Roslyn analysis is similarly slow, compounded by NuGet restore. The `EXECUTION_LIMITS.maxTimeoutMs` constant is also capped at 60,000 ms, which prevents per-tool override above that threshold.

**How to avoid:**
- Set `maxExecutionTimeMs: 180000` (180 seconds) for `csharp-verification` in `toolRegistry.ts` — more than Java's 120 seconds to account for NuGet restore + compilation + analysis.
- Update `EXECUTION_LIMITS.maxTimeoutMs` to allow values above 60,000 ms, or remove the cap (it is not enforced in `executionService.ts`, only declared as a constant).
- In Docker build, pre-seed the NuGet package cache by running `dotnet restore` on a reference project during image build. This eliminates network latency at request time, reducing runtime to compile + analyze only (~30-60 seconds for small projects).
- Verify timing: measure actual `dotnet build` duration on example projects with warm cache in the container before setting the final timeout value.

**Warning signs:**
- E2E tests for C# verification consistently timeout
- Portal shows `status: 'timeout'` on first request after container start, succeeds on second request (warm cache)
- `dotnet build` in container takes >60 seconds on small projects

**Phase to address:**
Phase 1 (Docker Image configuration) for NuGet pre-seeding; Phase 2 (Wrapper Script) for timeout constant adjustment — both before E2E tests are written.

---

### C# Pitfall 7: Shared `obj/` and `bin/` Directories in Concurrent Builds Cause Corruption

**What goes wrong:**
Each user's C# project is extracted to an isolated directory (e.g., `/app/uploads/<jobId>/`). When `dotnet build` runs, it creates `obj/` and `bin/` subdirectories inside that project directory. Because each job has a unique directory, this is safe. However, if the wrapper script uses a hardcoded working directory (e.g., `/tmp/csharp-build`) instead of the per-job input path, concurrent builds write to the same `obj/` directory, causing `dotnet build` to fail with file locking errors or produce corrupted output.

**Why it happens:**
The wrapper script copies the Java FV pattern where the JAR operates on individual files passed as arguments. The `dotnet build` command operates on a project directory and writes `obj/` artifacts there. If the CWD is set incorrectly, or if the `.csproj` file is not in the input directory, `dotnet build` may default to a shared location.

**How to avoid:**
- The wrapper script must pass the project path directly: `dotnet build "$PROJECT_PATH" --output "$PROJECT_PATH/bin"`.
- Never set CWD to a fixed path in the wrapper; use `cd "$PROJECT_PATH"` before invoking `dotnet build`, or use `dotnet build "$PROJECT_PATH/MyProject.csproj"` explicitly.
- The `executionService` already sets `cwd: projectPath` in execa options — the wrapper script must respect this and not override it with a hardcoded path.
- Verify isolation: run 5 concurrent `dotnet build` calls on separate input directories and confirm no cross-contamination in `obj/` or `bin/`.

**Warning signs:**
- Random build failures under concurrent load that succeed in isolation
- "File is in use by another process" or locking errors from MSBuild
- `obj/` directory missing from some user outputs when concurrent builds ran

**Phase to address:**
Phase 2 (Wrapper Script) — validate isolation explicitly in the wrapper script implementation.

---

### C# Pitfall 8: Example C# Projects Must Include a `.csproj` — `dotnet build` Cannot Build Loose Files

**What goes wrong:**
The Java FV tool accepts a list of `.java` files directly (no project structure required). The wrapper script uses `find "$PROJECT_PATH" -name "*.java" -print0` and passes them as arguments. This pattern does not transfer to C#: `dotnet build` requires a `.csproj` (or `.sln`) file. If the example C# projects or user-uploaded zips contain only `.cs` files without a project file, `dotnet build` fails with "No project files found."

**Why it happens:**
Developers familiar with the Java FV integration assume C# works similarly. The Java model (pass individual source files) is architecturally different from the MSBuild model (project file defines build graph). Example projects created without a `.csproj` expose this assumption.

**How to avoid:**
- Every C# example project zip must contain a valid `.csproj` at its root.
- The wrapper script must validate that at least one `.csproj` exists in the input directory before invoking `dotnet build`, and emit a helpful error if not.
- User-facing error message: "C# verification requires a `.csproj` project file in your zip archive. See the example projects for reference."
- Do NOT try to auto-generate a `.csproj` from loose `.cs` files — this is fragile and unnecessary for a demo portal.
- When creating example projects, use `dotnet new console` or `dotnet new classlib` as the starting point, then add the Roslyn analyzer NuGet reference.

**Warning signs:**
- `dotnet build` exits with "MSBUILD : error MSB1003: Specify a project or solution file" in the output
- Users uploading `.cs`-only zips see cryptic MSBuild error instead of a helpful message
- Example projects load successfully in the portal but fail at the build step

**Phase to address:**
Phase 3 (Example C# Projects) — enforce `.csproj` presence check in wrapper script during Phase 2 before example projects are created.

---

### C# Pitfall 9: NuGet Restore Requires Internet Access — Container May Be Network-Restricted

**What goes wrong:**
If the production Docker container runs in a network-restricted environment (Digital Ocean firewall rules, no egress to `api.nuget.org`), `dotnet restore` fails with a network error. The build fails for every user. This is a deployment-time failure, not a development-time failure, making it easy to miss.

**Why it happens:**
During local development, the container has full network access. The Digital Ocean droplet may have egress restrictions or NuGet rate limiting. Unlike Java FV (where the JAR is bundled in the image), the C# FV tool depends on `dotnet restore` to download analyzer packages at request time unless packages are pre-seeded.

**How to avoid:**
- Pre-seed NuGet packages during Docker image build: copy example `.csproj` files into the image builder stage and run `dotnet restore` there, placing packages in a known location.
- At runtime, set `NUGET_PACKAGES` to point at the pre-seeded cache. Pass `--no-restore` to `dotnet build` if all required packages are pre-cached.
- Test the container with `--network=none` (Docker) to verify builds succeed without internet: `docker run --network=none <image> hupyy-csharp-verify --input /example`.
- If packages cannot be fully pre-seeded, add egress rules to allow `api.nuget.org` and `globalcdn.nuget.org` in the Digital Ocean firewall.

**Warning signs:**
- Builds succeed in development but fail in production with "Unable to resolve package" errors
- `dotnet restore` output shows connection timeout to `nuget.org`
- Builds succeed only on first deploy (warm cache from build) but fail after container restart

**Phase to address:**
Phase 1 (Docker Image) — the pre-seeding strategy must be implemented in the Dockerfile during initial setup, not added later as a fix.

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
| Shared NuGet cache across all users (C#) | Simpler setup, faster if no collision | Race conditions under concurrent load, random failures | Never - always use per-job NUGET_PACKAGES path |
| Full .NET SDK in production without pre-seeding | No build step complexity | 400+ MB avoidable image bloat, network-dependent builds | Never - pre-seed packages during Docker build |
| Using `dotnet build` exit code only for status (C#) | Simpler wrapper script | Silent verification failures when analyzer uses Warning severity | Never - also scan output for diagnostic patterns |

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
| dotnet build (C#) | Running as root, writing NuGet to /root/.nuget | Run as nodejs user, set NUGET_PACKAGES to per-job writable path |
| dotnet restore (C#) | Relying on network at request time | Pre-seed packages during Docker build, use --no-restore at runtime |
| MSBuild output (C#) | Treating all stdout as verification results | Use --verbosity minimal; scan for analyzer diagnostic codes specifically |
| .csproj discovery (C#) | Assuming loose .cs files work like .java files | Validate .csproj exists before invoking dotnet build, error helpfully if not |

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
| Cold NuGet restore per request (C#) | 60-90s first-request latency, timeout failures | Pre-seed NuGet cache in Docker build stage | Every request until cache warm |
| Shared NuGet global cache (C#) | Random failures under concurrent load | Per-job NUGET_PACKAGES environment variable | >3 concurrent C# builds |
| MSBuild normal verbosity (C#) | 10,000 output lines cap hit on normal builds | Use --verbosity minimal, reduces output by 80% | Any build with verbose target output |

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
| dotnet build writing to shared NuGet cache (C#) | Race conditions enabling cache poisoning | Per-job NUGET_PACKAGES path, never share cache between requests |
| Running dotnet as root in container (C#) | Full container compromise if dotnet exploited | Always run as nodejs user (UID 1001); HOME and NUGET_PACKAGES must be writable by that user |

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
| Raw MSBuild output shown to user (C#) | Confusing noise hides the verification result | Use --verbosity minimal; consider post-processing to highlight diagnostic lines |
| Missing .csproj shown as cryptic MSBuild error (C#) | User sees "MSB1003" with no guidance | Wrapper script detects missing .csproj and shows actionable error before invoking dotnet |

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
- [ ] **C# Docker Stage:** Often missing HOME directory for non-root user - verify `dotnet build` succeeds as `nodejs` user interactively
- [ ] **C# NuGet Isolation:** Often missing per-job NUGET_PACKAGES - verify concurrent builds do not share cache path
- [ ] **C# NuGet Pre-seeding:** Often missing offline build test - verify `docker run --network=none` succeeds for example projects
- [ ] **C# Timeout Config:** Often uses default 60s - verify `csharp-verification` entry in toolRegistry.ts has maxExecutionTimeMs >= 180000
- [ ] **C# Exit Code:** Often trusts exit code alone - verify wrapper script or E2E test catches Warning-severity violations
- [ ] **C# .csproj Check:** Often skipped in wrapper - verify wrapper emits helpful error when no .csproj found
- [ ] **C# Verbosity:** Often missing --verbosity minimal - verify build output does not hit 10,000 line cap on normal projects

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
| C# NuGet cache race condition | LOW | Set NUGET_PACKAGES per-job; restart container clears corrupted cache |
| C# non-root permission failure | LOW | Add HOME directory to Dockerfile; rebuild image; verify as nodejs user before deploy |
| C# timeout on cold NuGet restore | MEDIUM | Pre-seed packages in Docker build; rebuild image; increase timeout to 180s |
| C# silent verification failure (Warning severity) | MEDIUM | Add -warnaserror flag or output scanning in wrapper; re-run E2E suite |
| C# image size too large | MEDIUM | Switch to Alpine SDK base; rebuild; measure with docker images |

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
| C# SDK image bloat | Phase 1 (Docker Image) | `docker images` shows image <800 MB uncompressed; verify Alpine base used |
| C# NuGet cache race | Phase 1 (Wrapper Script) | Run 10 concurrent builds; verify zero failures from cache collision |
| C# non-root NuGet write | Phase 1 (Docker Image) | `docker run --user nodejs` and invoke dotnet build; verify no permission errors |
| C# MSBuild output noise | Phase 2 (Wrapper Script) | Verify --verbosity minimal used; output lines <200 for example project |
| C# silent verification failure | Phase 2 (Wrapper Script) | Run known-bad project; verify status is 'failed' not 'completed' |
| C# 60s timeout too short | Phase 1 (Config) + Phase 2 | toolRegistry.ts shows maxExecutionTimeMs: 180000; E2E tests pass without timeout |
| C# obj/bin isolation | Phase 2 (Wrapper Script) | 5 concurrent builds on separate inputs; verify no cross-contamination |
| C# missing .csproj | Phase 2 (Wrapper Script) | Upload .cs-only zip; verify helpful error message before dotnet invocation |
| C# network-dependent restore | Phase 1 (Docker Image) | `docker run --network=none` on example project; verify build succeeds |

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

### .NET Docker Image Optimization
- [Official .NET Docker images — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/net-core-net-framework-containers/official-net-docker-images)
- [.NET container images — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/core/docker/container-images)
- [Optimizing your .NET Core Docker image size with multi-stage builds](https://medium.com/@chrislewisdev/optimizing-your-net-core-docker-image-size-with-multi-stage-builds-778c577121d)
- [Containerize an app with Docker tutorial — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/core/docker/build-container)

### NuGet Cache and Concurrency
- [How to manage NuGet global packages, HTTP cache, temp folders — Microsoft Learn](https://learn.microsoft.com/en-us/nuget/consume-packages/managing-the-global-packages-and-cache-folders)
- [Writes to the plugins-cache directory are not concurrency-safe — NuGet/Home #8129](https://github.com/NuGet/Home/issues/8129)
- [dotnet restore fails for non-root user on 1.0.0-preview2-sdk — dotnet/dotnet-docker #78](https://github.com/dotnet/dotnet-docker/issues/78)
- [Reevaluate workaround for non-root user issue with NuGetScratch — dotnet/dotnet-docker #84](https://github.com/dotnet/dotnet-docker/issues/84)
- [Caching NuGet Packages Using --mount=type=cache Seems Broken — dotnet/dotnet-docker #3353](https://github.com/dotnet/dotnet-docker/issues/3353)
- [dotnet restore within a docker build hangs indefinitely — dotnet/dotnet-docker #5085](https://github.com/dotnet/dotnet-docker/issues/5085)

### MSBuild Output and Verbosity
- [dotnet build command — .NET CLI | Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-build)
- [MSBuild Output Verbosity Levels Explained](https://www.codestudy.net/blog/what-is-output-at-the-different-msbuild-output-verbosity-levels/)
- [Code analysis in .NET — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/overview)

### Roslyn Analyzer Severity and Exit Codes
- [Code analysis using Roslyn analyzers — Visual Studio | Microsoft Learn](https://learn.microsoft.com/en-us/visualstudio/code-quality/roslyn-analyzers-overview?view=visualstudio)
- [Compiler Options - errors and warnings — C# reference | Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-options/errors-warnings)
- [TreatWarningsAsErrors ignored when severity set in EditorConfig — dotnet/roslyn #43051](https://github.com/dotnet/roslyn/issues/43051)

---

*Pitfalls research for: Hapyy Languages Web Portal*
*General portal research: 2026-02-12*
*C# Formal Verification (v1.3) research: 2026-02-20*
