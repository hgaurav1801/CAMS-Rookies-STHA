
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const BASE = 'http://127.0.0.1:4001';
const ORIGIN = (
  process.env.APP_ORIGIN || 'http://127.0.0.1:5173'
).split(',')[0].trim();

const credentials = {
  ADMIN: {
    email: process.env.SEED_ADMIN_EMAIL ||
      process.env.IT_ADMIN_EMAIL ||
      'admin@stha.demo',
    password: process.env.SEED_ADMIN_PASSWORD ||
      process.env.IT_ADMIN_PASSWORD
  },
  MANAGEMENT: {
    email: process.env.SEED_MANAGEMENT_EMAIL ||
      process.env.IT_MANAGEMENT_EMAIL ||
      'management@stha.demo',
    password: process.env.SEED_MANAGEMENT_PASSWORD ||
      process.env.IT_MANAGEMENT_PASSWORD
  }
};

async function request(path, {
  method = 'GET',
  cookie,
  csrf,
  body
} = {}) {
  const headers = {};

  if (cookie) headers.Cookie = cookie;
  if (csrf) headers['X-CSRF-Token'] = csrf;

  if (method !== 'GET') headers.Origin = ORIGIN;

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    redirect: 'manual',
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {})
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    // Some successful responses may have no JSON body.
  }

  return { response, status: response.status, data };
}

async function login(role, email, password) {
  assert.ok(email && password, `Missing ${role} credentials`);

  const result = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password }
  });

  assert.equal(
    result.status,
    200,
    `${role} login failed: HTTP ${result.status}. ` +
    JSON.stringify(result.data?.error || {})
  );

  assert.equal(result.data?.data?.user?.role, role);

  const csrf = result.data.data.csrfToken;
  const cookie = (
    result.response.headers.get('set-cookie') || ''
  ).split(';')[0];

  assert.ok(csrf, `${role} CSRF token missing`);
  assert.match(cookie, /^cams_sid=[0-9a-f]{64}$/);

  return { role, cookie, csrf };
}

async function prepareStudent() {
  const configuredEmail = process.env.ST02_STUDENT_EMAIL;
  const configuredPassword = process.env.ST02_STUDENT_PASSWORD;

  if (configuredEmail && configuredPassword) {
    return login('STUDENT', configuredEmail, configuredPassword);
  }

  const email =
    `st02-${crypto.randomUUID()}@example.com`;

  const password =
    `St02-${crypto.randomBytes(18).toString('base64url')}`;

  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: { email, password }
  });

  assert.equal(
    registration.status,
    201,
    `Sandbox student registration failed: HTTP ` +
    registration.status
  );

  console.log('ST-02 SETUP: Sandbox student created');

  return login('STUDENT', email, password);
}

async function expectStatus(label, path, expected, options = {}) {
  const result = await request(path, options);

  assert.equal(
    result.status,
    expected,
    `${label}: Expected HTTP ${expected}, ` +
    `received ${result.status}. ` +
    JSON.stringify(result.data?.error || {})
  );

  if (expected === 403) {
    assert.equal(
      result.data?.error?.code,
      'FORBIDDEN',
      `${label}: Rejection must come from role authorization`
    );
  }

  console.log(`${label} PASS`);
  return result;
}

async function expectAllowed(label, path, session) {
  return expectStatus(label, path, 200, {
    cookie: session.cookie
  });
}

async function expectDenied(label, path, session) {
  return expectStatus(label, path, 403, {
    cookie: session.cookie
  });
}

async function expectMutationDenied(label, path, session, method = 'POST') {
  return expectStatus(label, path, 403, {
    method,
    cookie: session.cookie,
    csrf: session.csrf,
    body: {}
  });
}

async function logout(session) {
  if (!session) return;

  await request('/api/auth/logout', {
    method: 'POST',
    cookie: session.cookie,
    csrf: session.csrf
  });
}

