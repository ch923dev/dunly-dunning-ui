import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  api,
  fetchCampaign,
  fetchExpiringCards,
  fetchWorkspace,
  type CampaignStep,
  type ExpiryCardStatus,
  type Workspace,
} from '../lib/api'
import { formatDay, formatMoney } from './case-ui'

function dayNumber(delayHours: number) {
  return Math.round(delayHours / 24)
}

function EnableToggle({ step }: { step: CampaignStep }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (isEnabled: boolean) =>
      api(`/api/campaign/steps/${step.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isEnabled }),
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['campaign'] }),
  })

  return (
    <button
      role="switch"
      aria-checked={step.isEnabled}
      aria-label={`Stage ${step.order} ${step.isEnabled ? 'enabled' : 'disabled'}`}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate(!step.isEnabled)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
        step.isEnabled ? 'bg-brand' : 'bg-line'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          step.isEnabled ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

function windowLabel(step: CampaignStep) {
  if (step.sendWindowStart === null || step.sendWindowEnd === null) return 'Any time'
  const hh = (h: number) => `${String(h).padStart(2, '0')}:00`
  return `${hh(step.sendWindowStart)}–${hh(step.sendWindowEnd)}`
}

/** Timeline row: day circle on the rail + stage card (design prototype). */
function StageRow({ step, isLast }: { step: CampaignStep; isLast: boolean }) {
  return (
    <div className="relative pl-14">
      {!isLast && <span className="absolute -bottom-5 left-[19px] top-12 w-0.5 bg-line" />}
      <span
        className={`absolute left-0 top-1 grid h-10 w-10 place-items-center rounded-full font-mono text-[13px] font-extrabold tnum ${
          step.isEnabled ? 'bg-brand text-white' : 'bg-line text-ink-faint'
        }`}
      >
        {dayNumber(step.delayHours)}
      </span>

      <div
        className={`mb-5 rounded-xl border border-line bg-card p-5 shadow-card transition-opacity ${
          step.isEnabled ? '' : 'opacity-60'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <Link
                to={step.id}
                className="truncate text-[15px] font-bold text-ink hover:text-brand"
              >
                {step.subject}
              </Link>
              {step.isCustomized && (
                <span className="shrink-0 rounded-full bg-plum-tint px-2 py-0.5 text-[10px] font-semibold text-plum">
                  customized
                </span>
              )}
            </div>
            <p className="mt-1 text-[12px] text-ink-mute">
              {step.order === 1
                ? 'Friendly heads-up, sent right after the failure'
                : step.order === 2
                  ? 'Short nudge restating the update-card link'
                  : step.order === 3
                    ? 'Urgency — mentions the risk of losing access'
                    : 'Last chance before the subscription is canceled'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <EnableToggle step={step} />
            <Link
              to={step.id}
              className="rounded-lg border border-line px-3.5 py-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              Edit
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line-soft pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              Delay after failure
            </p>
            <p className="mt-1 font-mono text-[13px] font-semibold text-ink tnum">
              {step.delayHours === 0 ? 'Immediately' : `Day ${dayNumber(step.delayHours)}`}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              Send window
            </p>
            <p className="mt-1 font-mono text-[13px] font-semibold text-ink tnum">
              {windowLabel(step)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              Skip if under
            </p>
            <p className="mt-1 font-mono text-[13px] font-semibold text-ink tnum">
              {step.skipIfAmountBelow === null ? '—' : formatMoney(step.skipIfAmountBelow, 'usd')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pre-dunning (phase 4) — card-expiry prevention, before anything fails
// ---------------------------------------------------------------------------

const EXPIRY_TOUCHES = [
  {
    key: 'expiryTouch1Enabled' as const,
    day: '−21',
    subject: 'Your card on file expires soon — keep {{company_name}} running',
    desc: 'Friendly heads-up, three weeks before the card expires',
    when: '21 days before expiry',
  },
  {
    key: 'expiryTouch2Enabled' as const,
    day: '−7',
    subject: 'Last call: your card ending {{card_last4}} expires this month',
    desc: 'Last call, one week out — names the interruption risk',
    when: '7 days before expiry',
  },
]

function ExpiryToggle({ field, enabled }: { field: string; enabled: boolean }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      api('/api/workspace', { method: 'PATCH', body: JSON.stringify({ [field]: next }) }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['workspace'] }),
  })
  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={`${field} ${enabled ? 'enabled' : 'disabled'}`}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate(!enabled)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
        enabled ? 'bg-brand' : 'bg-line'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          enabled ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

/** Timeline row for one pre-dunning touch — slate accent: prevention is
 *  in-flight work, never brand green (DESIGN.md). Read-only in v1. */
function ExpiryTouchRow({
  touch,
  enabled,
  isLast,
}: {
  touch: (typeof EXPIRY_TOUCHES)[number]
  enabled: boolean
  isLast: boolean
}) {
  return (
    <div className="relative pl-14">
      {!isLast && <span className="absolute -bottom-5 left-[19px] top-12 w-0.5 bg-line" />}
      <span
        className={`absolute left-0 top-1 grid h-10 w-10 place-items-center rounded-full font-mono text-[12px] font-extrabold tnum ${
          enabled ? 'bg-slate text-white' : 'bg-line text-ink-faint'
        }`}
      >
        {touch.day}
      </span>

      <div
        className={`mb-5 rounded-xl border border-line bg-card p-5 shadow-card transition-opacity ${
          enabled ? '' : 'opacity-60'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-ink">{touch.subject}</p>
            <p className="mt-1 text-[12px] text-ink-mute">{touch.desc}</p>
          </div>
          <ExpiryToggle field={touch.key} enabled={enabled} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line-soft pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              Sends
            </p>
            <p className="mt-1 font-mono text-[13px] font-semibold text-ink tnum">{touch.when}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              Send time
            </p>
            <p className="mt-1 font-mono text-[13px] font-semibold text-ink tnum">
              10:00 workspace time
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              Stops when
            </p>
            <p className="mt-1 text-[13px] font-semibold text-ink">Card is updated</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const EXPIRY_STATUS_META: Record<ExpiryCardStatus, { label: string; cls: string }> = {
  OPEN: { label: 'Watching', cls: 'bg-slate-tint text-slate' },
  RESOLVED: { label: 'Updated', cls: 'bg-brand-tint text-brand' },
  LAPSED: { label: 'Lapsed', cls: 'bg-line-soft text-ink-mute' },
  CANCELED: { label: 'Canceled', cls: 'bg-line-soft text-ink-mute' },
}

function WatchingTable() {
  const { data } = useQuery({ queryKey: ['expiring-cards'], queryFn: fetchExpiringCards })
  const cards = data?.cards ?? []
  if (cards.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-line bg-card px-5 py-6 text-center text-[13px] text-ink-mute shadow-card">
        No expiring cards right now — Dunly checks every active subscription daily.
      </p>
    )
  }
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-line bg-card shadow-card">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wide text-ink-faint">
            <th className="px-5 py-2.5 font-semibold">Customer</th>
            <th className="px-3 py-2.5 font-semibold">Card</th>
            <th className="px-3 py-2.5 font-semibold">Expires</th>
            <th className="px-3 py-2.5 font-semibold">Protects</th>
            <th className="px-3 py-2.5 font-semibold">Touches</th>
            <th className="px-3 py-2.5 font-semibold">Next touch</th>
            <th className="px-5 py-2.5 text-right font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((c) => {
            const meta = EXPIRY_STATUS_META[c.status]
            return (
              <tr key={c.id} className="border-t border-line-soft">
                <td className="px-5 py-2.5">
                  <span className="block max-w-[180px] truncate font-semibold text-ink">
                    {c.customerName ?? c.customerEmail ?? '—'}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-mono text-ink-soft tnum">
                  {c.cardBrand ?? 'card'} ····{c.cardLast4 ?? '????'}
                </td>
                <td className="px-3 py-2.5 font-mono text-ink tnum">
                  {String(c.expMonth).padStart(2, '0')}/{c.expYear}
                </td>
                <td className="px-3 py-2.5 font-mono text-ink tnum">
                  {formatMoney(c.protectedAmount, c.currency)}/mo
                </td>
                <td className="px-3 py-2.5 font-mono text-ink-soft tnum">{c.touchesSent} of 2</td>
                <td className="px-3 py-2.5 font-mono text-ink-mute tnum">
                  {c.nextTouchAt ? formatDay(c.nextTouchAt) : '—'}
                </td>
                <td className="px-5 py-2.5 text-right">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}
                  >
                    {meta.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PreDunningSection({ workspace }: { workspace: Workspace | undefined }) {
  const touch1 = workspace?.settings?.expiryTouch1Enabled ?? true
  const touch2 = workspace?.settings?.expiryTouch2Enabled ?? true
  return (
    <>
      <h2 className="mt-10 text-[15px] font-bold text-ink">Pre-dunning</h2>
      <p className="mt-1 text-[12px] text-ink-mute">
        Sent before a card expires, to prevent the failure entirely. Copy is fixed in v1 and
        never mentions billing — only keeping access running.
      </p>
      <div className="mt-4">
        {EXPIRY_TOUCHES.map((t, i) => (
          <ExpiryTouchRow
            key={t.key}
            touch={t}
            enabled={t.key === 'expiryTouch1Enabled' ? touch1 : touch2}
            isLast={i === EXPIRY_TOUCHES.length - 1}
          />
        ))}
      </div>
      <h3 className="mt-6 text-[13px] font-bold text-ink">Currently watching</h3>
      <WatchingTable />
    </>
  )
}

const STOP_CONDITIONS = [
  {
    label: 'Payment recovered',
    desc: 'The invoice is paid — every pending email cancels instantly.',
  },
  {
    label: 'Subscription canceled',
    desc: 'Voluntary or involuntary. Involuntary cancellations trigger the one-shot reactivation email below.',
  },
  {
    label: 'Customer disputes the charge',
    desc: 'All outreach stops immediately — a disputing customer is never dunned.',
  },
  {
    label: 'Customer unsubscribes',
    desc: 'Emails stop for good, but Stripe keeps retrying the charge — the case can still recover.',
  },
  {
    label: 'Email bounces',
    desc: 'The address is suppressed to protect your sending reputation.',
  },
]

export function SequencePage() {
  const { data: campaign } = useQuery({ queryKey: ['campaign'], queryFn: fetchCampaign })
  const { data: workspace } = useQuery({ queryKey: ['workspace'], queryFn: fetchWorkspace })

  if (!campaign) {
    return (
      <div className="max-w-[760px]">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Sequence</h1>
        <p className="mt-8 font-mono text-sm text-ink-faint">Loading…</p>
      </div>
    )
  }

  const activeCount = campaign.steps.filter((s) => s.isEnabled).length

  return (
    <div className="max-w-[760px]">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Sequence</h1>
      <p className="mt-1 text-sm text-ink-mute">
        When and how Dunly reaches out after a payment fails. Click a stage to edit its email.
      </p>

      <div className="mt-8 flex items-baseline justify-between">
        <h2 className="text-[15px] font-bold text-ink">Dunning sequence</h2>
        <span className="font-mono text-[12px] text-ink-faint tnum">
          {activeCount} of {campaign.steps.length} touches active
        </span>
      </div>
      <div className="mt-4">
        {campaign.steps.map((step, i) => (
          <StageRow key={step.id} step={step} isLast={i === campaign.steps.length - 1} />
        ))}
      </div>

      <h2 className="mt-10 text-[15px] font-bold text-ink">After cancellation</h2>
      <p className="mt-1 text-[12px] text-ink-mute">
        One optional win-back touch when dunning doesn't succeed.
      </p>
      <div className="relative mt-4 pl-14">
        <span className="absolute left-0 top-1 grid h-10 w-10 place-items-center rounded-full bg-plum font-mono text-[13px] font-extrabold text-white">
          R
        </span>
        <div className="rounded-xl border border-line bg-card p-5 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Link
                to="reactivation"
                className="block truncate text-[15px] font-bold text-ink hover:text-brand"
              >
                {campaign.reactivation.subject}
              </Link>
              <p className="mt-1 text-[12px] leading-snug text-ink-mute">
                Sent once when a subscription is canceled over a payment failure — never to
                customers who cancel on purpose.
              </p>
            </div>
            <Link
              to="reactivation"
              className="shrink-0 rounded-lg border border-line px-3.5 py-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              View
            </Link>
          </div>
        </div>
      </div>

      <PreDunningSection workspace={workspace} />

      <h2 className="mt-10 text-[15px] font-bold text-ink">Stop conditions</h2>
      <p className="mt-1 text-[12px] text-ink-mute">
        When Dunly automatically ends a sequence — enforced at send time, read-only.
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-card shadow-card">
        {STOP_CONDITIONS.map((s, i) => (
          <div
            key={s.label}
            className={`flex items-start gap-3 px-5 py-3.5 ${i > 0 ? 'border-t border-line-soft' : ''}`}
          >
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-tint text-[12px] font-bold text-brand">
              ✓
            </span>
            <div>
              <div className="text-[14px] font-semibold text-ink">{s.label}</div>
              <div className="text-[13px] text-ink-mute">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
