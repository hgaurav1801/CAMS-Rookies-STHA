# Phase 5 — Development and Integration Plan

> **Historical implementation baseline:** This document describes the original Phase 5 implementation and verification plan. The subsequent Phase 6 testing results are documented separately in `docs/phase6/PHASE6-TEST-CLOSURE.md`. Earlier pending-test statements are retained to preserve the chronological project record.


**Rookies → STHA | CAMS-DEV-001 | Implementation handoff (not an acceptance record)**

The implementation follows the locked Waterfall documents: CAMS-SRS-001 v1.0, CAMS-ANA-001/002 v1.0, CAMS-SDD-001 v1.0, and CAMS-UI-001 v1.0. Coding is performed against that baseline; major new behaviour requires change control.

| Section | Objective | Main files | Completion check |
|---|---|---|---|
| 5.1 | Prepare project and MySQL | `docker-compose.yml`, `api/sql/schema.sql` | Database opens; tables created |
| 5.2 | Configure server, security and seed | `api/.env`, `api/src/server.js`, `api/scripts/seed.js` | API health responds; staff sign in |
| 5.3 | Account/profile module M01–M02 | `api/src/lib/auth.js`, `api/src/routes/index.js`, `web/src/auth.jsx` | Student registers; RBAC protects staff |
| 5.4 | Course & application M03–M04 | `api/src/services/admissions.js`, `web/src/pages/Student.jsx` | Draft, edit, eligibility, submit |
| 5.5 | Files, review and status M05–M07 | `api/src/routes/index.js`, `web/src/pages/Admin.jsx` | Four files verified; legal transitions |
| 5.6 | Confirmation and reporting M08–M09 | `web/src/pages/Management.jsx`, API PDF and report endpoints | PDF for Approved only; management read-only |
| 5.7 | Interface integration | `web/src/pages`, `web/src/styles.css`, `web/src/App.jsx` | All 12 design screens accessible |
| 5.8 | Repository & integration review | Git, README, smoke script, records | Team reproduces demo and records results |

## Suggested ownership for four members

- **Member 1:** API integration, documentation controls, requirement review, coordinating Git merges.
- **Member 2:** React student/public screens and shared UI.
- **Member 3:** MySQL schema, authentication, application/document/review APIs, seed.
- **Member 4:** Staff and management UI, API smoke checks, user manual and test-record preparation.

All members inspect cross-module interfaces and participate in demonstration and testing.

## Actual execution evidence to collect

Record the actual date/time, machine, Git commit, setup command outputs, screens and errors. Evidence labels:

- DEV-E01 — Backend startup and `/api/health` response.
- DEV-E02 — Seeded courses and role accounts (do not expose passwords).
- DEV-E03 — Student registration/login/profile screenshot.
- DEV-E04 — Draft + submitted application screen.
- DEV-E05 — Document upload/verification screens.
- DEV-E06 — Administrator decision and the resulting status.
- DEV-E07 — PDF demo confirmation for an approved fictional applicant.
- DEV-E08 — Management dashboard populated from MySQL.
- DEV-E09 — Automated checks output and defect/issue record.

**Do not mark Phase 5 complete until these checks are executed in a running environment.** A source ZIP is not proof of end-to-end integration.
