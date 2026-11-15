# ROOKIES \| CAMS — Installation, User and Maintenance Guide

CAMS-HND-001 \| Phase 7.4 \| Working Draft v0.1 \| 14 November 2026  
Project: College Admission Management System (CAMS)  
Team: Rookies \| Simulated client: STHA \| Waterfall academic project

# DOCUMENT CONTROL

This is an operational handover guide for the locally tested CAMS demonstration. It is not a production-deployment standard, external-client acceptance certificate or permission to use real applicant information. Subject to final team and faculty review.

# 1\. PURPOSE AND AUDIENCE

This document supports three operational audiences: (i) the person installing the demonstration on a Mac; (ii) students, admissions administrators and management users participating in the demo; and (iii) team members maintaining the source code, database and evidence archive. The associated controlled baselines are CAMS-SRS-001, CAMS-SDD-001 and the Phase 6 closure report.

# 2\. SYSTEM OVERVIEW

Frontend: React and Vite. Backend: Node.js and Express. Database: MySQL 8.4 in Docker. Private uploaded documents: restricted server-side filesystem. Authentication: bcrypt password verification, server-managed HttpOnly sessions, CSRF tokens, role authorization and student ownership checks. The local demonstration is bound to loopback hosts. Use invented test identities only.

# 3\. INSTALLATION REQUIREMENTS

\- macOS with a supported Node.js release (at least 20.19 or a compatible 22+ version), npm and Docker Desktop with Compose.  
\- A clone or extracted copy of CAMS-Rookies-STHA. VS Code is recommended.  
\- Free local ports 3307 for the Docker MySQL mapping, 4000 for the API, and 5173 for the Vite frontend. If occupied, inspect existing processes and the repository configuration before changing ports.  
\- A private api/.env file prepared from api/.env.example. Do not publish credentials.

4\. ONE-TIME INSTALLATION ON MAC  
4.1 Open Docker Desktop and wait until it is ready.  
4.2 In Terminal, from the repository root:  
   docker compose up \-d db  
   docker compose ps  
Verify that the db service is healthy.  
4.3 For a fresh, empty demo database only, apply the schema as specified in the repository README:  
   docker compose exec \-T db sh \-c 'MYSQL\_PWD="\$MYSQL\_PASSWORD" mysql \-u"\$MYSQL\_USER" "\$MYSQL\_DATABASE"' \< api/sql/schema.sql  
Never execute schema reinitialisation on an existing database without first reviewing the file and taking a backup.  
4.4 Configure API:  
   cd api  
   cp .env.example .env  
Edit .env with actual local database settings and separate strong demonstration staff passwords; keep this file out of Git.  
4.5 Install dependencies and seed a fresh database:  
   npm install  
   npm run seed  
The seed establishes fictional course data, the admission cycle and configured staff accounts. Do not rerun seed indiscriminately against meaningful demo records.  
4.6 Start API in its own terminal:  
   npm run dev  
Expected: CAMS API ready at http\://127.0.0.1:4000  
4.7 In a second terminal:  
   cd CAMS-Rookies-STHA/web  
   npm install  
   npm run dev  
Open http\://127.0.0.1:5173. The host spelling matters for the local origin and proxy configuration.  
4.8 Smoke-check the API using:  
   curl http\://127.0.0.1:4000/api/health  
An OK response indicates the endpoint is accessible, not that all workflows have passed.

# 5\. DEMONSTRATION USERS AND ROLES

STUDENT: register from the portal, sign in, maintain their own profile, choose an eligible course, save a Draft, provide required supporting documents, submit, track a decision and download a confirmation after approval.  
ADMISSION ADMINISTRATOR: sign in with the private configured admin account, view and filter applications, begin review, inspect and verify uploaded documents, request correction or reject with a reason, approve only eligible and fully verified applications with remaining seats; manage fictional course eligibility and capacity.  
COLLEGE MANAGEMENT: sign in with the private management account, view admissions overview, course-wise reporting and seat utilization. Management is intentionally read-only and cannot perform review or course-edit operations.

# 6\. STUDENT USER PROCEDURE

6.1 Visit Explore courses. Compare Class XII threshold, required subjects and currently available seats.  
6.2 Register with a fictional email and strong password, then sign in.  
6.3 Open My profile and complete the required name, date of birth, telephone and address fields.  
6.4 Open Application form. Select a course, provide Class X/XII percentage values between 0 and 100 and choose studied subjects accurately. Save the Draft.  
6.5 Open Documents and upload the four required categories: PHOTO, CLASS\_X, CLASS\_XII and IDENTITY. Use a synthetic JPG/PNG image for PHOTO and accepted PDF/JPG/PNG content for the other categories. Each file must be at most 5 MiB.  
6.6 Submit the application. Confirm its status becomes Submitted and the form is read-only. If corrections are requested, read the recorded reason, amend permitted fields and resubmit.  
6.7 After an administrator approves the application, view Approved status and download the demonstration admission confirmation. The PDF is fictional and not an offer of real admission.  
6.8 Sign out when the demonstration is complete.

# 7\. ADMINISTRATOR USER PROCEDURE

