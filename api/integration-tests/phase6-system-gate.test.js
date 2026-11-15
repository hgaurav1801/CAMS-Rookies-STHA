import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pool } from '../src/lib/db.js';

const API = 'http://127.0.0.1:4001/api';
const ORIGIN = 'http://127.0.0.1:5173';
const DB = 'cams_phase6_test';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+t8b8AAAAASUVORK5CYII=',
  'base64'
);

if (process.env.DB_NAME !== DB) {
  throw new Error(
    'SAFETY STOP: DB_NAME must be cams_phase6_test'
  );
}

async function api(method, route, { session, json, form } = {}) {
  const headers = {};

  if (session) headers.Cookie = session.cookie;

  if (method !== 'GET') {
    headers.Origin = ORIGIN;
    if (session) headers['X-CSRF-Token'] = session.csrf;
  }

  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API}${route}`, {
    method,
    headers,
    body: form ?? (
      json === undefined ? undefined : JSON.stringify(json)
    )
  });

  const type = res.headers.get('content-type') ?? '';
  const body = type.includes('application/json')
    ? await res.json()
    : null;

  return {
    status: res.status,
    data: body?.data,
    code: body?.error?.code
  };
}

function expect(actual, wanted, label) {
  assert.equal(
    actual.status,
    wanted,
    `${label}: HTTP ${actual.status}, error ${actual.code ?? 'none'}`
  );

  return actual.data;
}

function formData(kind, buffer = PNG, filename = 'sample.png') {
  const form = new FormData();

  form.set('document_type', kind);
  form.set(
    'file',
    new Blob([buffer], { type: 'image/png' }),
    filename
  );

  return form;
}

async function loggedIn(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: {
      Origin: ORIGIN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  assert.equal(
    res.status,
    200,
    'Seeded login must succeed'
  );

  const body = await res.json();

  const cookie = res.headers
    .getSetCookie()
    .find(c => c.startsWith('cams_sid='))
    ?.split(';')[0];

  assert.ok(cookie && body.data?.csrfToken);

  return {
    cookie,
    csrf: body.data.csrfToken,
    role: body.data.user.role
  };
}

async function freshStudent(sessions) {
  const email = `cams-system-${randomUUID()}@example.com`;
  const password = `X!7p-${randomUUID()}`;

  expect(
    await api('POST', '/auth/register', {
      json: { email, password }
    }),
    201,
    'Register synthetic student'
  );

  const session = await loggedIn(email, password);

  assert.equal(session.role, 'STUDENT');

  sessions.push(session);

  expect(
    await api('PATCH', '/student/profile', {
      session,
      json: {
        full_name: 'CAMS System Synthetic',
        date_of_birth: '2007-01-01',
        phone: '9876543210',
        address: 'Fictional test address'
      }
    }),
    200,
    'Save synthetic profile'
  );

  return session;
}

async function draftAndSubmit(sessions, course) {
  const session = await freshStudent(sessions);

  const fields = {
    course_id: course.id,
    class_x_percentage: 81,
    class_xii_percentage: 75,
    studied_physics: true,
    studied_mathematics: true,
    studied_computer_science: true
  };

  const created = expect(
    await api('POST', '/student/application', {
      session,
      json: fields
    }),
    201,
    'Create Draft'
  );

  const id = created.id;

  assert.equal(created.status, 'Draft');

  for (const type of [
    'PHOTO',
    'CLASS_X',
    'CLASS_XII',
    'IDENTITY'
  ]) {
    expect(
      await api(
        'POST',
        `/student/application/${id}/documents`,
        {
          session,
          form: formData(type)
        }
      ),
      200,
      `Upload ${type}`
    );
  }

  expect(
    await api(
      'POST',
      `/student/application/${id}/submit`,
      { session }
    ),
    200,
    'Submit'
  );

  const check = expect(
    await api(
      'GET',
      `/student/application/${id}/documents`,
      { session }
    ),
    200,
    'List documents'
  );

  assert.equal(check.length, 4);

  return {
    id,
    session,
    fields,
    docs: check
  };
}

async function startAndVerify(admin, app) {
  expect(
    await api(
      'POST',
      `/admin/applications/${app.id}/start-review`,
      { session: admin }
    ),
    200,
    'Begin review'
  );

  const detail = expect(
    await api(
      'GET',
      `/admin/applications/${app.id}`,
      { session: admin }
    ),
    200,
    'Read admin detail'
  );

  for (const document of detail.documents) {
    expect(
      await api(
        'PATCH',
        `/admin/applications/${app.id}/documents/${document.id}/verification`,
        {
          session: admin,
          json: { verification_state: 'VERIFIED' }
        }
      ),
      200,
      'Verify test document'
    );
  }
}

test(
  'Phase 6 system, boundary, access, concurrency and performance sandbox suite',
  async t => {
    const sessions = [];

    t.after(async () => {
      await Promise.allSettled(
        sessions.map(session =>
          api('POST', '/auth/logout', { session })
        )
      );

      await pool.end();
    });

    const [active] = await pool.query(
      'SELECT DATABASE() AS name'
    );

    assert.equal(active[0].name, DB);

    expect(
      await api('GET', '/health'),
      200,
      'Sandbox API health'
    );

    const adminEmail =
      process.env.IT_ADMIN_EMAIL ??
      process.env.SEED_ADMIN_EMAIL;

    const adminPassword =
      process.env.IT_ADMIN_PASSWORD ??
      process.env.SEED_ADMIN_PASSWORD;

    assert.ok(
      adminEmail && adminPassword,
      'Provide IT_ADMIN_EMAIL/PASSWORD or SEED_ADMIN_EMAIL/PASSWORD in .env'
    );

    const admin = await loggedIn(
      adminEmail,
      adminPassword
    );

    assert.equal(admin.role, 'ADMIN');

    sessions.push(admin);

    const courses = expect(
      await api('GET', '/courses'),
      200,
      'Course listing'
    ).courses;

    const bca = courses.find(
      c => c.name === 'BCA'
    );

    assert.ok(bca);

    // SYSTEM: correction, resubmission and rejection.

    const correction = await draftAndSubmit(
      sessions,
      bca
    );

    expect(
      await api(
        'POST',
        `/admin/applications/${correction.id}/start-review`,
        { session: admin }
      ),
      200,
      'Review correction fixture'
    );

    expect(
      await api(
        'POST',
        `/admin/applications/${correction.id}/request-correction`,
        {
          session: admin,
          json: {
            reason: 'Please correct the fictional marksheet entry.'
          }
        }
      ),
      200,
      'Request correction'
    );

    const correctedState = expect(
      await api(
        'GET',
        `/student/application/${correction.id}/status`,
        { session: correction.session }
      ),
      200,
      'Read correction reason'
    );

    assert.equal(
      correctedState.status,
      'Correction Required'
    );

    assert.match(
      correctedState.reason,
      /correct/i
    );

    expect(
      await api(
        'PATCH',
        `/student/application/${correction.id}`,
        {
          session: correction.session,
          json: {
            ...correction.fields,
            class_x_percentage: 82
          }
        }
      ),
      200,
      'Update after correction'
    );

    expect(
      await api(
        'POST',
        `/student/application/${correction.id}/submit`,
        { session: correction.session }
      ),
      200,
      'Resubmit correction'
    );

    await startAndVerify(admin, correction);

    expect(
      await api(
        'POST',
        `/admin/applications/${correction.id}/reject`,
        {
          session: admin,
          json: {
            reason: 'Fictional rejection to verify the audit process.'
          }
        }
      ),
      200,
      'Reject fictional case'
    );

    const rejected = expect(
      await api(
        'GET',
        `/student/application/${correction.id}/status`,
        { session: correction.session }
      ),
      200,
      'Read rejection reason'
    );

    assert.equal(rejected.status, 'Rejected');

    assert.match(
      rejected.reason,
      /fictional rejection/i
    );

    expect(
      await api(
        'PATCH',
        `/student/application/${correction.id}`,
        {
          session: correction.session,
          json: correction.fields
        }
      ),
      409,
      'Reject edits after final decision'
    );

    const deniedConfirmation = await api(
      'GET',
      `/student/application/${correction.id}/confirmation`,
      { session: correction.session }
    );

    assert.ok(
      [403, 404, 409].includes(deniedConfirmation.status),
      'A rejected student must not receive an admission confirmation'
    );

    const details = expect(
      await api(
        'GET',
        `/admin/applications/${correction.id}`,
        { session: admin }
      ),
      200,
      'Review audit'
    );

    assert.deepEqual(
      details.history.map(h => h.new_status).sort(),
      [
        'Submitted',
        'Under Review',
        'Correction Required',
        'Submitted',
        'Under Review',
        'Rejected'
      ].sort()
    );

    console.log(
      'ST-01 PASS: Correction, resubmission, rejection, terminal-state guard and audit history'
    );

    // SECURITY: ownership, roles, CSRF and upload checks.

    const secondStudent = await freshStudent(
      sessions
    );

    const photo = correction.docs.find(
      d => d.document_type === 'PHOTO'
    );

    const privatePath =
      `/applications/${correction.id}/documents/${photo.id}`;

    const anonymous = await api(
      'GET',
      privatePath
    );

    const crossOwner = await api(
      'GET',
      privatePath,
      { session: secondStudent }
    );

    assert.equal(anonymous.status, 401);

    assert.ok(
      [403, 404].includes(crossOwner.status)
    );

    expect(
      await api(
        'POST',
        `/admin/applications/${correction.id}/start-review`,
        { session: secondStudent }
      ),
      403,
      'Student cannot review'
    );

    const missingCsrf = await fetch(
      `${API}/student/profile`,
      {
        method: 'PATCH',
        headers: {
          Cookie: secondStudent.cookie,
          Origin: ORIGIN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: 'Tamper',
          date_of_birth: '2007-01-01',
          phone: '9876543210',
          address: 'Tamper'
        })
      }
    );

    assert.equal(missingCsrf.status, 403);

    const boundary = expect(
      await api(
        'POST',
        '/student/application',
        {
          session: secondStudent,
          json: {
            course_id: bca.id,
            class_x_percentage: 70,
            class_xii_percentage: 70,
            studied_physics: false,
            studied_mathematics: true,
            studied_computer_science: false
          }
        }
      ),
      201,
      'Create boundary Draft'
    );

    const bPath =
      `/student/application/${boundary.id}/documents`;

    const pdfBytes = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< >>\nendobj\n%%EOF\n'
    );

    expect(
      await api('POST', bPath, {
        session: secondStudent,
        form: formData(
          'PHOTO',
          pdfBytes,
          'not-a-photo.pdf'
        )
      }),
      400,
      'Reject PDF photo'
    );

    expect(
      await api('POST', bPath, {
        session: secondStudent,
        form: formData(
          'CLASS_X',
          Buffer.from('not an image'),
          'fake.png'
        )
      }),
      400,
      'Reject fake image signature'
    );

    const maxFile = Buffer.concat([
      PNG,
      Buffer.alloc(
        5 * 1024 * 1024 - PNG.length
      )
    ]);

    expect(
      await api('POST', bPath, {
        session: secondStudent,
        form: formData('PHOTO', maxFile)
      }),
      200,
      'Accept 5 MiB signature-valid PNG'
    );

    const tooBig = Buffer.concat([
      PNG,
      Buffer.alloc(
        5 * 1024 * 1024 - PNG.length + 1
      )
    ]);

    expect(
      await api('POST', bPath, {
        session: secondStudent,
        form: formData('PHOTO', tooBig)
      }),
      413,
      'Reject 5 MiB + 1 byte'
    );

    console.log(
      'SEC-01 PASS: Owner isolation, role, CSRF and upload-size/signature guards'
    );

    // CONCURRENCY: two applicants competing for one seat.

    const raceCourse = expect(
      await api(
        'POST',
        '/admin/courses',
        {
          session: admin,
          json: {
            name: `IT-RACE-${randomUUID().slice(0, 8)}`,
            seat_capacity: 1,
            min_xii_percentage: 45,
            subject_policy: 'NONE'
          }
        }
      ),
      201,
      'Create one-seat test course'
    );

    const first = await draftAndSubmit(
      sessions,
      raceCourse
    );

    const second = await draftAndSubmit(
      sessions,
      raceCourse
    );

    await startAndVerify(admin, first);
    await startAndVerify(admin, second);

    const results = await Promise.all([
      api(
        'POST',
        `/admin/applications/${first.id}/approve`,
        { session: admin }
      ),
      api(
        'POST',
        `/admin/applications/${second.id}/approve`,
        { session: admin }
      )
    ]);

    assert.deepEqual(
      results
        .map(r => r.status)
        .sort((a, b) => a - b),
      [200, 409]
    );

    const [raceRows] = await pool.execute(
      `SELECT status, COUNT(*) AS n
       FROM applications
       WHERE course_id = ?
       GROUP BY status`,
      [raceCourse.id]
    );

    assert.equal(
      Number(
        raceRows.find(
          r => r.status === 'Approved'
        )?.n
      ),
      1
    );

    assert.equal(
      Number(
        raceRows.find(
          r => r.status === 'Under Review'
        )?.n
      ),
      1
    );

    const [confirm] = await pool.execute(
      `SELECT COUNT(*) AS n
       FROM confirmations f
       JOIN applications a
         ON a.id = f.application_id
       WHERE a.course_id = ?`,
      [raceCourse.id]
    );

    assert.equal(
      Number(confirm[0].n),
      1
    );

    const raceAfter = expect(
      await api('GET', '/courses'),
      200,
      'Read one-seat course'
    ).courses.find(
      c => c.id === raceCourse.id
    );

    assert.equal(
      Number(raceAfter.approved_count),
      1
    );

    assert.equal(
      Number(raceAfter.available_seats),
      0
    );

    expect(
      await api(
        'PATCH',
        `/admin/courses/${raceCourse.id}`,
        {
          session: admin,
          json: {
            name: raceCourse.name,
            seat_capacity: 0,
            min_xii_percentage: 45,
            subject_policy: 'NONE'
          }
        }
      ),
      409,
      'Capacity below approved admissions denied'
    );

    console.log(
      'CON-01 PASS: Exactly one seat granted under simultaneous approval attempts'
    );

    // PERFORMANCE: five authenticated sessions.

    const profileSessions = [
      correction.session,
      secondStudent,
      first.session,
      second.session
    ];

    profileSessions.push(
      await freshStudent(sessions)
    );

    const readings = await Promise.all(
      profileSessions.map(async session => {
        const durations = [];

        for (let i = 0; i < 20; i++) {
          const start = performance.now();

          expect(
            await api(
              'GET',
              '/student/profile',
              { session }
            ),
            200,
            'Authenticated profile read'
          );

          durations.push(
            performance.now() - start
          );
        }

        return durations;
      })
    );

    const times = readings
      .flat()
      .sort((a, b) => a - b);

    const p95 =
      times[Math.ceil(0.95 * times.length) - 1];

    const median =
      (times[49] + times[50]) / 2;

    const underLimit = times.filter(
      ms => ms < 3000
    ).length;

    assert.ok(
      underLimit >= Math.ceil(times.length * 0.95),
      `NFR-01 p95 target failed: ${p95}ms`
    );

    console.log(
      `NFR-01 PASS: ${times.length} requests / 5 sessions; ` +
      `median=${median.toFixed(1)}ms, ` +
      `p95=${p95.toFixed(1)}ms, ` +
      `max=${times.at(-1).toFixed(1)}ms`
    );

    console.log(
      'PHASE-6 SANDBOX SYSTEM AND SECURITY SUITE PASSED'
    );
  }
);