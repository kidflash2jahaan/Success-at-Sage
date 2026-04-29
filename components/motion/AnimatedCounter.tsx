'use client'
import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'motion/react'

/**
 * Counts a number up from 0 to `value` with a spring curve. Used for
 * stat tiles ("Pending Review: 12") so numbers feel alive on mount.
 */
export default function AnimatedCounter({
  value,
  duration = 1.2,
  className,
}: {
  value: number
  duration?: number
  className?: string
}) {
  const motionVal = useMotionValue(0)
  const rounded = useTransform(motionVal, (v) => Math.round(v).toLocaleString())

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    })
    return () => controls.stop()
  }, [value, duration, motionVal])

  return <motion.span className={className}>{rounded}</motion.span>
}
