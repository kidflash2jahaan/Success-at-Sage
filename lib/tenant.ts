import 'server-only'
import { cache } from 'react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

export type Tenant = {
  id: string
  slug: string
  name: string
  displayShort: string
  contestEnabled: boolean
}

/** Resolve slug → Tenant. 404s if the school doesn't exist. Memoized per request. */
export const resolveTenantBySlug = cache(async (slug: string): Promise<Tenant> => {
  const { data, error } = await supabaseAdmin
    .from('schools')
    .select('id, slug, name, display_short, contest_enabled')
    .eq('slug', slug)
    .single()
  if (error || !data) notFound()
  return {
    id: (data as any).id as string,
    slug: (data as any).slug as string,
    name: (data as any).name as string,
    displayShort: (data as any).display_short as string,
    contestEnabled: (data as any).contest_enabled as boolean,
  }
})

/** Resolve email domain → Tenant. Returns null if no school matches. Memoized per request. */
export const resolveTenantByEmail = cache(async (email: string): Promise<Tenant | null> => {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null
  const { data: dom } = await supabaseAdmin
    .from('school_domains')
    .select('school_id')
    .eq('domain', domain)
    .single()
  if (!dom) return null
  const { data: s } = await supabaseAdmin
    .from('schools')
    .select('id, slug, name, display_short, contest_enabled')
    .eq('id', (dom as any).school_id)
    .single()
  if (!s) return null
  return {
    id: (s as any).id as string,
    slug: (s as any).slug as string,
    name: (s as any).name as string,
    displayShort: (s as any).display_short as string,
    contestEnabled: (s as any).contest_enabled as boolean,
  }
})
