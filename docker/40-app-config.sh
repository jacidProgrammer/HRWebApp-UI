#!/bin/sh
# Writes /config.js from environment variables when the container starts, so one image can be deployed
# against any backend and Keycloak. Run by the nginx image's entrypoint (/docker-entrypoint.d/).
set -eu

TARGET="${APP_CONFIG_PATH:-/usr/share/nginx/html/config.js}"

# Escapes a value for a JavaScript string literal (backslashes, quotes, </script>).
js_string() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's#</#<\\/#g'
}

entry() {
  name="$1"
  value="$(printenv "$name" 2>/dev/null || true)"
  if [ -n "$value" ]; then
    printf '  %s: "%s",\n' "$name" "$(js_string "$value")"
  fi
}

{
  echo '// Generated at container start by 40-app-config.sh. Do not edit.'
  echo 'window.__APP_CONFIG__ = {'
  entry API_BASE_URL
  entry KEYCLOAK_URL
  entry KEYCLOAK_REALM
  entry KEYCLOAK_CLIENT_ID
  entry AUTH_MODE
  echo '};'
} > "$TARGET"

echo "40-app-config.sh: wrote $TARGET"
