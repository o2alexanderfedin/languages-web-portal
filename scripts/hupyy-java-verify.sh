#!/bin/bash
set -euo pipefail

# Wrapper for Java FV CLI - bridges portal interface to Java FV command
# Interface: hupyy-java-verify --input <path>
# Invokes: java -jar /usr/local/lib/java-fv-cli.jar verify <path>

JAR_PATH="${JAVA_FV_JAR:-/usr/local/lib/java-fv-cli.jar}"
JAVA_BIN="${JAVA_HOME:+$JAVA_HOME/bin/}java"

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

# Execute Java FV CLI with verify command, passing individual files
# Output streams to stdout/stderr automatically (real-time for executionService)
# Exit code propagates naturally
exec "$JAVA_BIN" -jar "$JAR_PATH" verify "${JAVA_FILES[@]}"
