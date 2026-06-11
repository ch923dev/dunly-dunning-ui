import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

const recoveryData = [
  { week: 'Apr 14', recovered: 610 },
  { week: 'Apr 21', recovered: 740 },
  { week: 'Apr 28', recovered: 520 },
  { week: 'May 05', recovered: 880 },
  { week: 'May 12', recovered: 690 },
  { week: 'May 19', recovered: 940 },
  { week: 'May 26', recovered: 1020 },
  { week: 'Jun 02', recovered: 1180 },
]

const sampleCases = [
  { customer: 'Northwind Labs', amount: '$149.00', stage: 'Email 2 of 4', status: 'active' },
  { customer: 'Lumen Studio', amount: '$89.00', stage: 'Recovered in 3 days', status: 'recovered' },
  { customer: 'Cobalt Systems', amount: '$99.00', stage: 'Dispute opened', status: 'paused' },
] as const

const stats = [
  { value: '20–40%', label: 'of churn is involuntary' },
  { value: '50–70%', label: 'of failed payments recoverable' },
  { value: '4 min', label: 'from signup to connected' },
  { value: '$0', label: 'until Dunly recovers money' },
]

const steps = [
  {
    no: '01',
    title: 'Connect Stripe',
    body: 'One-click OAuth. Dunly listens to invoice.payment_failed webhooks the moment you connect — no code, no exports.',
  },
  {
    no: '02',
    title: 'Sequences go to work',
    body: 'Four perfectly-timed, branded emails layered on top of Stripe Smart Retries — each with a one-tap link to pay or fix the card.',
  },
  {
    no: '03',
    title: 'Revenue comes home',
    body: 'Every case moves through an honest state machine: recovered, paused, suppressed, or lost — and the dashboard proves the ROI.',
  },
]

const features = [
  {
    title: 'Email sequences that convert',
    body: 'A 4-touch default sequence tuned for recovery — friendly at day 0, final notice at day 12. Every template is yours to edit.',
  },
  {
    title: 'Built on the hosted invoice page',
    body: 'Emails deep-link to Stripe’s hosted pay/update-card page. Customers fix a card in under a minute; you never touch card data.',
  },
  {
    title: 'Stops itself, honestly',
    body: 'Recovered, canceled, disputed, or unsubscribed — sequences halt instantly. Disputing customers are never dunned.',
  },
  {
    title: 'ROI you can screenshot',
    body: 'Revenue recovered, recovery rate, days-to-recovery — with voluntary churn excluded so the numbers stay credible.',
  },
]

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5 select-none">
      <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-brand shadow-sm">
        <span className="text-[15px] leading-none font-extrabold text-white">D</span>
      </span>
      <span className="text-[19px] font-extrabold tracking-tight text-ink">Dunly</span>
    </span>
  )
}

const badgeStyles = {
  active: { cls: 'bg-slate-tint text-slate', dot: '#3d6080', label: 'Active' },
  recovered: { cls: 'bg-brand-tint text-brand-ink', dot: '#13714c', label: 'Recovered' },
  paused: { cls: 'bg-amber-tint text-amber', dot: '#b6781f', label: 'Paused' },
} as const

