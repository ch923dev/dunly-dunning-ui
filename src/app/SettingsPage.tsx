import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { api, fetchStripeConnection, fetchWorkspace, type Workspace } from '../lib/api'
import { Field, inputClass } from '../components/AuthShell'

// Messages for the OAuth callback's ?connected=1 / ?error=… redirect params.
const STRIPE_CALLBACK_MESSAGES: Record<string, { tone: 'ok' | 'err'; text: string }> = {
  connected: { tone: 'ok', text: 'Stripe account connected.' },
  denied: { tone: 'err', text: 'You declined the Stripe connection.' },
  account_in_use: {
    tone: 'err',
    text: 'That Stripe account is already connected to another workspace.',
  },
  invalid_state: { tone: 'err', text: 'The connection link expired — try again.' },
  invalid_callback: { tone: 'err', text: 'Stripe sent an invalid callback — try again.' },
  exchange_failed: { tone: 'err', text: 'Connecting to Stripe failed — try again.' },
  stripe_error: { tone: 'err', text: 'Stripe reported an error — try again.' },
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-card p-6 shadow-card">
      <h2 className="text-[17px] font-bold text-ink">{title}</h2>
      <p className="mt-0.5 text-[13px] text-ink-mute">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Notice({ tone, children }: { tone: 'ok' | 'err'; children: ReactNode }) {
  return (
    <p
      role="status"
      className={`rounded-lg px-3.5 py-2.5 text-[13px] font-medium ${
        tone === 'ok' ? 'bg-brand-tint text-brand-ink' : 'bg-rose-tint text-rose'
      }`}
    >
      {children}
    </p>
  )
}

function WorkspaceForm({ workspace }: { workspace: Workspace }) {
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)

  const mutation = useMutation({
    mutationFn: (body: Record<string, string>) =>
      api<Workspace>('/api/workspace', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: (fresh) => {
      queryClient.setQueryData(['workspace'], fresh)
      setSaved(true)
    },
  })

  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 2500)
    return () => clearTimeout(t)
  }, [saved])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    mutation.mutate({
      name: String(fd.get('name') ?? ''),
      logoUrl: String(fd.get('logoUrl') ?? ''),
      brandColor: String(fd.get('brandColor') ?? ''),
      replyTo: String(fd.get('replyTo') ?? ''),
      timezone: String(fd.get('timezone') ?? 'UTC'),
    })
  }

  const s = workspace.settings
  // Plain "UTC" (our DB default) isn't in the IANA list — without an explicit
  // option the select would silently fall back to the first zone in the list.
  const timezones = ['UTC', ...Intl.supportedValuesOf('timeZone')]

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
      {mutation.isError && <Notice tone="err">{mutation.error.message}</Notice>}
      <Field label="Workspace name">
        <input
          type="text"
          name="name"
          required
          maxLength={120}
          defaultValue={workspace.name}
          className={inputClass}
        />
      </Field>
      <Field label="Logo URL">
        <input
          type="url"
          name="logoUrl"
          defaultValue={s?.logoUrl ?? ''}
          placeholder="https://yourdomain.com/logo.png — shown in email headers"
          className={inputClass}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand color">
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="brandColor"
              defaultValue={s?.brandColor ?? '#13714c'}
              className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-card p-1"
            />
            <span className="font-mono text-[12px] text-ink-mute">
              buttons &amp; accents in your emails
            </span>
          </div>
        </Field>
        <Field label="Reply-to email">
          <input
            type="email"
            name="replyTo"
            autoComplete="off"
            defaultValue={s?.replyTo ?? ''}
            placeholder="support@yourdomain.com"
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Timezone">
        <select name="timezone" defaultValue={s?.timezone ?? 'UTC'} className={inputClass}>
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="h-10 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="text-[13px] font-semibold text-brand">Saved ✓</span>}
      </div>
    </form>
  )
}

