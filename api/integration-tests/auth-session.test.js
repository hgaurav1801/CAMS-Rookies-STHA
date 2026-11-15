
import test from 'node:test';
import assert from 'node:assert/strict';

const API = 'http://127.0.0.1:4000';
const ORIGIN = 'http://127.0.0.1:5173';

const accounts = [
  {
    id: 'IT-06C',
    role: 'STUDENT',
    email: process.env.IT_STUDENT_EMAIL,
    password: process.env.IT_STUDENT_PASSWORD
  },
  {
    id: 'IT-06D',
    role: 'ADMIN',
    email: process.env.IT_ADMIN_EMAIL,
    password: process.env.IT_ADMIN_PASSWORD
  },
  {
    id: 'IT-06E',
    role: 'MANAGEMENT',
    email: process.env.IT_MANAGEMENT_EMAIL,
    password: process.env.IT_MANAGEMENT_PASSWORD
  }
];

function assertCredentials(account) {
  assert.ok(
    account.email && account.password,
    `Missing IT credentials for ${account.role} in api/.env`
  );
}

function getSessionCookie(response) {
  const cookies =
    response.headers.getSetCookie?.() ??
    [response.headers.get('set-cookie')];

  const session = cookies
    .filter(Boolean)
    .find(cookie => cookie.startsWith('cams_sid='));

  assert.ok(session, 'Session cookie was not issued');

  return session.split(';')[0];
}

async function getCurrentUser(cookie) {
  const response = await fetch(`${API}/api/me`, {
    headers: cookie ? { Cookie: cookie } : {}
  });

  assert.equal(response.status, 200);

  return (await response.json()).data;
}

async function logout(cookie, csrf) {
  return fetch(`${API}/api/auth/logout`, {
    method: 'POST',
    headers: {
      Cookie: cookie,
      Origin: ORIGIN,
      'X-CSRF-Token': csrf
    }
  });
}

// IT-06A: Anonymous session
test('IT-06A: Anonymous user has no session', async () => {
  const data = await getCurrentUser();

  assert.equal(data.user, null);
  assert.equal(data.csrfToken, null);
});

// IT-06B: Incorrect login
test('IT-06B: Incorrect password is rejected', async () => {
  const student = accounts[0];

  assertCredentials(student);

  const response = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN
    },
    body: JSON.stringify({
      email: student.email,
      password: 'DefinitelyIncorrectPassword123!'
    })
  });

  assert.equal(response.status, 401);
});

// IT-06C/D/E: Role-specific authenticated sessions
for (const account of accounts) {
  test(`${account.id}: ${account.role} session and logout`, async (t) => {
    assertCredentials(account);

    const response = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: ORIGIN
      },
      body: JSON.stringify({
        email: account.email,
        password: account.password
      })
    });

    assert.equal(
      response.status,
      200,
      `${account.role} login failed with HTTP ${response.status}`
    );

    const result = await response.json();

    assert.equal(result.data.user.role, account.role);

    const csrf = result.data.csrfToken;
    assert.ok(csrf, 'Missing CSRF token');

    const cookie = getSessionCookie(response);

    let loggedOut = false;

    // Cleanup if a later assertion fails
    t.after(async () => {
      if (!loggedOut) {
        try {
          await logout(cookie, csrf);
        } catch {
          // Preserve the original test failure
        }
      }
    });

    // Session must identify the correct user
    const current = await getCurrentUser(cookie);

    assert.equal(current.user.role, account.role);
    assert.equal(current.user.email, account.email);
    assert.equal(current.csrfToken, csrf);

    // CSRF must prevent a logout without its token
    const denied = await fetch(`${API}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: cookie,
        Origin: ORIGIN
      }
    });

    assert.equal(denied.status, 403);

    // Failed logout must leave the session valid
    const stillLoggedIn = await getCurrentUser(cookie);
    assert.equal(stillLoggedIn.user.role, account.role);

    // Verify management report permissions
    if (account.role === 'STUDENT') {
      const forbidden = await fetch(
        `${API}/api/management/reports`,
        { headers: { Cookie: cookie } }
      );

      assert.equal(forbidden.status, 403);
    }

    if (account.role === 'MANAGEMENT') {
      const allowed = await fetch(
        `${API}/api/management/reports`,
        { headers: { Cookie: cookie } }
      );

      assert.equal(allowed.status, 200);
    }

    // Valid logout
    const logoutResponse = await logout(cookie, csrf);

    assert.ok(
      logoutResponse.status >= 200 &&
      logoutResponse.status < 300,
      'Logout request failed'
    );

    loggedOut = true;

    // Old session cookie must no longer authenticate
    const afterLogout = await getCurrentUser(cookie);

    assert.equal(afterLogout.user, null);
    assert.equal(afterLogout.csrfToken, null);
  });
}
