# Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **IMPORTANT:** Before writing any Next.js code, read `node_modules/next/dist/docs/` — Next.js 16 has breaking changes. Key ones: `proxy.ts` replaces `middleware.ts`, `params` is a Promise and must be awaited.

**Goal:** Install all dependencies, configure Supabase, define the database schema with Drizzle, and wire up authentication so any route can check the current user's session.

**Architecture:** Supabase handles auth (Google OAuth + email/password) and Postgres. Drizzle ORM sits on top of Supabase Postgres via the direct connection string. A server-side Supabase client reads the session cookie; a browser client is used for OAuth redirects.

**Tech Stack:** Next.js 16, Supabase JS v2, Drizzle ORM, drizzle-kit, postgres (node-postgres driver), Resend, Tiptap

---

### Task 1: Install dependencies

**Files:** `package.json`

- [ ] Run:
```bash
npm install @supabase/supabase-js @supabase/ssr drizzle-orm postgres resend
npm install -D drizzle-kit
```
- [ ] Verify `package.json` now includes all six packages.
- [ ] Commit:
```bash
git add package.json package-lock.json
git commit -m "feat: install supabase, drizzle, resend dependencies"
```

---

### Task 2: Environment variables

**Files:** `.env.local` (create, gitignored), `.env.example` (create)

- [ ] Create `.env.local` with the following keys (values filled in from your Supabase project dashboard under Settings → API and Settings → Database):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
ADMIN_EMAILS=your@email.com
RESEND_API_KEY=re_your_key
```
- [ ] Create `.env.example` with the same keys but empty values, for documentation.
- [ ] Verify `.env.local` is in `.gitignore` (it already is via `.env*`).
- [ ] Commit:
```bash
git add .env.example
git commit -m "chore: add env example file"
```

---

### Task 3: Drizzle config

**Files:** Create `drizzle.config.ts`

- [ ] Create `drizzle.config.ts`:
```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```
- [ ] Commit:
```bash
git add drizzle.config.ts
git commit -m "chore: add drizzle config"
```

---

### Task 4: Database schema

**Files:** Create `lib/db/schema.ts`, create `lib/db/index.ts`

- [ ] Create `lib/db/schema.ts`:
```ts
import { pgTable, uuid, text, integer, timestamp, pgEnum, index, primaryKey } from 'drizzle-orm/pg-core'
import { jsonb } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['student', 'admin'])
export const materialTypeEnum = pgEnum('material_type', ['note', 'test'])
export const contentTypeEnum = pgEnum('content_type', ['pdf', 'richtext'])
export const statusEnum = pgEnum('status', ['pending', 'approved', 'rejected'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // matches auth.users.id
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
```
- [ ] Create `lib/db/index.ts`:
```ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema })
```
- [ ] Run migration to generate SQL:
```bash
npx drizzle-kit generate
```
- [ ] Push schema to Supabase:
```bash
npx drizzle-kit push
```
Expected: all tables created in Supabase with no errors.
- [ ] Commit:
```bash
git add lib/db/ drizzle.config.ts
git commit -m "feat: add drizzle schema and push to supabase"
```

---

### Task 5: Supabase client helpers

**Files:** Create `lib/supabase/server.ts`, create `lib/supabase/client.ts`

- [ ] Create `lib/supabase/server.ts` (used in Server Components and Server Actions):
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

export async function getUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```
- [ ] Create `lib/supabase/client.ts` (used in Client Components for OAuth):
```ts
'use client'
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```
- [ ] Commit:
```bash
git add lib/supabase/
git commit -m "feat: add supabase server and browser client helpers"
```

---

### Task 6: Auth helper — get current DB user

**Files:** Create `lib/auth.ts`

- [ ] Create `lib/auth.ts`:
```ts
import { getUser } from './supabase/server'
import { db } from './db'
import { users } from './db/schema'
import { eq } from 'drizzle-orm'

export async function getCurrentUser() {
  const authUser = await getUser()
  if (!authUser) return null
  const [user] = await db.select().from(users).where(eq(users.id, authUser.id))
  return user ?? null
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'admin') throw new Error('Forbidden')
  return user
}

export function calculateGrade(graduatingYear: number): { grade: number; label: string } {
  const now = new Date()
  const schoolYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
  const grade = 12 - (graduatingYear - schoolYear - 1)
  const labels: Record<number, string> = { 9: 'Freshman', 10: 'Sophomore', 11: 'Junior', 12: 'Senior' }
  return { grade, label: labels[grade] ?? `Grade ${grade}` }
}
```
- [ ] Commit:
```bash
git add lib/auth.ts
git commit -m "feat: add auth helpers and grade calculator"
```

---

### Task 7: Route protection proxy

**Files:** Create `proxy.ts` at project root

- [ ] Create `proxy.ts` (Next.js 16 — note: NOT `middleware.ts`):
```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/submit') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/admin')
  const isAdmin = pathname.startsWith('/admin')

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin check is done inside each admin page via requireAdmin()
  // The proxy only handles the unauthenticated redirect

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```
- [ ] Commit:
```bash
git add proxy.ts
git commit -m "feat: add route protection proxy"
```

---

### Task 8: Auth callback route

**Files:** Create `app/auth/callback/route.ts`

- [ ] Create `app/auth/callback/route.ts`:
```ts
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Upsert user in our DB
      const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim())
      const role = adminEmails.includes(data.user.email ?? '') ? 'admin' : 'student'

      const existing = await db.select().from(users).where(eq(users.id, data.user.id))
      if (existing.length === 0) {
        // New user — redirect to onboarding to collect name + graduating year
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
```
- [ ] Commit:
```bash
git add app/auth/callback/route.ts
git commit -m "feat: add auth callback route with admin bootstrapping"
```

