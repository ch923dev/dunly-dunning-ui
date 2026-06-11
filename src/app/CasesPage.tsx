import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { api, fetchCases, type CaseListItem, type CasesResponse } from '../lib/api'
import { Avatar, formatDay, formatMoney, reasonLabel, StageDots, StatusBadge } from './case-ui'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'RECOVERED', label: 'Recovered' },
  { value: 'LOST_VOLUNTARY', label: 'Lost · voluntary' },
  { value: 'LOST_INVOLUNTARY', label: 'Lost · involuntary' },
  { value: 'SUPPRESSED', label: 'Suppressed' },
  { value: 'PAUSED', label: 'Paused' },
] as const

const AMOUNT_OPTIONS = [
  { value: 'all', label: 'Any' },
  { value: 'lt100', label: 'Under $100' },
  { value: '100to300', label: '$100 – $300' },
  { value: 'gt300', label: 'Over $300' },
] as const

const DATE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
] as const

type Option = { value: string; label: string }

function FilterChip({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly Option[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const current = options.find((o) => o.value === value)
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[13px] font-semibold transition-colors ${
          value !== 'all'
            ? 'border-brand/40 bg-brand-tint text-brand-ink'
            : 'border-line bg-card text-ink-soft hover:border-ink-faint'
        }`}
      >
        <span className="font-medium text-ink-faint">{label}:</span> {current?.label ?? 'All'}
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="shadow-pop absolute z-20 mt-1.5 w-44 rounded-xl border border-line bg-card p-1">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              className={`flex h-9 w-full items-center justify-between rounded-lg px-3 text-left text-[13px] font-medium hover:bg-line-soft ${
                o.value === value ? 'text-brand-ink' : 'text-ink-soft'
              }`}
            >
              {o.label}
              {o.value === value && <span className="text-brand">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const REASON_TONE: Record<string, string> = {
  card_declined: 'bg-rose-tint text-rose',
  expired_card: 'bg-amber-tint text-amber',
}

function ReasonTag({ code }: { code: string | null }) {
  const tone = (code && REASON_TONE[code]) || 'bg-slate-tint text-slate'
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium ${tone}`}
    >
      {reasonLabel(code)}
    </span>
  )
}

/** Pause/resume/stop mutations shared by the row menu and the detail page. */
export function useCaseActions(caseId: string) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['cases'] })
    void queryClient.invalidateQueries({ queryKey: ['case', caseId] })
    void queryClient.invalidateQueries({ queryKey: ['metrics'] })
    void queryClient.invalidateQueries({ queryKey: ['email-performance'] })
  }
  return useMutation({
    mutationFn: (action: 'pause' | 'resume' | 'stop') =>
      api(`/api/cases/${caseId}/${action}`, { method: 'POST' }),
    onSettled: invalidate,
  })
}

