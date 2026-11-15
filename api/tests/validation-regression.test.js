import test from 'node:test';
import assert from 'node:assert/strict';
import { applicationSchema } from '../src/lib/validation.js';

const valid = {
  course_id: '061234b0-5dad-46d6-aacb-80d68353e028',
  class_x_percentage: 80,
  class_xii_percentage: 75,
  studied_physics: true,
  studied_mathematics: true,
  studied_computer_science: false
};

test('UT-24: Empty and whitespace-only marks fail HTTP schema validation', () => {
  for (const field of ['class_x_percentage', 'class_xii_percentage']) {
    for (const value of ['', ' ', '\t\n', '   ']) {
      const outcome = applicationSchema.safeParse({
        ...valid,
        [field]: value
      });

      assert.equal(
        outcome.success,
        false,
        `${field}: ${JSON.stringify(value)} was accepted`
      );
    }
  }
});

test('UT-25: Valid numeric marks, including 0 and 100, are accepted', () => {
  for (const marks of [0, 50, 100, '0', '50', '100']) {
    const outcome = applicationSchema.safeParse({
      ...valid,
      class_x_percentage: marks
    });

    assert.equal(
      outcome.success,
      true,
      `Valid mark ${marks} was rejected`
    );
  }
});

test('UT-26: Invalid numeric and out-of-range marks are rejected', () => {
  for (const marks of [-1, 101, '-0.01', '100.01', 'abc', 'Infinity']) {
    const outcome = applicationSchema.safeParse({
      ...valid,
      class_x_percentage: marks
    });

    assert.equal(
      outcome.success,
      false,
      `Invalid mark ${marks} was accepted`
    );
  }
});