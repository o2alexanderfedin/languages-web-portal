#!/bin/bash
set -euo pipefail

# Wrapper for Java FV CLI - bridges portal interface to Java FV command
# Interface: hupyy-java-verify --input <path>
# Invokes: java -jar /usr/local/lib/java-fv-cli.jar verify <path>

JAR_PATH="${JAVA_FV_JAR:-/usr/local/lib/java-fv-cli.jar}"

# Resolve Java binary:
# 1. Use JAVA_HOME if set and points to a valid java binary
# 2. Fall back to first Java 22+ installation found on common macOS paths
# (The java-fv CLI is compiled with Java 22 class file version 66.0)
if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
  JAVA_BIN="${JAVA_HOME}/bin/java"
else
  JAVA_BIN="java"
fi

# If the default java is Java < 22, find Java 22+
if "${JAVA_BIN}" -version 2>&1 | grep -qE 'version "([0-9]+)' ; then
  JAVA_VER=$("${JAVA_BIN}" -version 2>&1 | grep -oE '"[0-9]+' | head -1 | tr -d '"')
  if [[ "${JAVA_VER:-0}" -lt 22 ]]; then
    # Search common macOS Java 22+ installation paths
    for candidate in \
      /Library/Java/JavaVirtualMachines/jdk-22.jdk/Contents/Home/bin/java \
      /Library/Java/JavaVirtualMachines/jdk-23.jdk/Contents/Home/bin/java \
      /Library/Java/JavaVirtualMachines/jdk-24.jdk/Contents/Home/bin/java; do
      if [[ -x "$candidate" ]]; then
        JAVA_BIN="$candidate"
        break
      fi
    done
  fi
fi

# Parse arguments
if [[ "$#" -ne 2 ]] || [[ "$1" != "--input" ]]; then
  echo "Usage: hupyy-java-verify --input <projectPath>" >&2
  exit 1
fi

PROJECT_PATH="$2"

# Validate project path exists
if [[ ! -d "$PROJECT_PATH" ]]; then
  echo "Error: Project path does not exist: $PROJECT_PATH" >&2
  exit 1
fi

# Check for .java files
if ! find "$PROJECT_PATH" -name "*.java" -type f | grep -q .; then
  echo "Error: No .java files found in $PROJECT_PATH" >&2
  echo "Java verification requires at least one .java source file" >&2
  exit 1
fi

# Collect all .java files in project path
JAVA_FILES=()
while IFS= read -r -d '' file; do
  JAVA_FILES+=("$file")
done < <(find "$PROJECT_PATH" -name "*.java" -type f -print0)

# Build optional JVM system properties for solver configuration
JVM_ARGS=()
if [[ -n "${JAVA_FV_CVC5_PATH:-}" && -x "${JAVA_FV_CVC5_PATH}" ]]; then
  JVM_ARGS+=("-Dsolver.cvc5.path=${JAVA_FV_CVC5_PATH}")
fi

# Execute Java FV CLI with verify command, passing individual files
# Output streams to stdout/stderr automatically (real-time for executionService)
# Exit code propagates naturally
exec "$JAVA_BIN" "${JVM_ARGS[@]}" -jar "$JAR_PATH" verify "${JAVA_FILES[@]}"
