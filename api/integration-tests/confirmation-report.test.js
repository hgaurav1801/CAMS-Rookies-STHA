
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API = 'http://127.0.0.1:4000/api';
const ORIGIN = 'http://127.0.0.1:5173';
const APP_ID = 'e9ad161a-34f9-468b-8a76-f8da845f482a';
const EVIDENCE = path.resolve('..', 'evidence', 'phase6');
const PDF_PATH = `/student/application/${APP_ID}/confirmation`;

async function get(url, session) {
  return fetch(`${API}${url}`, {
    headers: session ? { Cookie: session.cookie } : {}
  });
}

async function getJson(url, session) {
  const response = await get(url, session);
  const body = await response.json().catch(() => null);
  return { status: response.status, data: body?.data, body };
}

async function login(role, prefix) {
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];

  assert.ok(
    email && password,
    `Missing ${prefix}_EMAIL or ${prefix}_PASSWORD`
  );

  const response = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN
    },
    body: JSON.stringify({ email, password })
  });

  const body = await response.json();

  assert.equal(
    response.status,
    200,
    `${role} login failed: ${response.status}`
  );

  assert.equal(body?.data?.user?.role, role);

  const cookieLine = response.headers.getSetCookie()
    .find(value => value.startsWith('cams_sid='));

  assert.ok(cookieLine, 'Missing authentication cookie');
  assert.ok(body?.data?.csrfToken, 'Missing CSRF token');

  return {
    email,
    cookie: cookieLine.split(';')[0],
    csrf: body.data.csrfToken
  };
}

async function logout(session) {
  await fetch(`${API}/auth/logout`, {
    method: 'POST',
    headers: {
      Cookie: session.cookie,
      Origin: ORIGIN,
      'X-CSRF-Token': session.csrf
    }
  });
}

function reportShape(value, depth = 0) {
  if (Array.isArray(value)) {
    return {
      length: value.length,
      sample: depth < 3 && value.length
        ? reportShape(value[0], depth + 1)
        : 'array'
    };
  }

  if (value && typeof value === 'object') {
    if (depth >= 4) return 'object';

    return Object.fromEntries(
      Object.entries(value).slice(0, 25)
        .map(([key, item]) => [
          key,
          reportShape(item, depth + 1)
        ])
    );
  }

  return typeof value;
}

test('IT-09 preflight: confirmation, access and management response', async t => {
  await mkdir(EVIDENCE, { recursive: true });

  const sessions = [];

  t.after(async () => {
    await Promise.allSettled(sessions.map(logout));
  });

  // Authenticate the test accounts.
  const student = await login('STUDENT', 'IT07_STUDENT');
  sessions.push(student);

  const anotherStudent = await login('STUDENT', 'IT_STUDENT');
  sessions.push(anotherStudent);

  assert.notEqual(
    student.email.toLowerCase(),
    anotherStudent.email.toLowerCase(),
    'Owner-isolation test needs a second, different student account'
  );

  const admin = await login('ADMIN', 'IT_ADMIN');
  sessions.push(admin);

  const management = await login('MANAGEMENT', 'IT_MANAGEMENT');
  sessions.push(management);

  // IT-09A: Approved application ownership.
  const application = await getJson(
    '/student/application',
    student
  );

  assert.equal(application.status, 200);
  assert.equal(application.data?.id, APP_ID);
  assert.equal(application.data?.status, 'Approved');

  console.log(
    'IT-09A PASS: Owner sees the approved test application'
  );

  // IT-09B: Download the actual confirmation PDF.
  const confirmation = await get(PDF_PATH, student);

  assert.equal(
    confirmation.status,
    200,
    'Owner confirmation download must succeed'
  );

  assert.match(
    confirmation.headers.get('content-type') || '',
    /application\/pdf/i
  );

  const pdf = Buffer.from(
    await confirmation.arrayBuffer()
  );

  assert.ok(
    pdf.length > 500,
    'Downloaded PDF is unexpectedly small'
  );

  assert.equal(
    pdf.subarray(0, 5).toString('ascii'),
    '%PDF-'
  );

  await writeFile(
    path.join(EVIDENCE, 'IT-09-approved-confirmation.pdf'),
    pdf,
    { mode: 0o600 }
  );

  console.log(
    `IT-09B PASS: PDF signature, MIME type and nonempty file (${pdf.length} bytes)`
  );

  console.log(
    'PDF saved: evidence/phase6/IT-09-approved-confirmation.pdf'
  );

  // IT-09C: PDF authorization.
  assert.equal(
    (await get(PDF_PATH)).status,
    401
  );

  assert.equal(
    (await get(PDF_PATH, admin)).status,
    403
  );

  assert.equal(
    (await get(PDF_PATH, management)).status,
    403
  );

  const otherStatus = (
    await get(PDF_PATH, anotherStudent)
  ).status;

  assert.ok(
    [403, 404].includes(otherStatus),
    `Another student's access must be denied, received HTTP ${otherStatus}`
  );

  console.log(
    'IT-09C PASS: Anonymous, staff and other-student access denied'
  );

  // IT-09D: Read-only management reporting.
  const report = await getJson(
    '/management/reports',
    management
  );

  assert.equal(
    report.status,
    200,
    'Management report must be accessible to MANAGEMENT'
  );

  assert.ok(
    report.data && typeof report.data === 'object'
  );

  assert.equal(
    (await get('/management/reports')).status,
    401
  );

  assert.equal(
    (await get('/management/reports', student)).status,
    403
  );

  assert.equal(
    (await get('/management/reports', admin)).status,
    403
  );

  console.log(
    'IT-09D PASS: Management reporting role restrictions'
  );

  await writeFile(
    path.join(EVIDENCE, 'IT-09-management-response.json'),
    JSON.stringify(report.data, null, 2),
    { mode: 0o600 }
  );

  console.log(
    'MANAGEMENT REPORT RESPONSE STRUCTURE (keys and types only):'
  );

  console.log(
    JSON.stringify(reportShape(report.data), null, 2)
  );

  // IT-09E: Public catalogue count precheck.
  const catalogue = await getJson('/courses');

  assert.equal(catalogue.status, 200);

  const courses = catalogue.data?.courses;

  assert.ok(
    Array.isArray(courses),
    'Course catalogue array missing'
  );

  const expected = {
    'B.Tech CSE': {
      capacity: 60,
      approved: 2,
      available: 58
    },
    BBA: {
      capacity: 40,
      approved: 0,
      available: 40
    },
    BCA: {
      capacity: 60,
      approved: 1,
      available: 59
    }
  };

  for (const [name, values] of Object.entries(expected)) {
    const course = courses.find(
      item => item.name === name
    );

    assert.ok(course, `${name} missing from course catalogue`);

    assert.equal(
      Number(course.seat_capacity),
      values.capacity
    );

    assert.equal(
      Number(course.approved_count),
      values.approved
    );

    assert.equal(
      Number(course.available_seats),
      values.available
    );
  }

  console.log(
    'IT-09E PRECHECK PASS: Public course counts match IT-08 SQL baseline'
  );

  console.log(
    'IT-09 PREFLIGHT COMPLETE. PDF contents, report fields and SQL reference remain to verify.'
  );
});
