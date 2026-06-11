import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { authClient, useSession } from '../lib/auth-client'
import { fetchCases, fetchWorkspace } from '../lib/api'
import { Wordmark } from '../components/Wordmark'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-semibold transition-colors ${
    isActive ? 'bg-brand-tint text-brand-ink' : 'text-ink-soft hover:bg-line-soft hover:text-ink'
  }`

export function AppLayout() {
  const { data: session, isPending } = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: workspace } = useQuery({
    queryKey: ['workspace'],
    queryFn: fetchWorkspace,
    enabled: !!session,
  })

  // Live active-case count for the Cases nav badge (design prototype).
  const { data: activeCases } = useQuery({
    queryKey: ['cases', 'badge'],
    queryFn: () => fetchCases('status=ACTIVE&limit=1'),
    enabled: !!session,
  })
  const activeCount = activeCases?.summary.count ?? 0

  if (isPending) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <p className="font-mono text-sm text-ink-faint">Loading…</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  async function handleSignOut() {
    await authClient.signOut()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Sidebar rail — 248px per DESIGN.md */}
      <aside className="fixed inset-y-0 left-0 flex w-[248px] flex-col border-r border-line bg-card">
        <div className="px-5 py-5">
          <Wordmark />
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <NavLink to="/app" end className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/app/cases" className={navLinkClass}>
            Cases
            {activeCount > 0 && (
              <span className="ml-auto rounded-full bg-slate-tint px-2 py-0.5 font-mono text-[10px] font-semibold text-slate">
                {activeCount}
              </span>
            )}
          </NavLink>
          <NavLink to="/app/sequence" className={navLinkClass}>
            Sequence
          </NavLink>
          <NavLink to="/app/settings" className={navLinkClass}>
            Settings
          </NavLink>
        </nav>

        <div className="border-t border-line px-5 py-4">
          <p className="truncate text-[13px] font-bold text-ink">{workspace?.name ?? '—'}</p>
          <p className="truncate text-[12px] text-ink-mute">{session.user.email}</p>
          <button
            onClick={handleSignOut}
            className="mt-3 w-full rounded-lg border border-line px-3 py-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Content — offset by the rail, capped at 1180px per DESIGN.md */}
      <main className="ml-[248px] flex-1">
        <div className="mx-auto max-w-[1180px] px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
