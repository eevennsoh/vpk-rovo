#!/usr/bin/env bash
# Download the twg binary and install skills (public distribution via Bifrost CDN).
#
# Usage:
#   bash <(curl -fsSL https://teamwork-graph.atlassian.com/cli/install)
#   bash <(curl -fsSL https://teamwork-graph.atlassian.com/cli/install) --version 0.3.2
#   bash <(curl -fsSL https://teamwork-graph.atlassian.com/cli/install) --skip-login
#   bash <(curl -fsSL https://teamwork-graph.atlassian.com/cli/install) --skip-skills
#
# Environment variables:
#   TWG_VERSION=0.5.0   Alternative to --version flag (e.g. for scripted installs)
set -euo pipefail

CDN_BASE_URL="${TWG_INSTALL_BASE_URL:-https://teamwork-graph.atlassian.com/cli}"
AGENT_INSTRUCTIONS_URL="${CDN_BASE_URL}/AGENTS.md"
# DTAC CloudFront routes /cli/* to twg-cli-cdn with originPath: /assets,
# so /cli/foo maps to /assets/foo on the twg-cli-cdn Bifrost consumer.
DEFAULT_VERSION="0.9.7"

# ---------------------------------------------------------------------------
# Parse flags
# ---------------------------------------------------------------------------
SKIP_DOWNLOAD=false
SKIP_LOGIN=false
SKIP_SKILLS=false
WAIT_FOR_PID=""
INSTALL_DIR_OVERRIDE=""
REQUESTED_VERSION="${TWG_VERSION:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-download)
      SKIP_DOWNLOAD=true
      shift
      ;;
    -y|--yes)
      # Backwards-compatible no-op for existing scripts. Setup consent is still
      # collected by twg unless it was already recorded.
      shift
      ;;
    --skip-login)
      SKIP_LOGIN=true
      shift
      ;;
    --skip-skills)
      SKIP_SKILLS=true
      shift
      ;;
    --wait-for-pid)
      if [[ $# -lt 2 ]]; then
        echo "Error: --wait-for-pid requires a value." >&2
        exit 2
      fi
      WAIT_FOR_PID="$2"
      shift 2
      ;;
    --wait-for-pid=*)
      WAIT_FOR_PID="${1#--wait-for-pid=}"
      shift
      ;;
    --install-dir)
      if [[ $# -lt 2 ]]; then
        echo "Error: --install-dir requires a value." >&2
        exit 2
      fi
      INSTALL_DIR_OVERRIDE="$2"
      shift 2
      ;;
    --install-dir=*)
      INSTALL_DIR_OVERRIDE="${1#--install-dir=}"
      if [[ -z "${INSTALL_DIR_OVERRIDE}" ]]; then
        echo "Error: --install-dir requires a value." >&2
        exit 2
      fi
      shift
      ;;
    --version)
      if [[ $# -lt 2 ]]; then
        echo "Error: --version requires a value." >&2
        exit 2
      fi
      REQUESTED_VERSION="$2"
      shift 2
      ;;
    --version=*)
      REQUESTED_VERSION="${1#--version=}"
      shift
      ;;
    *)
      echo "Error: unknown argument '$1'." >&2
      exit 2
      ;;
  esac
done

if [[ -n "${REQUESTED_VERSION}" ]]; then
  RELEASE_SELECTOR="version ${REQUESTED_VERSION}"
else
  REQUESTED_VERSION="${DEFAULT_VERSION}"
  RELEASE_SELECTOR="latest (v${DEFAULT_VERSION})"
fi

# ---------------------------------------------------------------------------
# Detect platform
# ---------------------------------------------------------------------------
OS="$(uname -s)"
ARCH="$(uname -m)"

case "${OS}" in
  Darwin) PLATFORM="darwin" ;;
  Linux)  PLATFORM="linux"  ;;
  *)
    echo "Error: unsupported OS '${OS}'. Only macOS and Linux are supported." >&2
    exit 1
    ;;
esac

case "${ARCH}" in
  arm64|aarch64) ARCH_SUFFIX="arm64" ;;
  x86_64)        ARCH_SUFFIX="x64"   ;;
  *)
    echo "Error: unsupported architecture '${ARCH}'. Only arm64 and x86_64 are supported." >&2
    exit 1
    ;;
esac

