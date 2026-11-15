
import { fail } from '../lib/errors.js';

export const REQUIRED_DOCUMENTS = [
  'PHOTO',
  'CLASS_X',
  'CLASS_XII',
  'IDENTITY'
];

// Check course eligibility
export function eligibility(course, application) {
  const marks = Number(application?.class_xii_percentage);

  if (
    application?.class_xii_percentage === null ||
    application?.class_xii_percentage === undefined ||
    !Number.isFinite(marks) ||
    marks < Number(course.min_xii_percentage)
  ) {
    return false;
  }

  if (course.subject_policy === 'PHYSICS_MATH') {
    return (
      Boolean(application.studied_physics) &&
      Boolean(application.studied_mathematics)
    );
  }

  if (course.subject_policy === 'MATH_OR_CS') {
    return (
      Boolean(application.studied_mathematics) ||
      Boolean(application.studied_computer_science)
    );
  }

  if (course.subject_policy === 'NONE') {
    return true;
  }

  return false;
}

// Check whether an application can be edited
export function requireEditable(status) {
  if (!['Draft', 'Correction Required'].includes(status)) {
    fail(
      409,
      'INVALID_STATE',
      'Only Draft or Correction Required applications may be edited.'
    );
  }
}

// Validate application before submission
export function validateSubmission(
  application,
  profile,
  course,
  documents
) {
  const fields = {};

  // Validate required student profile fields
  for (const key of [
    'full_name',
    'phone',
    'address',
    'date_of_birth'
  ]) {
    if (!profile?.[key]) {
      fields[key] = 'This profile field is required.';
    }
  }

  // Validate Class X and Class XII percentages
  // DEF-001 FIX: Reject blank and invalid-type values
  for (const key of [
    'class_x_percentage',
    'class_xii_percentage'
  ]) {
    const value = application?.[key];

    const isMissing =
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '');

    const invalidType =
      typeof value !== 'number' &&
      typeof value !== 'string';

    const percentage = invalidType ? NaN : Number(value);

    if (
      isMissing ||
      !Number.isFinite(percentage) ||
      percentage < 0 ||
      percentage > 100
    ) {
      fields[key] = 'Enter a percentage between 0 and 100.';
    }
  }

  // Validate course eligibility
  if (!course || !eligibility(course, application)) {
    fields.course_id =
      'The applicant does not meet the selected course eligibility conditions.';
  }

  // Validate all four required documents
  const types = new Set(
    documents.map((x) => x.document_type)
  );

  for (const type of REQUIRED_DOCUMENTS) {
    if (!types.has(type)) {
      fields[`document_${type}`] =
        'This supporting document is required.';
    }
  }

  // Reject incomplete applications
  if (Object.keys(fields).length) {
    fail(
      400,
      'INCOMPLETE_APPLICATION',
      'Please complete the profile, form and required documents.',
      fields
    );
  }
}

// Validate administrator approval conditions
export function validateApproval({
  status,
  verified,
  eligible,
  seats
}) {
  if (status !== 'Under Review') {
    fail(
      409,
      'INVALID_STATE',
      'The application is not Under Review.'
    );
  }

  if (!verified || !eligible) {
    fail(
      409,
      'NOT_VERIFIED',
      'All required documents and eligibility must be verified.'
    );
  }

  if (seats <= 0) {
    fail(
      409,
      'NO_SEATS',
      'No seats are available for this course.'
    );
  }

  return true;
}
