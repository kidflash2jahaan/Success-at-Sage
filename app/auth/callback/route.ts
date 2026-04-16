import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existing) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    console.error('[auth/callback] Supabase error:', error)
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
