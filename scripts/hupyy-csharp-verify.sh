#!/bin/bash
set -euo pipefail

# Wrapper for C# FV CLI - bridges portal interface to cs-fv command
# Interface: hupyy-csharp-verify --input <projectPath>
# Invokes: dotnet cs-fv.dll verify <cs-file> for each .cs file found

DOTNET_BIN="${DOTNET_CMD:-dotnet}"
CS_FV_DLL="${CS_FV_DLL:-/usr/local/lib/cs-fv/cs-fv.dll}"

# Parse arguments
if [[ "$#" -ne 2 ]] || [[ "$1" != "--input" ]]; then
  MSG="Usage: hupyy-csharp-verify --input <projectPath>"
  echo "$MSG" >&2
  echo "$MSG" >&1
  exit 2
fi

PROJECT_PATH="$2"

# Validate project path exists
if [[ ! -d "$PROJECT_PATH" ]]; then
  MSG="Error: Project path does not exist: $PROJECT_PATH"
  echo "$MSG" >&2
  echo "$MSG" >&1
  exit 2
fi

# Pre-flight: check for .csproj file (SDK-style projects require project file)
CSPROJ_COUNT=$(find "$PROJECT_PATH" -name "*.csproj" -not -path "*/bin/*" -not -path "*/obj/*" -type f | wc -l)
if [[ "$CSPROJ_COUNT" -eq 0 ]]; then
  MSG1="Error: No .csproj file found in $PROJECT_PATH"
  MSG2="C# verification requires a .csproj project file"
  echo "$MSG1" >&2; echo "$MSG1" >&1
  echo "$MSG2" >&2; echo "$MSG2" >&1
  exit 2
fi

# Collect .cs files scoped to each .csproj directory
# SDK-style .csproj files use implicit globbing — locate each .csproj,
# treat its containing directory as the project root, collect all .cs files
# under that root (excluding bin/ obj/). Respects .csproj project boundaries.
CS_FILES=()
while IFS= read -r -d '' csproj; do
  PROJ_DIR="$(dirname "$csproj")"
  while IFS= read -r -d '' file; do
    CS_FILES+=("$file")
  done < <(find "$PROJ_DIR" -name "*.cs" \
    -not -path "*/bin/*" \
    -not -path "*/obj/*" \
    -type f -print0)
done < <(find "$PROJECT_PATH" -name "*.csproj" \
  -not -path "*/bin/*" \
  -not -path "*/obj/*" \
  -type f -print0)

# Pre-flight: check for .cs source files
if [[ ${#CS_FILES[@]} -eq 0 ]]; then
  MSG1="Error: No .cs files found in $PROJECT_PATH"
  MSG2="C# verification requires at least one .cs source file"
  echo "$MSG1" >&2; echo "$MSG1" >&1
  echo "$MSG2" >&2; echo "$MSG2" >&1
  exit 2
fi

# Build optional --cvc5-path argument from CVC5_PATH env var
CVC5_ARGS=()
if [[ -n "${CVC5_PATH:-}" && -x "${CVC5_PATH}" ]]; then
  CVC5_ARGS=(--cvc5-path "$CVC5_PATH")
fi

# Run cs-fv verify for each .cs file
# 2>&1 merges cs-fv stderr into stdout for portal SSE streaming
OVERALL_EXIT=0
for cs_file in "${CS_FILES[@]}"; do
  "$DOTNET_BIN" "$CS_FV_DLL" verify "$cs_file" "${CVC5_ARGS[@]}" 2>&1 || OVERALL_EXIT=$?
done

exit $OVERALL_EXIT
