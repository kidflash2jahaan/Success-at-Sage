/**
 * Pure date/grade helpers — no server-only imports, safe to use from client
 * components (signup form, onboarding form, etc.)
 */

export function calculateGrade(graduatingYear: number): { grade: number; label: string } {
  const now = new Date()
  // School year rolls over on Aug 1 (month index 7).
  const schoolYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
  const grade = 12 - (graduatingYear - schoolYear - 1)
  const labels: Record<number, string> = {
    7: '7th Grade',
    8: '8th Grade',
    9: 'Freshman',
    10: 'Sophomore',
    11: 'Junior',
    12: 'Senior',
  }
  return { grade, label: labels[grade] ?? `Grade ${grade}` }
}

/**
 * The list of graduating years that should appear in signup/onboarding
 * dropdowns. Covers grades 7–12 (Sage Hill's upper + middle school range).
 *
 * The school year advances on Aug 1, so this list automatically rolls
 * forward then — the outgoing senior class drops off and a new incoming
 * 7th-grade cohort appears.
 */
export function getGraduatingYearOptions(): Array<{ year: number; label: string }> {
  const now = new Date()
  const schoolYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
  const seniorYear = schoolYear + 1
  // 6 cohorts: seniorYear (12th), seniorYear+1 (11th), ..., seniorYear+5 (7th)
  return Array.from({ length: 6 }, (_, i) => {
    const year = seniorYear + i
    const { label } = calculateGrade(year)
    return { year, label }
  })
}
