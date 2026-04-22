import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantByEmail, resolveTenantBySlug } from '@/lib/tenant'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Resolve tenant: existing users row → their school_id; new users →
      // resolve by email domain; fall back to Sage if nothing matches.
      const email = (data.user.email ?? '').trim().toLowerCase()

      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id, school_id')
        .eq('id', data.user.id)
        .single()

      if (!existing) {
        const tenant = await resolveTenantByEmail(email) ?? await resolveTenantBySlug('sage').catch(() => null)
        const slug = tenant?.slug ?? 'sage'
        return NextResponse.redirect(`${origin}/s/${slug}/onboarding`)
      }

      // Existing user: look up their tenant's slug
      const { data: school } = await supabaseAdmin
        .from('schools').select('slug').eq('id', (existing as any).school_id).single()
      const slug = (school as any)?.slug ?? 'sage'
      return NextResponse.redirect(`${origin}/s/${slug}/dashboard`)
    }

    console.error('[auth/callback] Supabase error:', error)
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
