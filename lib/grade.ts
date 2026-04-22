/**
 * Pure date/grade helpers — no server-only imports, safe to use from client
 * components (signup form, onboarding form, etc.)
 */

export function calculateGrade(graduatingYear: number): { grade: number; label: string } {
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
 * The list of graduating years that should appear in signup/onboarding
 * dropdowns. 7 options:
 *   - most recently graduated class → "Beyond"
 *   - 6 current cohorts → Senior through 7th Grade
 *
 * The school year advances on June 1, so this list automatically rolls
 * forward then — a new 7th-grade cohort appears at the bottom, every
 * grade moves up a slot, and the outgoing senior class becomes the new
 * "Beyond" option (replacing last year's, which drops off).
 */
export function getGraduatingYearOptions(): Array<{ year: number; label: string }> {
  const now = new Date()
  const schoolYear = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1
  // i = 0 → schoolYear (just graduated, "Beyond")
  // i = 1 → Senior, i = 2 → Junior, ..., i = 6 → 7th Grade
  return Array.from({ length: 7 }, (_, i) => {
    const year = schoolYear + i
    const { label } = calculateGrade(year)
    return { year, label }
  })
}
