#!/bin/bash
set -euo pipefail

# Wrapper for Java FV CLI - bridges portal interface to Java FV command
# Interface: hupyy-java-verify --input <path>
# Invokes: java -jar /usr/local/lib/java-fv-cli.jar verify <path>

JAR_PATH="/usr/local/lib/java-fv-cli.jar"

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

# Execute Java FV CLI with verify command
# Output streams to stdout/stderr automatically (real-time for executionService)
# Exit code propagates naturally
exec java -jar "$JAR_PATH" verify "$PROJECT_PATH"
