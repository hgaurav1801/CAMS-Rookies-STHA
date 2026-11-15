# CAMS — Phase 7.3 Test Evidence Reconciliation

Document ID: CAMS-P7-EVID-001
Version: 0.3 (working, not a faculty acceptance record)
Date: 14 November 2026
Prepared by: Rookies
Simulated Client: STHA
Canonical print master: https://docs.google.com/document/d/1KkOLF6WXGcpoH2j88lyV0NrzIYIgvi5cXrGFAwjHaKc/edit

This text is synchronized from the native Google Docs appendices. EVIDENCED is an evidence classification, not a separate test-run claim.


## APPENDIX H — PHASE 6 EXECUTION EVIDENCE AND CASE-LEVEL RECONCILIATION

### H.1 Evidence classification and audit method

The 42 entries below are reconciled against the approved CAMS-TCS-001 case identifiers and the observed Phase 6 terminal/SQL screenshots and closure report. EVIDENCED means the essential behaviour appears in recorded output; PARTIAL means only some acceptance points were observed; OPEN means the named case has no direct execution evidence in the currently reviewed records. These are internal evidence dispositions, not an independent audit and not 42 case passes. The historical Google Doc's NOT RUN fields remain a valid record of its earlier edition.


### H.2 Summary: 21 evidenced; 16 partial; 5 open (42 planned cases)

Directly recorded suites: 31 of 31 Node unit tests; IT-06 session 5 of 5; IT-07 student workflow; IT-08 administrator approval; IT-09 PDF/report reconciliation; IT-10 blank-marks HTTP regression; ST-01 session and CSRF; ST-02 RBAC; ST-03 document access; ST-04 concurrent approval; database restoration rehearsal; and final build/audit checks. Each composite suite may represent multiple checkpoints, not one run per original TC.


### H.3 Functional test case dispositions (TC-FR-01 through TC-FR-24)

- TC-FR-01: PARTIAL  |  IT-07 student creation  |  Duplicate-email registration and invalid-field partitions need direct case evidence.
- TC-FR-02: EVIDENCED  |  IT-06; ST-01; ST-02  |  Role sessions, invalid credentials, logout and old-session denial recorded.
- TC-FR-03: PARTIAL  |  IT-07; ST-02  |  Profile persisted; direct cross-student profile update needs a dedicated assertion.
- TC-FR-04: PARTIAL  |  Admin course UI screenshots  |  Course form shown; negative capacity/below-approved tests lack a recorded outcome.
- TC-FR-05: EVIDENCED  |  IT-02; IT-09 final reconciliation  |  Catalogue counts matched direct SQL.
- TC-FR-06: EVIDENCED  |  IT-07B  |  Duplicate same-cycle application rejected.
- TC-FR-07: EVIDENCED  |  IT-07D; UT-15/16  |  Submitted edit refused and guard unit cases passed.
- TC-FR-08: PARTIAL  |  UT-01-05, 09-14, 22-26; IT-10  |  Blank/whitespace marks and eligibility tested; full input matrix not recorded.
- TC-FR-09: PARTIAL  |  IT-07C; ST-03  |  Four document categories persisted; oversized-file boundary still unchecked.
- TC-FR-10: EVIDENCED  |  IT-07D; student DB check  |  Submission and stored Submitted status recorded.
- TC-FR-11: PARTIAL  |  IT-09A; UI status capture  |  Owner status demonstrated; correction/rejection reason visibility lacks case evidence.
- TC-FR-12: PARTIAL  |  IT-08A; admin UI  |  Queue access shown; all filter combinations unverified.
- TC-FR-13: EVIDENCED  |  IT-08C; admin DB check  |  Submitted to Under Review transition recorded.
- TC-FR-14: EVIDENCED  |  IT-08E; admin DB check  |  Four verified documents persisted.
- TC-FR-15: PARTIAL  |  UT reason/schema and admin UI  |  Request-correction HTTP transition and persisted reason not separately shown.
- TC-FR-16: OPEN  |  No direct test log  |  Correction Required to Submitted resubmission needs execution.
- TC-FR-17: EVIDENCED  |  IT-08D/F; UT-17-21  |  Review prerequisites and successful approval observed.
- TC-FR-18: EVIDENCED  |  ST-04; IT-08G  |  One successful competing approval; no overallocation.
- TC-FR-19: OPEN  |  No direct rejection-workflow log  |  Reason-required terminal rejection needs HTTP and SQL check.
- TC-FR-20: EVIDENCED  |  IT-09B/C; confirmation PDF  |  Owner-only PDF downloaded and visually inspected.
- TC-FR-21: EVIDENCED  |  IT-08A/H; admin review screenshots  |  Authorised detail, restriction and history checks recorded.
- TC-FR-22: EVIDENCED  |  IT-09D/E; IT-09 final  |  Read-only report and SQL aggregate match verified.
- TC-FR-23: EVIDENCED  |  ST-02; ST-03  |  Backend role/ownership denial and private files tested.
- TC-FR-24: EVIDENCED  |  IT-08H; admin DB check  |  Review-history row count and transitions checked.

