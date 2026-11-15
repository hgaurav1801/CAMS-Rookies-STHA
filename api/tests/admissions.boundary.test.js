
import test from "node:test";
import assert from "node:assert/strict";

import {
  eligibility,
  requireEditable,
  validateSubmission,
  validateApproval,
  REQUIRED_DOCUMENTS,
} from "../src/services/admissions.js";

// Synthetic test data
const application = {
  class_x_percentage: 80,
  class_xii_percentage: 75,
  studied_physics: true,
  studied_mathematics: true,
  studied_computer_science: false,
};

const profile = {
  full_name: "Test Student",
  phone: "9876543210",
  address: "Fictional Test Address",
  date_of_birth: "2007-01-01",
};

const courses = {
  cse: {
    min_xii_percentage: 60,
    subject_policy: "PHYSICS_MATH",
  },
  bca: {
    min_xii_percentage: 50,
    subject_policy: "MATH_OR_CS",
  },
  bba: {
    min_xii_percentage: 45,
    subject_policy: "NONE",
  },
};

const documents = REQUIRED_DOCUMENTS.map(
  (document_type) => ({ document_type })
);

function submit(
  app = application,
  student = profile,
  course = courses.cse,
  docs = documents
) {
  return validateSubmission(app, student, course, docs);
}

// UNIT TESTS — ELIGIBILITY

test("UT-01: CSE percentage boundary", () => {
  assert.equal(
    eligibility(courses.cse, {
      ...application,
      class_xii_percentage: 60,
    }),
    true
  );

  assert.equal(
    eligibility(courses.cse, {
      ...application,
      class_xii_percentage: 59.99,
    }),
    false
  );
});

test("UT-02: CSE requires both subjects", () => {
  assert.equal(
    eligibility(courses.cse, {
      ...application,
      studied_physics: false,
    }),
    false
  );

  assert.equal(
    eligibility(courses.cse, {
      ...application,
      studied_mathematics: false,
    }),
    false
  );
});

test("UT-03: BCA accepts Math OR CS", () => {
  assert.equal(
    eligibility(courses.bca, {
      ...application,
      studied_mathematics: true,
      studied_computer_science: false,
    }),
    true
  );

  assert.equal(
    eligibility(courses.bca, {
      ...application,
      studied_mathematics: false,
      studied_computer_science: true,
    }),
    true
  );

  assert.equal(
    eligibility(courses.bca, {
      ...application,
      studied_mathematics: false,
      studied_computer_science: false,
    }),
    false
  );
});

test("UT-04: BBA percentage boundary", () => {
  assert.equal(
    eligibility(courses.bba, {
      ...application,
      class_xii_percentage: 45,
    }),
    true
  );

  assert.equal(
    eligibility(courses.bba, {
      ...application,
      class_xii_percentage: 44.99,
    }),
    false
  );
});

test("UT-05: Invalid eligibility inputs", () => {
  for (const value of [null, undefined, "abc"]) {
    assert.equal(
      eligibility(courses.cse, {
        ...application,
        class_xii_percentage: value,
      }),
      false
    );
  }

  assert.equal(
    eligibility(
      { min_xii_percentage: 60, subject_policy: "UNKNOWN" },
      application
    ),
    false
  );
});

// UNIT TESTS — SUBMISSION VALIDATION

test("UT-06: Valid submission", () => {
  assert.doesNotThrow(() => submit());
});

test("UT-07: Missing profile rejected", () => {
  for (const field of [
    "full_name",
    "phone",
    "address",
    "date_of_birth",
  ]) {
    assert.throws(
      () => submit(application, { ...profile, [field]: "" }),
      /complete the profile/
    );
  }
});

test("UT-08: All four documents required", () => {
  for (const type of REQUIRED_DOCUMENTS) {
    const incomplete = documents.filter(
      (doc) => doc.document_type !== type
    );

    assert.throws(
      () => submit(application, profile, courses.cse, incomplete),
      /complete the profile/
    );
  }
});

test("UT-09: Negative percentages rejected", () => {
  for (const field of [
    "class_x_percentage",
    "class_xii_percentage",
  ]) {
    assert.throws(
      () => submit({ ...application, [field]: -0.01 }),
      /complete the profile/
    );
  }
});

test("UT-10: Percentages above 100 rejected", () => {
  for (const field of [
    "class_x_percentage",
    "class_xii_percentage",
  ]) {
    assert.throws(
      () => submit({ ...application, [field]: 100.01 }),
      /complete the profile/
    );
  }
});

test("UT-11: Non-numeric percentages rejected", () => {
  for (const field of [
    "class_x_percentage",
    "class_xii_percentage",
  ]) {
    assert.throws(
      () => submit({ ...application, [field]: "abc" }),
      /complete the profile/
    );
  }
});

test("UT-12: Missing percentage values rejected", () => {
  for (const field of [
    "class_x_percentage",
    "class_xii_percentage",
  ]) {
    for (const value of [null, undefined]) {
      assert.throws(
        () => submit({ ...application, [field]: value }),
        /complete the profile/
      );
    }
  }
});

test("UT-13: Ineligible application rejected", () => {
  assert.throws(
    () =>
      submit(
        { ...application, class_xii_percentage: 59.99 },
        profile,
        courses.cse
      ),
    /complete the profile/
  );
});

test("UT-14: Missing course rejected", () => {
  assert.throws(
    () => submit(application, profile, null),
    /complete the profile/
  );
});

// UNIT TESTS — APPLICATION STATES

test("UT-15: Editable states permitted", () => {
  assert.doesNotThrow(() => requireEditable("Draft"));
  assert.doesNotThrow(() =>
    requireEditable("Correction Required")
  );
});

test("UT-16: Non-editable states rejected", () => {
  for (const status of [
    "Submitted",
    "Under Review",
    "Approved",
    "Rejected",
  ]) {
    assert.throws(
      () => requireEditable(status),
      /Only Draft or Correction Required/
    );
  }
});

// UNIT TESTS — APPROVAL

const approval = {
  status: "Under Review",
  verified: true,
  eligible: true,
  seats: 1,
};

test("UT-17: Valid approval permitted", () => {
  assert.equal(validateApproval(approval), true);
});

test("UT-18: Incorrect approval state rejected", () => {
  for (const status of [
    "Draft",
    "Submitted",
    "Correction Required",
    "Approved",
    "Rejected",
  ]) {
    assert.throws(
      () => validateApproval({ ...approval, status }),
      /not Under Review/
    );
  }
});

test("UT-19: Unverified documents block approval", () => {
  assert.throws(
    () => validateApproval({ ...approval, verified: false }),
    /All required documents/
  );
});

test("UT-20: Ineligible applicant cannot be approved", () => {
  assert.throws(
    () => validateApproval({ ...approval, eligible: false }),
    /All required documents/
  );
});

test("UT-21: Zero or negative seats block approval", () => {
  for (const seats of [0, -1]) {
    assert.throws(
      () => validateApproval({ ...approval, seats }),
      /No seats/
    );
  }
});

// DEFECT DETECTION TEST

test("UT-22: Blank Class X marks must be rejected", () => {
  assert.throws(
    () =>
      submit({
        ...application,
        class_x_percentage: "",
      }),
    /complete the profile/
  );
});


test("UT-23: Blank and invalid-type percentages rejected", () => {
  for (const field of [
    "class_x_percentage",
    "class_xii_percentage",
  ]) {
    for (const value of ["   ", true, false, [], {}]) {
      assert.throws(
        () => submit({ ...application, [field]: value }),
        /complete the profile/
      );
    }
  }
});
