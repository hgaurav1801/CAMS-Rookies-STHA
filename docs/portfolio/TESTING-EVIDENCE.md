
# CAMS — Software Testing and Verification Evidence

**Project:** College Admission Management System (CAMS)  
**Development Team:** Rookies  
**Simulated Institution:** STHA  
**SDLC:** Waterfall  
**Testing Phase:** Phase 6  
**Verification Period:** November 2026

## 1. Overview

CAMS was verified through automated unit testing,
HTTP integration testing, security regression testing,
database reconciliation and backup recovery exercises.

Testing was performed against the local Node.js,
Express, React and MySQL demonstration environment.

All records used for the project demonstration were fictional.

## 2. Unit Testing

| Metric | Result |
|---|---|
| Test runner | Node.js built-in test runner |
| Tests executed | 31 |
| Passed | 31 |
| Failed | 0 |
| Status | PASS |

Major areas tested:

- Course eligibility and subject requirements
- Class X and XII percentage boundaries
- Mandatory supporting documents
- Application submission validation
- Editable and non-editable states
- Administrative approval constraints
- Seat availability checks
- Blank, invalid and out-of-range marks

Source files:

- `api/tests/admissions.test.js`
- `api/tests/admissions.boundary.test.js`
- `api/tests/validation-regression.test.js`

## 3. Integration Testing

The following workflows were executed successfully:

| Test | Verified area |
|---|---|
| IT-06 | Authentication, sessions and logout |
| IT-07 | Student application workflow |
| IT-08 | Administrative review and approval |
| IT-09 | Confirmation PDF and reporting |
| IT-10 | HTTP validation regression |

Additional read-only checks verified API health,
course retrieval and unauthenticated access restrictions.

These integration tests verified behavior against
the running API and database.

## 4. Security Regression Testing

| Test | Verification |
|---|---|
| ST-01 | Authentication, session and CSRF protection |
| ST-02 | Role-based access control |
| ST-03 | Private document access restrictions |
| ST-04 | Concurrent admission approval |

Recorded results confirmed:

- Unauthorized users were denied protected access.
- Student accounts could not access another student's files.
- Management accounts could not perform administrative actions.
- Invalid and missing CSRF tokens were rejected.
- Tested concurrent approvals did not overallocate seats.

These checks do not constitute an independent
penetration test or security certification.

## 5. Defect Resolution — DEF-001

**Defect:** Blank Class X percentage was accepted
during application validation.

### Initial observation

The expanded unit-test suite reported a failure
in UT-22 because the expected validation exception
was not raised.

### Root cause

Blank string values could be converted to numeric
zero during percentage validation.

### Correction

Validation was updated to reject blank and
whitespace-only percentage values while preserving
valid numerical inputs, including boundary values.

### Regression verification

The following were subsequently recorded as passing:

- UT-22: Blank Class X marks rejected
- UT-23: Blank and invalid-type percentages rejected
- UT-24: Empty and whitespace-only HTTP schema validation
- IT-10: HTTP-level regression of the original defect

**Final recorded defect status: CLOSED**

## 6. Database Verification

At the recorded final reconciliation checkpoint:

| Course | Capacity | Approved | Available |
|---|---:|---:|---:|
| B.Tech CSE | 60 | 2 | 58 |
| BBA | 40 | 0 | 40 |
| BCA | 60 | 1 | 59 |
| **Total** | **160** | **3** | **157** |

These values represent a recorded demonstration
database state, not permanent application totals.

## 7. Recovery Testing

An isolated recovery rehearsal restored:

- 9 database tables
- 12 uploaded files
- Recorded application, document and review data

The original development database was not targeted.

The exercise verified basic restoration and record
availability, not full byte-for-byte file integrity.

## 8. Build and Dependency Verification

The final recorded regression included:

| Check | Result |
|---|---|
| Backend JavaScript syntax | PASS |
| Unit tests | 31/31 PASS |
| Frontend production build | PASS |
| Backend npm audit | 0 reported vulnerabilities |
| Frontend npm audit | 0 reported vulnerabilities |

Audit results apply to the recorded dependency
versions and the date of execution.

## 9. Requirements-Level Test Coverage

The broader academic test register contains
42 planned cases:

| Evidence status | Cases |
|---|---:|
| Evidenced | 21 |
| Partially evidenced | 16 |
| Open | 5 |
| **Total** | **42** |

This register is distinct from the 31 automated
unit-test results.

Open or partially evidenced cases must not be
represented as successfully executed tests.

Outstanding coverage includes additional
correction/rejection workflows, registration
partitions, performance measurements and
cross-browser verification.

## 10. Evidence and Reproducibility

The repository contains executable tests under:

- `api/tests/`
- `api/integration-tests/`

Run the independent unit suite using:

```bash
cd api
npm run check
npm run test:logic
```

Integration tests require a configured API,
a MySQL database and appropriate synthetic
test credentials.

State-changing integration tests should use
an isolated test database.

Original execution logs are retained privately
in the project evidence archive.

Only reviewed, sanitized evidence should be
published in the public repository.

## 11. Conclusion

The recorded Phase 6 results demonstrate successful
unit, integration, security regression and recovery
verification within the defined academic scope.

The evidence also documents an actual defect,
its correction and subsequent regression tests.

CAMS is an academic prototype developed to
demonstrate software engineering methodology,
not a production-certified admissions platform.