test('ST-02: Role-based access control', {
  timeout: 30000
}, async () => {
  assert.ok(
    credentials.ADMIN.password,
    'SEED_ADMIN_PASSWORD or IT_ADMIN_PASSWORD is required'
  );

  assert.ok(
    credentials.MANAGEMENT.password,
    'SEED_MANAGEMENT_PASSWORD or IT_MANAGEMENT_PASSWORD is required'
  );

  const sessions = [];

  try {
    // Verify the isolated API is available.
    await expectStatus(
      'ST-02A: Sandbox API health',
      '/api/health',
      200
    );

    // Anonymous access must be denied.
    await expectStatus(
      'ST-02B: Anonymous admin access denied',
      '/api/admin/applications',
      401
    );

    await expectStatus(
      'ST-02C: Anonymous student access denied',
      '/api/student/profile',
      401
    );

    await expectStatus(
      'ST-02D: Anonymous management access denied',
      '/api/management/reports',
      401
    );

    // Authenticate each role independently.
    const student = await prepareStudent();
    sessions.push(student);

    const admin = await login(
      'ADMIN',
      credentials.ADMIN.email,
      credentials.ADMIN.password
    );
    sessions.push(admin);

    const management = await login(
      'MANAGEMENT',
      credentials.MANAGEMENT.email,
      credentials.MANAGEMENT.password
    );
    sessions.push(management);

    console.log('ST-02E PASS: All three role sessions authenticated');

    // STUDENT: own endpoint allowed.
    await expectAllowed(
      'ST-02F: Student profile access',
      '/api/student/profile',
      student
    );

    // STUDENT: staff functions denied.
    await expectDenied(
      'ST-02G: Student denied admin queue',
      '/api/admin/applications',
      student
    );

    await expectDenied(
      'ST-02H: Student denied management reports',
      '/api/management/reports',
      student
    );

    // ADMIN: admin endpoint allowed.
    await expectAllowed(
      'ST-02I: Admin application queue access',
      '/api/admin/applications',
      admin
    );

    // ADMIN: other role-specific endpoints denied.
    await expectDenied(
      'ST-02J: Admin denied student profile endpoint',
      '/api/student/profile',
      admin
    );

    await expectDenied(
      'ST-02K: Admin denied management reports',
      '/api/management/reports',
      admin
    );

    // MANAGEMENT: reporting allowed.
    await expectAllowed(
      'ST-02L: Management reporting access',
      '/api/management/reports',
      management
    );

    // MANAGEMENT: operational endpoints denied.
    await expectDenied(
      'ST-02M: Management denied admin queue',
      '/api/admin/applications',
      management
    );

    await expectDenied(
      'ST-02N: Management denied student profile',
      '/api/student/profile',
      management
    );

    // Mutations include valid CSRF tokens.
    // A 403 FORBIDDEN must therefore come from needRole.

    await expectMutationDenied(
      'ST-02O: Student cannot create courses',
      '/api/admin/courses',
      student
    );

    await expectMutationDenied(
      'ST-02P: Management cannot create courses',
      '/api/admin/courses',
      management
    );

    await expectMutationDenied(
      'ST-02Q: Admin cannot create student applications',
      '/api/student/application',
      admin
    );

    await expectMutationDenied(
      'ST-02R: Management cannot create student applications',
      '/api/student/application',
      management
    );

    const fakeId =
      '00000000-0000-4000-8000-000000000000';

    await expectMutationDenied(
      'ST-02S: Student cannot approve admissions',
      `/api/admin/applications/${fakeId}/approve`,
      student
    );

    await expectMutationDenied(
      'ST-02T: Management cannot approve admissions',
      `/api/admin/applications/${fakeId}/approve`,
      management
    );

    console.log('ST-02 RBAC SECURITY REGRESSION PASSED');

  } finally {
    // Close all test sessions without changing applications.
    await Promise.allSettled(sessions.map(logout));
  }
});
