import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantByEmail } from '@/lib/tenant'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Resolve tenant: existing users row → their school_id; new users →
      // resolve by email domain. If nothing matches for a new user, send
      // them to /request-school so their school can be created.
      const email = (data.user.email ?? '').trim().toLowerCase()

      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id, school_id')
        .eq('id', data.user.id)
        .single()

      if (!existing) {
        const tenant = await resolveTenantByEmail(email)
        if (!tenant) {
          return NextResponse.redirect(`${origin}/request-school?email=${encodeURIComponent(email)}`)
        }
        return NextResponse.redirect(`${origin}/s/${tenant.slug}/onboarding`)
      }

      // Existing user: look up their tenant's slug and drop them on the
      // dashboard for that school.
      const { data: school } = await supabaseAdmin
        .from('schools')
        .select('slug')
        .eq('id', (existing as any).school_id)
        .single()
      if (!school) {
        // users row is orphaned (school was deleted). Send them to the
        // generic landing so they can re-request.
        return NextResponse.redirect(`${origin}/`)
      }
      return NextResponse.redirect(`${origin}/s/${(school as any).slug}/dashboard`)
    }

    console.error('[auth/callback] Supabase error:', error)
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
