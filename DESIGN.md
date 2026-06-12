---
# DESIGN.md — Dunly design system (format: github.com/google-labs-code/design.md)
# Source of truth: dunly-design/ handoff bundle (Claude Design prototype, Jun 2026).
name: Dunly
description: >
  Failed-payment recovery for Stripe subscription businesses. Financial-grade,
  calm, and warm: deep "money + safety" green on warm paper neutrals, humanist
  grotesque type, monospace numerals. The brand green is reserved for value
  recovered — it must never be diluted into a generic UI accent.

colors:
  brand:
    DEFAULT: "#13714c"   # deep desaturated forest green — money + safety
    ink: "#0c4a31"       # darkest brand, text-on-tint
    hover: "#0f5d3e"     # primary-button hover
    tint: "#eaf4ef"      # brand wash backgrounds
    tintLine: "#d6e9df"  # borders on brand-tinted surfaces
  ink:
    DEFAULT: "#1a1a1a"   # primary text
    soft: "#3f3f46"      # secondary text
    mute: "#71717a"      # tertiary text / labels
    faint: "#a1a1aa"     # placeholders, disabled, fine print
  paper:
    DEFAULT: "#fbfbfa"   # app background (warm off-white)
    card: "#ffffff"      # raised surfaces
  line:
    DEFAULT: "#e8e8e6"   # standard border
    soft: "#f0f0ee"      # hover fills, subtle separators
  status:
    active:     { fg: "#3d6080", tint: "#eaf0f5" }  # slate — in-flight
    recovered:  { fg: "#0c4a31", tint: "#eaf4ef" }  # brand — the hero state
    paused:     { fg: "#b6781f", tint: "#fbf3e3" }  # amber — held, not over
    lostInvoluntary: { fg: "#b4374a", tint: "#fbecee" }  # rose — real loss
    lostVoluntary:   { fg: "#71717a", tint: "#f0f0ee" }  # neutral — chose to leave
    suppressed: { fg: "#6d5a8f", tint: "#f1edf6" }  # plum — unsubscribed, retries continue

