import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata = { title: 'Terms of Service · Success at HS' }

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-nav sticky top-0 z-20 flex items-center justify-between px-6 py-4">
        <Link href="/" className="font-bold text-white tracking-tight text-base">Success at HS</Link>
        <div className="flex items-center gap-4 text-sm text-white/60">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Terms of Service</h1>
        <p className="text-white/40 text-sm mb-10">Last updated April 22, 2026</p>

        <Section title="What this is">
          Success at HS is a free platform that lets students at participating
          high schools share study notes and practice tests with their peers.
          By using it you agree to these terms.
        </Section>

        <Section title="Who can use it">
          You must be a current student, staff member, or faculty member at a
          school with an active tenant on the platform. You must sign up with
          your official school email. One account per person.
        </Section>

        <Section title="What you can upload">
          You can upload study notes, summaries, flash cards, outlines, and
          practice problems that are <strong>your own original work</strong>, or
          that are publicly available and that you have the right to share. You
          can upload your own unofficial practice tests you&apos;ve written.
        </Section>

        <Section title="What you can NOT upload">
          You may not upload:
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Real tests, quizzes, or answer keys from your school or any other school</li>
            <li>Copyrighted material (published textbook pages, commercial study guides, College Board practice exams, etc.) that you don&apos;t have the right to share</li>
            <li>Material obtained in violation of a classroom policy or honor code</li>
            <li>Anyone else&apos;s schoolwork passed off as your own</li>
            <li>Sexual, harassing, discriminatory, or otherwise harmful content</li>
          </ul>
          Uploading prohibited material violates both these terms AND your
          school&apos;s honor code, and will result in your account being
          removed and your school being notified.
        </Section>

        <Section title="Moderation">
          Every submission is reviewed by an admin before it becomes visible to
          other students. We may reject any submission for any reason.
          Approved materials can be flagged by other users; flagged content is
          re-reviewed and may be removed.
        </Section>

        <Section title="Who owns what you upload">
          You retain ownership of your uploads. By submitting, you grant Success
          at HS a non-exclusive, royalty-free license to host, display, and
          distribute your material to other students at your school for as long
          as your account is active or as needed to operate the platform. If you
          delete your account or your submission, the license ends.
        </Section>

        <Section title="Account removal">
          We can remove your account at any time for violating these terms, for
          violating your school&apos;s honor code, or at the request of your
          school&apos;s administration. You can delete your own account at any
          time by contacting us.
        </Section>

        <Section title="No warranty">
          The platform is provided as-is. Materials are student-submitted and
          may contain errors. We don&apos;t guarantee accuracy, and using the
          platform doesn&apos;t substitute for attending class, doing your own
          work, or consulting your teachers. Use materials at your own risk and
          always verify against official sources.
        </Section>

        <Section title="No official affiliation">
          Success at HS is an independent student project. It is not owned,
          operated, or officially endorsed by any individual school unless
          explicitly stated by that school.
        </Section>

        <Section title="Changes to these terms">
          We may update these terms. If we make a material change we&apos;ll
          notify active users by email. Continued use after an update means
          you accept the new terms.
        </Section>

        <Section title="Contact">
          Questions, takedown requests, or concerns: see the{' '}
          <Link href="/contact" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">contact page</Link>.
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
      <div className="text-white/60 text-sm leading-relaxed">{children}</div>
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