BINARY_NAME="twg-${PLATFORM}-${ARCH_SUFFIX}"
# Bifrost stores versioned binaries as twg-darwin-arm64-v0.3.2
VERSIONED_BINARY_NAME="${BINARY_NAME}-v${REQUESTED_VERSION}"

echo "Agent install instructions: ${AGENT_INSTRUCTIONS_URL}"

# ---------------------------------------------------------------------------
# Determine install directory
# ---------------------------------------------------------------------------
INSTALL_DIR="${INSTALL_DIR_OVERRIDE:-${HOME}/.local/bin}"
TWG_PATH="${INSTALL_DIR}/twg"
TWG_BIN_PATH="${INSTALL_DIR}/twg-bin"
CHECKSUMS_URL="${CDN_BASE_URL}/SHA256SUMS-v${REQUESTED_VERSION}"

write_twg_wrapper() {
  cat > "${TWG_PATH}" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for name in "${!BUN_@}"; do
  unset "$name"
done

exec "$SCRIPT_DIR/twg-bin" "$@"
EOF
  chmod 755 "${TWG_PATH}"
}

detect_shell_profile() {
  case "${SHELL:-}" in
    */zsh) echo "${HOME}/.zshrc" ;;
    */bash)
      if [[ -f "${HOME}/.bash_profile" ]]; then
        echo "${HOME}/.bash_profile"
      else
        echo "${HOME}/.bashrc"
      fi
      ;;
    *) echo "${HOME}/.zshrc" ;;
  esac
}

append_install_dir_to_path_profile() {
  SHELL_PROFILE="$(detect_shell_profile)"
  PATH_PROFILE_UPDATED=false
  PATH_PROFILE_SKIPPED=false

  if [[ -f "${SHELL_PROFILE}" ]] && grep -F "export PATH=\"${INSTALL_DIR}:\$PATH\"" "${SHELL_PROFILE}" >/dev/null 2>&1; then
    PATH_PROFILE_UPDATED=true
    return
  fi

  if {
    printf '\n'
    printf '# Added by Teamwork Graph CLI installer\n'
    printf 'export PATH="%s:$PATH"\n' "${INSTALL_DIR}"
  } >> "${SHELL_PROFILE}"; then
    PATH_PROFILE_UPDATED=true
  else
    PATH_PROFILE_SKIPPED=true
    echo "Warning: could not update ${SHELL_PROFILE}; continuing without a persistent PATH update." >&2
  fi
}

# ---------------------------------------------------------------------------
# Pre-flight: ensure curl is available when downloading
# ---------------------------------------------------------------------------
if [[ "${SKIP_DOWNLOAD}" != "true" ]] && ! command -v curl &>/dev/null; then
  echo "Error: 'curl' not found on PATH." >&2
  exit 127
fi

# ---------------------------------------------------------------------------
# Confirm installation
# ---------------------------------------------------------------------------
echo "Detected platform: ${PLATFORM}-${ARCH_SUFFIX}"
echo "Requested release: ${RELEASE_SELECTOR}"
echo "Will install twg to: ${TWG_PATH}"
echo ""
if [[ "${SKIP_DOWNLOAD}" == "true" ]]; then
  echo "Will reuse existing twg at: ${TWG_PATH}"
  echo ""
fi

# ---------------------------------------------------------------------------
# Download binary or reuse an existing one for local testing
# ---------------------------------------------------------------------------
mkdir -p "${INSTALL_DIR}"

if [[ -n "${WAIT_FOR_PID}" ]]; then
  while kill -0 "${WAIT_FOR_PID}" 2>/dev/null; do
    sleep 1
  done
fi

if [[ "${SKIP_DOWNLOAD}" == "true" ]]; then
  if [[ ! -x "${TWG_BIN_PATH}" && -x "${TWG_PATH}" ]]; then
    mv "${TWG_PATH}" "${TWG_BIN_PATH}"
  fi
  if [[ -x "${TWG_BIN_PATH}" ]]; then
    write_twg_wrapper
  fi
  if [[ ! -x "${TWG_PATH}" || ! -x "${TWG_BIN_PATH}" ]]; then
    echo "Error: --skip-download requires existing executables at ${TWG_PATH} and ${TWG_BIN_PATH}." >&2
    exit 126
  fi
  echo "Skipping download and reusing existing twg at ${TWG_PATH}"
