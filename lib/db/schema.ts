import { pgTable, uuid, text, integer, timestamp, date, pgEnum, index, primaryKey, jsonb, boolean } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['student', 'admin'])
export const materialTypeEnum = pgEnum('material_type', ['note', 'test'])
export const contentTypeEnum = pgEnum('content_type', ['pdf', 'richtext'])
export const statusEnum = pgEnum('status', ['pending', 'approved', 'rejected'])
export const schoolRequestStatusEnum = pgEnum('school_request_status', ['pending', 'approved', 'rejected'])

// ============================================================================
// Tenant-management tables
// ============================================================================

export const schools = pgTable('schools', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  displayShort: text('display_short').notNull(),
  contestEnabled: boolean('contest_enabled').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const schoolDomains = pgTable('school_domains', {
  schoolId: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  domain: text('domain').notNull().unique(),
}, (t) => [
  primaryKey({ columns: [t.schoolId, t.domain] }),
])

export const schoolRequests = pgTable('school_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposedSlug: text('proposed_slug').notNull(),
  proposedName: text('proposed_name').notNull(),
  proposedDisplayShort: text('proposed_display_short').notNull(),
  proposedDomains: text('proposed_domains').array().notNull(),
  requesterName: text('requester_name').notNull(),
  requesterEmail: text('requester_email').notNull(),
  requesterRole: text('requester_role'),
  notes: text('notes'),
  status: schoolRequestStatusEnum('status').notNull().default('pending'),
  reviewNote: text('review_note'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('school_requests_status_idx').on(t.status),
  index('school_requests_requester_email_idx').on(t.requesterEmail),
])

// ============================================================================
// Tenant-scoped tables
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  graduatingYear: integer('graduating_year').notNull(),
  role: roleEnum('role').notNull().default('student'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  colorAccent: text('color_accent').notNull(),
})

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  slug: text('slug').notNull().unique(),
})

export const units = pgTable('units', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  orderIndex: integer('order_index').notNull(),
})

export const materials = pgTable('materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  unitId: uuid('unit_id').notNull().references(() => units.id, { onDelete: 'cascade' }),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  title: text('title').notNull(),
  type: materialTypeEnum('type').notNull(),
  contentType: contentTypeEnum('content_type').notNull(),
  contentJson: jsonb('content_json'),
  pdfPath: text('pdf_path'),
  status: statusEnum('status').notNull().default('pending'),
  rejectionNote: text('rejection_note'),
  viewCount: integer('view_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('materials_unit_id_idx').on(t.unitId),
  index('materials_status_idx').on(t.status),
])

export const userCourses = pgTable('user_courses', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.courseId] }),
])

// ============================================================================
// Contest tables — schema mirrors the live DB (contestSettings uses
// school_id as its primary key after migration 0005).
// ============================================================================

export const contestSettings = pgTable('contest_settings', {
  schoolId: uuid('school_id').primaryKey().references(() => schools.id),
  periodStart: date('period_start').notNull(),
  nextResetDate: date('next_reset_date').notNull(),
  prizeDescription: text('prize_description').notNull(),
})

export const contestWinners = pgTable('contest_winners', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  periodLabel: text('period_label').notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
