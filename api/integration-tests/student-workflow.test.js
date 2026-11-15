
import test from 'node:test';
import assert from 'node:assert/strict';
import PDFDocument from 'pdfkit';

const API = 'http://127.0.0.1:4000';
const ORIGIN = 'http://127.0.0.1:5173';

const EMAIL = process.env.IT07_STUDENT_EMAIL;
const PASSWORD = process.env.IT07_STUDENT_PASSWORD;

const PROFILE = {
  full_name: 'CAMS IT07 Student',
  date_of_birth: '2007-01-01',
  phone: '9000000007',
  address: 'Fictional Test Campus, Kolkata'
};

const DOCUMENT_TYPES = [
  'PHOTO',
  'CLASS_X',
  'CLASS_XII',
  'IDENTITY'
];

async function request(path, options = {}) {
  const {
    method = 'GET',
    cookie,
    csrf,
    json,
    body
  } = options;

  const headers = {};

  if (cookie) headers.Cookie = cookie;
  if (method !== 'GET') headers.Origin = ORIGIN;
  if (csrf) headers['X-CSRF-Token'] = csrf;

  let requestBody = body;

  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(json);
  }

  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: requestBody
  });

  const payload = await response.json().catch(() => null);

  return {
    status: response.status,
    payload
  };
}

function expectStatus(result, expected, label) {
  assert.equal(
    result.status,
    expected,
    `${label}: expected HTTP ${expected}, received ${result.status}. ` +
    JSON.stringify(result.payload)
  );

  return result.payload?.data;
}

async function createPdf(label) {
  const document = new PDFDocument({ size: 'A4' });
  const chunks = [];

  const completed = new Promise((resolve, reject) => {
    document.on('data', chunk => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);
  });

  document.fontSize(20).text(`CAMS Integration Test - ${label}`);
  document.moveDown();
  document.fontSize(12).text(
    'FICTIONAL TEST DOCUMENT - NOT A REAL IDENTITY OR ACADEMIC RECORD'
  );
  document.moveDown();
  document.text('Student: CAMS IT07 Student');
  document.text('Purpose: Phase 6 integration testing');
  document.text('Developer: Rookies');
  document.text('Client simulation: STHA');

  document.end();
  return completed;
}

// Minimal synthetic PNG for the photograph upload.
// It is not a picture of any actual applicant.
const PHOTO = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwC' +
  'AAAAC0lEQVR42mP8/x8AAwMCAO+/R48AAAAASUVORK5CYII=',
  'base64'
);

