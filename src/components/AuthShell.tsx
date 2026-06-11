import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router'
import { Wordmark } from './Wordmark'

export const inputClass =
  'h-11 w-full rounded-lg border border-line bg-card px-3.5 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-brand focus:ring-2 focus:ring-brand-tintln'

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">{label}</span>
      {children}
    </label>
  )
}

export function AuthShell({
  title,
  subtitle,
  error,
  onSubmit,
  children,
  footer,
}: {
  title: string
  subtitle: string
  error: string | null
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-7 flex justify-center">
          <Link to="/" aria-label="Dunly home">
            <Wordmark />
          </Link>
        </div>
        <div className="animate-rise rounded-xl border border-line bg-card p-8 shadow-card">
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-mute">{subtitle}</p>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-rose-tint px-3.5 py-2.5 text-[13px] font-medium text-rose"
            >
              {error}
            </p>
          )}
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {children}
          </form>
        </div>
        <p className="mt-5 text-center text-sm text-ink-mute">{footer}</p>
      </div>
    </div>
  )
}
