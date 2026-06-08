---
version: alpha
name: a-share-flow-video-design
description: "A dark financial-dashboard aesthetic for an A-share sector fund-flow analysis console. Deep navy canvas, single cyan primary, and a strict Chinese-market color convention where red signals inflow (up) and green signals outflow (down) — the opposite of Western terminals. The system reads as quantitative trading tooling: dense numerical tables, tabular monospaced figures, hairline borders, soft cyan glows, and almost no decorative ornament. Every screen is information-first; chrome is restrained so the data carries the eye."
date: 2026-06-04
---

# DESIGN.md — A股情绪流 / 板块资金流向可视化

> 设计系统源文件。所有 UI 改动必须以本文档为准;如需偏离,先改文档再改代码。

---

## 1. Visual Theme & Atmosphere

**Mood**: Quantitative trading terminal meets modern SaaS dashboard. Bloomberg density, Linear precision, VoltAgent restraint. Information density is high, but every pixel earns its place.

**Design Philosophy**:
- **Data-first, chrome-second.** The numbers, charts, and rankings are the heroes. Cards, dividers, and surfaces are the supporting cast.
- **One chromatic accent.** Cyan `#00d4ff` is reserved for primary action, focus, live state, and brand. It never appears as decoration.
- **Hairline, not heavy.** Borders are 1px at `6–15%` white opacity. No 2px rules, no thick frames.
- **Glass, not gloss.** Panels are translucent black with backdrop-blur — not white cards. Reflects the "always-on trader" night-mode use case.
- **Chinese-market color rule.** Red = inflow / up / positive. Green = outflow / down / negative. This is the **opposite** of Western markets and is non-negotiable. Do not flip these under any visual context.

**Density**: Compact. 12–14px body type in tables, 10–11px for eyebrow labels, 16–18px for primary KPIs.

**Atmosphere Keywords**: 终端、深度夜色、玻璃面板、量化、单色微光、信息密度。

---

## 2. Color Palette & Roles

All colors are exposed as both Tailwind classes (`bg-canvas`, `text-ink`, `border-hairline`) and CSS variables (`--canvas`, `--ink`, `--hairline`).

### Canvas (backgrounds)
| Token | Hex | Role |
|---|---|---|
| `canvas` | `#0a1628` | App background, page surface. The deepest dark in the system. |
| `surface-1` | `#0d1f3c` | Sider, primary card, modal, drawer base. |
| `surface-2` | `#1a3a5c` | Elevated card, dropdown, popover, table header. |
| `surface-3` | `#2a4a6c` | Highest elevation — active menu, selected chip, hover over surface-2. |
| `surface-glass-low` | `rgba(0,0,0,0.30)` | Glass panel low density (`backdrop-blur-sm`). |
| `surface-glass-med` | `rgba(0,0,0,0.40)` | Glass panel medium density (default, `backdrop-blur-md`). |
| `surface-glass-high` | `rgba(0,0,0,0.50)` | Glass panel high density (modal, `backdrop-blur-lg`). |

### Ink (text)
| Token | Hex | Role |
|---|---|---|
| `ink` | `#ffffff` | Primary text, KPI values, headings. |
| `ink-2` | `#b0b8c4` | Body text inside cards, table cells, descriptions. |
| `ink-3` | `#86909c` | Secondary text — labels, captions, hint, placeholders. |
| `ink-muted` | `rgba(255,255,255,0.30)` | Disabled text, subtle hints, very low-emphasis. |

### Borders & dividers
| Token | Value | Role |
|---|---|---|
| `hairline` | `rgba(255,255,255,0.06)` | Default border between cards and surface-1 panels. |
| `hairline-strong` | `rgba(255,255,255,0.10)` | Emphasized divider, table header underline, popover border. |
| `hairline-active` | `rgba(255,255,255,0.18)` | Hover border on interactive surfaces. |

### Brand & semantic
| Token | Hex | Role |
|---|---|---|
| `primary` | `#00d4ff` | Single brand accent. Primary CTA, focus ring, live indicator, brand mark. **Never decorative.** |
| `primary-hover` | `#33ddff` | Hover state of `primary`. |
| `primary-soft` | `rgba(0,212,255,0.15)` | Selected state background (menu item, chip, segmented control). |
| `primary-softer` | `rgba(0,212,255,0.10)` | Hover state background, subtle highlight. |
| `primary-ink` | `#0a1628` | Text on top of `primary` (for buttons). |

