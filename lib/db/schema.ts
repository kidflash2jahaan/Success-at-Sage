import { pgTable, uuid, text, integer, timestamp, pgEnum, index, primaryKey, jsonb } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['student', 'admin'])
export const materialTypeEnum = pgEnum('material_type', ['note', 'test'])
export const contentTypeEnum = pgEnum('content_type', ['pdf', 'richtext'])
export const statusEnum = pgEnum('status', ['pending', 'approved', 'rejected'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  graduatingYear: integer('graduating_year').notNull(),
  role: roleEnum('role').notNull().default('student'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  colorAccent: text('color_accent').notNull(),
})

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  slug: text('slug').notNull().unique(),
})

export const units = pgTable('units', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  orderIndex: integer('order_index').notNull(),
})

export const materials = pgTable('materials', {
  id: uuid('id').primaryKey().defaultRandom(),
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
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.courseId] }),
])
