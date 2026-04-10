# Naming Conventions

Naming is not cosmetic. In Penpot, names determine how tokens are found and resolved, how components are discovered in the library panel, how designers navigate the file, and how code generators produce variable names. Get naming right from the start — renames in a large library cascade everywhere.

---

## Tokens: Dot-Notation (W3C DTCG)

Penpot tokens use **dot-separated paths** matching the W3C Design Token Community Group format. This also matches Token Studio and most modern token tools.

### Format

```
{category}.{group}.{variant}
{category}.{group}.{scale}
{category}.{property}.{modifier}
```

### Color Tokens

```
Primitives (raw values — never referenced in components directly):
  color.blue.50        color.blue.100       color.blue.200
  color.blue.300       color.blue.400       color.blue.500
  color.blue.600       color.blue.700       color.blue.800
  color.blue.900       color.blue.950

  color.gray.50        color.gray.100       …   color.gray.950
  color.red.500        color.green.500      color.yellow.500
  color.white          color.black

Semantic (theme-aware — reference primitives via expressions):
  Background:
    color.bg.primary   color.bg.secondary   color.bg.tertiary
    color.bg.inverse   color.bg.overlay     color.bg.disabled
    color.bg.brand     color.bg.brand-hover color.bg.destructive

  Text:
    color.text.primary    color.text.secondary  color.text.tertiary
    color.text.inverse    color.text.disabled   color.text.link
    color.text.brand      color.text.success    color.text.warning
    color.text.destructive

  Border:
    color.border.default  color.border.strong   color.border.focus
    color.border.brand    color.border.destructive

  Interactive:
    color.interactive.primary         color.interactive.primary-hover
    color.interactive.primary-active  color.interactive.secondary
    color.interactive.secondary-hover color.interactive.disabled
```

### Spacing Tokens

```
spacing.0    = 0
spacing.px   = 1
spacing.0-5  = 2     ← use "-" separator for decimal scale steps
spacing.1    = 4
spacing.1-5  = 6
spacing.2    = 8
spacing.3    = 12
spacing.4    = 16
spacing.5    = 20
spacing.6    = 24
spacing.8    = 32
spacing.10   = 40
spacing.12   = 48
spacing.16   = 64
spacing.20   = 80
spacing.24   = 96
spacing.32   = 128

Aliases (semantic convenience names):
spacing.xs   = {spacing.1}     = 4
spacing.sm   = {spacing.2}     = 8
spacing.md   = {spacing.4}     = 16
spacing.lg   = {spacing.6}     = 24
spacing.xl   = {spacing.8}     = 32
spacing.2xl  = {spacing.12}    = 48
spacing.3xl  = {spacing.16}    = 64
```

### Typography Tokens

```
typography.family.sans  = Inter, sans-serif
typography.family.serif = Georgia, serif
typography.family.mono  = JetBrains Mono, monospace

typography.size.xs   = 12     typography.size.sm   = 14
typography.size.base = 16     typography.size.lg   = 18
typography.size.xl   = 20     typography.size.2xl  = 24
typography.size.3xl  = 30     typography.size.4xl  = 36
typography.size.5xl  = 48     typography.size.6xl  = 60

typography.weight.thin        = 100   typography.weight.light    = 300
typography.weight.normal      = 400   typography.weight.medium   = 500
typography.weight.semibold    = 600   typography.weight.bold     = 700
typography.weight.extrabold   = 800   typography.weight.black    = 900

typography.lineHeight.none    = 1
typography.lineHeight.tight   = 1.25
typography.lineHeight.snug    = 1.375
typography.lineHeight.normal  = 1.5
typography.lineHeight.relaxed = 1.625
typography.lineHeight.loose   = 2

typography.letterSpacing.tighter = -0.05
typography.letterSpacing.tight   = -0.025
typography.letterSpacing.normal  = 0
typography.letterSpacing.wide    = 0.025
typography.letterSpacing.wider   = 0.05
typography.letterSpacing.widest  = 0.1
```

### Border Radius Tokens

```
radius.none = 0
radius.sm   = 2
radius.md   = 4
radius.lg   = 8
radius.xl   = 12
radius.2xl  = 16
radius.3xl  = 24
radius.full = 9999
```

### Shadow Tokens

```
shadow.none
shadow.sm
shadow.md
shadow.lg
shadow.xl
shadow.2xl
shadow.inner
```

### Border Width Tokens

```
border.width.none  = 0
border.width.thin  = 1
border.width.base  = 2
border.width.thick = 4
```

---

## Library Colors: Slash-Notation (Folder Paths)

Library colors appear in the Penpot color picker as folder hierarchies. Use **slash-separated paths**. The last segment is the name shown in the folder.

```
color/bg/primary          → folder: color/bg  → name: primary
color/bg/secondary        → folder: color/bg  → name: secondary
color/text/primary        → folder: color/text → name: primary
color/text/inverse        → folder: color/text → name: inverse
color/border/default      → folder: color/border → name: default
color/border/focus        → folder: color/border → name: focus
color/interactive/brand   → folder: color/interactive → name: brand
color/interactive/destructive → …
```

