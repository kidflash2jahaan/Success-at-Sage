import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata = { title: 'Contact · Success at HS' }

const CONTACT_EMAIL = '29PardhananiJ@sagehillschool.org'

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-nav sticky top-0 z-20 flex items-center justify-between px-6 py-4">
        <Link href="/" className="font-bold text-white tracking-tight text-base">Success at HS</Link>
        <div className="flex items-center gap-4 text-sm text-white/60">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-3">Contact</h1>
        <p className="text-white/60 text-sm mb-10">
          Success at HS is a student project. The fastest way to reach a real
          person is email — responses typically within 24 hours.
        </p>

        <div className="glass rounded-2xl p-6 mb-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-violet-300 mb-2">Direct email</div>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-white font-semibold text-lg hover:text-violet-300 transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
        </div>

        <Topic
          title="Takedown requests"
          body="If you see content that shouldn't be on the platform — real tests, copyrighted material, something you uploaded and want removed, anything violating our honor-code rules — email the address above with a link or screenshot. We review takedown requests same-day and remove confirmed violations immediately."
        />

        <Topic
          title="Data requests"
          body="Want a copy of everything we have about you, or want your account and uploads deleted? Email us from your school address and we'll handle it within 7 days. School administrations can request a full export of materials and user activity from their tenant at no cost."
        />

        <Topic
          title="Honor-code concerns"
          body="If you believe a student is using the platform to violate your school's honor code, contact us OR your school's administration directly — both channels work. We coordinate with the school on any confirmed violation."
        />

        <Topic
          title="Bug reports and feature ideas"
          body="Same email. Screenshots help."
        />

        <Topic
          title="Adding your school"
          body={
            <>
              If your school isn&apos;t on the platform yet, visit the{' '}
              <Link href="/request-school" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">
                request-a-school page
              </Link>
              . We review every request manually.
            </>
          }
        />
      </main>

      <Footer />
    </div>
  )
}

function Topic({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-white font-semibold text-base mb-2">{title}</h2>
      <div className="text-white/60 text-sm leading-relaxed">{body}</div>
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
