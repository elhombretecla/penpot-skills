# Design System Values — All Style Profiles

Exact token values for each style profile. Use these verbatim — do not invent new values or deviate without a specific reason documented in the design intent.

---

## PRECISION Profile

**Personality**: Focused, capable, trustworthy
**Target**: B2B SaaS, developer tools, dashboards, fintech
**Font**: Inter

### Color Tokens (Primitives)

```
color.slate.50   = #F8FAFC    color.slate.100  = #F1F5F9
color.slate.200  = #E2E8F0    color.slate.300  = #CBD5E1
color.slate.400  = #94A3B8    color.slate.500  = #64748B
color.slate.600  = #475569    color.slate.700  = #334155
color.slate.800  = #1E293B    color.slate.900  = #0F172A
color.slate.950  = #020617

color.indigo.50  = #EEF2FF    color.indigo.100 = #E0E7FF
color.indigo.400 = #818CF8    color.indigo.500 = #6366F1
color.indigo.600 = #4F46E5    color.indigo.700 = #4338CA

color.emerald.400 = #34D399   color.emerald.500 = #10B981   color.emerald.600 = #059669
color.amber.400   = #FBBF24   color.amber.500   = #F59E0B   color.amber.600   = #D97706
color.red.400     = #F87171   color.red.500     = #EF4444   color.red.600     = #DC2626

color.white = #FFFFFF
color.black = #000000
```

### Semantic Tokens (Light Theme)

```
color.bg.primary     = {color.white}          — Main page background
color.bg.secondary   = {color.slate.50}       — Sidebar, panels
color.bg.tertiary    = {color.slate.100}       — Hover states, subtle surfaces
color.bg.overlay     = rgba(15,23,42,0.5)     — Modal overlays
color.bg.inverse     = {color.slate.900}       — Dark sections (footer, callout)
color.bg.brand       = {color.indigo.500}      — Primary brand fills

color.text.primary   = {color.slate.900}       — Main content
color.text.secondary = {color.slate.600}       — Supporting text, labels
color.text.tertiary  = {color.slate.400}       — Placeholders, disabled labels
color.text.inverse   = {color.white}           — On dark backgrounds
color.text.link      = {color.indigo.600}      — Links
color.text.brand     = {color.indigo.600}      — Brand text
color.text.success   = {color.emerald.600}
color.text.warning   = {color.amber.600}
color.text.error     = {color.red.600}

color.border.default = {color.slate.200}       — Default borders
color.border.strong  = {color.slate.300}       — Emphasized borders
color.border.focus   = {color.indigo.500}      — Focus rings
color.border.error   = {color.red.500}

color.interactive.primary       = {color.indigo.500}   — Primary button fill
color.interactive.primary-hover = {color.indigo.600}   — Primary button hover
color.interactive.primary-text  = {color.white}
```

### Spacing Tokens

```
spacing.1  = 4     spacing.2  = 8     spacing.3  = 12    spacing.4  = 16
spacing.5  = 20    spacing.6  = 24    spacing.8  = 32    spacing.10 = 40
spacing.12 = 48    spacing.16 = 64    spacing.20 = 80    spacing.24 = 96
```

### Typography Tokens

```
font.family.sans = Inter, sans-serif
font.family.mono = JetBrains Mono, monospace

font.size.xs   = 11    font.size.sm   = 12    font.size.base = 13
font.size.md   = 15    font.size.lg   = 17    font.size.xl   = 20
font.size.2xl  = 24    font.size.3xl  = 30    font.size.4xl  = 36
font.size.5xl  = 48    font.size.6xl  = 60

font.weight.regular  = 400    font.weight.medium   = 500
font.weight.semibold = 600    font.weight.bold     = 700

font.lineHeight.tight   = 1.25    font.lineHeight.snug   = 1.375
font.lineHeight.normal  = 1.5     font.lineHeight.relaxed = 1.625

font.tracking.tight   = -0.03    font.tracking.snug  = -0.015
font.tracking.normal  = 0        font.tracking.wide  = 0.06
font.tracking.wider   = 0.08
```

### Radius Tokens

