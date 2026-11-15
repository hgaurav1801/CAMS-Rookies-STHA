import { z } from 'zod';
import { fail } from './errors.js';

export function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const fields = Object.fromEntries(result.error.issues.map(e => [e.path.join('.'), e.message]));
    fail(400, 'VALIDATION_FAILED', 'Please correct the highlighted fields.', fields);
  }
  return result.data;
}
export const email = z.string().trim().toLowerCase().email().max(254);
export const password = z.string().min(8).max(128);
export const profileSchema = z.object({
  full_name: z.string().trim().max(120),
  date_of_birth: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]),
  phone: z.string().trim().max(20),
  address: z.string().trim().max(300)
}).strict();

const percentage = z.union([z.number(), z.string()])
  .transform(value => {
    if (typeof value === 'string' && value.trim() === '') {
      return NaN;
    }
    return Number(value);
  })
  .refine(
    value => Number.isFinite(value) && value >= 0 && value <= 100,
    'Enter a percentage from 0 to 100'
  );

export const applicationSchema = z.object({
  course_id: z.string().uuid(),
  class_x_percentage: percentage.nullish(),
  class_xii_percentage: percentage.nullish(),
  studied_physics: z.boolean().default(false),
  studied_mathematics: z.boolean().default(false),
  studied_computer_science: z.boolean().default(false)
}).strict();
export const courseSchema = z.object({
  name: z.string().trim().min(2).max(100),
  seat_capacity: z.coerce.number().int().min(0).max(100000),
  min_xii_percentage: z.coerce.number().min(0).max(100),
  subject_policy: z.enum(['PHYSICS_MATH', 'MATH_OR_CS', 'NONE'])
}).strict();
export const reasonSchema = z.object({ reason: z.string().trim().min(3).max(1000) }).strict();
export const documentTypes = ['PHOTO','CLASS_X','CLASS_XII','IDENTITY'];
export const states = ['Draft','Submitted','Under Review','Correction Required','Approved','Rejected'];
