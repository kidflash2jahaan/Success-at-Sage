import Link from 'next/link'
import LegalLayout, { LegalSection } from '@/components/legal/LegalLayout'

export const dynamic = 'force-static'
export const metadata = { title: 'FAQ · Success at HS' }

export default function FaqPage() {
  return (
    <LegalLayout active="faq">
      <h1 className="text-3xl font-bold text-white tracking-tight mb-3">Frequently Asked Questions</h1>
      <p className="text-white/60 text-sm mb-10">
        For students, families, and school administration.
      </p>

      <h2 className="text-xs font-semibold uppercase tracking-widest text-violet-300 mb-4">The basics</h2>

      <LegalSection title="What is Success at HS?">
        A free, student-run platform for sharing study notes and practice
        material with classmates at your school. Every submission is reviewed
        by an admin before it becomes visible to other students.
      </LegalSection>

      <LegalSection title="Is it free?">
        Yes. There is no cost to use Success at HS, no ads, no upsells, and no
        premium tier. It will stay that way.
      </LegalSection>

      <LegalSection title="Who runs it?">
        Success at HS is an independent student project. Each school that opts
        in runs its own instance with its own admin(s). It is not owned,
        operated, or officially endorsed by any individual school unless that
        school explicitly says so.
      </LegalSection>

      <LegalSection title="Who can sign up?">
        Current students, staff, and faculty at participating schools, using
        their official school email. If your school isn&apos;t on the platform
        yet, visit the{' '}
        <Link href="/request-school" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">
          request-a-school page
        </Link>
        .
      </LegalSection>

      <h2 className="text-xs font-semibold uppercase tracking-widest text-violet-300 mb-4 mt-12">What you can upload</h2>

      <LegalSection title="What counts as a valid submission?">
        Your own study notes, summaries, flashcards, outlines, or problem sets.
        Publicly available material you have the right to share is also fine.
        Practice tests you&apos;ve written yourself are welcome.
      </LegalSection>

      <LegalSection title="What&apos;s off-limits?">
        Real tests, quizzes, or answer keys from any school. Copyrighted
        material you don&apos;t have the right to share (published textbook
        pages, commercial prep books, official practice exams, etc.). Anyone
        else&apos;s work passed off as your own. Anything harmful, harassing,
        or inappropriate.{' '}
        <Link href="/terms" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">
          Full list in the Terms
        </Link>
        . Uploading prohibited material violates both our rules AND your
        school&apos;s honor code, and results in account removal.
      </LegalSection>

      <h2 className="text-xs font-semibold uppercase tracking-widest text-violet-300 mb-4 mt-12">Moderation and safety</h2>

      <LegalSection title="How do you prevent cheating?">
        Three layers. (1) A required honor-code checkbox at the moment of
        upload — you confirm the material is legitimate before submitting. (2)
        An admin review queue — nothing is visible to other students until a
        human admin at your school has approved it. (3) A report/flag button
        on every published material — if anything slips through, any student
        can flag it for re-review and it can be removed in one click.
      </LegalSection>

      <LegalSection title="Who moderates?">
        Admins at your school. They see the pending queue and approve or
        reject each submission. If the school has designated a faculty member
        as admin, faculty participate in review alongside student admins.
      </LegalSection>

      <LegalSection title="Can schools request that something be removed?">
        Yes, immediately. School administration can request removal of any
        submission, and we honor the request same-day. Full data exports are
        also available at no cost.
      </LegalSection>

      <h2 className="text-xs font-semibold uppercase tracking-widest text-violet-300 mb-4 mt-12">Your data</h2>

      <LegalSection title="Who can see what I upload?">
        Only students and admins at your own school. Nobody outside your
        school can see who you are or what you&apos;ve submitted.{' '}
        <Link href="/privacy" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">
          Full details in the Privacy Policy
        </Link>
        .
      </LegalSection>

      <LegalSection title="Can I delete my account or a specific upload?">
        Yes, anytime. Email the address on the{' '}
        <Link href="/contact" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">contact page</Link>{' '}
        and we&apos;ll take care of it within 7 days. You can also request an
        export of everything we have about you.
      </LegalSection>

      <LegalSection title="Where is the data stored?">
        Vercel (hosting and compute) and Supabase (database, authentication,
        file storage). Transactional emails go through Resend. No data is
        sold, rented, or shared with anyone outside these providers.
      </LegalSection>

      <h2 className="text-xs font-semibold uppercase tracking-widest text-violet-300 mb-4 mt-12">Contests and prizes</h2>

      <LegalSection title="How does the monthly prize work?">
        If your school has the prize feature enabled, the top note-uploader
        each month wins the prize set by the school admin. The leaderboard
        always runs; the prize is an opt-in decoration on top of it.
      </LegalSection>

      <LegalSection title="Who pays for the prize?">
        The school or the student organizer, not the platform. Success at HS
        does not collect or disburse money.
      </LegalSection>

      <h2 className="text-xs font-semibold uppercase tracking-widest text-violet-300 mb-4 mt-12">For schools and families</h2>

      <LegalSection title="What happens when the student founder graduates?">
        Admin access is transferred. The intent is to hand over to a faculty
        sponsor and a rising junior/senior admin team, or — if the school
        prefers — shut down the school&apos;s tenant entirely. The decision
        is the school&apos;s.
      </LegalSection>

      <LegalSection title="Does the school have any control over content?">
        Yes. Any faculty or administrator the school designates as an admin
        has the same moderation powers as any other admin, including the
        ability to delete submissions, remove accounts, and export data.
      </LegalSection>

      <LegalSection title="What if I see something I&apos;m concerned about?">
        Use the flag button on the material, or email the address on the{' '}
        <Link href="/contact" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">contact page</Link>
        . You can also contact your school&apos;s administration directly —
        both channels work, and we coordinate with the school on any
        confirmed violation.
      </LegalSection>
    </LegalLayout>
  )
}