function StripeCard() {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: connection, isPending } = useQuery({
    queryKey: ['stripe-connection'],
    queryFn: fetchStripeConnection,
  })

  async function handleConnect() {
    setBusy(true)
    setError(null)
    try {
      const { url } = await api<{ url: string }>('/api/stripe/connect')
      window.location.assign(url) // off to the Stripe consent screen
    } catch (err) {
      setBusy(false)
      setError(err instanceof Error ? err.message : 'Could not start the Stripe connection.')
    }
  }

  async function handleDisconnect() {
    if (!window.confirm('Disconnect Stripe? Recovery pauses until you reconnect.')) return
    setBusy(true)
    setError(null)
    try {
      await api('/api/stripe/disconnect', { method: 'POST' })
      await queryClient.invalidateQueries({ queryKey: ['stripe-connection'] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed.')
    } finally {
      setBusy(false)
    }
  }

  if (isPending) {
    return <p className="font-mono text-sm text-ink-faint">Loading…</p>
  }

  if (connection?.connected) {
    return (
      <div className="space-y-4">
        {error && <Notice tone="err">{error}</Notice>}
        <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-paper px-4 py-3">
          <div>
            <p className="flex items-center gap-2 text-[14px] font-bold text-ink">
              {connection.businessName ?? 'Stripe account'}
              <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
                connected
              </span>
              {!connection.livemode && (
                <span className="rounded-full bg-amber-tint px-2 py-0.5 text-[11px] font-semibold text-amber">
                  test mode
                </span>
              )}
            </p>
            <p className="mt-0.5 font-mono text-[12px] text-ink-mute">
              since {new Date(connection.connectedAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={busy}
            className="rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-rose transition-colors hover:border-rose disabled:opacity-60"
          >
            Disconnect
          </button>
        </div>
        <p className="text-[12px] text-ink-mute">
          Dunly listens for failed payments on this account and runs your recovery sequence.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <Notice tone="err">{error}</Notice>}
      <p className="text-[13px] leading-relaxed text-ink-soft">
        Connect your Stripe account to start recovering failed payments. Dunly only needs
        read &amp; webhook access — customers pay on Stripe&rsquo;s hosted pages, and card data
        never touches Dunly.
      </p>
      <button
        onClick={handleConnect}
        disabled={busy}
        className="h-10 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {busy ? 'Redirecting…' : 'Connect Stripe'}
      </button>
    </div>
  )
}

export function SettingsPage() {
  const { data: workspace } = useQuery({ queryKey: ['workspace'], queryFn: fetchWorkspace })
  const [searchParams, setSearchParams] = useSearchParams()

  // One-shot banner from the OAuth callback redirect (?connected=1 / ?error=…).
  const callbackKey = searchParams.has('connected') ? 'connected' : searchParams.get('error')
  const callbackMessage = callbackKey ? STRIPE_CALLBACK_MESSAGES[callbackKey] : undefined

  return (
    <div className="max-w-[640px]">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Settings</h1>
      <p className="mt-1 text-sm text-ink-mute">
        Workspace branding, sending identity, and your Stripe connection.
      </p>

      <div className="mt-8 space-y-6">
        {callbackMessage && (
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <Notice tone={callbackMessage.tone}>{callbackMessage.text}</Notice>
            </div>
            <button
              onClick={() => setSearchParams({}, { replace: true })}
              className="mt-1.5 text-[12px] font-semibold text-ink-faint hover:text-ink"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        <Card title="Stripe connection" subtitle="The account Dunly recovers payments for.">
          <StripeCard />
        </Card>

        <Card
          title="Workspace"
          subtitle="Branding and sending details used in your dunning emails."
        >
          {workspace ? (
            <WorkspaceForm workspace={workspace} />
          ) : (
            <p className="font-mono text-sm text-ink-faint">Loading…</p>
          )}
        </Card>
      </div>
    </div>
  )
}
