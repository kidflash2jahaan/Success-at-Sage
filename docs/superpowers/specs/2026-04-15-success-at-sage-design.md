# Success at Sage — Design Spec

**Date:** 2026-04-15  
**Project:** successatsage (Next.js 16 + Supabase)  
**Status:** Approved

---

## 1. Overview

Success at Sage is a study platform for Sage Hill High School students. Students log in, add their courses to a personal schedule, and access community-submitted study notes and past tests organized by department → course → unit. All submitted content is reviewed and approved by an admin before going live.

---

## 2. Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router + TypeScript |
| Styling | Tailwind CSS 4 |
| Auth | Supabase Auth (Google OAuth + email/password) |
| Database | Supabase PostgreSQL + Row-Level Security |
| ORM | Drizzle ORM |
| File storage | Supabase Storage (PDFs) |
| Rich text | Tiptap editor (JSON stored in DB) |
| Email | Resend (transactional notifications) |
| Deployment | Vercel |

---

## 3. Visual Design

- **Theme:** Dark mode only
- **Background:** Dark navy (`#1a1a2e` / `#16213e`)
- **Accents:** Per-department color (purple `#a78bfa`, blue `#60a5fa`, green `#34d399`, amber `#fbbf24`, etc.)
- **Typography:** Sans-serif, high-contrast white text on dark backgrounds
- **Style:** Glassmorphism cards with subtle colored borders matching department accent

---

## 4. User Roles & Auth

### Roles
- **`student`** — default role on signup
- **`admin`** — full platform management

### Authentication
- Google OAuth (primary) — note: Sage Hill Google Workspace restrictions may apply, to be resolved
- Email/password (fallback)
- Both flows land on the same onboarding step to collect `full_name` and `graduating_year`

### Admin bootstrapping
- `ADMIN_EMAILS` environment variable (comma-separated list)
- On signup, if a user's email matches any entry in `ADMIN_EMAILS`, they are assigned `admin` role automatically
- Subsequent admins can be promoted via `/admin/users`

### Access control
- All material content (notes, tests) requires login — no public material viewing
- Course and department pages are publicly browsable (no materials shown, just metadata)
- All admin routes (`/admin/*`) are server-side protected; non-admins receive a 404

---

## 5. Data Model

### `users`
```
id            uuid  (references auth.users)
email         text
full_name     text
graduating_year  integer
role          enum('student', 'admin')  default 'student'
created_at    timestamp
```
**Grade calculation:** `12 - (graduating_year - current_school_year)`  
e.g. graduating 2027 in school year 2025–26 → Grade 11 (Junior)

### `departments`
```
id            uuid
name          text           e.g. "Mathematics"
slug          text           e.g. "mathematics"
color_accent  text           e.g. "#a78bfa"
```

### `courses`
```
id            uuid
department_id uuid  → departments
name          text           e.g. "AP Calculus BC"
description   text
slug          text           e.g. "ap-calculus-bc"
```

### `units`
```
id            uuid
course_id     uuid  → courses
title         text           e.g. "Unit 3: Derivatives"
order_index   integer
```

### `materials`
```
id            uuid
unit_id       uuid  → units
uploaded_by   uuid  → users
title         text
type          enum('note', 'test')
content_type  enum('pdf', 'richtext')
content_json  jsonb    nullable  (Tiptap JSON if richtext)
pdf_path      text     nullable  (Supabase Storage path if pdf)
status        enum('pending', 'approved', 'rejected')  default 'pending'
rejection_note text   nullable
view_count    integer  default 0   (incremented when a logged-in student opens the material)
created_at    timestamp
```

### `user_courses`
```
user_id       uuid  → users
course_id     uuid  → courses
added_at      timestamp
PRIMARY KEY (user_id, course_id)
```

### Row-Level Security policies
- `materials`: students can SELECT where `status = 'approved'`; students can INSERT (own submissions); students can SELECT own rows regardless of status; admins bypass all restrictions
- `user_courses`: users can only SELECT/INSERT/DELETE their own rows
- `users`: users can only SELECT/UPDATE their own row; admins can SELECT all

