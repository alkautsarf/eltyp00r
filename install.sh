#!/usr/bin/env sh
set -e

REPO="alkautsarf/eltyp00r"

# Detect OS
case "$(uname -s)" in
  Darwin) OS="darwin" ;;
  Linux)  OS="linux" ;;
  *)      echo "Unsupported OS: $(uname -s)" >&2; exit 1 ;;
esac

# Detect architecture
case "$(uname -m)" in
  arm64|aarch64) ARCH="arm64" ;;
  x86_64|amd64)  ARCH="x64" ;;
  *)             echo "Unsupported architecture: $(uname -m)" >&2; exit 1 ;;
esac

TARGET="${OS}-${ARCH}"

# Only supported combinations
case "$TARGET" in
  darwin-arm64|linux-x64) ;;
  *) echo "No prebuilt binary for ${TARGET}. Install from source instead:" >&2
     echo "  git clone https://github.com/${REPO}.git && cd eltyp00r && bun install && bun run src/index.tsx" >&2
     exit 1 ;;
esac

# Fetch latest tag
TAG=$(curl -sfL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | cut -d'"' -f4)
if [ -z "$TAG" ]; then
  echo "Failed to fetch latest release" >&2
  exit 1
fi

URL="https://github.com/${REPO}/releases/download/${TAG}/eltyp00r-${TAG}-${TARGET}.tar.gz"
BINARY="eltyp00r-${TARGET}"

echo "Installing eltyp00r ${TAG} (${TARGET})..."

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

curl -sfL "$URL" | tar xz -C "$WORK_DIR"

# Install to ~/.local/bin (no sudo) or /usr/local/bin
if [ -w "/usr/local/bin" ]; then
  INSTALL_DIR="/usr/local/bin"
else
  INSTALL_DIR="${HOME}/.local/bin"
  mkdir -p "$INSTALL_DIR"
fi

mv "$WORK_DIR/$BINARY" "$INSTALL_DIR/eltyp00r"
chmod +x "$INSTALL_DIR/eltyp00r"

echo "Installed eltyp00r to ${INSTALL_DIR}/eltyp00r"

if ! echo "$PATH" | tr ':' '\n' | grep -qx "$INSTALL_DIR"; then
  echo ""
  echo "Add ${INSTALL_DIR} to your PATH:"
  echo "  export PATH=\"${INSTALL_DIR}:\$PATH\""
fi
