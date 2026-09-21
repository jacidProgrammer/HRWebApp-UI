# syntax=docker/dockerfile:1

# ---- Build: environment-independent static files ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime: nginx serves the SPA; /config.js and the CSP are generated from env vars at start ----
FROM nginx:1.29-alpine

# Runtime configuration (read by 40-app-config.sh). Empty values fall back to the app defaults.
# ENABLE_HSTS=true adds Strict-Transport-Security: only when the site is served over HTTPS.
ENV API_BASE_URL=http://localhost:8080 \
    KEYCLOAK_URL=http://localhost:8082 \
    KEYCLOAK_REALM=hr-realm \
    KEYCLOAK_CLIENT_ID=hr-api-login \
    AUTH_MODE=keycloak \
    ENABLE_HSTS=false

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY docker/nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --chmod=755 docker/40-app-config.sh /docker-entrypoint.d/40-app-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
# Generate the defaults once so the configuration can be validated at build time.
RUN /docker-entrypoint.d/40-app-config.sh && nginx -t

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
