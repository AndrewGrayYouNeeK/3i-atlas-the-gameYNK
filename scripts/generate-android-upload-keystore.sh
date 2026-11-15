#!/usr/bin/env bash
# Generate a Play upload keystore locally and print base64 for GitHub secrets.
# NEVER commit the .jks / .keystore or the base64 file.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${ANDROID_KEYSTORE_OUT_DIR:-$ROOT/secrets}"
KEYSTORE_PATH="${ANDROID_KEYSTORE_PATH:-$OUT_DIR/atlas3i-upload.jks}"
ALIAS="${ANDROID_KEY_ALIAS:-atlas3i}"
VALIDITY_DAYS="${ANDROID_KEYSTORE_VALIDITY_DAYS:-10000}"
BASE64_OUT="${ANDROID_KEYSTORE_BASE64_OUT:-$OUT_DIR/atlas3i-upload.jks.base64.txt}"

mkdir -p "$(dirname "$KEYSTORE_PATH")"
mkdir -p "$(dirname "$BASE64_OUT")"

if [[ -f "$KEYSTORE_PATH" ]]; then
  echo "Refusing to overwrite existing keystore: $KEYSTORE_PATH" >&2
  echo "Delete it first, or set ANDROID_KEYSTORE_PATH to a new path." >&2
  exit 1
fi

if ! command -v keytool >/dev/null 2>&1; then
  echo "keytool not found. Install a JDK (e.g. OpenJDK 17+) and retry." >&2
  exit 1
fi

echo "Creating upload keystore at: $KEYSTORE_PATH"
echo "Alias: $ALIAS"
echo
echo "You will be prompted for keystore + key passwords (use strong unique values)."
echo "Remember them — they become ANDROID_KEYSTORE_PASSWORD / ANDROID_KEY_PASSWORD."
echo

keytool -genkeypair \
  -v \
  -storetype JKS \
  -keystore "$KEYSTORE_PATH" \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity "$VALIDITY_DAYS" \
  -dname "CN=3iAtlas The Game, OU=YouNeeK, O=YouNeeK, L=Unknown, ST=Unknown, C=US"

if command -v base64 >/dev/null 2>&1; then
  if base64 --help 2>&1 | grep -q -- '-w'; then
    base64 -w 0 "$KEYSTORE_PATH" > "$BASE64_OUT"
  else
    # macOS base64
    base64 -i "$KEYSTORE_PATH" > "$BASE64_OUT"
  fi
else
  echo "base64 command missing; keystore created but base64 file skipped." >&2
  exit 1
fi

# Restrict local secret files
chmod 600 "$KEYSTORE_PATH" "$BASE64_OUT" 2>/dev/null || true

cat <<EOF

Done.
  Keystore:     $KEYSTORE_PATH
  Base64 file:  $BASE64_OUT
  Alias:        $ALIAS

Add these GitHub repository secrets (Settings → Secrets and variables → Actions):
  ANDROID_KEYSTORE_BASE64   ← paste contents of the base64 file
  ANDROID_KEYSTORE_PASSWORD ← the store password you just entered
  ANDROID_KEY_ALIAS         ← $ALIAS
  ANDROID_KEY_PASSWORD      ← the key password you just entered

Keep $KEYSTORE_PATH and $BASE64_OUT outside git (both are gitignored under secrets/).
The first Play Console AAB upload must be done manually; CI can upload later
when PLAY_SERVICE_ACCOUNT_JSON is set (see docs/play-store/SETUP.md).
EOF