else
  URL="${CDN_BASE_URL}/${VERSIONED_BINARY_NAME}"
  CHECKSUMS_PATH="$(mktemp "${TMPDIR:-/tmp}/twg-sha256sums.XXXXXX")"
  TWG_BIN_TMP=""   # initialise before trap so nounset (-u) doesn't fire if mktemp below fails
  trap 'rm -f "${CHECKSUMS_PATH}" "${TWG_BIN_TMP}"' EXIT
  # Clean up any stale temp files left by previously interrupted installs.
  rm -f "${INSTALL_DIR}"/.twg-bin.* 2>/dev/null || true
  # Download the binary to a temp file in the same directory as the destination
  # so that the final mv is atomic (same filesystem). Writing directly to the
  # destination would overwrite the existing binary in-place, which leaves stale
  # Gatekeeper/AppleSystemPolicy approval state on the inode and causes macOS to
  # block the new binary from running.
  TWG_BIN_TMP="$(mktemp "${INSTALL_DIR}/.twg-bin.XXXXXX")" || {
    echo "Error: could not create temporary file in ${INSTALL_DIR}. Check disk space and permissions." >&2
    exit 1
  }
  echo "Downloading ${URL} …"
  curl -fSL --retry 2 -o "${TWG_BIN_TMP}" "${URL}"
  echo "Downloading ${CHECKSUMS_URL} -> ${CHECKSUMS_PATH} …"
  curl -fSL --retry 2 -o "${CHECKSUMS_PATH}" "${CHECKSUMS_URL}"

  if [[ ! -s "${CHECKSUMS_PATH}" ]]; then
    echo "Error: checksum file is empty or download failed. Aborting." >&2
    exit 1
  fi

  expected_sha="$(awk -v file="${VERSIONED_BINARY_NAME}" '$2 == file { print $1 }' "${CHECKSUMS_PATH}")"
  if [[ -z "${expected_sha}" ]]; then
    echo "Error: checksum entry for ${VERSIONED_BINARY_NAME} not found in ${CHECKSUMS_URL}." >&2
    exit 1
  fi

  if command -v sha256sum &>/dev/null; then
    actual_sha="$(sha256sum "${TWG_BIN_TMP}" | awk '{print $1}')"
  elif command -v shasum &>/dev/null; then
    actual_sha="$(shasum -a 256 "${TWG_BIN_TMP}" | awk '{print $1}')"
  else
    echo "Error: neither sha256sum nor shasum is available to verify ${VERSIONED_BINARY_NAME}." >&2
    exit 127
  fi

  if [[ "${actual_sha}" != "${expected_sha}" ]]; then
    echo "Error: checksum verification failed for ${VERSIONED_BINARY_NAME}." >&2
    echo "Expected: ${expected_sha}" >&2
    echo "Actual:   ${actual_sha}" >&2
    exit 1
  fi

  chmod +x "${TWG_BIN_TMP}"
  if [ ! -x "${TWG_BIN_TMP}" ]; then
    echo "Error: could not make downloaded binary executable." >&2
    exit 126
  fi
  # Atomically replace the destination — mv on the same filesystem is a single
  # rename() syscall, so the old binary is never partially overwritten.
  mv "${TWG_BIN_TMP}" "${TWG_BIN_PATH}"
  TWG_BIN_TMP=""   # moved into place; trap's rm -f on empty string is a no-op
  write_twg_wrapper

  # On macOS, remove quarantine attribute added to downloaded files.
  if [[ "${OS}" == "Darwin" ]]; then
    xattr -d com.apple.quarantine "${TWG_PATH}" "${TWG_BIN_PATH}" 2>/dev/null || true
  fi

  echo "twg v${REQUESTED_VERSION} installed at ${TWG_PATH}"
fi

echo ""

# ---------------------------------------------------------------------------
# Ensure install dir is on PATH
# ---------------------------------------------------------------------------
PATH_ALREADY_SET=true
PATH_PROFILE_UPDATED=false
PATH_PROFILE_SKIPPED=false
SHELL_PROFILE=""
case ":${PATH}:" in
  *":${INSTALL_DIR}:"*) ;;
  *)
    PATH_ALREADY_SET=false
    export PATH="${INSTALL_DIR}:${PATH}"
    append_install_dir_to_path_profile
    ;;
esac

