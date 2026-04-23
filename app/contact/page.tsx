import Link from 'next/link'
import LegalLayout, { LegalSection } from '@/components/legal/LegalLayout'

export const dynamic = 'force-static'
export const metadata = { title: 'Contact · Success at HS' }

const CONTACT_EMAIL = '29PardhananiJ@sagehillschool.org'

export default function ContactPage() {
  return (
    <LegalLayout active="contact">
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

      <LegalSection title="Takedown requests">
        If you see content that shouldn&apos;t be on the platform — real
        tests, copyrighted material, something you uploaded and want removed,
        anything violating our honor-code rules — email the address above
        with a link or screenshot. We review takedown requests same-day and
        remove confirmed violations immediately.
      </LegalSection>

      <LegalSection title="Data requests">
        Want a copy of everything we have about you, or want your account and
        uploads deleted? Email us from your school address and we&apos;ll
        handle it within 7 days. School administrations can request a full
        export of materials and user activity from their tenant at no cost.
      </LegalSection>

      <LegalSection title="Honor-code concerns">
        If you believe a student is using the platform to violate your
        school&apos;s honor code, contact us OR your school&apos;s
        administration directly — both channels work. We coordinate with the
        school on any confirmed violation.
      </LegalSection>

      <LegalSection title="Bug reports and feature ideas">
        Same email. Screenshots help.
      </LegalSection>

      <LegalSection title="Adding your school">
        If your school isn&apos;t on the platform yet, visit the{' '}
        <Link href="/request-school" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">
          request-a-school page
        </Link>
        . We review every request manually.
      </LegalSection>
    </LegalLayout>
  )
}
