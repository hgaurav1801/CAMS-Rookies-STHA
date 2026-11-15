
from pathlib import Path
from datetime import date
import hashlib
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "evidence" / "phase6"
DEST = ROOT / "evidence" / "public"
DEST.mkdir(parents=True, exist_ok=True)

LOGS = [
    ("Final regression", "final-regression.log"),
    ("Original failed unit regression", "unit-test-expanded.log"),
    ("DEF-001 corrected unit regression", "unit-test-retest-DEF-001.log"),
    ("Authentication retest", "integration-auth-session-retest-2.log"),
    ("Student application workflow", "integration-student-workflow.log"),
    ("Administrator review", "integration-admin-review.log"),
    ("Confirmation and reporting", "integration-confirmation-report.log"),
    ("DEF-001 HTTP regression", "integration-it10-def001.log"),
    ("Authentication and CSRF security", "security-st01-auth-csrf.log"),
    ("Role-based access security", "security-st02-rbac.log"),
    ("Private document security", "security-st03-documents.log"),
    ("Concurrent seat allocation", "security-st04-concurrency.log"),
    ("Database recovery", "recovery-rehearsal.log"),
]


def redact(line):
    # Remove terminal ANSI escape codes
    line = re.sub(r"\x1b\[[0-9;]*m", "", line)

    # Remove local macOS usernames
    line = re.sub(
        r"/Users/[^/\s]+",
        "/Users/[REDACTED]",
        line,
    )

    # Remove email addresses
    line = re.sub(
        r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}",
        "[EMAIL REDACTED]",
        line,
    )

    # Remove application UUID identifiers
    line = re.sub(
        r"\b[0-9a-f]{8}-[0-9a-f-]{27,36}\b",
        "[UUID REDACTED]",
        line,
        flags=re.I,
    )

    # Remove Indian mobile-number-shaped values
    line = re.sub(
        r"(?<!\d)(?:\+91[\s-]?)?[6-9]\d{9}(?!\d)",
        "[PHONE REDACTED]",
        line,
    )

    return line

    line = re.sub(r"\x1b\[[0-9;]*m", "", line)
    line = re.sub(
        r"/Users/[^/\s]+",
        "/Users/[REDACTED]",
        line,
    )
    line = re.sub(
        r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}",
        "[EMAIL REDACTED]",
        line,
    )
    line = re.sub(
        r"\b[0-9a-f]{8}-[0-9a-f-]{27,36}\b",
        "[UUID REDACTED]",
        line,
        flags=re.I,
    )
    return line

def permitted(line):
    text = line.strip()

    if text.startswith(("✔", "✓", "✖", "ℹ")):
        return True

    if re.match(r"^(IT-\d+|ST-\d+)", text):
        return True

    if text.startswith((
        "PASS:",
        "===== ",
        "found 0 vulnerabilities",
        "PHASE 6 RECOVERY",
        "RECOVERY REHEARSAL",
        "Restored table count:",
        "Restored uploaded-file count:",
    )):
        return True

    return False

output = [
    "# CAMS — Recorded Test Execution Excerpts",
    "",
    "**Project:** College Admission Management System",
    "**Team:** Rookies",
    f"**Prepared:** {date.today().isoformat()}",
    "",
    "This document contains selected lines extracted",
    "from original locally recorded Phase 6 logs.",
    "",
    "It is not a new test execution or an independent audit.",
    "Full original logs are retained privately.",
    "",
]

missing = []
included = 0

for title, filename in LOGS:
    path = SOURCE / filename

    output.append(f"## {title}")
    output.append("")
    output.append(f"**Source:** `{filename}`")
    output.append("")

    if not path.exists():
        output.append("Source log unavailable.")
        output.append("")
        missing.append(filename)
        continue

    raw = path.read_bytes()
    checksum = hashlib.sha256(raw).hexdigest()

    lines = raw.decode(
        "utf-8", errors="replace"
    ).splitlines()


    excerpts = []

    for line in lines:
        clean = redact(line)

        if permitted(clean):
            excerpts.append(clean)

        elif filename == "unit-test-expanded.log":
            if (
                "UT-22" in clean
                or "Missing expected exception" in clean
                or re.search(
                    r"^\s*(?:ℹ\s*)?(?:tests|pass|fail)\s+\d+\s*$",
                    clean,
                )
            ):
                excerpts.append(clean)


    output.append(f"**Original SHA-256:** `{checksum}`")
    output.append("")

    if excerpts:
        output.append("```text")
        output.extend(excerpts[:80])
        output.append("```")
        included += 1
    else:
        output.append(
            "No publishable status lines found."
        )

    output.append("")

output.extend([
    "## Evidence limitations",
    "",
    "This is a selective evidence extract.",
    "The original logs contain fuller execution details.",
    "Only tests explicitly shown as passed in the",
    "original output should be considered passing.",
    "",
    "Source files and integration test implementations",
    "are maintained in the repository.",
    "",
])

destination = DEST / "PHASE6-EXECUTION-EXCERPTS.md"
destination.write_text(
    "\n".join(output),
    encoding="utf-8",
)

print("===== CAMS PUBLIC EVIDENCE =====")
print(f"Log sources configured: {len(LOGS)}")
print(f"Sources with result excerpts: {included}")
print(f"Missing source files: {len(missing)}")

for filename in missing:
    print(f"MISSING: {filename}")

print(f"Output: {destination.relative_to(ROOT)}")
print("Review the output before publication.")
print("===== COMPLETE =====")