### Financial semantic (Chinese market — **red=up, green=down**)
| Token | Hex | Role |
|---|---|---|
| `inflow` | `#f53f3f` | Net inflow / 资金净流入 / 涨 / positive sentiment. Chinese convention. |
| `inflow-light` | `#ff7875` | Hover/light variant of `inflow`. |
| `inflow-muted` | `rgba(245,63,63,0.15)` | Background of inflow badge, glow, bar gradient end. |
| `inflow-softer` | `rgba(245,63,63,0.05)` | Error/info banner background, very low emphasis. |
| `outflow` | `#00b42a` | Net outflow / 资金净流出 / 跌 / negative sentiment. Chinese convention. |
| `outflow-light` | `#30c64a` | Hover/light variant of `outflow`. |
| `outflow-muted` | `rgba(0,180,42,0.15)` | Background of outflow badge, glow, bar gradient end. |
| `outflow-softer` | `rgba(0,180,42,0.05)` | Banner background. |

### Chart palette
| Token | Hex | Use |
|---|---|---|
| `chart-1` | `#00d4ff` | Primary series, brand. |
| `chart-2` | `#f53f3f` | Inflow series, positive. |
| `chart-3` | `#00b42a` | Outflow series, negative. |
| `chart-4` | `#ff7d00` | Warning, alert, peak. |
| `chart-5` | `#7c3aed` | Accent — third series in trend chart. |
| `chart-6` | `#14b8a6` | Accent — fourth series in trend chart. |

### Status
| Token | Hex | Use |
|---|---|---|
| `warning` | `#f0ab00` | Amber — neutral sentiment, schedule, warning chip. |
| `warning-soft` | `rgba(240,171,0,0.15)` | Warning badge background. |
| `info` | `#4488ff` | Informational — link, secondary action. |

---

## 3. Typography Rules

### Font stack
| Role | Stack |
|---|---|
| Display / heading | `Plus Jakarta Sans` → `PingFang SC` → `Microsoft YaHei` → `sans-serif` |
| Body | Same as display, weights 400–600. |
| Numeric / tabular | `JetBrains Mono` → `SF Mono` → `monospace`. **Always** for numbers, tickers, percentages, timestamps. |

Fallback chain ensures native rendering on macOS, Windows, and Linux.

### Hierarchy
| Token | Size | Weight | Line-height | Letter-spacing | Use |
|---|---|---|---|---|---|
| `display-2xl` | 30px | 700 | 1.1 | -0.02em | Page title (h1), hero number |
| `display-xl` | 24px | 700 | 1.15 | -0.02em | Section title, KPI value |
| `display-lg` | 20px | 600 | 1.2 | -0.015em | Card title, sub-heading |
| `title` | 16px | 600 | 1.3 | 0 | Panel title, button text |
| `body-lg` | 15px | 400 | 1.5 | 0 | Lead paragraph, large body |
| `body` | 14px | 400 | 1.5 | 0 | Default body, table cell, form input |
| `body-sm` | 13px | 400 | 1.5 | 0 | Secondary body |
| `caption` | 12px | 400 | 1.4 | 0 | Caption, helper text |
| `eyebrow` | 10–11px | 500 | 1.3 | **0.12–0.18em (uppercase)** | All-caps label above KPI, table column tag, "TOP 6" pill |
| `numeric-xl` | 28–32px | 700 | 1.05 | -0.02em | Hero metric (gauge center) |
| `numeric-lg` | 22–24px | 600 | 1.1 | -0.01em | KPI card value |
| `numeric-md` | 14–16px | 500 | 1.2 | 0 | Inline number, badge, ranking |
| `numeric-sm` | 11–12px | 500 | 1.3 | 0 | Tiny badge, chip |

### Tabular numerics
**All** numerical displays use `font-variant-numeric: tabular-nums`. The trading context requires perfectly aligned columns. CSS: `font-feature-settings: "tnum" 1, "lnum" 1`; Tailwind class: `tabular-nums`.

### Chinese typography
- Use `font-display` for Chinese display headings, `font-sans` for body, `font-mono` for numerics.
- CJK punctuation should use full-width forms in body prose, half-width in code/ID contexts.
- Title weight on Chinese: prefer 600 over 700 (700 reads as artificial bold on CJK glyphs).

