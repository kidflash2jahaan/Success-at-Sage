import 'server-only'
import { cache } from 'react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

export type Tenant = {
  id: string
  slug: string
  name: string
  displayShort: string
  prizeEnabled: boolean
}

type SchoolRow = {
  id: string
  slug: string
  name: string
  display_short: string
  prize_enabled: boolean
}

function toTenant(row: SchoolRow): Tenant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    displayShort: row.display_short,
    prizeEnabled: row.prize_enabled,
  }
}

/** Resolve slug → Tenant. 404s if the school doesn't exist. Memoized per request. */
export const resolveTenantBySlug = cache(async (slug: string): Promise<Tenant> => {
  const { data, error } = await supabaseAdmin
    .from('schools')
    .select('id, slug, name, display_short, prize_enabled')
    .eq('slug', slug)
    .single<SchoolRow>()
  if (error || !data) notFound()
  return toTenant(data)
})

/** Resolve email domain → Tenant. Returns null if no school matches. Memoized per request. */
export const resolveTenantByEmail = cache(async (email: string): Promise<Tenant | null> => {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null
  const { data: dom } = await supabaseAdmin
    .from('school_domains')
    .select('school_id')
    .eq('domain', domain)
    .single<{ school_id: string }>()
  if (!dom) return null
  const { data: school } = await supabaseAdmin
    .from('schools')
    .select('id, slug, name, display_short, prize_enabled')
    .eq('id', dom.school_id)
    .single<SchoolRow>()
  return school ? toTenant(school) : null
})
