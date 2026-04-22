'use client'
import { useFormStatus } from 'react-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * Drop-in replacement for `<button type="submit">` inside a `<form action={...}>`.
 *
 * Reads `useFormStatus().pending` to render a spinner and disable the button
 * while the server action is in flight. Works for both synchronous and
 * asynchronous server actions.
 *
 * Must be a descendant of the same form it submits. For buttons outside a
 * form (e.g. triggering a `useTransition`), use `<PendingButton>` instead.
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
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'disabled'> & { disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={className}
      {...rest}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {pending && <Spinner />}
        <span>{pending && pendingLabel ? pendingLabel : children}</span>
      </span>
    </button>
  )
}

/**
 * Client-driven variant: for buttons that trigger a React transition (not a
 * form submission). Callers pass `pending` themselves.
 */
export function PendingButton({
  children,
  pendingLabel,
  pending,
  className,
  type = 'button',
  ...rest
}: {
  children: ReactNode
  pendingLabel?: ReactNode
  pending: boolean
  className?: string
  type?: 'button' | 'submit'
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'disabled'>) {
  return (
    <button
      type={type}
      disabled={pending}
      aria-busy={pending}
      className={className}
      {...rest}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {pending && <Spinner />}
        <span>{pending && pendingLabel ? pendingLabel : children}</span>
      </span>
    </button>
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