---

## 6. Pages & Navigation

### Public (unauthenticated)
| Route | Description |
|---|---|
| `/` | Landing page — hero, site description, department previews, Sign In / Sign Up CTAs |
| `/login` | Sign in with Google or email/password |
| `/signup` | Create account — name, email, password, graduating year |
| `/browse` | Browse all departments and courses (metadata only, no materials) |
| `/courses/[slug]` | Course overview — units listed, material counts shown, Add to Schedule button (requires login to add) |

### Student (authenticated)
| Route | Description |
|---|---|
| `/dashboard` | Sidebar layout — course list on left, selected course content (units → materials) on right |
| `/courses/[slug]/units/[id]` | Unit page — approved materials listed; PDF viewer or rich text renderer; Upload button |
| `/submit` | Submit form — select course, unit, title, type (note/test), then PDF upload or Tiptap editor |
| `/profile` | Name, grade (calculated), graduating year, my submissions with statuses |

### Admin only
| Route | Description |
|---|---|
| `/admin` | Dashboard — pending submissions count, recent activity |
| `/admin/submissions` | Review queue — approve/reject with optional rejection note, inline preview |
| `/admin/courses` | Manage departments, courses, units (create/edit/delete) |
| `/admin/users` | View all users, promote to admin, deactivate accounts |

---

## 7. Content Flow

### Submission
1. Student opens `/submit`, selects course + unit, enters title, picks type (note or test)
2. Student chooses content format: PDF upload or Tiptap rich text editor
3. PDF uploads go directly from browser → Supabase Storage via signed upload URL
4. A `materials` row is created with `status: 'pending'`
5. Student sees submission on their profile as "Pending Review"

### Review
1. Admin sees pending count on `/admin` dashboard
2. `/admin/submissions` lists all pending items
3. Admin previews inline (PDF embedded viewer or rendered rich text)
4. **Approve** → `status = 'approved'`, Resend email sent to student: "Your submission was approved"
5. **Reject** → `status = 'rejected'`, admin enters optional rejection note, Resend email sent: "Your submission was not approved" + note

### Visibility
- Only `approved` materials appear on course/unit pages
- Students see all their own submissions (including pending/rejected) on `/profile`

---

## 8. Dashboard Layout

- **Desktop:** Fixed left sidebar (course list) + main content panel
- **Mobile:** Sidebar collapses to hamburger menu → slides open as a full-height drawer
- Sidebar shows student's added courses grouped by department accent color
- "Browse Courses" link at the bottom of the sidebar
- Global search bar in the top nav — searches material titles and course names across the platform

---

## 9. Global Search

- Search input in the top navigation bar (visible on all authenticated pages)
- Queries `materials.title` (approved only) and `courses.name` in real time
- Results grouped by type: Courses / Notes / Past Tests
- Clicking a result navigates to the relevant unit page or course page

---

## 10. Email Notifications (Resend)

| Trigger | Recipient | Content |
|---|---|---|
| Submission approved | Student | Material title, course name, link to the material |
| Submission rejected | Student | Material title, rejection note (if provided), encouragement to resubmit |

---

## 11. Placeholder Courses (to be expanded)

### Mathematics
- Algebra I, Geometry, Algebra II, Pre-Calculus, AP Calculus AB, AP Calculus BC, AP Statistics

### Science
- Biology, Chemistry, Physics, AP Biology, AP Chemistry, AP Physics 1, AP Physics C

### English
- English 9, English 10, AP Language & Composition, AP Literature & Composition

### History & Social Science
- World History, US History, AP US History (APUSH), AP Government, Economics

### World Languages
- Spanish I–IV, French I–IV, Mandarin I–IV

### Arts & Electives
- *(Placeholders — to be filled in)*

---

## 12. Out of Scope (v1)

- Flashcards or quizzes
- Comments or discussion on materials
- Student-to-student messaging
- Dark/light mode toggle (dark only for v1)
- Google Workspace OAuth domain restriction (deferred pending Sage Hill IT confirmation)
