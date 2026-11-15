# CAMS implementation traceability to SRS v1.0

> **Verification status update — 15 November 2026:** This document records the original SRS-to-implementation mapping and planned verification activities. Phase 6 testing was subsequently executed and internally closed. See `docs/phase6/PHASE6-TEST-CLOSURE.md` and `docs/portfolio/TESTING-EVIDENCE.md`. The original planned-verification column is retained as historical baseline information.


| SRS requirement | Implementation component | Verification to perform in Phase 6 |
|---|---|---|
| FR-01, FR-02 | `api/src/lib/auth.js`, `/api/auth/*`, `web/src/auth.jsx` | Student registration/login/role isolation |
| FR-03 | `api/src/routes/index.js` profile routes; `web/src/pages/Student.jsx` | Owner profile updates |
| FR-04, FR-05 | `courses` routes; `web/src/pages/Public.jsx`, `Admin.jsx` | Course listing, criteria, capacity checks |
| FR-06, FR-07 | Application create/patch; UNIQUE(student_id,cycle_id) | One application per cycle; edit-state restrictions |
| FR-08, FR-10 | `services/admissions.js`, submit endpoint | Field, subject, eligibility and document validation |
| FR-09 | Upload/list/download endpoints | Four file categories; type, size and ownership |
| FR-11 | Student status endpoint; status screen | State/reason visibility |
| FR-12, FR-13 | Admin queue, start-review | Only Submitted → Under Review |
| FR-14 | Document verification endpoint | Admin-only verification of file categories |
| FR-15, FR-16 | Correction request, student resubmit | Reason required; resubmission validates data |
| FR-17, FR-18 | Approval transaction with course row lock | Verified eligible case, last-seat collision test |
| FR-19 | Reject endpoint | Non-empty reason; terminal Rejected |
| FR-20 | PDF confirmation endpoint | Approved-only owner download |
| FR-21, FR-24 | Admin detail and `review_history` | Audit trail and authorised review access |
| FR-22 | `GET /api/management/reports` | Correct aggregates, read-only management |
| FR-23 | `needRole()`, `ownedApplication()`, private files | Deny unauthorised API and cross-student access |
| NFR-01 | Express API + MySQL pool | Measure p95 under prescribed demo conditions |
| NFR-02, NFR-08 | bcrypt, DB sessions, CSRF, RBAC, file checks | Negative security and privacy tests |
| NFR-03 | UNIQUE constraints, transactions, course locks | Duplicate, foreign-key and concurrent-seat tests |
| NFR-04, NFR-05 | Responsive React pages and validation | Usability, viewport and browser test |
| NFR-06 | Modular source + README | Rebuild and maintainability review |
| NFR-07 | MySQL data volume and backup instructions | Database export/restore rehearsal |

Status: **Implementation source written; integrated results pending execution**. Requirements and entity names are based on the locked academic design. Passing test evidence must be added only after observed execution.