---

## 4. Component Stylings

### Button
| Variant | Background | Border | Text | Hover | Use |
|---|---|---|---|---|---|
| `primary` | `primary` | none | `primary-ink` (`#0a1628`) | brightness +8% | Single primary action per view |
| `secondary` | `surface-2` | `hairline` | `ink` | bg → `surface-3`, border → `hairline-active` | Default secondary |
| `ghost` | transparent | `hairline` | `ink-2` | bg → `surface-2`, text → `ink` | Tertiary, table row action |
| `danger` | `inflow` | none | white | `inflow-light` | Destructive (rare) |
| `success` | `outflow` | none | white | `outflow-light` | Positive confirmation (rare) |

Sizes: `sm` 28px height, `md` 36px (default), `lg` 44px. Border-radius `lg` (12px). Font: title (16/600). Primary button adds `shadow-glow-primary` on hover.

### Input
- Background `surface-2` with `backdrop-blur-sm`. Border `hairline`. Height 40px (md) / 36px (sm).
- Focus: border `primary/50%`, ring `primary/15%` (2px shadow). Text `ink`. Placeholder `ink-muted`.
- Error: border `inflow/50%`, helper text in `inflow`.

### Card / Panel
- **Default**: `surface-glass-med` (rgba black 0.4) + `backdrop-blur-md`, border `hairline`, radius `xl` (16px), shadow `bento`.
- **Glow variant**: same surface, border uses `primary/20%` or `inflow/20%` or `outflow/20%`, shadow `glow-*`.
- Inner padding: 20–24px (default density). Compact density 16px.
- Card title: `title` (16/600) `ink`, optional leading icon at 16px, ink-3.

### Badge / Chip
- Height 20–22px, padding 6–8px horizontal, radius `md` (6px), font 10–11/500, uppercase + 0.12em tracking.
- Variants: `inflow`, `outflow`, `primary`, `neutral`, `warning`, `outline`. Each maps to a `*-muted` background + matching `*` foreground.

### Chip (selectable)
- Default state: `surface-2` bg, `hairline` border, `ink-3` text.
- Active state: `surface-3` bg, `hairline-active` border, `ink` text. Active chip with color theme adds matching glow (`0 0 12px {color}33`).

### Segmented Control / Tabs
- Underline style: 1px `hairline` underline on inactive, 2px `primary` on active. Active text `primary`.
- Pill style: inactive transparent, active `primary-soft` bg + `primary` text.

### Sidebar / Sider
- Width 220px (desktop). Collapsed to icons-only on `md` breakpoint (< 768px → hidden).
- Background `surface-1`, right border `hairline`, shadow `2px 0 12px rgba(0,0,0,0.3)`.
- Brand area: padding 20px 16px 16px, bottom border `hairline`. Title 18/700 `ink`, subtitle 12px `ink-3`.
- Nav item: 44px tall, 8px horizontal margin, 6px radius. Default `ink-3`. Hover: bg `primary-softer`, text `primary`. Selected: bg `primary-soft`, text `primary`, weight 600.
- Mobile: hide entire sider, expose menu via top-bar burger (future enhancement).

### Modal / Drawer
- Backdrop: `bg-black/60 backdrop-blur-sm`.
- Modal panel: `surface-1` bg, `hairline` border, 16px radius, `shadow-glass` (8px 32px rgba 0,0,0,0.3). Max-width 640px, max-height 80vh.
- Modal header: `surface-2` bg, bottom border `hairline`, title 18/600 `ink`. Close button: `ink-3` → hover `ink`.

### Table
- Header: `surface-2` bg, `ink` text, weight 600, 12/600, 0.05em tracking. Bottom border `hairline-strong`.
- Row: `surface-1` bg default, `surface-2` on hover. 14/400 `ink-2`. 44px row height.
- Numeric cells: right-aligned, `font-mono tabular-nums`.
- Stripe variant: even rows `surface-1` slightly tinted (`#0f2444`).
- Border-radius on outer container: `xl` (16px), overflow hidden.

### Toast / Notification
- Top-right position, 16px from edges. Width 360px, padding 16px, radius `lg` (12px). Background `surface-2`, border `hairline`, shadow `glass`.
- Variants follow badge colors with the matching glow. Icon 18px left, text 13/400 `ink-2`. Close X top-right.