```
radius.sm  = 4     radius.md  = 6     radius.lg  = 8
radius.xl  = 12    radius.2xl = 16    radius.full = 9999
```

### Shadow Values (use as CSS strings in shadow tokens)

```
shadow.xs  = 0 1px 2px 0 rgba(15,23,42,0.06)
shadow.sm  = 0 1px 3px 0 rgba(15,23,42,0.08), 0 1px 2px -1px rgba(15,23,42,0.08)
shadow.md  = 0 4px 6px -1px rgba(15,23,42,0.08), 0 2px 4px -2px rgba(15,23,42,0.06)
shadow.lg  = 0 10px 15px -3px rgba(15,23,42,0.08), 0 4px 6px -4px rgba(15,23,42,0.05)
shadow.xl  = 0 20px 25px -5px rgba(15,23,42,0.08), 0 8px 10px -6px rgba(15,23,42,0.05)
shadow.ring-brand = 0 0 0 3px rgba(99,102,241,0.2)    — focus ring
```

### Library Typographies (PRECISION)

| Name | Family | Size | Weight | Line-height | Tracking |
|------|--------|------|--------|-------------|---------|
| Display/Large | Inter | 60 | 700 | 1.1 | -0.03 |
| Display/Medium | Inter | 48 | 700 | 1.15 | -0.03 |
| Heading/H1 | Inter | 36 | 700 | 1.2 | -0.025 |
| Heading/H2 | Inter | 30 | 600 | 1.25 | -0.02 |
| Heading/H3 | Inter | 24 | 600 | 1.3 | -0.01 |
| Heading/H4 | Inter | 20 | 600 | 1.35 | 0 |
| Heading/H5 | Inter | 17 | 600 | 1.4 | 0 |
| Body/Large | Inter | 17 | 400 | 1.625 | 0 |
| Body/Base | Inter | 15 | 400 | 1.6 | 0 |
| Body/Small | Inter | 13 | 400 | 1.5 | 0 |
| Label/Large | Inter | 14 | 500 | 1.25 | 0 |
| Label/Base | Inter | 13 | 500 | 1.25 | 0 |
| Label/Small | Inter | 12 | 500 | 1.25 | 0 |
| Caption | Inter | 12 | 400 | 1.4 | 0 |
| Overline | Inter | 11 | 600 | 1.25 | 0.08 |
| Code/Base | JetBrains Mono | 13 | 400 | 1.6 | 0 |

---

## DARK Profile

**Personality**: Powerful, focused, technical
**Target**: Dev tools, professional apps, dark-mode-first
**Font**: Inter (UI), JetBrains Mono (code/data)

### Color Tokens (Primitives)

```
color.zinc.900  = #18181B    color.zinc.800  = #27272A
color.zinc.700  = #3F3F46    color.zinc.600  = #52525B
color.zinc.500  = #71717A    color.zinc.400  = #A1A1AA
color.zinc.300  = #D4D4D8    color.zinc.200  = #E4E4E7
color.zinc.100  = #F4F4F5    color.zinc.50   = #FAFAFA

color.neutral.950 = #0A0A0B   color.neutral.900 = #111113
color.neutral.850 = #141415   color.neutral.800 = #1A1A1E
color.neutral.700 = #252527   color.neutral.600 = #3A3A3D

color.violet.300 = #C4B5FD   color.violet.400 = #A78BFA
color.violet.500 = #8B5CF6   color.violet.600 = #7C3AED

color.cyan.400 = #22D3EE     color.cyan.500 = #06B6D4

color.green.400 = #4ADE80    color.green.500 = #22C55E
color.red.400   = #F87171    color.amber.400 = #FBBF24
```

### Semantic Tokens (Dark Theme)

