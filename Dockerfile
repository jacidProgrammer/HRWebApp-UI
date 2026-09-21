# syntax=docker/dockerfile:1

# ---- Build: environment-independent static files ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime: nginx serves the SPA; /config.js is generated from env vars at start ----
FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/40-app-config.sh /docker-entrypoint.d/40-app-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
RUN chmod +x /docker-entrypoint.d/40-app-config.sh

# Runtime configuration (read by 40-app-config.sh). Empty values fall back to the app defaults.
ENV API_BASE_URL=http://localhost:8080 \
    KEYCLOAK_URL=http://localhost:8082 \
    KEYCLOAK_REALM=hr-realm \
    KEYCLOAK_CLIENT_ID=hr-api-login \
    AUTH_MODE=keycloak

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
