/**
 * Pure date/grade helpers — no server-only imports, safe to use from client
 * components (signup form, onboarding form, etc.)
 */

/**
 * Sentinel for "no graduating year known" (e.g. faculty/staff/parents,
 * or anyone whose school email doesn't follow the 2-digit prefix
 * convention). The schema requires graduating_year to be a number, so we
 * use 0 instead of NULL and translate it to the "Other" label at display
 * time. Admins can edit a user's year explicitly if they need to.
 */
export const UNKNOWN_GRADUATING_YEAR = 0

export function calculateGrade(graduatingYear: number): { grade: number; label: string } {
  if (graduatingYear === UNKNOWN_GRADUATING_YEAR) {
    return { grade: 0, label: 'Other' }
  }
  const now = new Date()
  // School year rolls over on June 1 (month index 5) when the outgoing
  // senior class graduates and everyone else moves up a grade.
  const schoolYear = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1
  const grade = 12 - (graduatingYear - schoolYear - 1)
  const labels: Record<number, string> = {
    7: '7th Grade',
    8: '8th Grade',
    9: 'Freshman',
    10: 'Sophomore',
    11: 'Junior',
    12: 'Senior',
  }
  // Grade ≥ 13 means this cohort has graduated — show as "Beyond".
  const label = grade >= 13 ? 'Beyond' : labels[grade] ?? `Grade ${grade}`
  return { grade, label }
}

/**
 * Derive a graduating year from a school email's first two characters.
 * Convention: students at participating schools are issued emails like
 * `29pardhananij@sagehillschool.org` where "29" is the two-digit year of
 * graduation (class of 2029).
 *
 * Returns 2000 + the two-digit prefix if the email starts with two
 * digits; otherwise returns UNKNOWN_GRADUATING_YEAR (faculty/staff/etc.
 * who don't follow the convention will display as "Other").
 */
export function deriveGraduatingYearFromEmail(email: string): number {
  const match = email.trim().match(/^(\d{2})/)
  if (!match) return UNKNOWN_GRADUATING_YEAR
  return 2000 + parseInt(match[1], 10)
}
