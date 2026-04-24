# Phase 1: Token Inference — Naming and Taxonomy

This phase runs entirely in Claude's context — no `execute_code` calls needed. Take the raw values from Phase 0 and map them to a W3C-compliant token taxonomy **organised into Sets and Themes**, which is the structure Phase 2 will write into Penpot.

A Phase 1 output is a `PLAN` object with three parts:
1. **Sets** — the containers that hold tokens (primitives, color/light, color/dark, spacing, radius, typography…). Tokens can only exist inside a set.
2. **Tokens** inside each set — primitives first (raw values), semantic tokens second (referencing primitives via `{…}` expressions).
3. **Themes** — presets that activate specific sets together. At most one theme per group is active at a time (e.g. Mode: Light xor Dark; Density: Compact xor Comfortable).

---

## Step-by-Step Inference Process

### Step 1: Normalize Colors

1. Parse every hex value to HSL (hue, saturation, lightness).
2. Group colors by hue proximity (±15° hue, same family = same brand color).
3. Within each family, sort by lightness to form a scale.
4. Assign scale numbers: lightest = 50, then 100, 200... darkest = 900.

```javascript
// Local color normalization (runs in Claude context)
function hexToHSL(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      case b: h = ((r-g)/d + 4)/6; break;
    }
  }
  return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
}
```

### Step 2: Assign Family Names

Common hue-to-name mapping:

| Hue range | Family |
|-----------|--------|
| 0–15 or 345–360 | `red` |
| 15–45 | `orange` |
| 45–65 | `yellow` |
| 65–150 | `green` |
| 150–200 | `teal` or `cyan` |
| 200–260 | `blue` |
| 260–290 | `indigo` or `violet` |
| 290–345 | `purple` or `pink` |
| saturation < 10% | `gray` |
| lightness > 95% | `white` |
| lightness < 5% | `black` |

The **most used color** in the design that is NOT gray/white/black is typically the brand primary.

### Step 3: Assign Scale Numbers

```
lightness > 95%  → 50
lightness 90–95% → 100
lightness 80–90% → 200
lightness 70–80% → 300
lightness 55–70% → 400
lightness 40–55% → 500  ← "500" is the canonical hue value
lightness 30–40% → 600
lightness 20–30% → 700
lightness 12–20% → 800
lightness < 12%  → 900
```

### Step 4: Infer Semantic Roles

Use usage context (from Phase 0 `roles` set) to assign semantic names:

| Usage pattern | Semantic token |
|--------------|---------------|
| Most common background, light color | `color.bg.primary` |
| Second background (cards, surfaces) | `color.bg.surface` |
| Overlay / modal background | `color.bg.overlay` |
| Dark text on light bg | `color.text.primary` |
| Medium gray text | `color.text.secondary` |
| Light gray / disabled text | `color.text.disabled` |
| Link / action text color | `color.text.link` |
| Inverted text (white on dark) | `color.text.inverse` |
| Border on inputs and dividers | `color.border.default` |
| Stronger border (focus, hover) | `color.border.strong` |
| Brand primary (CTA buttons) | `color.brand.primary` |
| Brand hover state | `color.brand.primary-hover` |
| Success green | `color.feedback.success` |
| Error red | `color.feedback.error` |
| Warning yellow/orange | `color.feedback.warning` |
| Info blue | `color.feedback.info` |

### Step 5: Map Spacing to Scale

Snap values to the nearest 4px grid point, then name:

| Value (px) | Token name |
|-----------|-----------|
| 2 | `spacing.2xs` |
| 4 | `spacing.xs` |
| 8 | `spacing.sm` |
| 12 | `spacing.sm-plus` (or drop if close to 8 or 16) |
| 16 | `spacing.md` |
| 20 | `spacing.md-plus` (or drop) |
| 24 | `spacing.lg` |
| 32 | `spacing.xl` |
| 40 | `spacing.xl-plus` (or drop) |
| 48 | `spacing.2xl` |
| 64 | `spacing.3xl` |
| 80 | `spacing.4xl` |
| 96+ | `spacing.5xl` |

**Collapsing rule**: If two adjacent values are less than 2px apart (e.g., 15px and 16px), collapse them to the nearest standard value. Show collapsed values in the review with a note.

### Step 6: Map Border Radii

| Value (px) | Token name |
|-----------|-----------|
| 0 | `radius.none` |
| 2 | `radius.2xs` |
| 4 | `radius.sm` |
| 6 | `radius.sm-plus` |
| 8 | `radius.md` |
| 10–12 | `radius.lg` |
| 14–16 | `radius.xl` |
| 20–24 | `radius.2xl` |
| ≥ 999 | `radius.full` |

### Step 7: Map Typography

Identify the base body font size (most common font size). Then assign the scale relative to it:

| Relative to base (16px) | Token |
|------------------------|-------|
| 10px | `font.size.2xs` |
| 12px | `font.size.xs` |
| 14px | `font.size.sm` |
| 16px | `font.size.base` |
| 18px | `font.size.lg` |
| 20px | `font.size.xl` |
| 24px | `font.size.2xl` |
| 30px | `font.size.3xl` |
| 36px | `font.size.4xl` |
| 48px | `font.size.5xl` |

---

## Penpot Token Types (use these exact strings)

The Penpot Plugin API's `TokenType` is:

```
"color" | "dimension" | "spacing" | "typography" | "shadow" | "opacity"
| "borderRadius" | "borderWidth"
| "fontWeights" | "fontSizes" | "fontFamilies"
| "letterSpacing" | "textDecoration" | "textCase"
```

**Critical**: types are **camelCase**, and plural where the API uses plurals. Using `'border-radius'`, `'font-size'`, or `'font-weight'` will cause `set.addToken(...)` to reject the token silently or error.

| Inferred concept | TokenType string |
|------------------|------------------|
| Colors | `color` |
| Spacing / gap / padding | `spacing` |
| Width / height / sizing | `dimension` or `sizing` (`sizing` for layout children) |
| Border radius | `borderRadius` |
| Border / stroke width | `borderWidth` |
| Font size (per token = one size) | `fontSizes` |
| Font weight (per token = one weight) | `fontWeights` |
| Font family | `fontFamilies` |
| Letter spacing | `letterSpacing` |
| Text decoration | `textDecoration` |
| Text case | `textCase` |
| Shadow | `shadow` |
| Opacity | `opacity` |
| Composite text style | `typography` |

---

## Canonical Set Architecture

For most inferred systems, use this set layout:

```
primitives         (raw values only — color scales, raw spacing scale, raw radii, raw font-sizes/weights)
color/light        (semantic color aliases for light theme — {color.white}, {color.gray.900}, …)
color/dark         (semantic color aliases for dark theme — {color.gray.900}, {color.white}, …)
spacing            (semantic spacing if different from primitive scale — otherwise skip)
radius             (semantic radius if different — otherwise skip)
typography         (typographic role tokens — heading/body/label, can be composite `typography` tokens)
shadow             (if shadows exist)
```

Rules:
- Slash-separated set names (`color/light`) appear as folders in the Penpot Tokens panel.
- Primitives set is always active across all themes — it contains the raw atoms every semantic token refers to.
- A semantic token's value is **always** a reference like `{color.blue.500}`, never a raw hex. That is the whole point — if the primitive changes, every semantic alias updates.

---

## Canonical Theme Architecture

Themes are presets. Each theme has a `group` (the axis) and a `name` (the value on that axis). Only one theme per group can be active at a time.

```
Group "Mode"
  Light   → activates: [primitives, color/light, spacing, radius, typography, shadow]
  Dark    → activates: [primitives, color/dark,  spacing, radius, typography, shadow]

Group "Density"  (optional — only if the design has density variants)
  Compact     → activates: [spacing/compact]
  Comfortable → activates: [spacing/comfortable]
```

If the inspected file has no dark variant, create only a single theme `Mode/Light` — the theme system is still useful for future expansion.

---

## Presenting the Token Plan

After inference, present the plan as a mapping table. Format:

```
GLOBAL TOKENS (primitives — raw values)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Colors
  color.blue.500     = #3B82F6    (used 18 times)
  color.blue.700     = #1D4ED8    (used 6 times)
  color.gray.50      = #F9FAFB    (used 12 times)
  color.gray.900     = #111827    (used 24 times)
  color.white        = #FFFFFF    (used 31 times)

Spacing
  spacing.xs         = 4px
  spacing.sm         = 8px
  spacing.md         = 16px
  spacing.lg         = 24px
  spacing.xl         = 32px

Radii
  radius.sm          = 4px
  radius.md          = 8px
  radius.full        = 9999px

Typography
  font.size.sm       = 14px
  font.size.base     = 16px
  font.size.xl       = 20px
  font.size.3xl      = 30px
  font.weight.regular = 400
  font.weight.semibold = 600
  font.weight.bold   = 700

SEMANTIC TOKENS (aliases — applied to shapes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Set: color/light
  color.bg.primary       = {color.white}        → 31 shapes
  color.bg.surface       = {color.gray.50}       → 12 shapes
  color.text.primary     = {color.gray.900}      → 24 shapes
  color.brand.primary    = {color.blue.500}      → 18 shapes
  color.brand.hover      = {color.blue.700}      → 6 shapes

THEMES
━━━━━━

  Mode / Light   → active sets: [primitives, color/light]
```

After user approval, this structure is pasted into `scripts/createInferredTokens.js` as the `PLAN` constant.

---

## Ambiguous Cases to Flag

- Colors used in both `text-fill` and `element-fill` roles → ask user which semantic role to use
- Spacing values not on a 4px grid (e.g., 13px, 17px) → propose collapsing and show which shapes are affected
- Multiple font families → ask user which is primary (`font.family.sans`) and which is secondary/mono
- Colors very close in value (e.g., #F9FAFB and #F8FAFC) → propose merging or keeping both
