
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const BASE = 'http://127.0.0.1:4001';
const REQUIRED_DB = 'cams_phase6_test';

function log(message) {
  console.log(`ST-03 PASS: ${message}`);
}

async function request(endpoint, {
  method = 'GET',
  session = null,
  body = null,
  form = null
} = {}) {
  const headers = {};

  if (session?.cookie) {
    headers.Cookie = session.cookie;
  }

  if (session?.csrfToken && method !== 'GET') {
    headers['X-CSRF-Token'] = session.csrfToken;
  }

  if (body !== null) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE}${endpoint}`, {
    method,
    headers,
    body: form ?? (body !== null ? JSON.stringify(body) : undefined)
  });

  const contentType = response.headers.get('content-type') || '';

  const result = contentType.includes('application/json')
    ? await response.json()
    : Buffer.from(await response.arrayBuffer());

  return {
    status: response.status,
    headers: response.headers,
    result
  };
}

async function register(email, password) {
  const response = await request('/api/auth/register', {
    method: 'POST',
    body: { email, password }
  });

  assert.equal(
    response.status,
    201,
    `Registration failed: ${JSON.stringify(response.result)}`
  );

  return response;
}

async function login(email, password) {
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password }
  });

  assert.equal(
    response.status,
    200,
    `Login failed: ${JSON.stringify(response.result)}`
  );

  const setCookie = response.headers.get('set-cookie') || '';

  assert.match(setCookie, /cams_sid=/);

  const csrfToken = response.result?.data?.csrfToken;

  assert.ok(csrfToken, 'CSRF token missing from login response.');

  return {
    cookie: setCookie.split(';')[0],
    csrfToken
  };
}

function requiredEnvironment(name) {
  const value = process.env[name];

  assert.ok(
    value,
    `Required environment variable ${name} is missing.`
  );

  return value;
}

test('ST-03: Private document access security', async () => {
  // Prevent running against the live database.
  assert.equal(
    process.env.DB_NAME,
    REQUIRED_DB,
    'STOP: This security test requires the isolated Phase 6 database.'
  );

  const health = await request('/api/health');

  assert.equal(health.status, 200);
  assert.equal(health.result?.data?.status, 'ok');

  // ----------------------------------------
  // ST-03A: Create two independent students
  // ----------------------------------------

  const suffix = randomUUID().replaceAll('-', '');

  const ownerEmail = `st03-owner-${suffix}@example.test`;
  const otherEmail = `st03-other-${suffix}@example.test`;

  const studentPassword = `ST03-Secure-${randomUUID()}!`;

  await register(ownerEmail, studentPassword);
  await register(otherEmail, studentPassword);

  const owner = await login(ownerEmail, studentPassword);
  const otherStudent = await login(otherEmail, studentPassword);

  log('Two independent student accounts authenticated');

  // ----------------------------------------
  // Create owner's student profile
  // ----------------------------------------

  const profileResponse = await request('/api/student/profile', {
    method: 'PATCH',
    session: owner,
    body: {
      full_name: 'ST03 Test Student',
      date_of_birth: '2007-01-01',
      phone: '9876543210',
      address: 'Fictional ST03 Test Address'
    }
  });

  assert.equal(
    profileResponse.status,
    200,
    `Profile creation failed: ${JSON.stringify(profileResponse.result)}`
  );

  // ----------------------------------------
  // Create a draft application
  // ----------------------------------------

  const catalogue = await request('/api/courses');

  assert.equal(catalogue.status, 200);

  const courses = catalogue.result?.data?.courses;

  assert.ok(Array.isArray(courses));

  const course = courses.find(c => c.name === 'B.Tech CSE');

  assert.ok(course, 'B.Tech CSE course was not found.');

  const draft = await request('/api/student/application', {
    method: 'POST',
    session: owner,
    body: {
      course_id: course.id,
      class_x_percentage: 85,
      class_xii_percentage: 85,
      studied_physics: true,
      studied_mathematics: true,
      studied_computer_science: true
    }
  });

  assert.ok(
    [200, 201].includes(draft.status),
    `Draft creation failed: ${JSON.stringify(draft.result)}`
  );

  const applicationId =
    draft.result?.data?.id ??
    draft.result?.data?.application?.id;

  assert.ok(applicationId, 'Application ID was not returned.');

  // ----------------------------------------
  // ST-03B: Upload a valid PNG document
  // ----------------------------------------

  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwC' +
    'AAAAC0lEQVR42mP8/x8AAusB9YLc9f0AAAAASUVORK5CYII=';

  const fileBuffer = Buffer.from(pngBase64, 'base64');

  const form = new FormData();

  form.append('document_type', 'PHOTO');

  form.append(
    'file',
    new Blob([fileBuffer], { type: 'image/png' }),
    'st03-test.png'
  );

  const upload = await request(
    `/api/student/application/${applicationId}/documents`,
    {
      method: 'POST',
      session: owner,
      form
    }
  );

  assert.equal(
    upload.status,
    200,
    `Document upload failed: ${JSON.stringify(upload.result)}`
  );

  const listing = await request(
    `/api/student/application/${applicationId}/documents`,
    { session: owner }
  );

  assert.equal(listing.status, 200);

  const document = listing.result?.data?.find(
    d => d.document_type === 'PHOTO'
  );

  assert.ok(document, 'Uploaded PHOTO document not found.');

  const documentId = document.id;

  const documentUrl =
    `/api/applications/${applicationId}/documents/${documentId}`;

  log('Valid private document uploaded and recorded');

  // ----------------------------------------
  // ST-03C: Anonymous access must be denied
  // ----------------------------------------

  const anonymous = await request(documentUrl);

  assert.equal(anonymous.status, 401);

  log('Anonymous document access denied');

  // ----------------------------------------
  // ST-03D: Another student must be denied
  // ----------------------------------------

  const unauthorizedStudent = await request(documentUrl, {
    session: otherStudent
  });

  assert.equal(unauthorizedStudent.status, 404);

  log('Cross-student document access denied');

  // ----------------------------------------
  // ST-03E: MANAGEMENT document access denied
  // ----------------------------------------

  const management = await login(
    requiredEnvironment('IT_MANAGEMENT_EMAIL'),
    requiredEnvironment('IT_MANAGEMENT_PASSWORD')
  );

  const managementAccess = await request(documentUrl, {
    session: management
  });

  assert.equal(managementAccess.status, 403);

  log('Management access to private documents denied');

  // ----------------------------------------
  // ST-03F: Owner can retrieve own document
  // ----------------------------------------

  const ownerAccess = await request(documentUrl, {
    session: owner
  });

  assert.equal(ownerAccess.status, 200);

  assert.equal(
    ownerAccess.headers.get('content-type'),
    'image/png'
  );

  assert.equal(
    ownerAccess.headers.get('cache-control'),
    'no-store'
  );

  assert.ok(Buffer.isBuffer(ownerAccess.result));

  assert.deepEqual(ownerAccess.result, fileBuffer);

  log('Document owner retrieved correct private file');

  // ----------------------------------------
  // ST-03G: Administrator can retrieve document
  // ----------------------------------------

  const admin = await login(
    requiredEnvironment('IT_ADMIN_EMAIL'),
    requiredEnvironment('IT_ADMIN_PASSWORD')
  );

  const adminAccess = await request(documentUrl, {
    session: admin
  });

  assert.equal(adminAccess.status, 200);

  assert.deepEqual(adminAccess.result, fileBuffer);

  log('Authorized administrator retrieved correct file');

  // ----------------------------------------
  // ST-03H: Invalid document ID rejected
  // ----------------------------------------

  const invalidId = await request(
    `/api/applications/${applicationId}/documents/not-a-uuid`,
    { session: owner }
  );

  assert.equal(invalidId.status, 400);

  const unknownId = await request(
    `/api/applications/${applicationId}/documents/${randomUUID()}`,
    { session: owner }
  );

  assert.equal(unknownId.status, 404);

  log('Malformed and unknown document identifiers rejected');

  // ----------------------------------------
  // ST-03I: Logout invalidates document access
  // ----------------------------------------

  const logout = await request('/api/auth/logout', {
    method: 'POST',
    session: owner
  });

  assert.equal(logout.status, 200);

  const afterLogout = await request(documentUrl, {
    session: owner
  });

  assert.equal(afterLogout.status, 401);

  log('Logged-out student cannot retrieve private documents');

  console.log('--------------------------------------------');
  console.log('ST-03 DOCUMENT SECURITY REGRESSION PASSED');
  console.log('--------------------------------------------');
  console.log(`Test application ID: ${applicationId}`);
});