### H.4 Non-functional test case dispositions (TC-NFR-01 through TC-NFR-08)

- TC-NFR-01: OPEN  |  No reference workload measurements  |  Five concurrent users, <=500 applications, P95 <3 s is unverified.
- TC-NFR-02: EVIDENCED  |  ST-01; ST-02; password hash source  |  Session, CSRF and RBAC regression recorded; not a penetration test.
- TC-NFR-03: EVIDENCED  |  IT-07B; ST-04  |  Duplicate constraints and concurrent seat guard tested.
- TC-NFR-04: PARTIAL  |  Real UI screenshots  |  Visible labels/statuses shown; formal usability checklist not executed.
- TC-NFR-05: OPEN  |  No test artifacts  |  Firefox and 360px mobile browser verification not recorded.
- TC-NFR-06: PARTIAL  |  Source module review; README; final build  |  Modularity documented; independent clean-machine installation pending.
- TC-NFR-07: PARTIAL  |  Recovery rehearsal; recovery-data-check.log  |  Nine tables and 12 files restored; no complete byte-for-byte comparison.
- TC-NFR-08: EVIDENCED  |  ST-03  |  Cross-owner, anonymous and management file access denied.

### H.5 Supplemental test case dispositions

- TC-BVA-01: PARTIAL  |  UT-01-05, UT-24-26  |  Representative boundaries checked; full specified mark grid not logged.
- TC-EP-01: OPEN  |  No dedicated EP registration matrix  |  Invalid email, duplicate and 7/8/128/129 password partitions need execution.
- TC-EP-02: PARTIAL  |  IT-07C; ST-03  |  Valid signatures tested; 5MiB and 5MiB+1 tests remain.
- TC-DEC-01: PARTIAL  |  UT decision guards; IT-08  |  A subset of review decision combinations executed.
- TC-STATE-01: PARTIAL  |  UT-15-18; IT-07D; IT-08  |  Some illegal edits/transitions rejected; comprehensive HTTP matrix pending.
- TC-SEC-01: EVIDENCED  |  ST-01  |  Missing/invalid CSRF, origin and session handling tested.
- TC-SEC-02: EVIDENCED  |  ST-03  |  Anonymous/cross-owner private document retrieval denied.
- TC-CON-01: EVIDENCED  |  ST-04  |  Simultaneous approvals, single confirmation, no overallocation.
- TC-REG-01: EVIDENCED  |  IT-10; final-regression.log  |  Input regression, build, checks and npm audit passed.
- TC-REC-01: PARTIAL  |  Recovery rehearsal; ST-03  |  Files recovered and protected API separately tested; restored-file content parity pending.

### H.6 Evidence precedence and reproducibility

Retest logs supersede the earlier failed credential setup and initial DEF-001 unit-only status; they do not modify the original historic baseline. Avoid rerunning IT-07/IT-08 and ST-04 state-changing fixtures against the same existing approved applications. Use the isolated cams_phase6_test sandbox for further negative cases and retain new timestamped logs.

Unverified browser, performance and full boundary cases are documented openly. The project may be submitted as a tested academic prototype with those limitations; the absence of separate evidence must not be disguised as a pass.


