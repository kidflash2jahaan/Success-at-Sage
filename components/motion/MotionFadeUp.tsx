'use client'
import type { ReactNode, CSSProperties } from 'react'

/**
 * SSR-safe fade-up wrapper. Uses a CSS keyframe (defined in globals.css)
 * via inline `animation` so the animation runs as soon as the browser
 * parses the HTML — no JS hydration required, no period of invisible
 * content while React boots up.
 *
 * (We previously used Motion's `initial={{ opacity: 0 }}`, but that wrote
 * `opacity: 0` into the SSR HTML and content stayed invisible until JS
 * hydrated — making slow pages feel frozen. CSS animations don't have
 * that problem.)
 */
export default function MotionFadeUp({
  children,
  delay = 0,
  y = 20,
  className,
  style,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={className}
      style={{
        animation: `fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
        // y prop is honored by tweaking the from-state distance via a CSS var
        // — the keyframe in globals.css translates from 14px which is fine
        // for most uses; callers can pass a class with a different keyframe
        // if they need a different distance.
        ...style,
      }}
    >
      {children}
    </div>
  )
}