test('IT-07B/C/D: Complete student admission integration', async (t) => {
  assert.ok(EMAIL && PASSWORD, 'IT07 credentials are missing');

  // Authenticate
  const login = await fetch(`${API}/api/auth/login`, {
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

  assert.equal(login.status, 200);

  const loginData = (await login.json()).data;
  assert.equal(loginData.user.role, 'STUDENT');

  const csrf = loginData.csrfToken;

  const sessionHeader = login.headers.getSetCookie()
    .find(value => value.startsWith('cams_sid='));

  assert.ok(sessionHeader);

  const cookie = sessionHeader.split(';')[0];

  const auth = { cookie, csrf };

  // Invalidate the test session after execution.
  t.after(async () => {
    await request('/api/auth/logout', {
      method: 'POST',
      ...auth
    }).catch(() => {});
  });

  // This test must run against an unused account.
  const existing = await request('/api/student/application', auth);

  expectStatus(existing, 200, 'Read existing application');
  assert.equal(
    existing.payload?.data,
    null,
    'This student already has an application. Use a fresh test account.'
  );

  // Obtain real course ID.
  const catalogue = await request('/api/courses');

  const courses = expectStatus(catalogue, 200, 'Course catalogue')
    .courses;

  const course = courses.find(item => item.name === 'BCA');

  assert.ok(course, 'BCA course not available');

  const applicationInput = {
    course_id: course.id,
    class_x_percentage: 86,
    class_xii_percentage: 78,
    studied_physics: false,
    studied_mathematics: true,
    studied_computer_science: true
  };

  // ---------------------------------------------
  // IT-07B: Profile and application draft
  // ---------------------------------------------

  const savedProfile = await request('/api/student/profile', {
    method: 'PATCH',
    ...auth,
    json: PROFILE
  });

  const profileData = expectStatus(
    savedProfile,
    200,
    'Save student profile'
  );

  assert.equal(profileData.full_name, PROFILE.full_name);

  const profileReadback = await request('/api/student/profile', auth);

  assert.equal(
    expectStatus(profileReadback, 200, 'Profile readback').full_name,
    PROFILE.full_name
  );

  const draft = await request('/api/student/application', {
    method: 'POST',
    ...auth,
    json: applicationInput
  });

  const created = expectStatus(draft, 201, 'Create application draft');

  assert.ok(created.id);
  assert.equal(created.status, 'Draft');

  const applicationId = created.id;

  const duplicate = await request('/api/student/application', {
    method: 'POST',
    ...auth,
    json: applicationInput
  });

  expectStatus(duplicate, 409, 'Duplicate application must be denied');

  console.log('IT-07B PASS: Profile saved and draft created');
  console.log('IT-07B PASS: Duplicate application rejected');

  // ---------------------------------------------
  // IT-07C: Document upload and verification
  // ---------------------------------------------

  const earlySubmission = await request(
    `/api/student/application/${applicationId}/submit`,
    {
      method: 'POST',
      ...auth
    }
  );

  expectStatus(
    earlySubmission,
    400,
    'Submission without required documents must fail'
  );

  const unchanged = await request('/api/student/application', auth);

  assert.equal(
    expectStatus(unchanged, 200, 'Draft state verification').status,
    'Draft'
  );

  console.log('IT-07C PASS: Incomplete submission rejected');

  for (const type of DOCUMENT_TYPES) {
    const bytes = type === 'PHOTO'
      ? PHOTO
      : await createPdf(type);

    const mime = type === 'PHOTO'
      ? 'image/png'
      : 'application/pdf';

    const filename = type === 'PHOTO'
      ? 'synthetic-photo.png'
      : `fictional-${type.toLowerCase()}.pdf`;

    const form = new FormData();

    form.append('document_type', type);
    form.append('file', new Blob([bytes], { type: mime }), filename);

    const uploaded = await request(
      `/api/student/application/${applicationId}/documents`,
      {
        method: 'POST',
        ...auth,
        body: form
      }
    );

    const uploadData = expectStatus(
      uploaded,
      200,
      `Upload ${type}`
    );

    assert.equal(uploadData.document_type, type);
    assert.equal(uploadData.mime_type, mime);
    assert.equal(uploadData.size_bytes, bytes.length);

    console.log(`IT-07C PASS: ${type} uploaded`);
  }

  const documentResponse = await request(
    `/api/student/application/${applicationId}/documents`,
    auth
  );

  const documents = expectStatus(
    documentResponse,
    200,
    'List uploaded documents'
  );

  assert.equal(documents.length, 4);

  assert.deepEqual(
    documents.map(item => item.document_type).sort(),
    [...DOCUMENT_TYPES].sort()
  );

  for (const document of documents) {
    assert.equal(document.verification_state, 'PENDING');
  }

  // Verify that an uploaded document can be retrieved.
  const firstDocument = documents[0];

  const download = await fetch(
    `${API}/api/applications/${applicationId}/documents/${firstDocument.id}`,
    { headers: { Cookie: cookie } }
  );

  assert.equal(download.status, 200);
  assert.equal(download.headers.get('cache-control'), 'no-store');

  const downloadedBytes = Buffer.from(await download.arrayBuffer());

  assert.equal(downloadedBytes.length, firstDocument.size_bytes);

  console.log('IT-07C PASS: All four documents persisted');
  console.log('IT-07C PASS: Private document retrieval succeeded');

  // ---------------------------------------------
  // IT-07D: Final application submission
  // ---------------------------------------------

  const submission = await request(
    `/api/student/application/${applicationId}/submit`,
    {
      method: 'POST',
      ...auth
    }
  );

  const submitted = expectStatus(
    submission,
    200,
    'Final application submission'
  );

  assert.equal(submitted.status, 'Submitted');

  const statusResponse = await request(
    `/api/student/application/${applicationId}/status`,
    auth
  );

  const statusData = expectStatus(
    statusResponse,
    200,
    'Application status readback'
  );

  assert.equal(statusData.status, 'Submitted');
  assert.ok(statusData.submitted_at);

  // Submitted applications must become read-only.
  const editAfterSubmit = await request(
    `/api/student/application/${applicationId}`,
    {
      method: 'PATCH',
      ...auth,
      json: applicationInput
    }
  );

  expectStatus(
    editAfterSubmit,
    409,
    'Editing a submitted application must be denied'
  );

  console.log('IT-07D PASS: Application submitted');
  console.log('IT-07D PASS: Status persisted');
  console.log('IT-07D PASS: Submitted application is read-only');

  console.log('IT-07 WORKFLOW COMPLETED SUCCESSFULLY');
  console.log(`Test application ID: ${applicationId}`);
});