7.1 Sign in as the seeded administrator.  
7.2 Open All applications, use the status filter if needed and select a Submitted record.  
7.3 Start review, inspect all supporting files and verify each one.  
7.4 Check eligibility rules and current seat availability. Approve only if all required conditions are satisfied. Approval creates a single confirmation and consumes one seat transactionally.  
7.5 For incorrect data or incomplete submissions, use Request correction and enter a meaningful reason; for terminal refusal, use Reject with a recorded reason. Do not bypass state restrictions.  
7.6 On Manage courses, review capacity and eligibility settings. This changes the fictional demo catalogue and may affect future submissions. Do not silently alter approved baselines in a formal submission.  
7.7 Confirm the application decision appears in the student portal and the management aggregate.

# 8\. MANAGEMENT USER PROCEDURE

8.1 Sign in using the separate management credentials.  
8.2 Open Admissions overview and confirm total, approved and under-review counts.  
8.3 Open Course-wise reports. Choose All courses or an individual course. Review applications, approved count, rejected count, in-review count, available seats and occupancy.  
8.4 Reports are read-only. To correct data, a permitted student/administrator workflow must update the underlying records, not a manual edit to the report.  
8.5 For the recorded 14 November 2026 integration checkpoint, course counts were B.Tech CSE 60 seats / 2 approved / 58 available, BBA 40 / 0 / 40 and BCA 60 / 1 / 59\. These numbers change when more demo applications are approved.

# 9\. VERIFICATION AND TESTING COMMANDS

From api/: npm run check; npm run test:logic; npm audit \--audit-level=moderate.  
From web/: npm run build; npm audit \--audit-level=moderate.  
The last recorded final regression reported 31 of 31 unit tests passing, successful API syntax and frontend build, and zero npm audit findings at that time. Integration tests may alter records: run destructive/state-changing fixtures only in the isolated cams\_phase6\_test database, not in the established demonstration database.  
The evidence directory evidence/phase6 contains the original logs; the local Phase 6 closure report describes tested scope and limitations. Passing tests do not mean penetration testing or real-institution certification.

# 10\. ROUTINE MAINTENANCE

10.1 Before changes: record current commit/version, review SRS change-control implications, stop state-changing scripts, and take a database plus private-uploads backup.  
10.2 To review changes: use Git status, pull only reviewed changes, reinstall dependencies when lockfiles change and rerun the relevant unit, integration, security and build checks.  
10.3 For backups: keep dated database dumps and a separately encrypted or access-restricted archive of api/storage/private outside a public repository. Backups may include private applicant data even in a demonstration.  
10.4 Recovery must first be rehearsed into an isolated, empty database and separate upload directory. The Phase 6 exercise restored 9 tables and 12 files, but did not prove byte-for-byte equality of every artifact.  
10.5 For operational checks, inspect the Docker db status, API health endpoint and process logs. Never expose raw database credentials, session cookies, CSRF tokens, upload contents or full .env files in screenshots or issue reports.

# 11\. TROUBLESHOOTING

\- API will not start: check Docker health, MySQL connection configuration and whether port 4000 is occupied.  
\- Browser cannot load: confirm the Vite server is running at 127.0.0.1:5173; inspect its terminal output.  
\- HTTP 400 on login: validate email syntax and password length. HTTP 401 with well-formed input usually means invalid credentials or no authenticated session.  
\- HTTP 403 on modification: review role authorization, CSRF token and permitted origin; do not bypass security checks.  
\- Cannot submit: finish the required profile, valid marks, course eligibility and all four document uploads.  
\- Cannot approve: application must be Under Review, required files verified, eligibility satisfied and a seat available.  
\- Old report totals: refresh after the relevant decision; verify directly against the correct database and admission cycle.  
\- Failed tests after an environment update: check the configured test credentials, sandbox DB name and server port. Do not change production data to make a test pass.

# 12\. REPOSITORY AND SHARING HYGIENE

Recommended public repository content: source files, dependency manifests/lockfiles, schema, safe example environment template, manuals, redacted evidence, conceptual diagrams and fictional demonstration screenshots.  
Never commit api/.env or secrets, real identity documents, private uploads, raw database dumps or files containing hashes/session tokens. Public Google Drive sharing is separate from GitHub visibility. The CAMS Drive folder contains the editable Google Docs baselines and the working A4 print master.

# 13\. KNOWN LIMITATIONS AND HANDOVER CHECKLIST

This is a local academic prototype, not a publicly deployed admissions platform. Unfinished or partly evidenced cases include full correction/resubmission and rejection paths, reference-load P95 timing, cross-browser/360-pixel verification and registration edge partitions; see the 42-case Phase 7.3 reconciliation.  
Before final handover, verify: full source backup; synchronized public-safe GitHub commit; public Viewer-only Drive settings if requested; readable Google Docs and PDF; current print master; checked member and faculty details; no private information in public assets; runnable start instructions; evidence manifest; recorded known limitations; and faculty acknowledgement if required.

# VERSION HISTORY

v0.1 — Initial Phase 7.4 operating-manual draft created from the CAMS implemented architecture, existing README, observed Phase 6 results and working documentation baseline. Awaiting final review.  
