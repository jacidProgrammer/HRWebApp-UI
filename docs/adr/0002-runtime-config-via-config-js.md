# 0002. Runtime configuration through `/config.js`

- Status: accepted
- Date: 2026-09-21

## Context

The app needs the API URL, the Keycloak URL, realm and client id, and the auth mode. Vite inlines
`import.meta.env.VITE_*` at build time, so with build-time variables alone every environment needs its own
image, and the image that was tested isn't the one that is deployed.

## Considered options

1. Build-time `VITE_*` variables only, one build per environment.
2. Fetch a `config.json` at start-up before rendering.
3. A classic script, `/config.js`, that sets `window.__APP_CONFIG__`, written when the container starts.

## Decision

Option 3. `index.html` loads `config.js` (deferred, before the app's module script, so it has always run
first). In the Docker image, `docker/40-app-config.sh` runs from the nginx entrypoint and writes it from
`API_BASE_URL`, `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID` and `AUTH_MODE`, escaping values for a
JavaScript string. In development the file is empty and the `VITE_*` variables (or the defaults) apply.
Runtime values win over build-time ones (`src/config.ts`, unit-tested).

The same script writes the Content-Security-Policy for nginx, because `connect-src` must name exactly the
configured API and Keycloak origins.

A `config.json` fetch would work too, but it adds an asynchronous step before anything can render and needs
its own loading and error states. A script tag is synchronous from the app's point of view.

## Consequences

- One image runs in every environment; configuration is plain environment variables.
- `config.js` and `index.html` must never be cached (`Cache-Control: no-cache` in nginx).
- The configuration is public, by design: it contains URLs and a public client id, never secrets.
- Static hosting without a start-up hook (GitHub Pages) uses the empty file and build-time values.
