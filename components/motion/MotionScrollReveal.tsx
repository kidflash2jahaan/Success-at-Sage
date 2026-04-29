'use client'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Reveal-on-scroll wrapper — element fades+slides up the first time it
 * enters the viewport. Once it's in, it stays. Used for long pages
 * (legal, FAQ) so sections animate in as the user scrolls.
 */
export default function MotionScrollReveal({
  children,
  className,
  y = 24,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  y?: number
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ type: 'spring', stiffness: 200, damping: 24, delay }}
    >
      {children}
    </motion.div>
  )
}
