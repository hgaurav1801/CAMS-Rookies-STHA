# CAMS — Three-Terminal Live Demonstration Guide

**Public website:** https://cams-rookies-stha.vercel.app/  
**Local backend port:** 4000  
**Reusable ngrok domain:** `https://division-squeamish-envoy.ngrok-free.dev`

This guide is for the academic demonstration architecture. It does not expose a production backend.

## Before you begin

Install Node.js 20.19+ or compatible 22+, Docker Desktop, ngrok 3.x and the repository's dependencies once. Ensure the existing `api/.env` contains the correct private DB credentials, `NODE_ENV=production`, and `APP_ORIGIN=https://cams-rookies-stha.vercel.app`. Preserve the existing MySQL volume; do **not** run `npm run seed`, schema imports, or restore scripts on the live demo database.

## Terminal 1 — Docker and database

```bash
open -a Docker
cd ~/Downloads/CAMS-Rookies-STHA
docker compose up -d db
docker compose ps
```

Wait for `Up (healthy)` on `cams-rookies-stha-db-1`. Docker Desktop can remain open in the background.

## Terminal 2 — Express API

```bash
cd ~/Downloads/CAMS-Rookies-STHA/api
npm run dev
```

Leave running. Expect `CAMS API ready at http://127.0.0.1:4000`.

## Terminal 3 — Stable HTTPS tunnel

```bash
ngrok http 4000 --url https://division-squeamish-envoy.ngrok-free.dev
```

Leave running. Expect session status online and forwarding to `http://localhost:4000`.

## Terminal 4 (optional) — Check live connectivity

```bash
curl -fsS http://127.0.0.1:4000/api/health
curl -fsS https://division-squeamish-envoy.ngrok-free.dev/api/health
curl -fsS https://cams-rookies-stha.vercel.app/api/health
curl -fsS https://cams-rookies-stha.vercel.app/api/courses
```

Now open https://cams-rookies-stha.vercel.app/ on an interviewer/faculty device. No Vite frontend server is needed for this route.

## Troubleshooting

| Symptom | First action |
|---|---|
| Docker not healthy | Open Docker Desktop, check `docker compose ps`, examine logs |
| Express refuses to start | Check `api/.env` privately, DB health and port 4000 |
| ngrok address refuses connections | Confirm ngrok session online and the assigned hostname |
| Vercel public catalogue fails | Check `/api/courses` in browser Network tab; keep ngrok running |
| HTML warning instead of JSON | Verify `web/src/api.js` includes `ngrok-skip-browser-warning` header; ensure latest Vercel build |
| Sign-in unexpectedly fails | Check `/api/me` response and secure session cookie via browser DevTools; do not share cookie/token |

### Stopping the demonstration

Press `Ctrl+C` in the Express and ngrok terminals. You may leave Docker Desktop running, or stop the DB *without deleting volumes* using `docker compose stop db` from the repository root.

### Offline backup for an interview

If Wi-Fi fails, run the same DB + Express locally, then `cd web && npm run dev` in a third terminal. Open `http://127.0.0.1:5173`. In this mode the Vite dev proxy must point to `127.0.0.1:4000`, and `APP_ORIGIN` should include the exact local frontend origin (or switch back temporarily for local testing). Keep a private copy of your final PDF and demo video as offline evidence.

### Security

Never publish `api/.env`, ngrok authtoken, live database backups or genuine identity documents. The ngrok hostname is reusable across restarts but is not guaranteed to remain available under all future ngrok account policies or usage limits.