---

### Task 9: Onboarding page (collect name + graduating year)

**Files:** Create `app/onboarding/page.tsx`, create `app/actions/auth.ts`

- [ ] Create `app/actions/auth.ts`:
```ts
'use server'
import { getUser } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { redirect } from 'next/navigation'

export async function completeOnboarding(formData: FormData) {
  const authUser = await getUser()
  if (!authUser) redirect('/login')

  const fullName = formData.get('fullName') as string
  const graduatingYear = parseInt(formData.get('graduatingYear') as string)

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim())
  const role = adminEmails.includes(authUser.email ?? '') ? 'admin' as const : 'student' as const

  await db.insert(users).values({
    id: authUser.id,
    email: authUser.email!,
    fullName,
    graduatingYear,
    role,
  })

  redirect('/dashboard')
}
```
- [ ] Create `app/onboarding/page.tsx`:
```tsx
import { completeOnboarding } from '@/app/actions/auth'
import { getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function OnboardingPage() {
  const authUser = await getUser()
  if (!authUser) redirect('/login')

  // If already onboarded, skip
  const [existing] = await db.select().from(users).where(eq(users.id, authUser.id))
  if (existing) redirect('/dashboard')

  const currentYear = new Date().getFullYear()
  const years = [currentYear + 1, currentYear + 2, currentYear + 3, currentYear + 4]

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#16213e] border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome to Success at Sage</h1>
        <p className="text-white/60 mb-8">Tell us a bit about yourself to get started.</p>
        <form action={completeOnboarding} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Full Name</label>
            <input
              name="fullName"
              required
              defaultValue={authUser.user_metadata?.full_name ?? ''}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Graduating Year</label>
            <select
              name="graduatingYear"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="mt-2 w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg py-2.5 transition-colors"
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  )
}
```
- [ ] Commit:
```bash
git add app/onboarding/ app/actions/auth.ts
git commit -m "feat: add onboarding page to collect name and graduating year"
```

---

### Task 10: Login page

**Files:** Create `app/login/page.tsx`, create `app/actions/login.ts`

- [ ] Create `app/actions/login.ts`:
```ts
'use server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signInWithEmail(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect('/login?error=invalid')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/')
}
```
- [ ] Create `app/login/page.tsx`:
```tsx
'use client'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { signInWithEmail } from '@/app/actions/login'
import Link from 'next/link'

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient()

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#16213e] border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-8">Sign in to Success at Sage</h1>
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold rounded-lg py-2.5 mb-6 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/40 text-sm">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <form action={signInWithEmail} className="flex flex-col gap-4">
          <input name="email" type="email" required placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500" />
          <input name="password" type="password" required placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500" />
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg py-2.5 transition-colors">Sign In</button>
        </form>
        <p className="text-center text-white/40 text-sm mt-6">
          No account? <Link href="/signup" className="text-purple-400 hover:text-purple-300">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
```
- [ ] Commit:
```bash
git add app/login/ app/actions/login.ts
git commit -m "feat: add login page with Google OAuth and email/password"
```

---

### Task 11: Signup page

**Files:** Create `app/signup/page.tsx`, create `app/actions/signup.ts`

- [ ] Create `app/actions/signup.ts`:
```ts
'use server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { redirect } from 'next/navigation'

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const graduatingYear = parseInt(formData.get('graduatingYear') as string)

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error || !data.user) redirect('/signup?error=taken')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim())
  const role = adminEmails.includes(email) ? 'admin' as const : 'student' as const

  await db.insert(users).values({
    id: data.user.id,
    email,
    fullName,
    graduatingYear,
    role,
  })

  redirect('/dashboard')
}
```
- [ ] Create `app/signup/page.tsx`:
```tsx
'use client'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { signUpWithEmail } from '@/app/actions/signup'
import Link from 'next/link'

export default function SignupPage() {
  const supabase = createSupabaseBrowserClient()
  const currentYear = new Date().getFullYear()
  const years = [currentYear + 1, currentYear + 2, currentYear + 3, currentYear + 4]

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#16213e] border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-8">Create your account</h1>
        <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold rounded-lg py-2.5 mb-6 hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/40 text-sm">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <form action={signUpWithEmail} className="flex flex-col gap-4">
          <input name="fullName" required placeholder="Full Name" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500" />
          <input name="email" type="email" required placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500" />
          <input name="password" type="password" required placeholder="Password" minLength={8} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500" />
          <div>
            <label className="block text-sm text-white/70 mb-1">Graduating Year</label>
            <select name="graduatingYear" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button type="submit" className="mt-2 w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg py-2.5 transition-colors">Create Account</button>
        </form>
        <p className="text-center text-white/40 text-sm mt-6">
          Already have an account? <Link href="/login" className="text-purple-400 hover:text-purple-300">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
```
- [ ] Commit:
```bash
git add app/signup/ app/actions/signup.ts
git commit -m "feat: add signup page"
```

---

### Task 12: Root layout and global styles

**Files:** Modify `app/layout.tsx`, modify `app/globals.css`

- [ ] Update `app/globals.css` to set the dark background as default:
```css
@import "tailwindcss";

:root {
  --background: #1a1a2e;
  --foreground: #ffffff;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans, sans-serif);
}

* {
  box-sizing: border-box;
}
```
- [ ] Update `app/layout.tsx` — keep existing structure but ensure dark background is applied. Remove the Next.js boilerplate content.
- [ ] Run the dev server and verify login page loads at `http://localhost:3000/login` with dark background:
```bash
npm run dev
```
- [ ] Commit:
```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: apply dark theme to root layout"
```

---

**Phase 1 complete.** Move on to Phase 2 (Browse & Courses).
