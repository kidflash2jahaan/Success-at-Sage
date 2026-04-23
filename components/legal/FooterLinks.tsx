import Link from 'next/link'

export default function FooterLinks({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
      <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
      <Link href="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
    </div>
  )
}
