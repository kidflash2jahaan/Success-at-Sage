import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata = { title: 'Privacy Policy · Success at HS' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-nav sticky top-0 z-20 flex items-center justify-between px-6 py-4">
        <Link href="/" className="font-bold text-white tracking-tight text-base">Success at HS</Link>
        <div className="flex items-center gap-4 text-sm text-white/60">
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated April 22, 2026</p>

        <Section title="What we collect">
          When you sign up we store your name, school email, graduating year, and
          the school you belong to. When you upload a note or test we store the
          file, the title, your course/unit, and a timestamp. That&apos;s it.
          We don&apos;t collect phone numbers, addresses, browsing data, or any
          information about your activity outside of this site.
        </Section>

        <Section title="How we use it">
          Your email is used to sign you in and to notify you when your
          submission is approved or rejected. Your name and graduating year
          appear on the leaderboard and next to materials you&apos;ve uploaded.
          Uploads are visible only to other students at your school once an
          admin has approved them.
        </Section>

        <Section title="Where it lives">
          The platform is hosted on Vercel (compute and hosting) and Supabase
          (database, authentication, and file storage). Transactional emails are
          sent via Resend. We don&apos;t sell, rent, or share your data with
          anyone outside these service providers, all of whom act as data
          processors operating under their own industry-standard privacy
          practices.
        </Section>

        <Section title="Who can see what">
          Other students at your school can see your name, your graduating year,
          your approved uploads, and your leaderboard position. Admins at your
          school can additionally see your email and your pending/rejected
          submissions. Superadmins (the operators of the platform) can see this
          across all schools for the purpose of platform support. Nobody outside
          your school&apos;s community can see who you are or what you&apos;ve
          uploaded.
        </Section>

        <Section title="Your rights">
          You can request a copy or a deletion of your data at any time by
          emailing the address on our <Link href="/contact" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">contact page</Link>.
          Deletion removes your account, your uploads, and any record of your
          activity within 7 days. Some operational logs (authentication, error
          tracking) may persist for up to 30 days before being purged.
        </Section>

        <Section title="Data exports for schools">
          If your school&apos;s administration requests a full export of
          materials and user activity for their own records, we&apos;ll provide
          it at no cost.
        </Section>

        <Section title="Changes to this policy">
          If we change how we handle data, we&apos;ll update this page and
          notify active users by email. Material changes won&apos;t be applied
          retroactively.
        </Section>

        <Section title="Ages">
          The platform is open to high-school students, who are typically 14 and
          older. If you believe a student under 13 has signed up, contact us and
          we&apos;ll remove the account.
        </Section>
      </main>

      <Footer />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-white font-semibold text-lg mb-2">{title}</h2>
      <p className="text-white/60 text-sm leading-relaxed">{children}</p>
    </section>
  )
}

function Footer() {
  return (
    <footer className="px-6 py-6 border-t border-white/5 text-center text-white/30 text-xs flex items-center justify-center gap-5">
      <span>© Success at HS</span>
      <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
      <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
      <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
    </footer>
  )
}
