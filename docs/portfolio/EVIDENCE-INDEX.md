
# CAMS — Software Engineering Evidence Index

**Project:** College Admission Management System (CAMS)  
**Development Team:** Rookies  
**Simulated Institution:** STHA  
**Project ID:** CAMS-2026-01  
**Development Model:** Waterfall  

## 1. Purpose

This index connects the implemented source code,
Software Engineering documentation, test cases
and recorded verification evidence.

The goal is to demonstrate how CAMS progressed
from requirements to a tested full-stack application.

## 2. Software Engineering Lifecycle

| Phase | Engineering activity | Reference |
|---|---|---|
| 0 | Project initiation and scope | Project Charter |
| 1 | Feasibility and project planning | Feasibility Study, Project Plan |
| 2 | Requirements engineering | SRS, Requirements Traceability Matrix |
| 3 | System analysis and modelling | DFDs, UML, ER Diagram |
| 4 | System and interface design | SDD, UI Design |
| 5 | Implementation and integration | Source Code, Implementation Records |
| 6 | Testing and quality assurance | Test Plan, Tests, Defect Register |
| 7 | Documentation and handover | Final Report, Manuals, Screenshots |

The controlled academic documentation is
maintained separately in the CAMS project archive.

## 3. Implementation Evidence

| Component | Source |
|---|---|
| Express API | `api/src/server.js` |
| API routes | `api/src/routes/index.js` |
| Authentication | `api/src/lib/auth.js` |
| Input validation | `api/src/lib/validation.js` |
| Business rules | `api/src/services/admissions.js` |
| Database access | `api/src/lib/db.js` |
| MySQL schema | `api/sql/schema.sql` |
| React frontend | `web/src/` |
| Frontend API client | `web/src/api.js` |

## 4. Unit Testing Evidence

Recorded final result:

- 31 tests executed
- 31 tests passed
- 0 tests failed

Test source files:

- `api/tests/admissions.test.js`
- `api/tests/admissions.boundary.test.js`
- `api/tests/validation-regression.test.js`

See [Testing Evidence](TESTING-EVIDENCE.md).

## 5. Integration Testing Evidence

Integration tests verify the communication
between the running API, database and modules.

Available test implementations include:

- Authentication and session testing
- Student application workflow
- Administrator review and approval
- Admission confirmation and reporting
- HTTP validation regression
- Database-backed security checks

Test source location:

`api/integration-tests/`

## 6. Security Evidence

| ID | Area | Recorded result |
|---|---|---|
| ST-01 | Authentication, session and CSRF | PASS |
| ST-02 | Role-based access control | PASS |
| ST-03 | Private document access | PASS |
| ST-04 | Concurrent approval protection | PASS |

Results refer to the recorded Phase 6
regression executions, not an independent
security assessment.

## 7. Defect Management Evidence

**Defect ID:** DEF-001

**Problem:** Blank Class X percentage
was initially accepted.

**Detection:** UT-22 failed.

**Correction:** Percentage validation was
modified to reject blank input.

**Verification:** Unit tests and HTTP
integration regression subsequently passed.

**Final recorded status:** CLOSED

This provides evidence of:

1. Defect detection
2. Root-cause analysis
3. Code correction
4. Regression testing
5. Defect closure

## 8. Database and Recovery Evidence

The recorded final demonstration checkpoint was:

- Total seat capacity: 160
- Approved admissions: 3
- Available seats: 157

The isolated recovery exercise restored:

- 9 database tables
- 12 uploaded files

The original development database was
not targeted during the recovery rehearsal.

## 9. Requirements-Level Test Coverage

| Status | Cases |
|---|---:|
| Evidenced | 21 |
| Partially evidenced | 16 |
| Open | 5 |
| Total | 42 |

These 42 requirement-level cases must not
be confused with the 31 passing unit tests.

## 10. Application Screenshots

Actual application screenshots are stored in:

`docs/phase7/screenshots/`

Files:

- J-01.jpg
- J-02.jpg
- J-03.jpg
- J-04.jpg
- J-05.jpg
- J-06.jpg
- J-07.jpg
- J-08.jpg
- J-09.jpg
- J-10.png

See the Phase 7 screenshot register
for the documented meaning of each image.

## 11. Reproducibility

Install dependencies and configure the local
demonstration environment as described in
the root README.

Run backend checks:

```bash
cd api
npm run check
npm run test:logic
npm audit --audit-level=moderate
```

Run frontend verification:

```bash
cd web
npm run build
npm audit --audit-level=moderate
```

Database-dependent tests require the API,
MySQL and appropriate synthetic credentials.

State-changing tests should use an isolated
test database.

## 12. Evidence Integrity

Original execution logs are maintained
in the private project evidence archive.

Some raw records may contain environmental
or application-specific information and
are deliberately excluded from public Git.

The public repository contains the test
implementations, verified-result summaries,
design references and approved screenshots.

No unexecuted test is represented as passed.

## 13. Verified hosted demonstration

- [Final Vercel, ngrok and multi-device verification record](FINAL-DEMO-VERIFICATION.md)
- [Three-terminal future demo guide](DEMO-STARTUP.md)
- [Three-device responsive capture register](RESPONSIVE-SCREENSHOT-REGISTER.md)
- [Android phone screenshot](responsive/RD-01-phone.jpg) · [iPad screenshot](responsive/RD-02-tablet.jpg) · [Desktop screenshot](responsive/RD-03-desktop.png)
- [Live Vercel frontend](https://cams-rookies-stha.vercel.app/)

The frontend is published independently; API requests require local MacBook services and a running ngrok tunnel. Verified checkpoints should not be confused with uninterrupted public backend uptime. Team-reported multi-device workflows are not formal faculty acceptance.

An 18 November 2026 API checkpoint returned **4 approved admissions (3 CSE, 1 BCA)** and **156 available seats**. The earlier 3-approved figure in Section 8 remains a correctly labelled historical snapshot; fixture counts can change.

## 14. Academic Scope

CAMS was developed to demonstrate:

- Requirements Engineering
- Software Analysis and Design
- Full-Stack Development
- Database Management
- Software Testing
- Security Verification
- Defect Management
- Documentation and Project Management

Rookies and STHA are simulated organizations.

The project is not a production-certified
institutional admissions service.
