
import test from 'node:test';
import assert from 'node:assert/strict';

const BASE = 'http://127.0.0.1:4001';

const ORIGIN = (
  process.env.APP_ORIGIN || 'http://127.0.0.1:5173'
).split(',')[0].trim();

const EMAIL =
  process.env.SEED_ADMIN_EMAIL || 'admin@stha.demo';

const PASSWORD = process.env.SEED_ADMIN_PASSWORD;

async function request(path, options = {}) {
  return fetch(`${BASE}${path}`, {
    redirect: 'manual',
    ...options
  });
}

test('ST-01: Authentication, session and CSRF security', async () => {
  assert.ok(
    PASSWORD,
    'SEED_ADMIN_PASSWORD must be configured in api/.env'
  );

  // ST-01A: Anonymous session
  const anonymous = await request('/api/me');

  assert.equal(anonymous.status, 200);

  const anonymousData = await anonymous.json();

  assert.equal(anonymousData.data.user, null);

  console.log('ST-01A PASS: Anonymous session rejected');

  // ST-01B: Unauthenticated modification
  const unauthenticated = await request('/api/auth/logout', {
    method: 'POST'
  });

  assert.equal(unauthenticated.status, 401);

  console.log('ST-01B PASS: Unauthenticated modification blocked');

  // ST-01C: Valid administrator login
  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN
    },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD
    })
  });

  assert.equal(
    login.status,
    200,
    `Administrator login failed with HTTP ${login.status}`
  );

  const loginData = await login.json();

  assert.equal(loginData.data.user.role, 'ADMIN');

  const csrf = loginData.data.csrfToken;

  assert.ok(typeof csrf === 'string' && csrf.length > 0);

  console.log('ST-01C PASS: Administrator authentication successful');

  // ST-01D: Secure session cookie properties
  const setCookie = login.headers.get('set-cookie') || '';

  assert.match(setCookie, /cams_sid=[0-9a-f]{64}/);

  assert.match(setCookie, /httponly/i);

  assert.match(setCookie, /samesite=strict/i);

  const cookie = setCookie.split(';')[0];

  console.log('ST-01D PASS: Session cookie protections verified');

  // ST-01E: Authenticated session
  const session = await request('/api/me', {
    headers: {
      Cookie: cookie
    }
  });

  assert.equal(session.status, 200);

  const sessionData = await session.json();

  assert.equal(sessionData.data.user.role, 'ADMIN');

  console.log('ST-01E PASS: Authenticated session retained');

  // ST-01F: Missing CSRF token
  const missingCsrf = await request('/api/auth/logout', {
    method: 'POST',
    headers: {
      Cookie: cookie,
      Origin: ORIGIN
    }
  });

  assert.equal(missingCsrf.status, 403);

  console.log('ST-01F PASS: Missing CSRF token rejected');

  // ST-01G: Invalid CSRF token
  const invalidCsrf = await request('/api/auth/logout', {
    method: 'POST',
    headers: {
      Cookie: cookie,
      Origin: ORIGIN,
      'X-CSRF-Token': 'invalid-token'
    }
  });

  assert.equal(invalidCsrf.status, 403);

  console.log('ST-01G PASS: Invalid CSRF token rejected');

  // ST-01H: Cross-origin modification
  const invalidOrigin = await request('/api/auth/logout', {
    method: 'POST',
    headers: {
      Cookie: cookie,
      Origin: 'https://attacker.example',
      'X-CSRF-Token': csrf
    }
  });

  assert.equal(invalidOrigin.status, 403);

  console.log('ST-01H PASS: Cross-origin modification rejected');

  // ST-01I: Proper authenticated logout
  const logout = await request('/api/auth/logout', {
    method: 'POST',
    headers: {
      Cookie: cookie,
      Origin: ORIGIN,
      'X-CSRF-Token': csrf
    }
  });

  assert.equal(logout.status, 200);

  console.log('ST-01I PASS: Authenticated logout successful');

  // ST-01J: Old session invalid after logout
  const expired = await request('/api/me', {
    headers: {
      Cookie: cookie
    }
  });

  assert.equal(expired.status, 200);

  const expiredData = await expired.json();

  assert.equal(expiredData.data.user, null);

  console.log('ST-01J PASS: Old session invalidated');

  console.log('ST-01 SECURITY REGRESSION PASSED');
});