### Skeleton
- Animated shimmer: `bg-white/5` base, gradient overlay translating 200% → -200% over 2s linear. Radius matches target component.

---

## 5. Layout Principles

### Spacing scale (Tailwind, base 4px)
- `1` = 4px, `2` = 8px, `3` = 12px, `4` = 16px, `5` = 20px, `6` = 24px, `8` = 32px, `10` = 40px, `12` = 48px, `16` = 64px.
- **Default page padding**: 24px (`p-6`) desktop, 16px (`p-4`) mobile.
- **Card inner padding**: 20px (`p-5`) default, 16px (`p-4`) compact.
- **Vertical rhythm between cards**: 16px (`gap-4`).

### Grid
- 12-column responsive grid. Breakpoints: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536.
- Bento layout for dashboard: KPI row (4 × 3 cols), gauge + heatmap row (5 + 7 cols), ranking pair (6 + 6 cols), event timeline + heat (6 + 6 cols), full-width trend chart.

### Whitespace philosophy
- Density is high but each card needs breathing room. Never less than 16px between content blocks inside a panel.
- Charts: padding inside container 8–16px on axes, 16–24px on legend.
- Use the 8px baseline grid for all vertical rhythm; avoid 7px or 5px spacing.

### Z-index scale
- `0` base, `10` sticky (table headers), `20` floating (tooltips), `30` dropdown menu, `40` modal backdrop, `50` modal panel, `60` toast.

---

## 6. Depth & Elevation

The system uses **two** elevation mechanisms, not three:

1. **Surface tier** (4 levels, by lightness): canvas → surface-1 → surface-2 → surface-3. Each tier is +5–8% lighter than the previous. Use these for content hierarchy: base page → card → nested card → hovered/selected.
2. **Glow** (3 semantic colors): `glow-primary` cyan, `glow-danger` inflow-red, `glow-success` outflow-green. Glow = `0 0 20px {color}/15%`. Reserved for: live data, active CTA, important KPI.

**Avoid**:
- Multi-layer drop shadows (no `shadow-md` + `shadow-lg` stacking).
- Borders thicker than 1px (no `border-2`).
- Inset shadows on cards (use surface tier instead).

**Glass layering**: every glass panel is `bg-black/{30-50%}` + `backdrop-blur-{sm,md,lg}`. The page itself has no decorative background — only the dashboard adds a faint `40px × 40px` grid at 1.5% opacity for "terminal" texture.

---

## 7. Do's and Don'ts

### Do
- ✅ Use `text-inflow` / `text-outflow` (Chinese convention) for all financial gain/loss indicators.
- ✅ Right-align all numerical columns; left-align names/labels.
- ✅ Use `tabular-nums` and `font-mono` for any number, even in headlines (KPI cards use `font-display` only for the unit suffix).
- ✅ Treat the cyan primary as scarce — one primary button per view, one selected nav item, one live indicator.
- ✅ Use `glass-panel` for content surfaces, plain `surface-1` for static information (header bars, footers).
- ✅ Pair every chart with a one-line takeaway label (`流入 35.2%` / `领涨板块`).
- ✅ Maintain the Chinese-market color rule in tooltip, legend, table, badge — everywhere.

### Don't
- ❌ Use green for "good" / "positive" or red for "bad" / "negative" — that's the **Western** convention. In A-share context: red = inflow (positive), green = outflow (negative).
- ❌ Mix Arco Design primitives with shadcn primitives in the same view. Pick one. (We are migrating off Arco for Layout primitives — see §9.)
- ❌ Use raw hex codes in components. Always go through tokens: `bg-canvas`, `text-ink`, `border-hairline`, `text-inflow`, etc.
- ❌ Add decorative gradients, blob backgrounds, or animated mesh. The aesthetic is austere.
- ❌ Use emoji in production UI. The `📊` in the brand area is the only allowed exception (intentional brand character).
- ❌ Stack more than 2 cards in a single card (visual debt).
- ❌ Use `font-bold` (700) on CJK headings — prefer `font-semibold` (600) for cleaner rendering.

---

## 8. Responsive Behavior

