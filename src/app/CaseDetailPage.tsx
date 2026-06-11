import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { fetchCaseDetail, type CaseDetail, type TimelineEvent } from '../lib/api'
import { useCaseActions } from './CasesPage'
import {
  Avatar,
  formatDateTime,
  formatDay,
  formatMoney,
  reasonLabel,
  StatusBadge,
} from './case-ui'

const card = 'rounded-xl border border-line bg-card shadow-card'

/** Timeline ring colors — same status hues as the badges (DESIGN.md). */
const EVENT_TONE: Record<TimelineEvent['type'], string> = {
  failed: 'border-rose text-rose',
  sent: 'border-slate text-slate',
  opened: 'border-slate text-slate',
  clicked: 'border-brand text-brand',
  bounced: 'border-rose text-rose',
  pending: 'border-ink-faint text-ink-faint',
  held: 'border-amber text-amber',
  canceled: 'border-line text-ink-faint',
  suppressed: 'border-plum text-plum',
  recovered: 'border-brand text-brand',
  lost: 'border-rose text-rose',
}

const EVENT_GLYPH: Record<TimelineEvent['type'], string> = {
  failed: '✕',
  sent: '↗',
  opened: '◉',
  clicked: '➜',
  bounced: '!',
  pending: '…',
  held: '⏸',
  canceled: '—',
  suppressed: '✕',
  recovered: '✓',
  lost: '✕',
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol>
      {events.map((e, i) => (
        <li key={i} className="relative pb-6 pl-12 last:pb-0">
          {i < events.length - 1 && (
            <span className="absolute bottom-0 left-[15px] top-8 w-px bg-line" />
          )}
          <span
            className={`absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full border-2 bg-card text-[12px] font-bold ${
              EVENT_TONE[e.type]
            } ${e.future ? 'border-dashed' : ''}`}
            aria-hidden
          >
            {EVENT_GLYPH[e.type]}
          </span>
          <div className={`flex items-start justify-between gap-3 ${e.future ? 'opacity-60' : ''}`}>
            <div>
              <div className="text-sm font-bold text-ink">{e.title}</div>
              {e.detail && <div className="mt-0.5 text-[13px] text-ink-mute">{e.detail}</div>}
            </div>
            <div className="shrink-0 whitespace-nowrap pt-0.5 font-mono text-[12px] text-ink-faint tnum">
              {formatDateTime(e.at)}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

function OutcomeCallout({ detail }: { detail: CaseDetail }) {
  const clicked = detail.timeline.some((e) => e.type === 'clicked')
  if (detail.status === 'RECOVERED') {
    return (
      <div className={`border-brand-tintln bg-brand-tint/50 p-5 ${card}`}>
        <p className="text-sm font-bold text-brand-ink">✓ Recovered</p>
        <p className="mt-2 text-[13px] leading-relaxed text-brand-ink/80">
          {formatMoney(detail.amountDue, detail.currency)} collected
          {detail.recoveredAt ? ` on ${formatDay(detail.recoveredAt)}` : ''}. This case is closed —
          if the subscription fails again, a new recovery sequence resumes where this one left off.
        </p>
      </div>
    )
  }
  if (detail.status === 'SUPPRESSED') {
    return (
      <div className={`border-plum/20 bg-plum-tint/60 p-5 ${card}`}>
        <p className="text-sm font-bold text-plum">Suppressed ≠ lost</p>
        <p className="mt-2 text-[13px] leading-relaxed text-plum/90">
          This customer unsubscribed, so recovery emails stopped immediately. Stripe's Smart
          Retries keep running in the background — the invoice can still be recovered without
          another email.
        </p>
      </div>
    )
  }
  if (detail.status === 'PAUSED') {
    return (
      <div className={`border-amber/20 bg-amber-tint/60 p-5 ${card}`}>
        <p className="text-sm font-bold text-amber">⏸ Paused — emails held</p>
        <p className="mt-2 text-[13px] leading-relaxed text-amber/90">
          Scheduled emails are held, not canceled. Stripe retries and stop conditions stay live —
          if the customer pays while paused, the case still closes recovered. Resume any time.
        </p>
      </div>
    )
  }
  if (detail.status === 'LOST_INVOLUNTARY' || detail.status === 'LOST_VOLUNTARY') {
    return (
      <div className={`p-5 ${card}`}>
        <p className="text-sm font-bold text-ink">
          {detail.status === 'LOST_VOLUNTARY' ? 'Canceled by the customer' : 'Lost'}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-mute">
          {detail.status === 'LOST_VOLUNTARY'
            ? 'The customer canceled on purpose — this case is excluded from your recovery rate.'
            : 'The payment was never recovered and the subscription ended.'}
        </p>
      </div>
    )
  }
  if (clicked) {
    return (
      <div className={`border-brand-tintln bg-brand-tint/50 p-5 ${card}`}>
        <p className="text-sm font-bold text-brand-ink">➜ Engaged</p>
        <p className="mt-2 text-[13px] leading-relaxed text-brand-ink/80">
          This customer clicked the update-payment link — they've seen the problem. A recovery is
          likely; the sequence keeps going until the invoice is paid.
        </p>
      </div>
    )
  }
  return (
    <div className={`p-5 ${card}`}>
      <p className="text-sm font-bold text-ink">Recovery in progress</p>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-mute">
        The sequence is running. Stripe retries the charge on its own schedule while Dunly nudges
        the customer to fix their payment method.
      </p>
    </div>
  )
}

export function CaseDetailPage() {
  const { caseId = '' } = useParams()
  const { data: detail, isError } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => fetchCaseDetail(caseId),
  })
  const actions = useCaseActions(caseId)

  if (isError) {
    return (
      <div>
        <BackLink />
        <p className="mt-6 text-sm text-ink-mute">This case doesn't exist in your workspace.</p>
      </div>
    )
  }
  if (!detail) {
    return (
      <div>
        <BackLink />
        <p className="mt-6 font-mono text-sm text-ink-faint">Loading…</p>
      </div>
    )
  }

  const isOpen = detail.status === 'ACTIVE' || detail.status === 'PAUSED'
  const stageSummary =
    detail.status === 'SUPPRESSED'
      ? 'Emails suppressed'
      : detail.status === 'RECOVERED'
        ? 'Complete'
        : `Email ${detail.sentCount} of ${detail.totalSteps}`

  const stop = () => {
    const name = detail.customer.name ?? detail.customer.email ?? 'this customer'
    if (
      window.confirm(
        `Stop recovering ${formatMoney(detail.amountDue, detail.currency)} from ${name} and mark the case lost? This can't be undone.`,
      )
    )
      actions.mutate('stop')
  }

  return (
    <div className="max-w-5xl">
      <BackLink />

      <div className={`mt-5 p-6 ${card}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={detail.customer.name ?? detail.customer.email} size={52} />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="whitespace-nowrap text-[22px] font-extrabold tracking-tight text-ink">
                  {detail.customer.name ?? detail.customer.email ?? 'Customer'}
                </h1>
                <StatusBadge status={detail.status} />
              </div>
              <p className="mt-0.5 text-sm text-ink-mute">
                {detail.customer.email}
                {detail.subscription?.planName ? ` · ${detail.subscription.planName}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {detail.status === 'ACTIVE' && (
              <button
                onClick={() => actions.mutate('pause')}
                disabled={actions.isPending}
                className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-50"
              >
                Pause sequence
              </button>
            )}
            {detail.status === 'PAUSED' && (
              <button
                onClick={() => actions.mutate('resume')}
                disabled={actions.isPending}
                className="rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
              >
                Resume sequence
              </button>
            )}
            {isOpen && (
              <button
                onClick={stop}
                disabled={actions.isPending}
                className="rounded-lg border border-rose/30 px-3.5 py-2 text-[13px] font-semibold text-rose transition-colors hover:bg-rose-tint disabled:opacity-50"
              >
                Stop & mark lost
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
          {[
            { k: 'Invoice amount', v: formatMoney(detail.amountDue, detail.currency) },
            { k: 'Failure reason', v: reasonLabel(detail.failureCode) },
            { k: 'Current stage', v: stageSummary },
            { k: 'Failed on', v: formatDay(detail.failedAt) },
          ].map((m) => (
            <div key={m.k} className="bg-paper px-4 py-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                {m.k}
              </div>
              <div className="mt-1 font-mono text-[15px] font-bold text-ink tnum">{m.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className={`lg:col-span-2 ${card}`}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h3 className="text-[15px] font-bold text-ink">Recovery timeline</h3>
            <span className="text-xs text-ink-faint">Derived from real events</span>
          </div>
          <div className="p-5">
            <Timeline events={detail.timeline} />
          </div>
        </div>

        <div className="space-y-5">
          <OutcomeCallout detail={detail} />

          {detail.nextSend && (
            <div className={`p-5 ${card}`}>
              <h4 className="text-[13px] font-bold text-ink">
                {detail.nextSend.held ? 'Held touch (paused)' : 'Next scheduled touch'}
              </h4>
              <div className="mt-3 rounded-lg border border-line bg-paper p-3">
                <div className="text-[13px] font-semibold text-ink">
                  Email {detail.nextSend.stageOrder}
                  {detail.nextSend.subject ? ` — ${detail.nextSend.subject}` : ''}
                </div>
                <div className="mt-0.5 font-mono text-[12px] text-ink-faint tnum">
                  {detail.nextSend.held
                    ? `Was due ${formatDateTime(detail.nextSend.scheduledFor)} — resumes on unpause`
                    : `Sends ${formatDateTime(detail.nextSend.scheduledFor)} if unpaid`}
                </div>
              </div>
              {detail.nextSend.stepId && (
                <Link
                  to={`/app/sequence/${detail.nextSend.stepId}`}
                  className="mt-3 flex h-9 w-full items-center justify-center rounded-lg border border-line text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
                >
                  Edit this email
                </Link>
              )}
            </div>
          )}

          <div className={`p-5 ${card}`}>
            <h4 className="text-[13px] font-bold text-ink">Customer</h4>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              {[
                ['Email', detail.customer.email ?? '—'],
                ['Plan', detail.subscription?.planName ?? '—'],
                ['Customer since', formatDay(detail.customer.since)],
                ['Attempts', String(detail.attemptCount)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <dt className="shrink-0 text-ink-faint">{k}</dt>
                  <dd className="truncate font-mono font-semibold text-ink tnum">{v}</dd>
                </div>
              ))}
            </dl>
            {detail.hostedInvoiceUrl && (
              <a
                href={detail.hostedInvoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block text-[13px] font-semibold text-ink-mute hover:text-ink"
              >
                View invoice in Stripe →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/app/cases"
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-mute transition-colors hover:text-ink"
    >
      ← Back to cases
    </Link>
  )
}
