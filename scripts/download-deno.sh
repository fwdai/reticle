#!/usr/bin/env bash
set -euo pipefail

# Pin a specific version or override via env: DENO_VERSION=2.x.y bash scripts/download-deno.sh
DENO_VERSION="${DENO_VERSION:-$(curl -fsSL "https://api.github.com/repos/denoland/deno/releases/latest" | grep '"tag_name"' | sed 's/.*"v\([^"]*\)".*/\1/')}"

DEST="$(cd "$(dirname "$0")/.." && pwd)/src-tauri/binaries"
mkdir -p "$DEST"

download() {
  local triple="$1"
  local archive="$2"
  local inner="${3:-deno}"
  local out="deno-${triple}"
  [[ "$triple" == *windows* ]] && out="${out}.exe"

  if [[ -f "${DEST}/${out}" ]]; then
    echo "  skip  ${out} (already exists)"
    return
  fi

  local url="https://github.com/denoland/deno/releases/download/v${DENO_VERSION}/${archive}"
  local tmp
  tmp=$(mktemp -d)
  # shellcheck disable=SC2064
  trap "rm -rf '${tmp}'" RETURN

  echo "  fetch ${out} ..."
  curl -fsSL --progress-bar "${url}" -o "${tmp}/archive.zip"
  unzip -q "${tmp}/archive.zip" "${inner}" -d "${tmp}"
  mv "${tmp}/${inner}" "${DEST}/${out}"
  [[ "$triple" != *windows* ]] && chmod +x "${DEST}/${out}"
  echo "  done  ${out}"
}

echo "Downloading Deno v${DENO_VERSION} sidecars into src-tauri/binaries/ ..."
echo ""

download "aarch64-apple-darwin"     "deno-aarch64-apple-darwin.zip"
download "x86_64-apple-darwin"      "deno-x86_64-apple-darwin.zip"
download "x86_64-unknown-linux-gnu" "deno-x86_64-unknown-linux-gnu.zip"
download "x86_64-pc-windows-msvc"   "deno-x86_64-pc-windows-msvc.zip" "deno.exe"

echo ""
echo "All done. Run 'bun tauri build' to bundle."
