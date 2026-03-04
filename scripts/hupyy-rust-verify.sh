#!/bin/bash
set -euo pipefail

# Wrapper for Rust FV - bridges portal interface to rust-fv driver
# Interface: hupyy-rust-verify --input <projectPath>
# Invokes: cargo-verify verify (with RUSTC set to rust-fv-driver)
#
# Required env vars (set in .env or Docker):
#   RUST_FV_DRIVER  - path to rust-fv-driver binary (default: /usr/local/bin/rust-fv-driver)
#   CARGO_VERIFY    - path to cargo-verify binary   (default: /usr/local/bin/cargo-verify)

RUST_FV_DRIVER="${RUST_FV_DRIVER:-/usr/local/bin/rust-fv-driver}"
CARGO_VERIFY="${CARGO_VERIFY:-/usr/local/bin/cargo-verify}"

# Resolve DYLD_LIBRARY_PATH so macOS dyld can find rustc_driver and other
# rustc-private dylibs linked by the rust-fv binaries.
# These libs live in the active rustup toolchain's sysroot/lib directory.
# If RUST_SYSROOT is explicitly set, use it; otherwise ask rustc (using the
# toolchain pinned by rust-toolchain.toml in the rust-fv project directory).
RUST_SYSROOT="${RUST_SYSROOT:-}"
if [[ -z "$RUST_SYSROOT" ]]; then
  RUST_FV_DIR="$(dirname "$(dirname "$(dirname "$RUST_FV_DRIVER")")")"  # …/rust-fv/target/debug/binary → …/rust-fv
  if [[ -f "$RUST_FV_DIR/rust-toolchain.toml" ]]; then
    RUST_SYSROOT=$(cd "$RUST_FV_DIR" && rustc --print sysroot 2>/dev/null) || RUST_SYSROOT=""
  fi
  if [[ -z "$RUST_SYSROOT" ]]; then
    RUST_SYSROOT=$(rustc --print sysroot 2>/dev/null) || RUST_SYSROOT=""
  fi
fi
if [[ -n "$RUST_SYSROOT" && -d "$RUST_SYSROOT/lib" ]]; then
  export DYLD_LIBRARY_PATH="$RUST_SYSROOT/lib${DYLD_LIBRARY_PATH:+:$DYLD_LIBRARY_PATH}"
fi

echo "=== hupyy-rust-verify ==="
echo "Working directory : $(pwd)"
echo "Script            : $(realpath "$0")"
echo "RUST_FV_DRIVER    : $RUST_FV_DRIVER"
echo "CARGO_VERIFY      : $CARGO_VERIFY"
echo "RUST_SYSROOT      : ${RUST_SYSROOT:-<not resolved>}"
echo "DYLD_LIBRARY_PATH : ${DYLD_LIBRARY_PATH:-<not set>}"
echo ""

# Parse arguments
if [[ "$#" -ne 2 ]] || [[ "$1" != "--input" ]]; then
  MSG="Usage: hupyy-rust-verify --input <projectPath>"
  echo "$MSG" >&2
  echo "$MSG" >&1
  exit 2
fi

PROJECT_PATH="$(realpath "$2")"
echo "Project path      : $PROJECT_PATH"
echo ""

# Validate project path exists
if [[ ! -d "$PROJECT_PATH" ]]; then
  MSG="Error: Project path does not exist: $PROJECT_PATH"
  echo "$MSG" >&2
  echo "$MSG" >&1
  exit 2
fi

# Pre-flight: check for Cargo.toml (Rust project manifest)
CARGO_TOML="$PROJECT_PATH/Cargo.toml"
if [[ ! -f "$CARGO_TOML" ]]; then
  MSG1="Error: No Cargo.toml found in $PROJECT_PATH"
  MSG2="Rust verification requires a Cargo.toml project file"
  echo "$MSG1" >&2; echo "$MSG1" >&1
  echo "$MSG2" >&2; echo "$MSG2" >&1
  exit 2
fi
echo "Found Cargo.toml  : $CARGO_TOML"

# Pre-flight: check for .rs source files
RS_COUNT=$(find "$PROJECT_PATH" -name "*.rs" -not -path "*/target/*" -type f | wc -l | tr -d ' ')
if [[ "$RS_COUNT" -eq 0 ]]; then
  MSG1="Error: No .rs files found in $PROJECT_PATH"
  MSG2="Rust verification requires at least one .rs source file"
  echo "$MSG1" >&2; echo "$MSG1" >&1
  echo "$MSG2" >&2; echo "$MSG2" >&1
  exit 2
fi
echo "Found .rs files   : $RS_COUNT"
echo ""

# Run cargo verify from within the project directory.
# cargo-verify sets RUSTC=<rust-fv-driver path> and runs cargo check internally.
echo "Command: RUSTC=$RUST_FV_DRIVER $CARGO_VERIFY verify"
echo ""

# 2>&1 merges stderr into stdout for portal SSE streaming
cd "$PROJECT_PATH"
RUSTC="$RUST_FV_DRIVER" "$CARGO_VERIFY" verify 2>&1
EXIT_CODE=$?

echo ""
echo "=== Verification complete (exit $EXIT_CODE) ==="
exit $EXIT_CODE
