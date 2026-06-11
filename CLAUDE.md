# dunly-ui

React 19 + Vite 8 + TypeScript (strict) + Tailwind CSS 4 + TanStack Query + React Router 7 + Better Auth client + Recharts. Landing page (`src/App.tsx`) plus the authenticated app under `/app/*` (visual reference: `../dunly-design/project/`, rules: `../DESIGN.md`).

## Commands

```bash
npm install --include=dev    # NODE_ENV quirk — never plain npm install
npm run dev                  # Vite on :5173, proxies /api → :4000 (set NODE_ENV=development or Fast Refresh breaks)
npm run build                # tsc -b && vite build — use as the typecheck
npm run lint                 # eslint (flat config)
```

## Conventions

- Tailwind 4: design tokens live in `src/index.css` under `@theme` (no tailwind.config file). Tokens mirror `../DESIGN.md` — change DESIGN.md first, then sync.
- Use token classes (`text-ink-primary`, `bg-paper`, `text-brand`, etc.), never raw hex values in components.
- Numbers/amounts/dates use `font-mono` (JetBrains Mono, tabular numerals).
- Status colors map to the 6-state case machine: slate = active, green = recovered, amber = paused, rose = lost·involuntary, gray = lost·voluntary, plum = suppressed. Never color active cases green.
- Data fetching goes through React Query (client configured in `src/main.tsx`: staleTime 30s, retry 1).
- Routing: React Router 7 (`react-router` package) in `src/main.tsx`. `/app/*` is session-guarded by `src/app/AppLayout.tsx`; auth pages live in `src/pages/`, app pages in `src/app/`.
- Auth: Better Auth React client (`src/lib/auth-client.ts`, same-origin `/api/auth` via the Vite proxy). Auth forms read values via FormData on submit (controlled inputs miss browser autofill), and navigation after sign-in/up is driven by the `useSession` store, never called directly after the auth call (store-update race bounces the guard).
