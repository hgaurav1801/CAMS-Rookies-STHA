# CAMS — Recorded Test Execution Excerpts

**Project:** College Admission Management System
**Team:** Rookies
**Prepared:** 2026-11-15

This document contains selected lines extracted
from original locally recorded Phase 6 logs.

It is not a new test execution or an independent audit.
Full original logs are retained privately.

## Final regression

**Source:** `final-regression.log`

**Original SHA-256:** `5f2f731ab79556f363bc577a8af0a08f9c23d46f6efba1395dc1677b25ebf4d7`

```text
===== CAMS FINAL REGRESSION =====
===== API SYNTAX CHECK =====
===== API UNIT TESTS =====
✔ UT-01: CSE percentage boundary (0.412416ms)
✔ UT-02: CSE requires both subjects (0.060959ms)
✔ UT-03: BCA accepts Math OR CS (0.050167ms)
✔ UT-04: BBA percentage boundary (0.043583ms)
✔ UT-05: Invalid eligibility inputs (0.054292ms)
✔ UT-06: Valid submission (0.117375ms)
✔ UT-07: Missing profile rejected (0.184167ms)
✔ UT-08: All four documents required (0.084583ms)
✔ UT-09: Negative percentages rejected (0.072ms)
✔ UT-10: Percentages above 100 rejected (0.093125ms)
✔ UT-11: Non-numeric percentages rejected (0.05975ms)
✔ UT-12: Missing percentage values rejected (0.060833ms)
✔ UT-13: Ineligible application rejected (0.042375ms)
✔ UT-14: Missing course rejected (0.045833ms)
✔ UT-15: Editable states permitted (0.101208ms)
✔ UT-16: Non-editable states rejected (0.073125ms)
✔ UT-17: Valid approval permitted (0.036709ms)
✔ UT-18: Incorrect approval state rejected (0.061083ms)
✔ UT-19: Unverified documents block approval (0.035084ms)
✔ UT-20: Ineligible applicant cannot be approved (0.03ms)
✔ UT-21: Zero or negative seats block approval (0.046875ms)
✔ UT-22: Blank Class X marks must be rejected (0.032958ms)
✔ UT-23: Blank and invalid-type percentages rejected (0.089583ms)
✔ CSE requires marks and both Physics and Math (0.327916ms)
✔ BCA accepts Math OR Computer Science (0.063959ms)
✔ BBA uses marks threshold (0.368667ms)
✔ required documents and profile are validated (0.24325ms)
✔ approval requires review, verification and a remaining seat (0.076583ms)
✔ UT-24: Empty and whitespace-only marks fail HTTP schema validation (1.414584ms)
✔ UT-25: Valid numeric marks, including 0 and 100, are accepted (0.109167ms)
✔ UT-26: Invalid numeric and out-of-range marks are rejected (0.080666ms)
ℹ tests 31
ℹ suites 0
ℹ pass 31
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 77.590125
===== API SECURITY AUDIT =====
found 0 vulnerabilities
===== FRONTEND PRODUCTION BUILD =====
✓ 1597 modules transformed.
✓ built in 717ms
===== FRONTEND SECURITY AUDIT =====
found 0 vulnerabilities
===== FINAL REGRESSION PASSED =====
```

## Original failed unit regression

**Source:** `unit-test-expanded.log`

**Original SHA-256:** `5c6851370cb7e144939b09a326c72b1c35a997f37ca0c3e9287c6a24270b44b1`