```
color.bg.primary     = {color.neutral.950}    — #0A0A0B
color.bg.secondary   = {color.neutral.900}    — #111113
color.bg.surface     = {color.neutral.850}    — #141415
color.bg.elevated    = {color.neutral.800}    — #1A1A1E
color.bg.overlay     = rgba(0,0,0,0.7)
color.bg.brand       = {color.violet.500}

color.text.primary   = #FAFAF9 (near-white, NOT pure white)
color.text.secondary = {color.zinc.400}
color.text.tertiary  = {color.zinc.600}
color.text.inverse   = {color.neutral.950}
color.text.brand     = {color.violet.400}
color.text.success   = {color.green.400}
color.text.error     = {color.red.400}
color.text.warning   = {color.amber.400}

color.border.default = {color.neutral.700}    — #252527
color.border.strong  = {color.neutral.600}    — #3A3A3D
color.border.focus   = {color.violet.500}

color.interactive.primary       = {color.violet.500}
color.interactive.primary-hover = {color.violet.600}
color.interactive.primary-text  = {color.white}
```

### Shadow Values (DARK — more visible due to dark surface)

```
shadow.sm  = 0 1px 3px rgba(0,0,0,0.4)
shadow.md  = 0 4px 8px rgba(0,0,0,0.5)
shadow.lg  = 0 8px 20px rgba(0,0,0,0.6)
shadow.glow-brand = 0 0 20px rgba(139,92,246,0.25)   — subtle violet glow
```

---

## BOLD Profile

**Personality**: Confident, energetic, memorable
**Target**: Marketing sites, landing pages, editorial
**Font**: Inter

### Special Tokens for BOLD

```
font.size.display-sm  = 64
font.size.display-md  = 80
font.size.display-lg  = 96
font.size.display-xl  = 120

font.tracking.display = -0.04
font.tracking.headline = -0.03
```

### Color — BOLD defaults to high contrast

```
color.bg.primary    = #FFFFFF
color.bg.inverse    = #09090B    — near-black, deep sections

color.text.primary  = #09090B    — near black
color.text.inverse  = #FAFAF9    — near white

Accent options (pick ONE):
  Option A — Energetic: #F97316 (amber-500)
  Option B — Premium: #8B5CF6 (violet-500)
  Option C — Bold: #EF4444 (red-500)
  Option D — Fresh: #10B981 (emerald-500)
```

### Layout rules for BOLD

```
Display text: always negative tracking (-0.03 to -0.05em)
Section padding: 120–160px top/bottom
Content max-width: 1100px
Grid: 12 columns, 24px gutter
At least one section: full-bleed dark background with light text
Hero headline: minimum 64px, maximum 120px
```

---

## WARM Profile

**Personality**: Approachable, delightful, human
**Target**: Consumer apps, community, lifestyle
**Font**: Plus Jakarta Sans (preferred) or Inter

### Color Tokens (Primitives)

```
color.stone.50  = #FAFAF9    color.stone.100 = #F5F5F4
color.stone.200 = #E7E5E4    color.stone.300 = #D6D3D1
color.stone.400 = #A8A29E    color.stone.500 = #78716C
color.stone.600 = #57534E    color.stone.700 = #44403C
color.stone.800 = #292524    color.stone.900 = #1C1917

Warm accent options (pick ONE):
  color.rose.400 = #FB7185    color.rose.500 = #F43F5E
  color.orange.400 = #FB923C  color.orange.500 = #F97316
  color.teal.400 = #2DD4BF    color.teal.500 = #14B8A6
  color.amber.400 = #FBBF24   color.amber.500 = #F59E0B
```

### Semantic Tokens (WARM)

```
color.bg.primary   = {color.stone.50}     — warm white, not clinical
color.bg.secondary = {color.stone.100}
color.bg.surface   = #FFFFFF

color.text.primary   = {color.stone.900}
color.text.secondary = {color.stone.600}
color.text.tertiary  = {color.stone.400}
```

### Radius (WARM — more rounded)

```
radius.sm  = 8     radius.md  = 12    radius.lg  = 16
radius.xl  = 20    radius.2xl = 24    radius.full = 9999
```

### Typography (WARM — slightly larger, more readable)

```
Body/Base: Plus Jakarta Sans or Inter, 16px, weight 400, line-height 1.65
Label: 14px, weight 500
Heading/H1: 40px, weight 700, tracking -0.02em
Heading/H2: 32px, weight 700, tracking -0.01em
```
