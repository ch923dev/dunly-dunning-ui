import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { authClient, useSession } from '../lib/auth-client'
import { AuthShell, Field, inputClass } from '../components/AuthShell'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: session } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // The session store, not the submit handler, drives navigation: signIn
  // resolving and useSession updating are separate async events, and
  // navigating before the store catches up makes the /app guard bounce
  // right back here. This also skips the form for already-signed-in visits.
  useEffect(() => {
    if (session) {
      const from = (location.state as { from?: string } | null)?.from ?? '/app'
      navigate(from, { replace: true })
    }
  }, [session, location.state, navigate])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Read from the form, not component state — browser/password-manager
    // autofill sets input values without firing React onChange.
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email') ?? '')
    const password = String(fd.get('password') ?? '')
    setBusy(true)
    setError(null)
    const { error } = await authClient.signIn.email({ email, password })
    if (error) {
      setBusy(false)
      setError(error.message ?? 'Sign-in failed. Check your email and password.')
    }
    // Success: stay busy; the useEffect above navigates once the session lands.
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Dunly workspace."
      error={error}
      onSubmit={handleSubmit}
      footer={
        <>
          New to Dunly?{' '}
          <Link to="/signup" className="font-semibold text-brand hover:text-brand-hover">
            Create a workspace
          </Link>
        </>
      }
    >
      <Field label="Email">
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          autoFocus
          placeholder="you@company.com"
          className={inputClass}
        />
      </Field>
      <Field label="Password">
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={inputClass}
        />
      </Field>
      <button
        type="submit"
        disabled={busy}
        className="h-11 w-full rounded-lg bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </AuthShell>
  )
}