typography:
  fontFamily:
    sans: '"Hanken Grotesk", ui-sans-serif, system-ui, sans-serif'
    mono: '"JetBrains Mono", ui-monospace, monospace'
    email: 'Helvetica, Arial, sans-serif'   # web-safe stack for HTML email only
  styles:
    pageTitle:   { fontSize: "26px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }
    sectionTitle:{ fontSize: "16px", fontWeight: 700 }
    cardTitle:   { fontSize: "13px", fontWeight: 700 }
    body:        { fontSize: "14px", fontWeight: 400, lineHeight: 1.55 }
    small:       { fontSize: "13px", fontWeight: 500 }
    caption:     { fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em", textTransform: uppercase }
    numeral:     { fontFamily: "{typography.fontFamily.mono}", fontVariantNumeric: tabular-nums }

spacing:
  unit: 4px
  scale: [4, 8, 12, 16, 20, 24, 32, 40, 64]
  cardPadding: 20px
  pageGutter: 24px
  contentMaxWidth: 1180px
  sidebarWidth: 248px

rounded:
  sm: 6px      # tags, small chips
  md: 8px      # buttons, inputs
  lg: 12px     # cards (rounded-xl)
  pill: 9999px # badges, toggles

elevation:
  card: "0 1px 2px rgba(17,24,28,0.04), 0 1px 1px rgba(17,24,28,0.03)"
  pop:  "0 8px 28px -8px rgba(17,24,28,0.18), 0 2px 6px rgba(17,24,28,0.06)"
  rail: "1px 0 0 #e8e8e6"

components:
  button:
    primary:   { bg: "{colors.brand.DEFAULT}", color: "#ffffff", hoverBg: "{colors.brand.hover}", radius: "{rounded.md}", height: 40px, fontWeight: 600 }
    secondary: { bg: "#ffffff", color: "{colors.ink.DEFAULT}", border: "{colors.line.DEFAULT}", hoverBorder: "{colors.ink.faint}", radius: "{rounded.md}" }
    ghost:     { bg: transparent, color: "{colors.ink.soft}", hoverBg: "{colors.line.soft}" }
    danger:    { bg: "#ffffff", color: "{colors.status.lostInvoluntary.fg}", border: "rgba(180,55,74,0.3)", hoverBg: "{colors.status.lostInvoluntary.tint}" }
    dark:      { bg: "{colors.ink.DEFAULT}", color: "#ffffff", hoverBg: "{colors.ink.soft}" }
  card:
    bg: "{colors.paper.card}"
    border: "{colors.line.DEFAULT}"
    radius: "{rounded.lg}"
    shadow: "{elevation.card}"
    padding: "{spacing.cardPadding}"
  statusBadge:
    shape: "{rounded.pill}"
    fontSize: 12px
    fontWeight: 600
    anatomy: "1.5px status dot + label, tint bg + status fg"
  tag:
    shape: "{rounded.sm}"
    fontSize: 11px
    fontWeight: 600
  input:
    height: 44px
    radius: "{rounded.md}"
    border: "{colors.line.DEFAULT}"
    focus: "border {colors.brand.DEFAULT} + ring 2px rgba(19,113,76,0.15)"
  toggle:
    onBg: "{colors.brand.DEFAULT}"
    offBg: "#d8d8d4"
  sidebar:
    width: "{spacing.sidebarWidth}"
    bg: "{colors.paper.DEFAULT}"
    activeItem: "white bg + card shadow + line border"
  email:
    canvasBg: "{colors.paper.DEFAULT}"
    cardBg: "#ffffff"
    radius: "{rounded.lg}"
    maxWidth: 520px
    ctaRadius: "{rounded.md}"
    lockedFooter: "Unsubscribe + Manage-or-cancel links — always present, never removable"
---

## Overview

Dunly recovers revenue that subscription businesses lose to failed payments. The
visual identity has one job: make the product feel **financial-grade and calm** —
money is at stake, so nothing may look playful, alarmist, or flimsy.

The system rests on three pillars:

1. **The green means recovered.** Brand green `#13714c` reads as *money + safety*,
   not "tech-startup green." It is spent sparingly — primary actions, the
   recovered-revenue hero metric, positive deltas — so it never stops meaning
   "good / recovered." In-flight work is **slate**, never green.
2. **Warm paper, not clinical white.** Backgrounds are `#fbfbfa` with hairline
   `#e8e8e6` borders; cards are pure white and barely lift off the page. Depth is
   suggested, never dramatic.
3. **Numbers are sacred.** Every amount, date, count, and merge variable is set
   in JetBrains Mono with tabular numerals so money lines up in columns and
   tokens read as code.

Tone of voice everywhere (UI and emails): plain, honest, unembarrassed about
billing. Friendly at Day 0, urgent — but never threatening — by Day 12.

## Colors

- **Brand** `#13714c` (`ink #0c4a31`, `hover #0f5d3e`, `tint #eaf4ef`, tint border
  `#d6e9df`). Reserved for: primary buttons, the Revenue-Recovered accent,
  positive deltas, "Stripe connected" dots, selected/on states.
- **Ink neutrals** form the entire text hierarchy: `#1a1a1a` primary → `#3f3f46`
  secondary → `#71717a` labels → `#a1a1aa` fine print. No pure black, no cool grays.
- **Six case statuses, each earning its hue:** active = slate `#3d6080`,
  recovered = brand green, paused = amber `#b6781f`, lost·involuntary = rose
  `#b4374a`, lost·voluntary = neutral gray (they chose to leave — not an error
  state), suppressed = plum `#6d5a8f` (unsubscribed from email; Stripe retries
  continue). Every status color ships with a matching `tint` background; fg on
  tint is the only approved pairing.
- Rose is for genuine loss and destructive actions only. Amber means "held."

## Typography

- **Hanken Grotesk** for all UI text — humanist grotesque, precise without being
  cold. Deliberately not Inter/Roboto. Weights used: 400, 500, 600, 700, 800.
- **JetBrains Mono** for every numeral, amount, date, badge count, and
  `{{merge_variable}}` — always with `font-variant-numeric: tabular-nums`.
- Page titles are 26px/800/tight; card titles are small but heavy (13px/700);
  captions are 11px uppercase with letter-spacing. Hierarchy comes from weight
  and color far more than size.
- **HTML email is the exception:** web-safe `Helvetica, Arial, sans-serif` only
  (webfonts are unreliable in mail clients). Email numerals may use the
  `ui-monospace` stack.

## Layout

- Desktop-first at 1280px; content column max **1180px**; grids collapse
  gracefully to tablet.
- App shell: persistent **248px left sidebar** (paper bg, `rail` shadow edge) +
  scrolling content pane with 24px gutters.
- Cards are the unit of composition: 20px padding, 12px radius, stacked with
  20px gaps. Dense tables live inside flush (`pad=false`) cards.
- The dashboard leads with ROI: Revenue Recovered is a visually promoted hero
  card (brand accent bar + larger numeral); other KPIs are peers beside it.
- Screen transitions: 280ms ease-out rise (`screenIn`), disabled under
  `prefers-reduced-motion`.

## Elevation & Depth

Three shadows only: `card` (barely-there lift for resting cards), `pop`
(menus, toasts, tooltips), `rail` (the 1px sidebar edge). Hierarchy is carried
by borders + background shifts, not shadow stacking. Hover states prefer a
border darkening (`line → ink.faint`) or a `line.soft` fill over added shadow.

## Shapes

Radii: 6px tags → 8px buttons/inputs → 12px cards → pill badges/toggles.
Status dots are 6px circles. The wordmark is a 9px-radius brand-green square
with a white extrabold "D" beside "Dunly" in 800 tracking-tight.

## Components

- **Button** — five variants (primary / secondary / ghost / danger / dark),
  40px default height, 600 weight, `active:scale-[.98]`. Primary is brand
  green; danger is white with rose text/border (never solid red).
- **StatusBadge** — pill, tint bg, 6px status dot, 12px/600 label. The
  suppressed badge carries a hover tooltip: *"Customer unsubscribed from
  emails — Stripe retries continue."*
- **Card** — white, `line` border, 12px radius, `card` shadow, 20px padding.
- **Toggle** — 44×24px pill, brand green when on, `#d8d8d4` when off.
- **Input** — 44px, 8px radius, focus = brand border + 2px brand ring at 15%.
- **Sidebar nav item** — active = white bg + card shadow + line border (a
  raised card, not a colored fill); inactive hovers `line.soft`.
- **Avatar** — initials on a status-tint circle; tone chosen stably per name.
- **Email (React Email)** — paper canvas, white 520px card at 12px radius,
  brand-color CTA (merchant-overridable), and the **locked footer**: a
  "You're receiving this because…" line plus Unsubscribe and
  Manage-or-cancel-subscription links. The footer is structural — templates
  cannot omit it.

## Do's and Don'ts

**Do**
- Reserve brand green for recovered value, primary actions, and on-states.
- Set every number, amount, date, and merge token in JetBrains Mono (tabular).
- Use status tints with their paired foregrounds; let badges carry the state.
- Keep voluntary churn visually neutral — it is honest churn, not failure.
- Keep the email footer links (unsubscribe / manage-or-cancel) in every send.
- Use `pop` shadow + ink-colored surfaces for tooltips and toasts.

**Don't**
- Don't color "active" cases green — active is slate; green is earned at recovery.
- Don't use alarm red for urgency copy or paused states; rose = real loss only.
- Don't introduce new hues, pure black `#000`, or cool gray ramps.
- Don't use Inter/Roboto, or proportional figures in any money column.
- Don't stack shadows for hierarchy — borders and background shifts first.
- Don't load webfonts in HTML email or remove the locked footer.
- Don't use charge-reminder framing ("you will be billed") in customer-facing
  copy — service-continuity framing ("keep your access") converts and is kinder.
