import Link from 'next/link'
import FooterLinks from '@/components/legal/FooterLinks'

export default function RequestThanks() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <h1 className="text-3xl font-bold text-white mb-3">Request submitted</h1>
      <p className="text-white/50 mb-8">
        Thanks for your interest. We’ll review and get back to you at the email you provided.
      </p>
      <Link href="/" className="text-white/70 hover:text-white underline underline-offset-4">
        Back to home
      </Link>

      <FooterLinks className="mt-14 pt-6 border-t border-white/5 flex items-center justify-center gap-4 text-white/25 text-xs" />
    </div>
  )
}
