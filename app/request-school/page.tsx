export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requestSchool } from '@/app/actions/request-school'

export default async function RequestSchoolPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string }>
}) {
  const { email, error } = await searchParams

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link href="/" className="text-white/40 text-sm hover:text-white/70">
        ← Back
      </Link>

      <h1 className="mt-6 mb-2 text-3xl font-bold text-white tracking-tight">Request your school</h1>
      <p className="text-white/50 text-sm mb-8">
        We’ll review your request and get back to you. Takes about 60 seconds.
      </p>

      {error === 'missing' && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          Please fill in every required field.
        </div>
      )}
      {error === '1' && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          Couldn’t submit your request. Please try again.
        </div>
      )}

      <form action={requestSchool} className="space-y-4">
        <Field label="Your name" name="requester_name" required />
        <Field label="Your email" name="requester_email" type="email" defaultValue={email} required />
        <Field label="Your role (student / teacher / parent / other)" name="requester_role" />
        <Field label="School name" name="proposed_name" placeholder="Sage Hill School" required />
        <Field label="Short display name" name="proposed_display_short" placeholder="Sage" required />
        <Field label="URL slug (a-z, 0-9, hyphens)" name="proposed_slug" placeholder="sage-hill" required />
        <Field label="Email domains (comma-separated)" name="proposed_domains" placeholder="sagehillschool.org, sagehill.edu" required />
        <label className="block">
          <span className="block text-sm text-white/70 mb-1">Tell us about your school</span>
          <textarea
            name="notes"
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </label>
        <button
          type="submit"
          className="w-full mt-2 px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
        >
          Submit request
        </button>
      </form>
    </div>
  )
}

function Field({
  label, name, type = 'text', placeholder, defaultValue, required,
}: { label: string; name: string; type?: string; placeholder?: string; defaultValue?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-sm text-white/70 mb-1">{label}{required ? <span className="text-red-400"> *</span> : null}</span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
      />
    </label>
  )
}