```text
✔ UT-01: CSE percentage boundary (0.430291ms)
✔ UT-02: CSE requires both subjects (0.053583ms)
✔ UT-03: BCA accepts Math OR CS (0.055708ms)
✔ UT-04: BBA percentage boundary (0.045084ms)
✔ UT-05: Invalid eligibility inputs (0.054542ms)
✔ UT-06: Valid submission (0.112958ms)
✔ UT-07: Missing profile rejected (0.182542ms)
✔ UT-08: All four documents required (0.085334ms)
✔ UT-09: Negative percentages rejected (0.087ms)
✔ UT-10: Percentages above 100 rejected (0.090625ms)
✔ UT-11: Non-numeric percentages rejected (0.064625ms)
✔ UT-12: Missing percentage values rejected (0.064833ms)
✔ UT-13: Ineligible application rejected (0.048875ms)
✔ UT-14: Missing course rejected (0.064958ms)
✔ UT-15: Editable states permitted (0.04475ms)
✔ UT-16: Non-editable states rejected (0.057125ms)
✔ UT-17: Valid approval permitted (0.029083ms)
✔ UT-18: Incorrect approval state rejected (0.057833ms)
✔ UT-19: Unverified documents block approval (0.033625ms)
✔ UT-20: Ineligible applicant cannot be approved (0.032334ms)
✔ UT-21: Zero or negative seats block approval (0.0375ms)
✖ UT-22: Blank Class X marks must be rejected (0.217ms)
✔ CSE requires marks and both Physics and Math (0.322292ms)
✔ BCA accepts Math OR Computer Science (0.054625ms)
✔ BBA uses marks threshold (0.401583ms)
✔ required documents and profile are validated (0.261542ms)
✔ approval requires review, verification and a remaining seat (0.078958ms)
ℹ tests 27
ℹ suites 0
ℹ pass 26
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 42.008417
✖ failing tests:
✖ UT-22: Blank Class X marks must be rejected (0.217ms)
  AssertionError [ERR_ASSERTION]: Missing expected exception.
```

## DEF-001 corrected unit regression

**Source:** `unit-test-retest-DEF-001.log`

**Original SHA-256:** `dbafef4f822c19c444f02485e8ba5406fede6229eb9037a88cadbd1c9aaf567d`

```text
✔ UT-01: CSE percentage boundary (0.388292ms)
✔ UT-02: CSE requires both subjects (0.056375ms)
✔ UT-03: BCA accepts Math OR CS (0.052167ms)
✔ UT-04: BBA percentage boundary (0.04525ms)
✔ UT-05: Invalid eligibility inputs (0.051417ms)
✔ UT-06: Valid submission (0.111417ms)
✔ UT-07: Missing profile rejected (0.164791ms)
✔ UT-08: All four documents required (0.088792ms)
✔ UT-09: Negative percentages rejected (0.078334ms)
✔ UT-10: Percentages above 100 rejected (0.095167ms)
✔ UT-11: Non-numeric percentages rejected (0.079708ms)
✔ UT-12: Missing percentage values rejected (0.068208ms)
✔ UT-13: Ineligible application rejected (0.044583ms)
✔ UT-14: Missing course rejected (0.592834ms)
✔ UT-15: Editable states permitted (0.071041ms)
✔ UT-16: Non-editable states rejected (0.075584ms)
✔ UT-17: Valid approval permitted (0.037292ms)
✔ UT-18: Incorrect approval state rejected (0.072041ms)
✔ UT-19: Unverified documents block approval (0.044416ms)
✔ UT-20: Ineligible applicant cannot be approved (0.032583ms)
✔ UT-21: Zero or negative seats block approval (0.047208ms)
✔ UT-22: Blank Class X marks must be rejected (0.033333ms)
✔ UT-23: Blank and invalid-type percentages rejected (0.091542ms)
✔ CSE requires marks and both Physics and Math (0.321666ms)
✔ BCA accepts Math OR Computer Science (0.054667ms)
✔ BBA uses marks threshold (0.412958ms)
✔ required documents and profile are validated (0.304209ms)
✔ approval requires review, verification and a remaining seat (0.077417ms)
ℹ tests 28
ℹ suites 0
ℹ pass 28
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 43.271667
```

## Authentication retest

**Source:** `integration-auth-session-retest-2.log`

