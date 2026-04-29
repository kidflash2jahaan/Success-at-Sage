'use client'
import { useFormStatus } from 'react-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'motion/react'

/**
 * Drop-in replacement for `<button type="submit">` inside a `<form action={...}>`.
 *
 * Spring-physics tap response via Motion gives the button a tactile,
 * Apple-feeling press: compresses on tap, springs back on release with a
 * subtle overshoot. Reads `useFormStatus().pending` to render a spinner
 * and disable the button while the server action is in flight.
 */
export default function SubmitButton({
  children,
  pendingLabel,
  className,
  disabled,
  ...rest
}: {
  children: ReactNode
  pendingLabel?: ReactNode
  className?: string
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'disabled' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onDragEnter' | 'onDragExit' | 'onDragLeave' | 'onDragOver' | 'onDrop' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
> & { disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <motion.button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={className}
      whileHover={pending || disabled ? undefined : { scale: 1.015, y: -1 }}
      whileTap={pending || disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      {...rest}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {pending && <Spinner />}
        <span>{pending && pendingLabel ? pendingLabel : children}</span>
      </span>
    </motion.button>
  )
}

/**
 * Client-driven variant: for buttons that trigger a React transition (not a
 * form submission). Callers pass `pending` themselves, and may pass
 * `disabled` on top — the button is disabled when either is true.
 */
export function PendingButton({
  children,
  pendingLabel,
  pending,
  disabled,
  className,
  type = 'button',
  ...rest
}: {
  children: ReactNode
  pendingLabel?: ReactNode
  pending: boolean
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'disabled' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onDragEnter' | 'onDragExit' | 'onDragLeave' | 'onDragOver' | 'onDrop' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
>) {
  return (
    <motion.button
      type={type}
      disabled={pending || disabled}
      aria-busy={pending}
      className={className}
      whileHover={pending || disabled ? undefined : { scale: 1.015, y: -1 }}
      whileTap={pending || disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      {...rest}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {pending && <Spinner />}
        <span>{pending && pendingLabel ? pendingLabel : children}</span>
      </span>
    </motion.button>
  )
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
