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
      try {
        const existing = await db.select().from(users).where(eq(users.id, data.user.id))
        if (existing.length === 0) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
        return NextResponse.redirect(`${origin}/dashboard`)
      } catch (dbError) {
        console.error('[auth/callback] DB error:', dbError)
        return NextResponse.redirect(`${origin}/login?error=db`)
      }
    }

    console.error('[auth/callback] Supabase error:', error)
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