write_legacy_install_metadata() {
  local config_dir install_metadata_path
  config_dir="${HOME}/.twg"
  install_metadata_path="${config_dir}/install.json"
  mkdir -p "${config_dir}"
  cat > "${install_metadata_path}" <<EOF
{
  "installMethod": "direct-public-installer",
  "installChannel": "stable",
  "installDir": "${INSTALL_DIR}",
  "binaryPath": "${TWG_BIN_PATH}",
  "platform": "${PLATFORM}",
  "arch": "${ARCH_SUFFIX}",
  "installedVersion": "${REQUESTED_VERSION}",
  "installedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
}

refresh_help_cache() {
  local output cache_path
  echo "Refreshing TWG help cache..."
  if output="$("${TWG_PATH}" help --all --limit 1 --refresh-cache 2>/dev/null)"; then
    cache_path="$(printf '%s\n' "${output}" | sed -n 's/.*"path":"\([^"]*\)".*/\1/p' | head -n 1)"
    if [[ -n "${cache_path}" ]]; then
      echo "Refreshed TWG help cache: ${cache_path}"
    else
      echo "Refreshed TWG help cache."
    fi
  else
    echo "Skipped TWG help cache refresh." >&2
  fi
}

legacy_post_install() {
  write_legacy_install_metadata

  "${TWG_PATH}" consent --source direct-public-installer

  if [[ "${SKIP_SKILLS}" != "true" ]]; then
    "${TWG_PATH}" skills install --global --yes
  fi
  refresh_help_cache

  # skills install already replaces existing installs when run with --yes or after
  # interactive confirmation; no extra overwrite flag is required.

  LOGIN_FAILED=false
  if [[ "${SKIP_LOGIN}" != "true" ]]; then
    if { exec 3</dev/tty; } 2>/dev/null; then
      "${TWG_PATH}" login <&3 || LOGIN_FAILED=true
      exec 3<&-
    else
      echo "No interactive terminal detected; skipping installer login. Run 'twg login' after install." >&2
      LOGIN_FAILED=true
    fi
  fi
}

run_setup_finalize() {
  local finalize_args
  finalize_args=(
    setup finalize
    --install-method direct-public-installer
    --install-channel stable
    --install-dir "${INSTALL_DIR}"
    --binary-path "${TWG_BIN_PATH}"
    --installed-version "${REQUESTED_VERSION}"
    --platform "${PLATFORM}"
    --arch "${ARCH_SUFFIX}"
    --source direct-public-installer
    --skills-scope global
    --detect-agents
    --from-clipboard
    --allow-login-failure
  )
  if [[ "${SKIP_SKILLS}" == "true" ]]; then
    finalize_args+=(--skip-skills)
  fi
  if [[ "${SKIP_LOGIN}" == "true" ]]; then
    finalize_args+=(--skip-login)
  fi

  if "${TWG_PATH}" setup finalize --help >/dev/null 2>&1; then
    local finalize_status
    set +e
    "${TWG_PATH}" "${finalize_args[@]}"
    finalize_status=$?
    set -e
    if [[ "${finalize_status}" -eq 20 ]]; then
      LOGIN_FAILED=true
    elif [[ "${finalize_status}" -ne 0 ]]; then
      exit "${finalize_status}"
    fi
  else
    legacy_post_install
  fi
}

# ---------------------------------------------------------------------------
# Record install metadata, consent, skills, help cache and login
# ---------------------------------------------------------------------------
LOGIN_FAILED=false
run_setup_finalize

# ---------------------------------------------------------------------------
# Final summary — always shown last
# ---------------------------------------------------------------------------
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ Installed: ${TWG_PATH}"
echo ""
if [[ "${PATH_ALREADY_SET}" == "false" ]]; then
  if [[ "${PATH_PROFILE_UPDATED}" == "true" ]]; then
    echo "  ✅ Added ${INSTALL_DIR} to ${SHELL_PROFILE}"
    echo "  Open a new terminal to pick up the PATH update."
  elif [[ "${PATH_PROFILE_SKIPPED}" == "true" ]]; then
    echo "  ⚠️  ${INSTALL_DIR} was not added to your shell profile."
    echo "  twg is available inside this installer process only until your PATH is updated."
  fi
else
  echo "  ✅ ${INSTALL_DIR} is already in your PATH — you're all set!"
fi
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  twg doctor"
if [[ "${SKIP_LOGIN}" == "true" || "${LOGIN_FAILED}" == "true" ]]; then
  echo "  twg login                      # (skipped during install)"
fi
if [[ "${SKIP_SKILLS}" == "true" ]]; then
  echo "  twg skills install -g          # (skipped during install)"
fi
