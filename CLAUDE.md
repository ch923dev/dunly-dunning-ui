# dunly-ui

React 19 + Vite 8 + TypeScript (strict) + Tailwind CSS 4 + TanStack Query + Recharts. Currently only the landing page (`src/App.tsx`); the dashboard ships in Phase 2 (visual reference: `../dunly-design/project/`, rules: `../DESIGN.md`).

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
