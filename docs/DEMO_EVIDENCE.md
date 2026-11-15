# CAMS — Demonstration and Evidence Checklist

> **Historical checklist — Phase 5:** The unexecuted statuses below record the original demonstration planning stage. They do not represent the final testing status of CAMS. Later integration, security, defect regression and recovery checks were executed in Phase 6. Refer to `docs/phase6/PHASE6-TEST-CLOSURE.md` for the internal closure summary.


This is a record sheet, not a claim that testing already happened.

| Test | Procedure | Actual result | Screenshot / log | Status |
|---|---|---|---|---|
| TC-01 | Register a new student; attempt duplicate email | To record | To capture | Not run |
| TC-02 | Log in as Student, Admin and Management | To record | To capture | Not run |
| TC-03 | Try Student access to admin route and API | To record | To capture | Not run |
| TC-04 | Add/edit course; set capacity below approved count | To record | To capture | Not run |
| TC-05 | Create draft; try duplicate same-cycle application | To record | To capture | Not run |
| TC-06 | Submit without one mandatory document | To record | To capture | Not run |
| TC-07 | Upload file over 5 MiB or forbidden MIME | To record | To capture | Not run |
| TC-08 | Submit correct application | To record | To capture | Not run |
| TC-09 | Start review, request correction, resubmit | To record | To capture | Not run |
| TC-10 | Reject without reason, then with reason | To record | To capture | Not run |
| TC-11 | Verify all four files and approve | To record | To capture | Not run |
| TC-12 | Attempt two simultaneous approvals for last seat | To record | To capture | Not run |
| TC-13 | Download approved-only PDF | To record | To capture | Not run |
| TC-14 | Confirm management report agrees with DB | To record | To capture | Not run |
| TC-15 | Attempt management POST/PATCH to course/review | To record | To capture | Not run |
| TC-16 | Repeat user flow on 360px width and Chrome/Firefox | To record | To capture | Not run |
| TC-17 | Backup and restore data | To record | To capture | Not run |

## MySQL backup/restore rehearsal (Docker, only after user runs the project)

```bash
# From repository root; backup can be restored only into an appropriately prepared database.
docker compose exec -T db mysqldump -ucams -pcamspass cams > cams-backup.sql
# Review backup file and use a disposable demonstration DB before practicing restoration.
```

## Phase 5 review gate

- [ ] API starts with configured MySQL.
- [ ] React frontend loads at http://127.0.0.1:5173.
- [ ] Three role accounts can be exercised (student via self-registration).
- [ ] Full workflow demonstrated with fictional records.
- [ ] Business-logic tests and DB integration tests executed.
- [ ] Team members' contributions, Git commit and known issues recorded.
- [ ] Screenshots, sample confirmation and defect records saved.
- [ ] Only then mark implementation baseline as completed.
