import type { CaseStatus } from '../lib/api'

/** Minor units → "$49.00". MVP currencies are 2-decimal (usd/eur). */
export function formatMoney(minor: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(minor / 100)
}

export function formatDay(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso))
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export const REASON_LABEL: Record<string, string> = {
  card_declined: 'Card declined',
  expired_card: 'Card expired',
  insufficient_funds: 'Insufficient funds',
}

export const reasonLabel = (code: string | null) =>
  code ? (REASON_LABEL[code] ?? code.replaceAll('_', ' ')) : 'Payment failed'

/**
 * Status colors per DESIGN.md: slate = active/in-flight (NEVER brand green),
 * green = recovered only, amber = paused, rose = lost·involuntary,
 * neutral gray = lost·voluntary, plum = suppressed.
 */
const STATUS_META: Record<CaseStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'bg-slate-tint text-slate' },
  RECOVERED: { label: 'Recovered', className: 'bg-brand-tint text-brand-ink' },
  PAUSED: { label: 'Paused', className: 'bg-amber-tint text-amber' },
  LOST_INVOLUNTARY: { label: 'Lost · involuntary', className: 'bg-rose-tint text-rose' },
  LOST_VOLUNTARY: { label: 'Lost · voluntary', className: 'bg-line-soft text-ink-mute' },
  SUPPRESSED: { label: 'Suppressed', className: 'bg-plum-tint text-plum' },
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  )
}

/** "Email 2/4" progress dots — sent dots are brand (an on-state). */
export function StageDots({ sent, total }: { sent: number; total: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex items-center gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${i < sent ? 'bg-brand' : 'bg-line'}`}
          />
        ))}
      </span>
      <span className="ml-1 font-mono text-[12px] font-medium text-ink-soft">
        {sent}/{total}
      </span>
    </span>
  )
}

const AVATAR_TONES = [
  'bg-slate-tint text-slate',
  'bg-brand-tint text-brand-ink',
  'bg-amber-tint text-amber',
  'bg-plum-tint text-plum',
  'bg-rose-tint text-rose',
]

export function Avatar({ name, size = 30 }: { name: string | null; size?: number }) {
  const display = name?.trim() || '?'
  const initials = display
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  const tone = AVATAR_TONES[(display.charCodeAt(0) + display.length) % AVATAR_TONES.length]
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full text-[11px] font-bold ${tone}`}
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  )
}