**Original SHA-256:** `1bde9fdc56dc411ae03090a780af4fdb0f8bc6d427e72d70e12bf2d9bc5a5f5f`

```text
✔ IT-06A: Anonymous user has no session (15.972125ms)
✔ IT-06B: Incorrect password is rejected (216.677375ms)
✔ IT-06C: STUDENT session and logout (220.35725ms)
✔ IT-06D: ADMIN session and logout (213.959666ms)
✔ IT-06E: MANAGEMENT session and logout (213.041333ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 913.4295
```

## Student application workflow

**Source:** `integration-student-workflow.log`

**Original SHA-256:** `c79f51cb1fcb3f2d8396a1a8aed1202d68f6331b5c1f8fa3a4f36fd9f11bc579`

```text
IT-07B PASS: Profile saved and draft created
IT-07B PASS: Duplicate application rejected
IT-07C PASS: Incomplete submission rejected
IT-07C PASS: PHOTO uploaded
IT-07C PASS: CLASS_X uploaded
IT-07C PASS: CLASS_XII uploaded
IT-07C PASS: IDENTITY uploaded
IT-07C PASS: All four documents persisted
IT-07C PASS: Private document retrieval succeeded
IT-07D PASS: Application submitted
IT-07D PASS: Status persisted
IT-07D PASS: Submitted application is read-only
IT-07 WORKFLOW COMPLETED SUCCESSFULLY
✔ IT-07B/C/D: Complete student admission integration (310.921292ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 430.02875
```

## Administrator review

**Source:** `integration-admin-review.log`

**Original SHA-256:** `c4597d7127d1133e3fc31616e81948fcb541861a4c7afd9bb4ea241b69164601`

```text
IT-08A PASS: Submitted application and documents found
IT-08B PASS: Non-admin review access denied
IT-08C PASS: Review state transition recorded
IT-08D PASS: Approval validation enforced
IT-08E PASS: All four documents verified
IT-08F PASS: Admission approved and audited
IT-08G PASS: Exactly one BCA seat allocated
IT-08H PASS: Student status and restrictions correct
IT-08 WORKFLOW COMPLETED SUCCESSFULLY
✔ IT-08: Administrator review and approval integration (738.96075ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 790.286625
```

## Confirmation and reporting

**Source:** `integration-confirmation-report.log`

**Original SHA-256:** `b45a6421af8d6c1d43ce6a6104352dc14c6c28d2ac6af053d8193f8edc82dfe5`

```text
IT-09A PASS: Owner sees the approved test application
IT-09B PASS: PDF signature, MIME type and nonempty file (2009 bytes)
IT-09C PASS: Anonymous, staff and other-student access denied
IT-09D PASS: Management reporting role restrictions
IT-09E PRECHECK PASS: Public course counts match IT-08 SQL baseline
IT-09 PREFLIGHT COMPLETE. PDF contents, report fields and SQL reference remain to verify.
✔ IT-09 preflight: confirmation, access and management response (906.639375ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 943.465542
```

## DEF-001 HTTP regression

**Source:** `integration-it10-def001.log`

**Original SHA-256:** `82a8280c8662049604fb0f8984e12676469f2aa90331265c7a49527d06a30cd9`

```text
IT-10A PASS: Dedicated Draft, complete profile and four synthetic files
IT-10B PASS: HTTP rejects blank/whitespace Class X; stored Draft row unchanged
IT-10C PASS: Submission rejects missing Class X, no state/history changes
IT-10 DEF-001 HTTP REGRESSION PASSED
✔ IT-10 / DEF-001: blank Class X is rejected across the real HTTP boundary (536.912834ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 608.426167
```

## Authentication and CSRF security

**Source:** `security-st01-auth-csrf.log`

**Original SHA-256:** `5393cec98074b4b9c3335784a73adb28b06195b662d9f644628b87566f3ce17d`

