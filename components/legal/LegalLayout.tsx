import Link from 'next/link'
import FooterLinks from './FooterLinks'

export default function LegalLayout({
  active,
  children,
}: {
  active: 'privacy' | 'terms' | 'contact'
  children: React.ReactNode
}) {
  const otherPages: Array<{ slug: 'privacy' | 'terms' | 'contact'; label: string }> = [
    { slug: 'privacy', label: 'Privacy' },
    { slug: 'terms', label: 'Terms' },
    { slug: 'contact', label: 'Contact' },
  ]
  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-nav sticky top-0 z-20 flex items-center justify-between px-6 py-4">
        <Link href="/" className="font-bold text-white tracking-tight text-base">Success at HS</Link>
        <div className="flex items-center gap-4 text-sm text-white/60">
          {otherPages
            .filter(p => p.slug !== active)
            .map(p => (
              <Link key={p.slug} href={`/${p.slug}`} className="hover:text-white transition-colors">
                {p.label}
              </Link>
            ))}
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">{children}</main>

      <footer className="px-6 py-6 border-t border-white/5 text-center text-white/30 text-xs flex items-center justify-center gap-5">
        <span>© Success at HS</span>
        <FooterLinks className="flex items-center gap-5" />
      </footer>
    </div>
  )
}

export function LegalSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-8">
      <h2 className="text-white font-semibold text-lg mb-2">{title}</h2>
      <div className="text-white/60 text-sm leading-relaxed">{children}</div>
    </section>
  )
}