## APPENDIX I — DEFECT CLOSURE AND FINAL REGRESSION RECORD

### I.1 DEF-001 — Blank Class X percentage

Original defect: empty Class X percentages were accepted in a boundary path. The HTTP schema also previously permitted whitespace-only strings to become numeric zero. Requirement: FR-08; supplement: TC-BVA-01 / IT-10.

Correction: application percentage parsing now rejects empty and whitespace-only marks instead of coercing them to zero; validation retains finite numeric 0–100 limits. The initial unit correction and subsequent HTTP-level regression are distinct checkpoints.

Observed retest: UT-22–26 and related validation tests passed in the final 31/31 unit run. IT-10A created a synthetic Draft and four test files; IT-10B/C rejected blank/whitespace Class X values across the real HTTP boundary without changing application state or review history. The IT-10 test passed 1/1 in the isolated database.

Internal disposition: DEF-001 CLOSED for the recorded defect path. This does not prove all unexecuted input partitions.


### I.2 Configuration and environment issues

Incorrect IT-06 credentials initially caused 400/401 assertions; corrected test credentials produced 5/5 passing session tests. A missing sandbox integration-tests directory was created and the security document test rerun successfully. These were setup errors, not unresolved application defects.


### I.3 Final regression and restoration

Final regression, 14 November 2026: backend syntax check PASS; Node business-rule/unit tests 31 PASS, 0 FAIL; backend npm audit zero reported vulnerabilities; Vite frontend production build PASS; frontend npm audit zero reported vulnerabilities.

Backup/restore rehearsal: separate cams_phase6_restore database with 9 restored tables, 12 restored uploaded files, and counted rows: users 6; student_profiles 4; admission_cycles 1; courses 3; applications 3; documents 12; review_history 9; confirmations 3; sessions 0. Source development database was not targeted. This confirms restoration and row checks, but not byte-by-byte parity.

Reference evidence: evidence/phase6/final-regression.log; integration-it10-def001.log; security-st01-auth-csrf.log; security-st02-rbac.log; security-st03-documents.log; security-st04-concurrency.log; recovery-data-check.log; docs/phase6/PHASE6-TEST-CLOSURE.md.


## APPENDIX K — PRINT-EVIDENCE COMPLETION AND PRIVACY CHECKLIST

### K.1 Visual evidence acquired

The screenshot register now reproduces ten actual application images (Figures J-01 through J-10): public landing, registration, student application form, supporting files, submitted read-only form, administrator course management, administrator decision controls, approved student dashboard, course-wise management report and an actual demonstration-only confirmation. Source captures were dated 13 November 2026. They are implementation screenshots, distinct from UI-01 through UI-05 design wireframes.


### K.2 Historical-count handling

Figure J-09 intentionally shows two approved admissions and 158 seats available at an earlier checkpoint. The later reconciled final test baseline records three approved and 157 available out of 160. This is a chronological change, not a disagreement about the same moment. If printing as the final faculty report, preferably replace J-09 with a newly captured management report showing three approved and 157 available while retaining this description as a historical note.


### K.3 Unverified execution points

The case ledger identifies five OPEN and sixteen PARTIAL cases. Priorities are a measured reference-workload P95 test (NFR-01), Chrome and Firefox plus 360px viewport verification (NFR-05), the correction/resubmission and rejection HTTP workflows (FR-16, FR-19), and explicit registration partition testing (TC-EP-01). Additional case details are in Appendix H. Do not mark an unexecuted check PASS solely because the screen exists or a related unit test passed.


### K.4 Print-ready submission gate

Before changing CAMS-REP-001 to Final v1.0, complete: (1) source screenshot privacy review; (2) new final-state management screenshot where practicable; (3) gap dispositions for all 42 cases; (4) installation/user/maintenance guide and known limitations; (5) verified title-page author, faculty and institution details; (6) generated contents, figures list and pagination; (7) A4 PDF visual inspection for clipping, page breaks and caption separation; (8) final Google Docs, DOCX, PDF and local repository cross-check.

All screens and data remain an academic simulation. Never include real ID cards, password values, browser cookies, raw .env files, database dumps or private upload files in GitHub or printed annexures.
