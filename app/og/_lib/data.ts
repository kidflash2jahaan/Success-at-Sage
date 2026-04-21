// Shared data-fetch helpers for the /og/* marketing routes.
// Each route queries contest_settings + leaderboard + winners via the
// admin Supabase client (service role — routes are admin-gated already).

import { supabaseAdmin } from '@/lib/supabase/admin'

export type ContestSettings = {
  period_start: string
  next_reset_date: string | null
  prize_description: string
}

export type Leader = {
  id: string
  full_name: string
  graduating_year: number
  submission_count: number
  total_views: number
}

export type Winner = {
  id: string
  period_label: string
  paid_at: string | null
  created_at: string
  users: { full_name: string; email: string } | null
  // aggregates for the winner's period
  total_submissions?: number
  total_views?: number
}

export async function getContestSettings(): Promise<ContestSettings> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabaseAdmin.from('contest_settings').select('*').eq('id', 1).single()
  return (data ?? { period_start: today, next_reset_date: today, prize_description: '$50 Amazon gift card' }) as ContestSettings
}

export async function getLeaders(settings: ContestSettings): Promise<Leader[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabaseAdmin.rpc('get_leaderboard_period', {
    p_start: settings.period_start,
    p_end: settings.next_reset_date ?? today,
  })
  return (data ?? []) as Leader[]
}

// Most recent paid winner — used for the "winner" IG post template.
export async function getLatestPaidWinner(): Promise<Winner | null> {
  const { data } = await supabaseAdmin
    .from('contest_winners')
    .select('*, users(full_name, email)')
    .not('paid_at', 'is', null)
    .order('paid_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data ?? null) as Winner | null
}

// Parses "$50 Amazon gift card" into amount + label.
// Falls back to raw text if the shape doesn't match.
export function parsePrize(raw: string): { amount: string; label: string; raw: string } {
  const match = raw.match(/^\s*\$?\s*(\d+)\s*(.*)$/i)
  if (!match) return { amount: raw, label: '', raw }
  const amount = `$${match[1]}`
  const label = (match[2] || '').trim()
  return { amount, label, raw }
}

// Format period for display: "April 2026"
export function formatPeriod(periodStart: string): string {
  // parse as local date (YYYY-MM-DD) without TZ drift
  const [y, m] = periodStart.split('-').map(Number)
  const d = new Date(y, (m || 1) - 1, 1)
  return d.toLocaleString('default', { month: 'long', year: 'numeric' })
}

// Format a YYYY-MM-DD date as "Apr 30" etc.
export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, (m || 1) - 1, d || 1)
  return dt.toLocaleString('default', { month: 'short', day: 'numeric' })
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  const target = new Date(y, (m || 1) - 1, d || 1).getTime()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.round((target - today) / 86400000)
}
