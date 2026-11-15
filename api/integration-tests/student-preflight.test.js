
import test from 'node:test';
import assert from 'node:assert/strict';

const API = 'http://127.0.0.1:4000';
const ORIGIN = 'http://127.0.0.1:5173';

test('IT-07A: Student integration preflight', async (t) => {
  const email = process.env.IT07_STUDENT_EMAIL;
  const password = process.env.IT07_STUDENT_PASSWORD;

  assert.ok(email && password, 'Missing IT07 credentials');

  // Authenticate using the real API
  const login = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN
    },
    body: JSON.stringify({ email, password })
  });

  assert.equal(login.status, 200, 'Student login failed');

  const result = await login.json();
  assert.equal(result.data.user.role, 'STUDENT');

  const csrf = result.data.csrfToken;
  assert.ok(csrf);

  const cookies = login.headers.getSetCookie();
  const session = cookies.find(c => c.startsWith('cams_sid='));
  assert.ok(session);

  const cookie = session.split(';')[0];

  // Automatically end the test session
  t.after(async () => {
    await fetch(`${API}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: cookie,
        Origin: ORIGIN,
        'X-CSRF-Token': csrf
      }
    });
  });

  // Verify student profile API
  const profile = await fetch(`${API}/api/student/profile`, {
    headers: { Cookie: cookie }
  });

  assert.equal(profile.status, 200);
  console.log('Student profile endpoint: PASS');

  // Verify student application API
  const application = await fetch(
    `${API}/api/student/application`,
    { headers: { Cookie: cookie } }
  );

  assert.equal(application.status, 200);

  const payload = await application.json();
  const record = payload.data?.application ??
    (payload.data?.id && payload.data?.status
      ? payload.data
      : null);

  assert.equal(
    record,
    null,
    'Use a new fictional student without an existing application'
  );

  console.log('Student application endpoint: PASS');
  console.log('No pre-existing application: PASS');
});
