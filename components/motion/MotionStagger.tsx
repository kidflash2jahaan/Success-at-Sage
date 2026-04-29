'use client'
import { Children, cloneElement, isValidElement } from 'react'
import type { ReactNode, CSSProperties, ReactElement } from 'react'

/**
 * Cascading entrance for lists / grids — CSS-driven so it works during
 * SSR (no flash of invisible content while JS hydrates).
 *
 * MotionStagger walks its children at render time and injects an
 * incrementing `animationDelay` on each MotionItem. The CSS animation
 * itself lives on each MotionItem.
 *
 * Usage:
 *   <MotionStagger className="grid gap-4">
 *     {items.map(x => <MotionItem key={x.id}>...</MotionItem>)}
 *   </MotionStagger>
 */
export function MotionStagger({
  children,
  className,
  staggerChildren = 0.05,
  delayChildren = 0.05,
}: {
  children: ReactNode
  className?: string
  staggerChildren?: number
  delayChildren?: number
}) {
  let visibleIndex = 0
  return (
    <div className={className}>
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child
        const childProps = child.props as { style?: CSSProperties }
        const delay = delayChildren + visibleIndex * staggerChildren
        visibleIndex++
        return cloneElement(child as ReactElement<{ style?: CSSProperties }>, {
          style: {
            ...(childProps.style ?? {}),
            animationDelay: `${delay}s`,
          },
        })
      })}
    </div>
  )
}

/**
 * Direct child of MotionStagger — applies the fade-up animation. The
 * `animationDelay` is set by the parent via cloneElement.
 */
export function MotionItem({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={className}
      style={{
        animation: 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