```text
ST-01A PASS: Anonymous session rejected
ST-01B PASS: Unauthenticated modification blocked
ST-01C PASS: Administrator authentication successful
ST-01D PASS: Session cookie protections verified
ST-01E PASS: Authenticated session retained
ST-01F PASS: Missing CSRF token rejected
ST-01G PASS: Invalid CSRF token rejected
ST-01H PASS: Cross-origin modification rejected
ST-01I PASS: Authenticated logout successful
ST-01J PASS: Old session invalidated
ST-01 SECURITY REGRESSION PASSED
✔ ST-01: Authentication, session and CSRF security (257.390708ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 293.811208
```

## Role-based access security

**Source:** `security-st02-rbac.log`

**Original SHA-256:** `7b4a04498b5ad1031a1b07dfc7576c333e8adc725f316c2494f03fd2181bd7bf`

```text
ST-02A: Sandbox API health PASS
ST-02B: Anonymous admin access denied PASS
ST-02C: Anonymous student access denied PASS
ST-02D: Anonymous management access denied PASS
ST-02 SETUP: Sandbox student created
ST-02E PASS: All three role sessions authenticated
ST-02F: Student profile access PASS
ST-02G: Student denied admin queue PASS
ST-02H: Student denied management reports PASS
ST-02I: Admin application queue access PASS
ST-02J: Admin denied student profile endpoint PASS
ST-02K: Admin denied management reports PASS
ST-02L: Management reporting access PASS
ST-02M: Management denied admin queue PASS
ST-02N: Management denied student profile PASS
ST-02O: Student cannot create courses PASS
ST-02P: Management cannot create courses PASS
ST-02Q: Admin cannot create student applications PASS
ST-02R: Management cannot create student applications PASS
ST-02S: Student cannot approve admissions PASS
ST-02T: Management cannot approve admissions PASS
ST-02 RBAC SECURITY REGRESSION PASSED
✔ ST-02: Role-based access control (895.330834ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 934.428458
```

## Private document security

**Source:** `security-st03-documents.log`

**Original SHA-256:** `491b0926ec428bc7c6d9cc287aa3f3604a51c770b0e7762f4b6b1ad13a42018e`

```text
ST-03 PASS: Two independent student accounts authenticated
ST-03 PASS: Valid private document uploaded and recorded
ST-03 PASS: Anonymous document access denied
ST-03 PASS: Cross-student document access denied
ST-03 PASS: Management access to private documents denied
ST-03 PASS: Document owner retrieved correct private file
ST-03 PASS: Authorized administrator retrieved correct file
ST-03 PASS: Malformed and unknown document identifiers rejected
ST-03 PASS: Logged-out student cannot retrieve private documents
ST-03 DOCUMENT SECURITY REGRESSION PASSED
✔ ST-03: Private document access security (1338.246334ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1376.304667
```

## Concurrent seat allocation

**Source:** `security-st04-concurrency.log`

**Original SHA-256:** `cc38ab3a98ed700a3735a190cb748d172c8fed0acc300a1d1784f2e8778b65c7`

```text
ST-04 PASS: Exactly one admission approved
ST-04 PASS: Second approval rejected
ST-04 PASS: Exactly one confirmation created
ST-04 PASS: No seat overallocation
✔ ST-04: Simultaneous approvals cannot overallocate seats (1255.872625ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1360.948333
```

## Database recovery

**Source:** `recovery-rehearsal.log`

**Original SHA-256:** `b06ef6d02c71ac1aedfc46348824c4eb4e5a347c630c4e8eea292769ae341fdf`

```text
PHASE 6 RECOVERY REHEARSAL
Restored table count:
Restored uploaded-file count:
RECOVERY REHEARSAL PASSED: 9 restored tables.
```

## Evidence limitations

This is a selective evidence extract.
The original logs contain fuller execution details.
Only tests explicitly shown as passed in the
original output should be considered passing.

Source files and integration test implementations
are maintained in the repository.
