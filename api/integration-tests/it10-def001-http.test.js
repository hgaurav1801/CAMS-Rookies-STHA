import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pool } from '../src/lib/db.js';

const API = 'http://127.0.0.1:4001/api';
const ORIGIN = 'http://127.0.0.1:5173';
const REQUIRED_DB = 'cams_phase6_test';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+t8b8AAAAASUVORK5CYII=',
  'base64'
);

if (process.env.DB_NAME !== REQUIRED_DB) {
  throw new Error('SAFETY STOP: run only with DB_NAME=cams_phase6_test');
}

async function send(
  route,
  { method = 'GET', session, json, form } = {}
) {
  const headers = {};

  if (session) {
    headers.Cookie = session.cookie;
  }

  if (method !== 'GET') {
    headers.Origin = ORIGIN;

    if (session) {
      headers['X-CSRF-Token'] = session.csrf;
    }
  }

  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API}${route}`, {
    method,
    headers,
    body: form ?? (
      json === undefined ? undefined : JSON.stringify(json)
    )
  });

  const body = await response.json().catch(() => null);

  return {
    status: response.status,
    data: body?.data,
    code: body?.error?.code
  };
}

function status(result, expected, label) {
  assert.equal(
    result.status,
    expected,
    `${label}: HTTP ${result.status}, error ${result.code ?? 'none'}`
  );

  return result.data;
}

async function sqlRow(id) {
  const [rows] = await pool.execute(
    `SELECT
       status,
       class_x_percentage,
       class_xii_percentage,
       submitted_at
     FROM applications
     WHERE id = ?`,
    [id]
  );

  assert.equal(rows.length, 1);

  return rows[0];
}

async function count(table, id) {
  const allowed = {
    documents: 'documents',
    history: 'review_history'
  };

  assert.ok(allowed[table]);

  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS n
     FROM ${allowed[table]}
     WHERE application_id = ?`,
    [id]
  );

  return Number(rows[0].n);
}

test(
  'IT-10 / DEF-001: blank Class X is rejected across the real HTTP boundary',
  async t => {
    const health = await send('/health');

    status(health, 200, 'Isolated API health');

    const [db] = await pool.query(
      'SELECT DATABASE() AS db'
    );

    assert.equal(db[0].db, REQUIRED_DB);

    const email = `cams-it10-${randomUUID()}@example.com`;
    const password = `X!7p-${randomUUID()}`;

    let session;

    t.after(async () => {
      if (session) {
        await send('/auth/logout', {
          method: 'POST',
          session
        }).catch(() => {});
      }

      await pool.end();
    });

    status(
      await send('/auth/register', {
        method: 'POST',
        json: { email, password }
      }),
      201,
      'Synthetic registration'
    );

    const authResponse = await fetch(
      `${API}/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: ORIGIN
        },
        body: JSON.stringify({ email, password })
      }
    );

    assert.equal(authResponse.status, 200);

    const cookie = authResponse.headers
      .getSetCookie()
      .find(c => c.startsWith('cams_sid='))
      ?.split(';')[0];

    const body = await authResponse.json();

    assert.equal(
      body?.data?.user?.role,
      'STUDENT'
    );

    assert.ok(cookie && body?.data?.csrfToken);

    session = {
      cookie,
      csrf: body.data.csrfToken
    };

    const profile = {
      full_name: 'CAMS IT10 Synthetic',
      date_of_birth: '2007-01-01',
      phone: '9876543210',
      address: 'Fictional sandbox address'
    };

    status(
      await send('/student/profile', {
        method: 'PATCH',
        session,
        json: profile
      }),
      200,
      'Complete profile'
    );

    const courseData = status(
      await send('/courses'),
      200,
      'Course list'
    );

    const course = courseData.courses.find(
      c => c.name === 'BCA'
    );

    assert.ok(course);

    const validForm = {
      course_id: course.id,
      class_x_percentage: 85,
      class_xii_percentage: 70,
      studied_physics: false,
      studied_mathematics: true,
      studied_computer_science: false
    };

    const created = status(
      await send('/student/application', {
        method: 'POST',
        session,
        json: validForm
      }),
      201,
      'Create isolated Draft'
    );

    const id = created.id;

    assert.ok(id);
    assert.equal(created.status, 'Draft');

    for (const document_type of [
      'PHOTO',
      'CLASS_X',
      'CLASS_XII',
      'IDENTITY'
    ]) {
      const form = new FormData();

      form.set('document_type', document_type);

      form.set(
        'file',
        new Blob([png], { type: 'image/png' }),
        `${document_type}.png`
      );

      status(
        await send(
          `/student/application/${id}/documents`,
          {
            method: 'POST',
            session,
            form
          }
        ),
        200,
        `${document_type} upload`
      );
    }

    assert.equal(
      await count('documents', id),
      4
    );

    console.log(
      'IT-10A PASS: Dedicated Draft, complete profile and four synthetic files'
    );

    const beforeBlank = await sqlRow(id);

    assert.equal(
      Number(beforeBlank.class_x_percentage),
      85
    );

    for (const invalid of ['', '   ']) {
      const attempt = await send(
        `/student/application/${id}`,
        {
          method: 'PATCH',
          session,
          json: {
            ...validForm,
            class_x_percentage: invalid
          }
        }
      );

      status(
        attempt,
        400,
        'Blank/whitespace Class X HTTP PATCH'
      );

      assert.deepEqual(
        await sqlRow(id),
        beforeBlank
      );
    }

    console.log(
      'IT-10B PASS: HTTP rejects blank/whitespace Class X; stored Draft row unchanged'
    );

    status(
      await send(
        `/student/application/${id}`,
        {
          method: 'PATCH',
          session,
          json: {
            ...validForm,
            class_x_percentage: null
          }
        }
      ),
      200,
      'Save incomplete Draft'
    );

    const beforeSubmit = await sqlRow(id);

    assert.equal(
      beforeSubmit.class_x_percentage,
      null
    );

    assert.equal(
      beforeSubmit.status,
      'Draft'
    );

    assert.equal(
      await count('documents', id),
      4
    );

    status(
      await send(
        `/student/application/${id}/submit`,
        {
          method: 'POST',
          session
        }
      ),
      400,
      'Reject incomplete submission'
    );

    assert.deepEqual(
      await sqlRow(id),
      beforeSubmit
    );

    assert.equal(
      await count('history', id),
      0
    );

    console.log(
      'IT-10C PASS: Submission rejects missing Class X, no state/history changes'
    );

    console.log(
      'IT-10 DEF-001 HTTP REGRESSION PASSED'
    );

    console.log(
      'Isolated fixture application ID:',
      id
    );
  }
);