function RowMenu({ row }: { row: CaseListItem }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const actions = useCaseActions(row.id)
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const isOpenCase = row.status === 'ACTIVE' || row.status === 'PAUSED'
  const items: { id: string; label: string; danger?: boolean }[] = [
    { id: 'view', label: 'View timeline' },
    ...(row.status === 'PAUSED' ? [{ id: 'resume', label: 'Resume sequence' }] : []),
    ...(row.status === 'ACTIVE' ? [{ id: 'pause', label: 'Pause sequence' }] : []),
    ...(isOpenCase ? [{ id: 'stop', label: 'Stop & mark lost', danger: true }] : []),
  ]

  const act = (id: string) => {
    setOpen(false)
    if (id === 'view') return navigate(`/app/cases/${row.id}`)
    if (id === 'stop') {
      const name = row.customer.name ?? row.customer.email ?? 'this customer'
      if (!window.confirm(`Stop recovering ${formatMoney(row.amountDue, row.currency)} from ${name} and mark the case lost? This can't be undone.`))
        return
    }
    actions.mutate(id as 'pause' | 'resume' | 'stop')
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        aria-label="Case actions"
        className="grid h-8 w-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-line"
      >
        ⋯
      </button>
      {open && (
        <div
          className="shadow-pop absolute right-0 z-20 mt-1 w-48 rounded-xl border border-line bg-card p-1"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => act(it.id)}
              disabled={actions.isPending}
              className={`flex h-9 w-full items-center rounded-lg px-3 text-left text-[13px] font-medium hover:bg-line-soft disabled:opacity-50 ${
                it.danger ? 'text-rose' : 'text-ink-soft'
              }`}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MonitoringEmptyState() {
  return (
    <div className="rounded-xl border border-line bg-card py-20 shadow-card">
      <div className="mx-auto max-w-sm text-center">
        <h3 className="text-lg font-bold text-ink">No failed payments yet 🎉</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-mute">
          We're watching your Stripe account in real time. The moment a charge fails, Dunly opens
          a case and starts the recovery sequence automatically — nothing for you to do.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-tint px-3.5 py-2 text-[13px] font-semibold text-brand">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand" /> Monitoring live
        </div>
      </div>
    </div>
  )
}

export function CasesPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('all')
  const [amount, setAmount] = useState('all')
  const [date, setDate] = useState('all')

  const params = useMemo(() => {
    const p = new URLSearchParams({ limit: '50' })
    if (status !== 'all') p.set('status', status)
    if (amount === 'lt100') p.set('maxAmount', '9999')
    if (amount === '100to300') {
      p.set('minAmount', '10000')
      p.set('maxAmount', '30000')
    }
    if (amount === 'gt300') p.set('minAmount', '30001')
    if (date !== 'all') {
      const days = date === '7d' ? 7 : 30
      p.set('since', new Date(Date.now() - days * 86_400_000).toISOString())
    }
    return p.toString()
  }, [status, amount, date])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['cases', 'list', params],
    queryFn: ({ pageParam }) =>
      fetchCases(pageParam ? `${params}&cursor=${pageParam}` : params),
    initialPageParam: '',
    getNextPageParam: (last: CasesResponse) => last.nextCursor ?? undefined,
  })

  const rows = data?.pages.flatMap((p) => p.cases) ?? []
  const summary = data?.pages[0]?.summary
  const unfiltered = status === 'all' && amount === 'all' && date === 'all'

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Cases</h1>
          <p className="mt-1 text-sm text-ink-mute">
            {summary ? (
              <>
                <span className="font-mono tnum">{summary.count}</span>{' '}
                {summary.count === 1 ? 'case' : 'cases'} ·{' '}
                <span className="font-mono tnum">
                  {formatMoney(summary.atRisk, summary.currency)}
                </span>{' '}
                at risk in this view
              </>
            ) : (
              'Every failed payment Dunly is recovering'
            )}
          </p>
        </div>
      </div>

      {data && rows.length === 0 && unfiltered ? (
        <div className="mt-8">
          <MonitoringEmptyState />
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <FilterChip label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
            <FilterChip label="Amount" value={amount} options={AMOUNT_OPTIONS} onChange={setAmount} />
            <FilterChip label="Date" value={date} options={DATE_OPTIONS} onChange={setDate} />
            <span className="ml-auto text-[13px] font-medium text-ink-faint">
              Click a row to open its timeline
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-line bg-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-3 py-3 font-semibold">Amount</th>
                  <th className="px-3 py-3 font-semibold">Failure reason</th>
                  <th className="px-3 py-3 font-semibold">Stage</th>
                  <th className="px-3 py-3 font-semibold">Next email</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="w-12 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/app/cases/${c.id}`)}
                    className="cursor-pointer border-t border-line-soft transition-colors first:border-t-0 hover:bg-paper"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.customer.name ?? c.customer.email} size={32} />
                        <div className="leading-tight">
                          <div className="whitespace-nowrap font-semibold text-ink">
                            {c.customer.name ?? '—'}
                          </div>
                          <div className="text-[11px] text-ink-faint">{c.customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 font-mono font-bold text-ink tnum">
                      {formatMoney(c.amountDue, c.currency)}
                    </td>
                    <td className="px-3 py-3.5">
                      <ReasonTag code={c.failureCode} />
                    </td>
                    <td className="px-3 py-3.5">
                      {c.status === 'SUPPRESSED' ? (
                        <span className="text-[12px] font-medium text-plum">Emails off</span>
                      ) : c.status === 'ACTIVE' || c.status === 'PAUSED' ? (
                        <StageDots sent={c.sentCount} total={c.totalSteps} />
                      ) : (
                        <span className="text-[13px] text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 font-mono text-[13px] text-ink-mute tnum">
                      {c.status === 'PAUSED' ? 'Paused' : c.nextSendAt ? formatDay(c.nextSendAt) : '—'}
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-3 py-3.5">
                      <RowMenu row={c} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data && rows.length === 0 && (
              <div className="py-16 text-center text-sm text-ink-mute">
                No cases match these filters.
              </div>
            )}
            {!data && <div className="py-16 text-center font-mono text-sm text-ink-faint">Loading…</div>}
          </div>

          {hasNextPage && (
            <div className="mt-4 text-center">
              <button
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-50"
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}

      <p className="mt-6 text-[12px] text-ink-faint">
        Suppressed cases keep recovering through Stripe's retries — only the emails stop.{' '}
        <Link to="/app/sequence" className="font-semibold text-ink-mute hover:text-ink">
          Edit the sequence →
        </Link>
      </p>
    </div>
  )
}
