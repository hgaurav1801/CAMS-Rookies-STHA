
import test from 'node:test';
import assert from 'node:assert/strict';

const BASE = 'http://127.0.0.1:4000/api';
const ORIGIN = 'http://127.0.0.1:5173';

const APPLICATION_ID =
  'e9ad161a-34f9-468b-8a76-f8da845f482a';

const REQUIRED_DOCUMENTS = [
  'PHOTO',
  'CLASS_X',
  'CLASS_XII',
  'IDENTITY'
];

async function request(path, options = {}) {
  const {
    method = 'GET',
    session,
    json
  } = options;

  const headers = {};

  if (session) headers.Cookie = session.cookie;

  if (method !== 'GET') {
    headers.Origin = ORIGIN;
    if (session) {
      headers['X-CSRF-Token'] = session.csrf;
    }
  }

  const config = { method, headers };

  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(json);
  }

  const response = await fetch(`${BASE}${path}`, config);
  const payload = await response.json().catch(() => null);

  return {
    status: response.status,
    data: payload?.data,
    payload,
    response
  };
}

function expectStatus(result, expected, label) {
  assert.equal(
    result.status,
    expected,
    `${label}: expected HTTP ${expected}, received ` +
      `${result.status}. ${JSON.stringify(result.payload)}`
  );

  return result.data;
}

async function login(role, prefix) {
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];

  assert.ok(email && password, `${role} credentials missing`);

  const result = await request('/auth/login', {
    method: 'POST',
    json: { email, password }
  });

  const data = expectStatus(result, 200, `${role} login`);

  assert.equal(data.user.role, role);
  assert.ok(data.csrfToken);

  const sessionCookie = result.response.headers
    .getSetCookie()
    .find(value => value.startsWith('cams_sid='));

  assert.ok(sessionCookie, 'Session cookie missing');

  return {
    cookie: sessionCookie.split(';')[0],
    csrf: data.csrfToken
  };
}

async function logout(session) {
  await request('/auth/logout', {
    method: 'POST',
    session
  });
}

async function details(session) {
  const result = await request(
    `/admin/applications/${APPLICATION_ID}`,
    { session }
  );

  return expectStatus(result, 200, 'Application details');
}

async function courseCatalogue() {
  const result = await request('/courses');
  return expectStatus(result, 200, 'Course catalogue').courses;
}

function findCourse(courses, id) {
  const course = courses.find(item => item.id === id);
  assert.ok(course, `Course ${id} not found`);
  return course;
}