### Breakpoints
- `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px.

### Layout shifts
- **≥ lg (1024px)**: full sider (220px) + content. Dashboard 12-col grid, all panels visible side-by-side.
- **md (768–1023px)**: full sider + content with 2-col stacking for dashboard.
- **sm (< 768px)**: sider hidden, content full-width, all panels 1-col. Tabular data becomes a vertical card list with key fields visible.

### Touch targets
- Minimum 40px × 40px on `sm`. Nav items 44px (already compliant).
- DatePicker, Select, Button all use `md` size (40px) on mobile.

### Charts
- ResponsiveContainer scales 1:1. Min height 240px on mobile, 360px on desktop.
- Trend chart on mobile: shows only top 3 selected sectors (default selection shrinks), legend wraps.

### Density
- Default: `medium` (16–20px padding). On `sm` breakpoint, auto-switch to `compact` (12–16px).

---

## 9. Agent Prompt Guide

> Drop-in prompt template for AI agents generating UI for this project.

### Quick color reference
- **Primary action / live state / brand**: `primary` `#00d4ff` (cyan)
- **Inflow / 涨 / positive**: `inflow` `#f53f3f` (red — Chinese convention)
- **Outflow / 跌 / negative**: `outflow` `#00b42a` (green — Chinese convention)
- **Canvas background**: `canvas` `#0a1628` (deep navy)
- **Card / panel**: `surface-1` `#0d1f3c`
- **Text on dark**: `ink` `#ffffff` for primary, `ink-2` `#b0b8c4` for body, `ink-3` `#86909c` for secondary
- **Border**: `hairline` `rgba(255,255,255,0.06)` default, `hairline-active` `rgba(255,255,255,0.18)` on hover

### Ready-to-use prompt

```
You are extending the A股情绪流 (A-share Sector Fund Flow Console) web app.
Read DESIGN.md at the project root before making UI changes.

Hard rules:
1. NEVER use green for positive or red for negative. In Chinese A-share market,
   red = inflow/up/positive, green = outflow/down/negative. This is non-negotiable.
2. NEVER hardcode hex values in components. Always use Tailwind tokens:
   bg-canvas, bg-surface-1, bg-surface-2, bg-surface-3, text-ink, text-ink-2,
   text-ink-3, text-inflow, text-outflow, text-primary, border-hairline,
   border-hairline-active, border-primary, etc.
3. NEVER use emoji in production UI. The 📊 in the brand area is the only exception.
4. All numerical displays must use `font-mono tabular-nums`.
5. Right-align numerical columns; left-align names.
6. The cyan primary is scarce — one primary button per view, one selected nav item.
7. Use GlassPanel from @/components/ui/glass-panel for content surfaces, not
   raw <div> with bg-surface-1.
8. The aesthetic is Bloomberg × Linear × VoltAgent: dense, dark, restrained.
   No decorative gradients, no animated mesh, no white cards.
9. New components go in src/components/ui/. Pages go in src/pages/.
10. PageHeader, StatChip, EmptyState are the standard building blocks — use them
    instead of reinventing.
```

### Token cheat sheet (Tailwind classes)
```
Background:   bg-canvas, bg-surface-1, bg-surface-2, bg-surface-3
Text:         text-ink, text-ink-2, text-ink-3, text-ink-muted
Border:       border-hairline, border-hairline-strong, border-hairline-active
Brand:        bg-primary, text-primary, border-primary
Inflow:       bg-inflow, text-inflow, bg-inflow-muted, text-inflow, border-inflow
Outflow:      bg-outflow, text-outflow, bg-outflow-muted, text-outflow, border-outflow
Warning:      bg-warning, text-warning, bg-warning-soft
Glow:         shadow-glow-primary, shadow-glow-danger, shadow-glow-success
Glass:        shadow-bento, shadow-glass
Animation:    animate-pulse-glow, animate-float, animate-slide-up, animate-tick-flash, animate-shimmer
```

### Typography cheat sheet
```
Page title:        text-2xl sm:text-3xl font-bold tracking-tight
Section title:     text-lg font-semibold
Card title:        text-base font-semibold
Body:              text-sm text-ink-2
Caption:           text-xs text-ink-3
Eyebrow:           text-[10px] font-medium tracking-[0.12em] uppercase
Numeric KPI:       text-2xl font-bold tracking-tight tabular-nums
Tabular number:    font-mono tabular-nums
```

---

## File structure

