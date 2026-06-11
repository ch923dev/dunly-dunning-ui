import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { authClient, useSession } from '../lib/auth-client'
import { AuthShell, Field, inputClass } from '../components/AuthShell'

export function SignupPage() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Session-driven navigation — same rationale as LoginPage: navigating
  // before the useSession store catches up makes the /app guard bounce back.
  useEffect(() => {
    if (session) navigate('/app', { replace: true })
  }, [session, navigate])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Read from the form, not component state — browser/password-manager
    // autofill sets input values without firing React onChange.
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') ?? '')
    const email = String(fd.get('email') ?? '')
    const password = String(fd.get('password') ?? '')
    setBusy(true)
    setError(null)
    // The backend signup hook auto-creates the workspace (organization,
    // settings, default campaign) — name seeds the workspace name.
    const { error } = await authClient.signUp.email({ name, email, password })
    if (error) {
      setBusy(false)
      setError(error.message ?? 'Sign-up failed. Please try again.')
    }
    // Success: stay busy; the useEffect above navigates once the session lands.
  }

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Start recovering failed payments in minutes."
      error={error}
      onSubmit={handleSubmit}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand hover:text-brand-hover">
            Sign in
          </Link>
        </>
      }
    >
      <Field label="Your name">
        <input
          type="text"
          name="name"
          required
          autoComplete="name"
          autoFocus
          placeholder="Ada Lovelace"
          className={inputClass}
        />
      </Field>
      <Field label="Email">
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          className={inputClass}
        />
      </Field>
      <Field label="Password">
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className={inputClass}
        />
      </Field>
      <button
        type="submit"
        disabled={busy}
        className="h-11 w-full rounded-lg bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {busy ? 'Creating workspace…' : 'Create workspace'}
      </button>
    </AuthShell>
  )
}
