import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  fetchCases,
  fetchEmailPerformance,
  fetchMetrics,
  type Metrics,
} from '../lib/api'
import { Avatar, formatDay, formatMoney, reasonLabel, StageDots } from './case-ui'

const card = 'rounded-xl border border-line bg-card shadow-card'

function StatCard({
  label,
  value,
  sub,
  hero = false,
}: {
  label: string
  value: string
  sub: string
  hero?: boolean
}) {
  return (
    <div className={`relative overflow-hidden p-5 ${card} ${hero ? 'ring-1 ring-brand/15' : ''}`}>
      {hero && <div className="absolute inset-x-0 top-0 h-[3px] bg-brand" />}
      <p className="text-[13px] font-semibold text-ink-mute">{label}</p>
      <p
        className={`mt-3 font-mono font-extrabold tracking-tight text-ink tnum ${
          hero ? 'text-[36px] leading-none' : 'text-[28px] leading-none'
        }`}
      >
        {value}
      </p>
      <p className="mt-2.5 text-xs text-ink-faint">{sub}</p>
    </div>
  )
}

/** Stacked weekly bars: recovered (brand) under still-open/lost (line gray). */
function TrendChart({ metrics }: { metrics: Metrics }) {
  const H = 180
  const max = Math.max(...metrics.trend.map((w) => w.failed), 1)
  const anyData = metrics.trend.some((w) => w.failed > 0)
  return (
    <div className={`p-5 lg:col-span-2 ${card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-ink">Recovered vs. at risk</h3>
          <p className="mt-0.5 text-xs text-ink-mute">Weekly failed volume, last 8 weeks</p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand" /> Recovered
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
            <span className="h-2.5 w-2.5 rounded-sm bg-line" /> Still open / lost
          </span>
        </div>
      </div>
      {anyData ? (
        <div className="mt-5 flex items-end justify-between gap-2.5" style={{ height: H }}>
          {metrics.trend.map((w) => {
            const rec = Math.round((w.recoveredSoFar / max) * H)
            const rest = Math.round(((w.failed - w.recoveredSoFar) / max) * H)
            return (
              <div key={w.weekStart} className="group flex flex-1 flex-col items-center gap-2">
                <div
                  className="flex w-full max-w-[34px] flex-col justify-end overflow-hidden rounded-md"
                  style={{ height: H }}
                  title={`${formatMoney(w.recoveredSoFar, metrics.currency)} recovered of ${formatMoney(w.failed, metrics.currency)} failed`}
                >
                  <div className="w-full bg-line transition-colors group-hover:bg-line/70" style={{ height: rest }} />
                  <div className="w-full rounded-t-md bg-brand transition-colors group-hover:bg-brand-hover" style={{ height: rec }} />
                </div>
                <span className="font-mono text-[10px] font-medium text-ink-faint">{w.label}</span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-10 pb-8 text-center text-sm text-ink-mute">
          No failed payments in the last 8 weeks.
        </p>
      )}
    </div>
  )
}

/**
 * Dark "prevented" callout (design prototype PreDunningCallout): failures
 * stopped before they happened are invisible value worth surfacing.
 */
function PreDunningCallout({ metrics }: { metrics: Metrics }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-brand-ink bg-brand-ink p-5 text-white shadow-card">
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
      <div className="absolute -right-2 bottom-2 h-20 w-20 rounded-full bg-white/5" />
      <div className="relative">
        <div className="mb-4 grid h-9 w-9 place-items-center rounded-lg bg-white/15 text-[17px]">
          🛡
        </div>
        <p className="mb-1 text-[13px] font-semibold text-white/70">Pre-dunning prevented</p>
        <p className="font-mono text-[34px] font-extrabold leading-none tracking-tight tnum">
          {formatMoney(metrics.prevented.amount, metrics.currency)}
        </p>
        <p className="mt-2.5 text-[13px] leading-snug text-white/80">
          <b className="font-mono text-white tnum">{metrics.prevented.cards}</b>{' '}
          {metrics.prevented.cards === 1 ? 'card' : 'cards'} updated before expiry this month —
          failures stopped before they happened.
        </p>
        <p className="mt-1.5 text-[12px] text-white/60">
          <span className="font-mono tnum">{metrics.watching}</span>{' '}
          {metrics.watching === 1 ? 'card' : 'cards'} being watched right now.
        </p>
        <Link
          to="/app/sequence"
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/90 transition-colors hover:text-white"
        >
          Manage pre-dunning →
        </Link>
      </div>
    </div>
  )
}

const STAGE_LABEL: Record<number, string> = { 100: 'Reactivation' }

function EmailPerformanceCard() {
  const { data } = useQuery({ queryKey: ['email-performance'], queryFn: fetchEmailPerformance })
  const stages = data?.stages ?? []
  const totalSent = stages.reduce((s, x) => s + x.sent, 0)
  const noTracking = totalSent > 0 && stages.every((s) => s.opened === 0 && s.clicked === 0)
  return (
    <div className={`p-5 ${card}`}>
      <h3 className="text-[15px] font-bold text-ink">Email performance</h3>
      <p className="mt-0.5 text-xs text-ink-mute">Last-touch recoveries per stage</p>
      {totalSent === 0 ? (
        <p className="mt-6 text-sm text-ink-mute">No emails sent yet.</p>
      ) : (
        <table className="mt-4 w-full text-[13px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-ink-faint">
              <th className="py-1.5 font-semibold">Stage</th>
              <th className="py-1.5 text-right font-semibold">Sent</th>
              <th className="py-1.5 text-right font-semibold">Opened</th>
              <th className="py-1.5 text-right font-semibold">Clicked</th>
              <th className="py-1.5 text-right font-semibold">Won</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((s) => (
              <tr key={s.stageOrder} className="border-t border-line-soft">
                <td className="py-2 font-semibold text-ink-soft">
                  {STAGE_LABEL[s.stageOrder] ?? `Email ${s.stageOrder}`}
                </td>
                <td className="py-2 text-right font-mono text-ink tnum">{s.sent}</td>
                <td className="py-2 text-right font-mono text-ink tnum">{s.opened}</td>
                <td className="py-2 text-right font-mono text-ink tnum">{s.clicked}</td>
                <td className="py-2 text-right font-mono font-bold text-brand-ink tnum">
                  {s.recoveries}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {data && data.noEmailRecoveries > 0 && (
        <p className="mt-3 text-[11px] leading-snug text-ink-faint">
          +{data.noEmailRecoveries} recovered before any email was needed (Stripe retries).
        </p>
      )}
      {noTracking && (
        <p className="mt-3 text-[11px] leading-snug text-ink-faint">
          Opens and clicks appear once delivery tracking is live.
        </p>
      )}
    </div>
  )
}

function ActiveCasesPreview() {
  const { data } = useQuery({
    queryKey: ['cases', 'preview'],
    queryFn: () => fetchCases('status=ACTIVE&limit=5'),
  })
  const rows = data?.cases ?? []
  return (
    <div className={`overflow-hidden ${card}`}>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <h3 className="text-[15px] font-bold text-ink">Active cases</h3>
          <p className="mt-0.5 text-xs text-ink-mute">In-flight recovery sequences</p>
        </div>
        <Link
          to="/app/cases"
          className="rounded-lg border border-line px-3.5 py-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
        >
          View all
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-semibold text-ink">No active cases 🎉</p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-ink-mute">
            We're watching your Stripe account in real time — the moment a charge fails, a
            recovery case opens here automatically.
          </p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-ink-faint">
              <th className="px-5 py-2.5 font-semibold">Customer</th>
              <th className="px-3 py-2.5 font-semibold">Amount</th>
              <th className="px-3 py-2.5 font-semibold">Reason</th>
              <th className="px-3 py-2.5 font-semibold">Stage</th>
              <th className="px-5 py-2.5 text-right font-semibold">Next email</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-line-soft transition-colors hover:bg-paper">
                <td className="px-5 py-3">
                  <Link to={`/app/cases/${c.id}`} className="flex items-center gap-2.5">
                    <Avatar name={c.customer.name} />
                    <span className="whitespace-nowrap font-semibold text-ink">
                      {c.customer.name ?? c.customer.email ?? '—'}
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-3 font-mono font-semibold text-ink tnum">
                  {formatMoney(c.amountDue, c.currency)}
                </td>
                <td className="px-3 py-3 text-ink-mute">{reasonLabel(c.failureCode)}</td>
                <td className="px-3 py-3">
                  <StageDots sent={c.sentCount} total={c.totalSteps} />
                </td>
                <td className="px-5 py-3 text-right font-mono text-ink-mute tnum">
                  {c.nextSendAt ? formatDay(c.nextSendAt) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export function DashboardPage() {
  const { data: metrics } = useQuery({ queryKey: ['metrics'], queryFn: fetchMetrics })

  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(),
  )

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-mute">{monthLabel} · recovered revenue at a glance</p>

      {!metrics ? (
        <p className="mt-8 font-mono text-sm text-ink-faint">Loading…</p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              hero
              label="Revenue recovered"
              value={formatMoney(metrics.recovered.thisMonth, metrics.currency)}
              sub={`this month · ${formatMoney(metrics.recovered.allTime, metrics.currency)} all time`}
            />
            <StatCard
              label="Revenue at risk"
              value={formatMoney(metrics.atRisk.amount, metrics.currency)}
              sub={`${metrics.atRisk.openCases} open ${metrics.atRisk.openCases === 1 ? 'case' : 'cases'}${metrics.otherCurrencies ? ` · +${metrics.otherCurrencies.openCases} in other currencies` : ''}`}
            />
            <StatCard
              label="Recovery rate"
              value={
                metrics.recoveryRate.rate === null
                  ? '—'
                  : `${Math.round(metrics.recoveryRate.rate * 100)}%`
              }
              sub={
                metrics.recoveryRate.rate === null
                  ? 'no cases closed this month'
                  : `${metrics.recoveryRate.recovered} recovered · ${metrics.recoveryRate.lostInvoluntary} lost this month`
              }
            />
            <StatCard
              label="Avg. days to recover"
              value={metrics.avgDaysToRecover === null ? '—' : String(metrics.avgDaysToRecover)}
              sub={metrics.avgDaysToRecover === null ? 'no recoveries this month' : 'failure → payment, this month'}
            />
          </div>

          <p className="mt-3 px-1 text-[12px] text-ink-faint">
            Lost this month:{' '}
            <span className="font-mono font-semibold text-rose tnum">
              {formatMoney(metrics.lostThisMonth.involuntary, metrics.currency)} involuntary
            </span>
            <span className="mx-1.5">·</span>
            <span className="font-mono font-semibold text-ink-mute tnum">
              {formatMoney(metrics.lostThisMonth.voluntary, metrics.currency)} voluntary
            </span>{' '}
            (voluntary cancellations are excluded from the recovery rate)
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TrendChart metrics={metrics} />
            <EmailPerformanceCard />
          </div>

          <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <ActiveCasesPreview />
            </div>
            <PreDunningCallout metrics={metrics} />
          </div>
        </>
      )}
    </div>
  )
}