```
a-share-flow-video-web/
├── DESIGN.md                    ← this file (source of truth)
├── tailwind.config.js           ← tokens exposed to Tailwind
├── src/
│   ├── index.css                ← CSS variables + base layer
│   ├── components/ui/           ← primitive components
│   │   ├── glass-panel.tsx      ← surface container
│   │   ├── card.tsx             ← basic card
│   │   ├── badge.tsx            ← tag/chip with semantic variants
│   │   ├── sidebar.tsx          ← navigation rail
│   │   ├── page-header.tsx      ← standardized page title bar
│   │   ├── stat-chip.tsx        ← trend indicator chip
│   │   ├── empty-state.tsx      ← zero-data placeholder
│   │   └── ...
│   ├── lib/
│   │   ├── tokens.ts            ← programmatic token access (for chart.js etc)
│   │   └── utils.ts             ← cn(), formatters
│   └── pages/
│       └── *.tsx
└── preview.html                 ← visual catalog (open in browser, no build)
```

---

## Adoption status (2026-06-04)

### Pages
| Page | Status | Notes |
|---|---|---|
| `App.tsx` | ✅ Migrated | Uses `<Sidebar>`; Arco `Layout` shell retained for inner Menu/Tabs. |
| `DashboardPage` | ✅ Migrated | All KPIs, gauges, lists on tokens. |
| `NewsPage` | ✅ Migrated | Headlines, filters, replay controls on tokens. |
| `GeneratePage` | ✅ Migrated | Generator card, progress, logs on tokens. |
| `TTSPage` | ✅ Migrated | Sample list, custom textarea, player card on tokens. |
| `ConfigPage` | ✅ Migrated | API settings, status card on tokens. |
| `NotesPage` | ✅ Migrated | Drag-and-drop columns; `inflow`/`primary` semantic mapping (see §2). |
| `PreviewPage` | ✅ Migrated | Video grid, copy tabs, date picker on tokens. |
| `TickPage` | ✅ Migrated | Header, ModeToggle, status pill, stat cards, action buttons, table, Modal, news tags, and custom `SectorTrendChart` SVG all on tokens. SVG uses `tokens.chart[1]` / `tokens.hairline.*` / `tokens.ink[3]` for stroke/fill. |
| `DebatePage` | ✅ Migrated | All sections (header, stage progress, error banner, fetch card, report card, script preview, history panel, video frame, ProbeCard) on tokens. BULL/BEAR personas retain cyan/amber theme (see §2). `shadow-glow-warning` added to `tailwind.config.js`. |

### Components
| Component | Status |
|---|---|
| `Sidebar` (new) | ✅ Adopted in `App.tsx` |
| `PageHeader` (new) | ✅ Adopted in 6 pages |
| `StatChip` (new) | ✅ Adopted in `DashboardPage` |
| `EmptyState` (new) | ✅ Adopted in 5 pages |
| `Badge` (CVA variants) | ✅ Adopted in `NotesPage` |
| `Card` / `GlassPanel` | 🟡 Existing primitives; not yet widely used in page bodies. |

### Verified
- `npm run typecheck` — clean
- `npm run build` — 5489 modules · 7.53s · 2392.06 kB main bundle

---

## 10. Debate Theater System

The 财报两方辩论 (Debate) feature is the most visually expressive surface in the app. It treats the 6 personas as stage actors, the 7 phases as scene acts, and the transcript as live stage notes. The visual language borrows from cinema (spotlight, fade-in, title cards) and broadcast news (chyrons, persona lineup, wave bars) — but kept disciplined to the dark financial-terminal base.

### 10.1 Persona palette (cool/warm identity, not financial)

| Persona | Token | Hex | Role | File |
|---|---|---|---|---|
| 主持人 Moderator | `ink-2` / slate | `#94a3b8` | 议程主持 | `persona-config.ts → PERSONA.moderator` |
| 乐观派 Bull | `primary` cyan | `#22d3ee` | 多头分析师 | `PERSONA.bull` |
| 谨慎派 Bear | `warning` amber | `#fbbf24` | 空头分析师 | `PERSONA.bear` |
| 行业专家 Sector | `chart-6` teal | `#34d399` | 行业视角 | `PERSONA.sector` |
| 风控官 Risk | `chart-4` orange | `#fb923c` | 风险审查 | `PERSONA.risk` |
| 总结 Synthesizer | `chart-5` violet | `#a78bfa` | 终局研判 | `PERSONA.synthesizer` |

