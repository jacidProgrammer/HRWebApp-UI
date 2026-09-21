#!/bin/sh
# Runs at container start, from the nginx image's entrypoint (/docker-entrypoint.d/), so one image can be
# deployed against any backend and Keycloak:
#   1. writes /config.js (window.__APP_CONFIG__) from environment variables;
#   2. writes the Content-Security-Policy (and, when ENABLE_HSTS=true, Strict-Transport-Security) for nginx,
#      allowing connections to exactly the configured API and Keycloak origins.
set -eu

TARGET="${APP_CONFIG_PATH:-/usr/share/nginx/html/config.js}"
HEADERS="${APP_HEADERS_PATH:-/etc/nginx/snippets/generated-headers.conf}"

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

# scheme://host[:port] of an http(s) URL, or nothing if the value isn't one. The result is also safe to
# put inside the nginx config (no quotes, spaces or semicolons can get through).
origin() {
  printf '%s' "$1" | sed -n -E 's#^(https?://[A-Za-z0-9.-]+(:[0-9]+)?|https?://\[[0-9A-Fa-f:.]+\](:[0-9]+)?)([/?#].*)?$#\1#p'
}

auth_mode="$(printf '%s' "${AUTH_MODE:-keycloak}" | tr '[:upper:]' '[:lower:]')"
connect="'self'"
form_action="'self'"
if [ "$auth_mode" != "mock" ]; then
  # Demo mode talks only to its own origin (the in-browser mock API); otherwise allow the API and Keycloak.
  for name in API_BASE_URL KEYCLOAK_URL; do
    value="$(printenv "$name" 2>/dev/null || true)"
    [ -n "$value" ] || continue
    allowed="$(origin "$value")"
    if [ -z "$allowed" ]; then
      echo "40-app-config.sh: $name is not an http(s) URL ('$value'); it is left out of the Content-Security-Policy" >&2
      continue
    fi
    case " $connect " in *" $allowed "*) ;; *) connect="$connect $allowed" ;; esac
    # keycloak-js can sign out with a form POST to Keycloak (logoutMethod: 'POST').
    if [ "$name" = KEYCLOAK_URL ]; then form_action="$form_action $allowed"; fi
  done
fi

# - script-src/style-src 'self': no inline scripts or <style> (index.html loads theme-init.js instead).
# - frame-src 'none': keycloak-js is initialised with checkLoginIframe: false and without silent check-sso,
#   so it never creates an iframe. Enabling either needs "frame-src <keycloak origin>" here.
# - worker-src 'self': the demo mode's service worker (mockServiceWorker.js).
csp="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src $connect; worker-src 'self'; manifest-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action $form_action; frame-ancestors 'none'"

mkdir -p "$(dirname "$HEADERS")"
{
  echo '# Generated at container start by 40-app-config.sh. Do not edit.'
  printf 'add_header Content-Security-Policy "%s" always;\n' "$csp"
  # Only behind HTTPS: browsers remember HSTS for max-age, so never send it from a plain-HTTP deployment.
  case "$(printf '%s' "${ENABLE_HSTS:-false}" | tr '[:upper:]' '[:lower:]')" in
    true | 1 | yes) echo 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;' ;;
  esac
} > "$HEADERS"
echo "40-app-config.sh: wrote $HEADERS (connect-src $connect)"