test('IT-08: Administrator review and approval integration', async t => {
  const sessions = [];

  t.after(async () => {
    await Promise.allSettled(sessions.map(logout));
  });

  // Authenticate all required roles.
  const admin = await login('ADMIN', 'IT_ADMIN');
  sessions.push(admin);

  const student = await login('STUDENT', 'IT07_STUDENT');
  sessions.push(student);

  const management = await login(
    'MANAGEMENT',
    'IT_MANAGEMENT'
  );
  sessions.push(management);

  const path = `/admin/applications/${APPLICATION_ID}`;

  // IT-08A: Initial state and application access
  const initial = await details(admin);

  assert.equal(initial.application.status, 'Submitted');
  assert.equal(initial.application.course_name, 'BCA');
  assert.equal(initial.application.full_name, 'CAMS IT07 Student');
  assert.equal(Boolean(initial.eligible), true);
  assert.equal(initial.documents.length, 4);

  assert.deepEqual(
    initial.documents.map(d => d.document_type).sort(),
    [...REQUIRED_DOCUMENTS].sort()
  );

  for (const document of initial.documents) {
    assert.equal(document.verification_state, 'PENDING');
  }

  const submittedQueue = await request(
    '/admin/applications?status=Submitted',
    { session: admin }
  );

  const queue = expectStatus(
    submittedQueue,
    200,
    'Submitted application queue'
  );

  assert.ok(queue.some(a => a.id === APPLICATION_ID));

  const beforeCourses = await courseCatalogue();
  const beforeBCA = findCourse(
    beforeCourses,
    initial.application.course_id
  );

  assert.ok(Number(beforeBCA.available_seats) > 0);

  console.log('IT-08A PASS: Submitted application and documents found');

  // IT-08B: Role restrictions
  expectStatus(
    await request(path, { session: management }),
    403,
    'Management access to admin application'
  );

  expectStatus(
    await request(`${path}/start-review`, {
      method: 'POST',
      session: student
    }),
    403,
    'Student cannot start admin review'
  );

  expectStatus(
    await request(`${path}/start-review`, {
      method: 'POST',
      session: management
    }),
    403,
    'Management cannot start review'
  );

  console.log('IT-08B PASS: Non-admin review access denied');

  // IT-08C: Begin review
  expectStatus(
    await request(`${path}/approve`, {
      method: 'POST',
      session: admin
    }),
    409,
    'Cannot approve before review'
  );

  const started = await request(`${path}/start-review`, {
    method: 'POST',
    session: admin
  });

  assert.equal(
    expectStatus(started, 200, 'Begin review').status,
    'Under Review'
  );

  assert.equal(
    (await details(admin)).application.status,
    'Under Review'
  );

  expectStatus(
    await request(`${path}/start-review`, {
      method: 'POST',
      session: admin
    }),
    409,
    'Repeated review transition must fail'
  );

  console.log('IT-08C PASS: Review state transition recorded');

  // IT-08D: Approval must be blocked until verification
  expectStatus(
    await request(`${path}/approve`, {
      method: 'POST',
      session: admin
    }),
    409,
    'Unverified documents must block approval'
  );

  const firstDocument = initial.documents.find(
    item => item.document_type === 'PHOTO'
  );

  const verificationPath =
    `${path}/documents/${firstDocument.id}/verification`;

  expectStatus(
    await request(verificationPath, {
      method: 'PATCH',
      session: admin,
      json: { verification_state: 'INVALID' }
    }),
    400,
    'Invalid verification state'
  );

  const notVerified = await request(verificationPath, {
    method: 'PATCH',
    session: admin,
    json: { verification_state: 'NOT_VERIFIED' }
  });

  assert.equal(
    expectStatus(notVerified, 200, 'Mark not verified')
      .verification_state,
    'NOT_VERIFIED'
  );

  expectStatus(
    await request(`${path}/approve`, {
      method: 'POST',
      session: admin
    }),
    409,
    'Not-verified documents must block approval'
  );

  console.log('IT-08D PASS: Approval validation enforced');

  // IT-08E: Verify all four files
  for (const document of initial.documents) {
    const result = await request(
      `${path}/documents/${document.id}/verification`,
      {
        method: 'PATCH',
        session: admin,
        json: { verification_state: 'VERIFIED' }
      }
    );

    const updated = expectStatus(
      result,
      200,
      `Verify ${document.document_type}`
    );

    assert.equal(updated.verification_state, 'VERIFIED');
  }

  const verifiedCase = await details(admin);

  assert.equal(verifiedCase.application.status, 'Under Review');

  assert.equal(
    verifiedCase.documents.filter(
      d => d.verification_state === 'VERIFIED'
    ).length,
    4
  );

  console.log('IT-08E PASS: All four documents verified');

  // IT-08F: Transactional approval
  const beforeApproval = findCourse(
    await courseCatalogue(),
    initial.application.course_id
  );

  const approvedResponse = await request(`${path}/approve`, {
    method: 'POST',
    session: admin
  });

  expectStatus(approvedResponse, 200, 'Approve admission');

  const finalCase = await details(admin);

  assert.equal(finalCase.application.status, 'Approved');

  const history = finalCase.history;

  assert.ok(
    history.some(
      h => h.old_status === 'Submitted' &&
           h.new_status === 'Under Review'
    ),
    'Missing start-review audit event'
  );

  assert.ok(
    history.some(
      h => h.old_status === 'Under Review' &&
           h.new_status === 'Approved'
    ),
    'Missing approval audit event'
  );

  console.log('IT-08F PASS: Admission approved and audited');

  // IT-08G: Seat consistency
  const afterCourses = await courseCatalogue();
  const afterBCA = findCourse(
    afterCourses,
    initial.application.course_id
  );

  assert.equal(
    Number(afterBCA.approved_count),
    Number(beforeApproval.approved_count) + 1
  );

  assert.equal(
    Number(afterBCA.available_seats),
    Number(beforeApproval.available_seats) - 1
  );

  for (const before of beforeCourses) {
    if (before.id === initial.application.course_id) continue;

    const after = findCourse(afterCourses, before.id);

    assert.equal(
      Number(after.approved_count),
      Number(before.approved_count),
      `Unexpected approval count change in ${before.name}`
    );
  }

  console.log('IT-08G PASS: Exactly one BCA seat allocated');

  // IT-08H: Student status and final state restrictions
  const studentStatus = await request(
    `/student/application/${APPLICATION_ID}/status`,
    { session: student }
  );

  assert.equal(
    expectStatus(studentStatus, 200, 'Student status').status,
    'Approved'
  );

  expectStatus(
    await request(`${path}/approve`, {
      method: 'POST',
      session: admin
    }),
    409,
    'Duplicate approval must fail'
  );

  expectStatus(
    await request(verificationPath, {
      method: 'PATCH',
      session: admin,
      json: { verification_state: 'VERIFIED' }
    }),
    409,
    'Document verification after approval must fail'
  );

  const approvedQueue = await request(
    '/admin/applications?status=Approved',
    { session: admin }
  );

  assert.ok(
    expectStatus(approvedQueue, 200, 'Approved queue')
      .some(a => a.id === APPLICATION_ID)
  );

  const finalBCA = findCourse(
    await courseCatalogue(),
    initial.application.course_id
  );

  assert.equal(
    Number(finalBCA.approved_count),
    Number(afterBCA.approved_count)
  );

  console.log('IT-08H PASS: Student status and restrictions correct');
  console.log('IT-08 WORKFLOW COMPLETED SUCCESSFULLY');
  console.log(`Test application ID: ${APPLICATION_ID}`);
});