**Rule**: persona colors encode identity (who's speaking), **not** financial sentiment. They must never be substituted with `inflow` / `outflow` — those tokens are reserved for the A-share convention (red = up/positive).

### 10.2 Phase track (7 acts)

The pipeline (script → audio → render → done) is the **production** state — kept as a top-of-page progress strip. The 7 phases (open → opening → cross_exam → rebuttal → fact_check → closing → synthesis) are the **content** state — visualized as `StageTrack`, a horizontal track with 7 numbered nodes:

| State | Visual |
|---|---|
| `past` | `bg-outflow-muted`, outflow check icon, full opacity |
| `active` | `bg-primary-soft`, primary, `ring-1 ring-primary/40`, `scale-110`, ping halo |
| `upcoming` | `bg-surface-2`, `ink-muted`, no icon, number only |

The connector line between nodes uses gradient: past side `bg-outflow/40`, current side `bg-gradient-to-r from-outflow/40 via-primary/30 to-hairline`, future side `bg-hairline`. Subtitle below the active node shows the act's intent (`PHASE_SUBTITLE`).

### 10.3 Persona lineup (the cast)

`PersonaLineup` renders all 6 personas in a `grid-cols-3 sm:grid-cols-6` cast. Each card uses the `state` prop to derive visual:

- `active` — persona's color, ring + glow, dot pulse on top-right
- `past` — muted, visited
- `upcoming` — fully desaturated

A footer line shows "聚光: <persona> · <role>" and "下一位: <next 3>" as soon as the script arrives.

### 10.4 Spotlight (ambient glow)

`Spotlight` is a fixed-position overlay that paints a radial gradient in the active persona's `hex.primary` (with `intensity` prop controlling opacity 0.06/0.10/0.15 and blur 80/120/160). Used:

- In `DebateStage` wrapper around the transcript (auto-color from `activeSpeaker`)
- Inside the phone/TV frame during `idle` / `working` placeholder states (`color="#22d3ee"` cyan)

**Rule**: never use `primary` cyan spotlight when the active speaker is `bear` (warning) — it would conflict with the persona palette. Always pass the persona's `hex.primary` from `PERSONA[speaker]`.

### 10.5 Entrance / exit (cinematic, not bouncy)

All theater transitions use `Easing.bezier(0.16, 1, 0.3, 1)` — the "expo out" curve. No bouncy springs, no overshoot. This is a financial terminal, not a game.

| Element | Frames (30fps) | Behavior |
|---|---|---|
| Speaker avatar + quote | 0–18 | fade-in opacity 0→1 + translateY 24→0 |
| Speaker avatar ring | continuous | `scale = 1 + sin(frame * 0.15) * 0.04` |
| Wave bars | continuous | `h = 12 + abs(sin(frame * 0.3 + i * 0.7)) * 22`, 8 bars |
| Phase title card | 0–30 (1s) | opacity 0→1 (0–8) → 1 (8–22) → 0 (22–30) + translateY 12→0 |
| Turn exit | last 12 frames | opacity 1→0 |

**Remotion rule**: never use CSS `transition` or Tailwind `animate-*` inside the composition. They will not render correctly. Always `interpolate(frame, …, { easing: EASE })`.

### 10.6 Phase title card

Between every phase change, a `PhaseTitleCard` `<Sequence>` fires for 30 frames (1s). It shows:
- "SCRIPT" eyebrow (slate, 18px, 8px letter-spacing, uppercase)
- Phase name (96px mobile / 56px TV, 800 weight, 12px letter-spacing, cyan text-shadow)
- Phase subtitle (22px, slate-2, from `PHASE_SUBTITLE`)

The card overlaps the first 30 frames of the next turn's audio — speaker content fades in over the title's last 12 frames, creating a brief cross-fade. The card sits at `zIndex: 20`, above the speaker content (10), so the title is readable even with the speaker behind it.

### 10.7 Waveform (voice indicator)

`Waveform` (React) renders 8 bars driven by a CSS keyframe. Used in `PhaseCard` to show "audio playing" state.

In Remotion, the 8 bars live inside the speaker stage, driven by `frame` via `Math.sin` — no CSS animation. Both implementations must visually sync. The Remotion version has bars 4–6px wide; the React version has 2px wide bars.

### 10.8 Quote typography

| Surface | Size | Weight | Color | Notes |
|---|---|---|---|---|
| Remotion quote (mobile) | 64px | 600 | `#f1f5f9` | with `"` 140px serif glyph at top-left, opacity 0.5 |
| Remotion quote (TV) | 32px | 600 | `#f1f5f9` | with `"` 80px serif |
| React `PhaseCard` quote | 14px | 400 | `text-ink-2` | left-aligned, pl-9 to clear avatar |
| Remotion moderator quote | 36px (mobile) | 500 italic | `#cbd5e1` | smaller avatar, no `"` glyph |
| React moderator (n/a) | — | — | — | host turn is rendered identically to other roles in the React view |

### 10.9 Shared components (file map)

| File | Purpose | Used by |
|---|---|---|
| `persona-config.ts` | Single source: `PERSONA`, `PERSONA_ORDER`, `PHASE_ORDER`, `PHASE_LABEL`, `PHASE_SUBTITLE`, types | Both React & Remotion |
| `persona-icon.tsx` | 6 persona SVG icons (Bull/Bear/Moderator/Sector/Risk/Synthesizer), props `name` `size` `color` | Both (color prop in Remotion, Tailwind classes in React) |
| `persona-card.tsx` | Single persona card with state | `PersonaLineup` |
| `persona-lineup.tsx` | 6-person cast strip | `DebatePage` |
| `stage-track.tsx` | 7-phase horizontal track | `DebatePage` |
| `phase-card.tsx` | Single turn card with avatar/quote/citations/audio | `DebatePage` |
| `spotlight.tsx` | Ambient radial glow overlay | `DebateStage`, `VideoPreview` placeholder |
| `waveform.tsx` | Voice bars (CSS keyframe) | `PhaseCard` (audio playing state) |
| `debate-stage.tsx` | Stage container with auto-color spotlight | `DebatePage` (wraps transcript) |

**Rule**: any future debate feature (e.g. live chat, replay, comparison view) must read from `persona-config.ts`. Do not re-declare `SPEAKER_CONFIG` or `COLORS` in any other file.

---

## 11. Open questions / future work

- [x] ~~Migrate `App.tsx` sider~~ — done; uses `Sidebar`.
- [x] ~~Migrate `NewsPage` / `GeneratePage` / `TTSPage` / `ConfigPage` / `NotesPage` / `PreviewPage`~~ — done.
- [x] ~~Finish `TickPage`~~ — done; SVG chart, Modal, mode-toggle, action cards, table all on tokens.
- [x] ~~`DebatePage` (1291 lines)~~ — done; full refactor including BULL/BEAR personas, multi-stage progress, custom phone/TV video frame, ProbeCard, rich-report YoY inversion.
- [x] ~~Strip remaining Arco `Layout`/`Content` from `App.tsx`~~ — done; replaced with plain `<div className="flex">` + `<main className="flex-1 min-w-0">` because Arco's `Layout` defaults to `flex-direction: column` and only switches to row when it sees `<Layout.Sider>`. Using a custom `<aside>` left Arco in column mode, stacking Sidebar above Content.
- [x] ~~`DebatePage` theater redesign (2026-06-07)~~ — done; 6 personas as lineup, 7-stage `StageTrack`, `PhaseCard` turns, `PersonaIcon` SVGs replace all emoji, `DebateStage` wraps transcript with persona-colored spotlight, `Waveform` voice indicator. New `src/components/debate/` shared layer: `persona-config.ts` (single source for Tailwind + Remotion tokens), `persona-icon.tsx`, `persona-card.tsx`, `persona-lineup.tsx`, `stage-track.tsx`, `phase-card.tsx`, `spotlight.tsx`, `waveform.tsx`, `debate-stage.tsx`. Remotion `DebateVideo` now uses `<Sequence>` per turn, adds `PhaseTitleCard` between phase changes, `Easing.bezier(0.16, 1, 0.3, 1)` for entrance/exit, and 8-bar voice wave between avatar and quote.
- [ ] `tokens.ts` ↔ `tailwind.config.js` are duplicated; extract a build step that injects the single source of truth.
- [ ] Light mode is out of scope — dark-only financial terminal aesthetic.
- [ ] Mobile-first sider collapse (burger menu) — not yet implemented.

---

*Maintained by the a-share-flow-video team. Last revised: 2026-06-04.*
