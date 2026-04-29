'use client'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import Link from 'next/link'

/**
 * Interactive card wrapper. Two layers:
 *
 *   - Outer <div>: CSS fade-up entrance. Runs at SSR + first paint, no JS
 *     dependency. Prevents the "everything opacity 0 until hydration"
 *     blank-screen problem.
 *
 *   - Inner motion.div: Motion's spring-physics whileHover / whileTap.
 *     Only runs after hydration, which is fine because the user can't
 *     hover/tap until JS is loaded anyway.
 */
export default function MotionCard({
  href,
  children,
  className,
  delay = 0,
  onClick,
}: {
  href?: string
  children: ReactNode
  className?: string
  delay?: number
  onClick?: () => void
}) {
  const motionInner = (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      {href ? (
        <Link href={href} className={className} onClick={onClick}>
          {children}
        </Link>
      ) : (
        <div className={className} onClick={onClick}>
          {children}
        </div>
      )}
    </motion.div>
  )
  return (
    <div
      style={{
        animation: `fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
      }}
    >
      {motionInner}
    </div>
  )
}