function StatusBadge({ status }: { status: keyof typeof badgeStyles }) {
  const s = badgeStyles[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${s.cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  )
}

/** Hero visual — a faithful miniature of the product's recovered-revenue card. */
function RecoveryCard() {
  return (
    <div className="animate-rise [animation-delay:250ms]">
      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-pop">
        {/* brand accent bar — the hero metric earns the green */}
        <div className="h-1 bg-brand" />
        <div className="p-6">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-ink-mute uppercase">
              Revenue recovered · June
            </span>
            <span className="tnum inline-flex items-center gap-0.5 text-xs font-semibold text-brand">
              ↑ 18%
            </span>
          </div>
          <p className="tnum mt-2 font-mono text-4xl font-semibold text-ink">$4,310</p>

          <div className="mt-4 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recoveryData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="recovered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#13714c" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#13714c" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" hide />
                <Tooltip
                  cursor={false}
                  formatter={(v) => [`$${Number(v).toLocaleString()}`, 'recovered']}
                  contentStyle={{
                    background: '#1a1a1a',
                    border: 'none',
                    borderRadius: 8,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                    color: '#ffffff',
                  }}
                  labelStyle={{ color: '#a1a1aa' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Area
                  type="monotone"
                  dataKey="recovered"
                  stroke="#13714c"
                  strokeWidth={2.25}
                  fill="url(#recovered)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* mini cases table */}
          <div className="mt-5 border-t border-line">
            {sampleCases.map((c) => (
              <div
                key={c.customer}
                className="flex items-center justify-between gap-3 border-b border-line-soft py-3 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">{c.customer}</p>
                  <p className="text-[11px] text-ink-faint">{c.stage}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="tnum font-mono text-[13px] font-medium text-ink-soft">
                    {c.amount}
                  </span>
                  <StatusBadge status={c.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-[11px] text-ink-faint">
        Live view from the Dunly dashboard — sample workspace
      </p>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-5">
        <Wordmark />
        <nav className="hidden items-center gap-7 text-sm font-semibold text-ink-soft sm:flex">
          <a href="#how" className="transition-colors hover:text-ink">
            How it works
          </a>
          <a href="#features" className="transition-colors hover:text-ink">
            Features
          </a>
          <a
            href="#cta"
            className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover"
          >
            Start recovering
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1180px] items-center gap-14 px-6 pt-12 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-brand-tintln bg-brand-tint px-3 py-1 text-[12px] font-semibold text-brand-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            For Stripe subscription businesses
          </p>
          <h1 className="animate-rise mt-6 text-5xl leading-[1.05] font-extrabold tracking-tight text-ink [animation-delay:100ms] sm:text-6xl">
            Failed payments aren&rsquo;t lost.
            <br />
            <span className="text-brand">They&rsquo;re unfinished.</span>
          </h1>
          <p className="animate-rise mt-6 max-w-md text-lg leading-relaxed text-ink-soft [animation-delay:200ms]">
            Dunly catches every{' '}
            <span className="font-mono text-[15px] text-ink">invoice.payment_failed</span> webhook
            and runs the recovery for you — smart retries, perfectly-timed emails, and one-tap
            card updates on Stripe&rsquo;s hosted pages.
          </p>
          <div className="animate-rise mt-9 flex flex-wrap items-center gap-4 [animation-delay:300ms]">
            <a
              href="#cta"
              className="inline-flex h-12 items-center rounded-lg bg-brand px-6 text-[15px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-hover"
            >
              Connect Stripe →
            </a>
            <a
              href="#how"
              className="inline-flex h-12 items-center rounded-lg border border-line bg-card px-6 text-[15px] font-semibold text-ink transition-colors hover:border-ink-faint"
            >
              See how it works
            </a>
          </div>
          <p className="animate-rise mt-6 font-mono text-xs text-ink-faint [animation-delay:400ms]">
            No code. No card. 4-minute setup.
          </p>
        </div>

        <RecoveryCard />
      </section>

      {/* Stat strip */}
      <section className="border-y border-line bg-card">
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 px-6 sm:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`py-7 text-center ${i > 0 ? 'sm:border-l sm:border-line' : ''}`}
            >
              <p className="tnum font-mono text-2xl font-semibold text-brand-ink">{s.value}</p>
              <p className="mt-1 text-[13px] font-medium text-ink-mute">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-[1180px] px-6 py-24">
        <h2 className="text-4xl font-extrabold tracking-tight text-ink">
          Declined to recovered, on autopilot
        </h2>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-ink-mute">
          Recovery is a process, not an email blast. Dunly runs the whole case from first failure
          to final state.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.no} className="rounded-xl border border-line bg-card p-6 shadow-card">
              <span className="tnum inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-tint font-mono text-[13px] font-semibold text-brand-ink">
                {step.no}
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-mute">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-line bg-paper">
        <div className="mx-auto max-w-[1180px] px-6 py-24">
          <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-brand uppercase">
            What&rsquo;s in the box
          </p>
          <h2 className="mt-4 max-w-xl text-4xl font-extrabold tracking-tight text-ink">
            Everything between <span className="text-rose">declined</span> and{' '}
            <span className="text-brand">recovered</span>
          </h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-line bg-card p-7 shadow-card transition-colors hover:border-ink-faint"
              >
                <h3 className="text-[17px] font-bold text-ink">{feature.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-mute">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — the one dark surface, in brand ink */}
      <section id="cta" className="bg-brand-ink">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-brand-tintln uppercase">
            Recovery starts tonight
          </p>
          <h2 className="mt-5 text-4xl leading-tight font-extrabold tracking-tight text-white">
            Your next failed payment doesn&rsquo;t have to stay failed.
          </h2>
          <a
            href="#"
            className="mt-10 inline-flex h-12 items-center rounded-lg bg-white px-7 text-[15px] font-semibold text-brand-ink shadow-pop transition-all hover:-translate-y-0.5"
          >
            Connect Stripe — free to start
          </a>
          <p className="mt-5 font-mono text-xs text-brand-tintln/70">
            Pay only when Dunly recovers money for you.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-card">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Wordmark />
          <p className="font-mono text-xs text-ink-faint">
            © 2026 Dunly · Dunning &amp; failed-payment recovery for Stripe
          </p>
        </div>
      </footer>
    </div>
  )
}
