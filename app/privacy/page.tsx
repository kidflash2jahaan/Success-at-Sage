import Link from 'next/link'
import LegalLayout, { LegalSection } from '@/components/legal/LegalLayout'

export const dynamic = 'force-static'
export const metadata = { title: 'Privacy Policy · Success at HS' }

export default function PrivacyPage() {
  return (
    <LegalLayout active="privacy">
      <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-white/40 text-sm mb-10">Last updated April 22, 2026</p>

      <LegalSection title="What we collect">
        When you sign up we store your name, school email, graduating year, and
        the school you belong to. When you upload a note or test we store the
        file, the title, your course/unit, and a timestamp. That&apos;s it.
        We don&apos;t collect phone numbers, addresses, browsing data, or any
        information about your activity outside of this site.
      </LegalSection>

      <LegalSection title="How we use it">
        Your email is used to sign you in and to notify you when your
        submission is approved or rejected. Your name and graduating year
        appear on the leaderboard and next to materials you&apos;ve uploaded.
        Uploads are visible only to other students at your school once an
        admin has approved them.
      </LegalSection>

      <LegalSection title="Where it lives">
        The platform is hosted on Vercel (compute and hosting) and Supabase
        (database, authentication, and file storage). Transactional emails are
        sent via Resend. We don&apos;t sell, rent, or share your data with
        anyone outside these service providers, all of whom act as data
        processors operating under their own industry-standard privacy
        practices.
      </LegalSection>

      <LegalSection title="Who can see what">
        Other students at your school can see your name, your graduating year,
        your approved uploads, and your leaderboard position. Admins at your
        school can additionally see your email and your pending/rejected
        submissions. Superadmins (the operators of the platform) can see this
        across all schools for the purpose of platform support. Nobody outside
        your school&apos;s community can see who you are or what you&apos;ve
        uploaded.
      </LegalSection>

      <LegalSection title="Your rights">
        You can request a copy or a deletion of your data at any time by
        emailing the address on our <Link href="/contact" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">contact page</Link>.
        Deletion removes your account, your uploads, and any record of your
        activity within 7 days. Some operational logs (authentication, error
        tracking) may persist for up to 30 days before being purged.
      </LegalSection>

      <LegalSection title="Data exports for schools">
        If your school&apos;s administration requests a full export of
        materials and user activity for their own records, we&apos;ll provide
        it at no cost.
      </LegalSection>

      <LegalSection title="Changes to this policy">
        If we change how we handle data, we&apos;ll update this page and
        notify active users by email. Material changes won&apos;t be applied
        retroactively.
      </LegalSection>

      <LegalSection title="Ages">
        The platform is open to high-school students, who are typically 14 and
        older. If you believe a student under 13 has signed up, contact us and
        we&apos;ll remove the account.
      </LegalSection>
    </LegalLayout>
  )
}
