# HRWebApp UI

React + TypeScript frontend (Vite) for [HRWebApp](https://github.com/jacidProgrammer/HRWebApp), the HR backend with Keycloak login and AI sentiment analysis of employee feedback.

> **Status: work in progress.** This repository only has the project setup so far (`package.json`, `index.html`, environment template). The application source (`src/`) has not been published yet.

## Planned stack

React 18, TypeScript, Vite, React Router, Axios, and `keycloak-js` for login against the backend's Keycloak realm.

## Configuration

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | HRWebApp API base URL |
| `VITE_KEYCLOAK_URL` | Keycloak server URL |
| `VITE_KEYCLOAK_REALM` | Realm imported by the backend (`hr-realm`) |
| `VITE_KEYCLOAK_CLIENT_ID` | Public client used for login |

## Scripts

```bash
npm install
npm run dev      # development server
npm run build    # type-check and production build
```