> **Key distinction**: Token names use dots (`color.bg.primary`); library color names use slashes (`color/bg/primary`). Both name the same concept from different layers of the system. The token expression `{color.bg.primary}` refers to the dot-notation token name, not the library color name.

---

## Library Typographies: Title Case with Slash Category

```
Body/Small       Body/Base      Body/Large
Heading/XS       Heading/SM     Heading/MD     Heading/LG     Heading/XL
Display/Small    Display/Medium Display/Large
Label/Small      Label/Medium   Label/Large
Caption/Small    Caption/Medium
Code/Small       Code/Medium    Code/Large
Overline/Small   Overline/Medium
```

---

## Components: PascalCase, No Prefixes

```
✅  Button           Input          Checkbox        Radio
    Toggle           Badge           Avatar          Tag
    Tooltip          Alert           Card            Modal
    Divider          Spinner         Icon            Breadcrumb
    NavBar           Sidebar         DataTable       PageHeader

❌  btn              input-field    MyButton         ui-button
    DSButton         _button        button-component ButtonComponent
```

**Private/internal components** (not for direct consumer use) — prefix with underscore:

```
_Button/Base         ← base frame before being wrapped as component
_Icon/Slot           ← icon placeholder inside Button
_InputAdornment      ← internal Input sub-component
```

**Documentation-only components** — prefix with dot:

```
.ColorSwatch         ← used only on the Foundations page
.SpacingBar          ← used only on the Foundations page
.TypographySpecimen  ← used only on the Foundations page
```

---

## Variant Properties: PascalCase Property = Title Case Value

```
Variant property syntax: Property=Value

Correct:
  Size=Small       Size=Medium      Size=Large
  Style=Primary    Style=Secondary  Style=Ghost     Style=Destructive
  State=Default    State=Hover      State=Active    State=Disabled    State=Loading
  Checked=True     Checked=False
  Icon=None        Icon=Left        Icon=Right      Icon=Both
  Orientation=Horizontal   Orientation=Vertical
  Density=Compact  Density=Default  Density=Spacious

Incorrect:
  size=small       SIZE=SMALL       style=primary
  state=default    disabled=true    loading=false
  isChecked=true   hasIcon=left
```

**Property ordering** in the variant matrix (leftmost = most stable, rightmost = most volatile):

```
Size → Style → State
Orientation → Size → Density
Checked → Size → State
```

---

## Pages: Emoji + Status Prefix

```
Status indicators:
  ✅ Cover            — complete, final
  🏗️ Getting Started  — in progress
  📐 Foundations      — in progress
  📦 Components       — in progress
  🔧 Utilities        — in progress
  ⚠️ [Page Name]      — needs review
  🚫 [Page Name]      — deprecated, do not use

Component pages (no status prefix during build, add ✅ when done):
  Button
  Input
  Card
  Modal
```

---

## Layer Names: kebab-case for Shapes, PascalCase for Components

```
Shapes (frames, groups, text, primitives):
  button-container      icon-left          label
  card-body             card-footer        card-image
  section-header        content-area       divider
  bg-overlay            input-field        placeholder-text

Components (main component frames and instances):
  Button               Button/Primary-Medium
  Input                Card
  NavBar               DataTable

Documentation frames:
  _Doc                 _Doc/Button
  ——— COLORS ———       ——— TYPOGRAPHY ———

Section separators:
  ---                  ——— COMPONENTS ———
```

---

## Token Set Names

```
primitives          ← raw values
color/light         ← semantic colors, light theme
color/dark          ← semantic colors, dark theme
color/light/hc      ← high-contrast light (accessibility)
color/dark/hc       ← high-contrast dark
spacing             ← spacing scale
typography          ← type scale and text properties
radius              ← border radius scale
shadow              ← elevation/shadow scale
border              ← border width scale
component/button    ← component-specific tokens (optional, advanced)
component/input     ← component-specific tokens (optional, advanced)
```

---

## Run ID Format

For state tracking, use a deterministic run ID:

```
penpot-dsb-{project-slug}-{YYYYMMDD}
  e.g.: penpot-dsb-acme-ui-20250115

For reruns on the same day, append a counter:
  penpot-dsb-acme-ui-20250115-002
```

---

## Naming Anti-Patterns

- ❌ Using slash notation for tokens (`color/bg/primary`) — use dots (`color.bg.primary`)
- ❌ Using dot notation for library colors (`color.bg.primary`) — use slashes (`color/bg/primary`)
- ❌ Lowercase or kebab-case component names (`button`, `primary-button`)
- ❌ Prefixes in component names (`DSButton`, `UIButton`, `AppButton`)
- ❌ Abbreviations in variant values (`Sm` instead of `Small`, `Def` instead of `Default`)
- ❌ Boolean variant values as `yes`/`no` or `on`/`off` — use `True`/`False`
- ❌ Token names that don't map to code variable names (prevents token export round-trips)
- ❌ Mixing conventions in the same collection (some tokens with dots, some with slashes)
- ❌ Unnamed shapes anywhere in the component tree (`Frame 1`, `Rectangle 2`)
