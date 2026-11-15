
import test from 'node:test';
import assert from 'node:assert/strict';

const API = 'http://127.0.0.1:4000';
const WEB = 'http://127.0.0.1:5173';

// IT-01: Backend availability
test('IT-01: Backend health endpoint', async () => {
  const response = await fetch(`${API}/api/health`);

  assert.equal(response.status, 200);

  const result = await response.json();

  assert.equal(result.data.status, 'ok');
});

// IT-01B: Frontend availability
test('IT-01B: React frontend is accessible', async () => {
  const response = await fetch(WEB);

  assert.equal(response.status, 200);

  const html = await response.text();

  assert.match(html, /<html/i);
});

// IT-02: Course catalogue and database-backed values
test('IT-02: Course catalogue consistency', async () => {
  const response = await fetch(`${API}/api/courses`);

  assert.equal(response.status, 200);

  const result = await response.json();

  const { cycle, courses } = result.data;

  assert.equal(cycle.display_name, 'DEMO-2027-28');
  assert.equal(courses.length, 3);

  const expected = {
    'B.Tech CSE': {
      capacity: 60,
      minimum: 60,
      policy: 'PHYSICS_MATH'
    },
    BBA: {
      capacity: 40,
      minimum: 45,
      policy: 'NONE'
    },
    BCA: {
      capacity: 60,
      minimum: 50,
      policy: 'MATH_OR_CS'
    }
  };

  for (const course of courses) {
    const rule = expected[course.name];

    assert.ok(rule, `Unexpected course: ${course.name}`);

    assert.equal(Number(course.seat_capacity), rule.capacity);
    assert.equal(Number(course.min_xii_percentage), rule.minimum);
    assert.equal(course.subject_policy, rule.policy);

    assert.equal(
      Number(course.available_seats),
      Number(course.seat_capacity) -
        Number(course.approved_count)
    );
  }
});

// IT-04: Management endpoint must require authentication
test('IT-04: Unauthenticated management access denied', async () => {
  const response = await fetch(
    `${API}/api/management/reports`
  );

  assert.ok(
    [401, 403].includes(response.status),
    `Expected 401 or 403, received ${response.status}`
  );
});

// IT-05: Student endpoint must require authentication
test('IT-05: Unauthenticated student access denied', async () => {
  const response = await fetch(
    `${API}/api/student/application`
  );

  assert.ok(
    [401, 403].includes(response.status),
    `Expected 401 or 403, received ${response.status}`
  );
});
