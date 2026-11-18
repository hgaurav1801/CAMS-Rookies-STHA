# CAMS — Final Deployment and Manual Demonstration Record

**Document:** CAMS-DEP-001  
**Version:** 1.0 (internal record)  
**Record date:** 18 November 2026  
**Team:** Rookies  
**Simulated institution:** STHA  
**Public frontend:** https://cams-rookies-stha.vercel.app/  
**Repository:** https://github.com/hgaurav1801/CAMS-Rookies-STHA

## 1. Deployment structure

```text
Faculty / portfolio visitor
    |
    v
https://cams-rookies-stha.vercel.app
    |  React/Vite static frontend hosted on Vercel
    |  same-origin /api requests (including session cookies)
    v
Vercel rewrite /api/:path*
    |
    v
https://division-squeamish-envoy.ngrok-free.dev
    |  ngrok Free forwarding through HTTPS
    v
127.0.0.1:4000 on developer MacBook
    |  Node.js + Express API
    +--> MySQL 8.4 / Docker Desktop (127.0.0.1:3307)
    +--> Private local document-storage directory
```

The frontend is hosted on Vercel, while the API, database and private uploads remain on the local laptop. If the laptop is asleep/off, the tunnel is stopped, or ngrok limits are exceeded, API-dependent operations become unavailable. This is a temporary academic demonstration model and must not be described as independent, 24/7 production hosting.

## 2. Verification checkpoints

| ID | Check | Observed basis | Result |
|---|---|---|---|
| DEP-01 | MySQL container healthy | `docker compose ps`, 18 Nov | Pass |
| DEP-02 | Express API on 127.0.0.1:4000 | Terminal startup and local checks | Pass |
| DEP-03 | Fixed ngrok HTTPS hostname online | ngrok agent and public curl screenshots | Pass |
| DEP-04 | ngrok `/api/health` | HTTP 200 and `status: ok` | Pass |
| DEP-05 | ngrok `/api/courses` | HTTP 200 with three fictional courses | Pass |
| DEP-06 | Vercel `/api/health` through ngrok | HTTP 200 JSON, 18 Nov | Pass |
| DEP-07 | Vercel `/api/courses` through ngrok | HTTP 200 JSON, 18 Nov | Pass |
| DEP-08 | ngrok browser interstitial corrected | `web/src/api.js`, commit `dde4ff2`; course page reported loading | Pass (manual) |
| DEP-09 | Existing Student login | Reported successful in Chrome by project team | Pass (manual) |
| DEP-10 | Existing Admin login | Reported successful by project team | Pass (manual) |
| DEP-11 | Existing Management login | Reported successful by project team | Pass (manual) |

**Snapshot note:** At the 18 November API checkpoint, B.Tech CSE had 3 approved / 57 available, BCA 1 approved / 59 available, BBA 0 approved / 40 available. These are mutable demonstration data, not promised current totals.

## 3. Multi-device role workflow (project-team report)

The project team reported successful manual exercise of the following flows from the Vercel URL on 15–18 November 2026:

| Device | Role | Activity reported | Evidence qualification |
|---|---|---|---|
| Mobile phone | Student | Draft application created | Manual report, not a device screenshot in this file |
| iPad/tablet | Administrator | Admission reviewed and approved | Manual report, not a device screenshot in this file |
| Laptop | Management | Course-wise admission statistics reviewed | Manual report, not a device screenshot in this file |

This does not assert exhaustive mobile/tablet coverage of every internal page. The three landing-page captures RD-01 through RD-03 may be added to the responsive screenshot register when supplied. Never mark screenshots as captured before receiving the actual files.

## 4. Existing formal test evidence remains authoritative

- Phase 6 final unit regression: **31 passed; 0 failed**.
- ST-01 through ST-04 security regressions: passed in recorded test sessions.
- Recovery rehearsal: 9 tables and 12 private uploaded files restored to an isolated environment.
- Requirements-level case register: **21 evidenced, 16 partially evidenced, 5 open** (42 total). The new multi-device report does not retroactively close every partial or open case.
- Faculty/client acceptance and signatures: **not claimed**.

See [TESTING-EVIDENCE.md](TESTING-EVIDENCE.md), [EVIDENCE-INDEX.md](EVIDENCE-INDEX.md), and [public execution excerpts](../../evidence/public/PHASE6-EXECUTION-EXCERPTS.md).

## 5. Configuration and privacy boundaries

- `api/.env`, ngrok authtoken, database dumps and private uploaded documents are never committed.
- The publicly exposed ngrok API must contain **synthetic demonstration data only**.
- An ngrok authentication token was visible in a prior diagnostic screenshot: revoke/rotate it before further public sharing or interviews. Do not include the screenshot in GitHub.
- Production origin is `https://cams-rookies-stha.vercel.app`. Never commit authentication credentials.
- Keep the laptop awake and connected while presenting. Stop the tunnel after demonstrations.

## 6. Release record

| Git commit | Purpose |
|---|---|
| `b260dfd` | Initial full-stack application and Waterfall evidence |
| `99e474b` | SPA rewrite for Vercel |
| `3e410b7` | Initial Cloudflare tunnel API rewrite |
| `2d31237` | Reusable ngrok endpoint in Vercel rewrite |
| `dde4ff2` | ngrok browser-warning bypass header |

Later branding and documentation commits should be recorded here only after they are actually pushed.
