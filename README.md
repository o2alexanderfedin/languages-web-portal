# Hupyy Languages Web Portal

Try Hupyy formal verification and transpiler tools in the browser — upload code, run it, see results.

## Prerequisites

Install these before anything else.

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 22+ | [nodejs.org](https://nodejs.org) or `brew install node` |
| .NET Runtime | 8.0 | [dotnet.microsoft.com](https://dotnet.microsoft.com/download/dotnet/8.0) |
| Java JDK | 21 | `brew install --cask temurin@21` |
| Z3 | any | `brew install z3` |
| CVC5 | 1.3.2 | See below |

### Installing CVC5

CVC5 1.3.2 is not in Homebrew — download the macOS static binary from GitHub releases:

1. Go to https://github.com/cvc5/cvc5/releases/tag/cvc5-1.3.2
2. Download `cvc5-macOS-arm64-static.zip` (Apple Silicon) or `cvc5-macOS-x86_64-static.zip` (Intel)
3. Unzip and place the `cvc5` binary in `~/bin/` (or any directory in your `$PATH`)
4. Make it executable: `chmod +x ~/bin/cvc5`
5. Verify: `cvc5 --version` should print `cvc5 version 1.3.2`

### Building cs-fv (C# Formal Verification CLI)

The C# FV tool requires the `cs-fv` CLI DLL to be published locally:

1. Clone the `cs-fv` repository (ask the team for access)
2. From the `cs-fv` root: `dotnet publish src/CsFv.Cli -c Release -r osx-arm64`
3. Note the output path: `src/CsFv.Cli/bin/Release/net8.0/publish/cs-fv.dll`

## One-Time Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd languages-web-portal
npm install
```

### 2. Configure environment variables

Copy the env template and fill in your local paths:

```bash
cp packages/server/.env.example packages/server/.env
```

Edit `packages/server/.env` — replace every `/path/to/...` placeholder with absolute paths on your machine:

| Variable | What it points to |
|----------|-------------------|
| `JAVA_HOME` | JDK 21 home directory (e.g. `/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home`) |
| `CSHARP_FV_CMD` | Wrapper script: `<repo>/scripts/hupyy-csharp-verify.sh` |
| `CS_FV_DLL` | Published cs-fv DLL path (from build step above) |
| `CVC5_PATH` | cvc5 binary (e.g. `~/bin/cvc5` or `/usr/local/bin/cvc5`) |

Make the wrapper script executable (one-time):

```bash
chmod +x scripts/hupyy-csharp-verify.sh
```

## Running Locally

```bash
npm run dev
```

This starts both services in one terminal:

```
[server] Listening on http://localhost:3000
[client] Local: http://localhost:5173
```

Open **http://localhost:5173** in your browser.

## Using the Portal

- **C# Formal Verification** — should show **Available**. Upload a `.zip` containing a C# project (with `.csproj` and `.cs` files), click Execute, and see real-time verification output stream in the browser.
- **Java Formal Verification** — will show **Unavailable** locally. The java-fv CLI jar is not built from source in this repo. This is expected.
- Other tools — available via Docker; see Docker section below (not required for C# FV).

## Project Structure

```
languages-web-portal/
├── packages/
│   ├── server/          # Express API (port 3000)
│   │   └── .env         # Machine-local env vars (gitignored — copy from .env.example)
│   └── client/          # React + Vite frontend (port 5173)
├── scripts/
│   └── hupyy-csharp-verify.sh   # C# FV wrapper script
├── e2e/                 # Playwright end-to-end tests
└── package.json         # Root workspace — `npm run dev` starts everything
```

## Running Tests

```bash
# Unit tests
npm test

# E2E tests (requires running portal)
npm run test:e2e

# E2E against Docker stack
npm run test:e2e:docker:up
```
