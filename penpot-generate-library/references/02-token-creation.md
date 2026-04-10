# Phase 1: Token Creation

Tokens are the foundation of the design system. No component can be built until all tokens it depends on exist. This phase creates all tokens, library colors, and library typographies.

---

## Token Architecture Patterns

Choose the pattern based on the number of tokens in your system:

### Simple (< 50 tokens)

Single token set. Define light and dark values as separate named tokens within the same set.

```
Token set: "tokens"
  color.bg.primary.light = #FFFFFF
  color.bg.primary.dark  = #111827
  spacing.md             = 16
  radius.md              = 8
```

### Standard (50–200 tokens) ← Recommended for most projects

Two-layer architecture: primitives set + semantic sets + component sets.

```
Token set: "primitives"          ← raw values, never referenced directly in components
  color.blue.50  = #EFF6FF
  color.blue.500 = #3B82F6
  color.gray.900 = #111827
  color.white    = #FFFFFF

Token set: "color/light"         ← semantic aliases, light theme
  color.bg.primary    = {color.white}
  color.bg.secondary  = {color.blue.50}
  color.text.primary  = {color.gray.900}
  color.text.inverse  = {color.white}
  color.border.default= {color.gray.200}

Token set: "color/dark"          ← semantic aliases, dark theme
  color.bg.primary    = {color.gray.900}
  color.bg.secondary  = {color.gray.800}
  color.text.primary  = {color.white}
  color.text.inverse  = {color.gray.900}
  color.border.default= {color.gray.700}

Token set: "spacing"
  spacing.xs  = 4
  spacing.sm  = 8
  spacing.md  = 16
  spacing.lg  = 24
  spacing.xl  = 32
  spacing.2xl = 48
  spacing.3xl = 64

Token set: "typography"
  typography.size.xs   = 12
  typography.size.sm   = 14
  typography.size.base = 16
  typography.size.lg   = 18
  typography.size.xl   = 20
  typography.size.2xl  = 24
  typography.size.3xl  = 30
  typography.size.4xl  = 36
  typography.weight.normal   = 400
  typography.weight.medium   = 500
  typography.weight.semibold = 600
  typography.weight.bold     = 700
  typography.lineHeight.tight   = 1.25
  typography.lineHeight.normal  = 1.5
  typography.lineHeight.relaxed = 1.75
  typography.letterSpacing.tight  = -0.025
  typography.letterSpacing.normal = 0
  typography.letterSpacing.wide   = 0.025

Token set: "radius"
  radius.none = 0
  radius.sm   = 4
  radius.md   = 8
  radius.lg   = 12
  radius.xl   = 16
  radius.2xl  = 24
  radius.full = 9999

Token set: "shadow"
  shadow.sm = 0 1px 2px 0 rgba(0,0,0,0.05)
  shadow.md = 0 4px 6px -1px rgba(0,0,0,0.10)
  shadow.lg = 0 10px 15px -3px rgba(0,0,0,0.15)
  shadow.xl = 0 20px 25px -5px rgba(0,0,0,0.20)
```

### Advanced (200+ tokens)

Multiple semantic sets with themes (Light/Dark × Contrast × Brand):

```
Token set: "primitives"
Token set: "color/light/base"
Token set: "color/light/high-contrast"
Token set: "color/dark/base"
Token set: "color/dark/high-contrast"
Token set: "brand/default"
Token set: "brand/alternate"
Token set: "spacing"
Token set: "typography"
Token set: "radius"
Token set: "shadow"
```

---

## Penpot Token Types Reference

| Penpot type | Use for | Example value |
|-------------|---------|---------------|
| `color` | Colors in any format | `#3B82F6`, `rgba(59,130,246,0.5)` |
| `spacing` | Padding, margin, gap | `16` (unitless px) |
| `sizing` | Width, height, min/max | `44` (min touch target) |
| `border-radius` | Corner radius | `8` |
| `border-width` | Stroke width | `1` |
| `opacity` | Opacity / alpha | `0.5` (0–1 range) |
| `font-family` | Font family string | `Inter, sans-serif` |
| `font-size` | Font size | `16` |
| `font-weight` | Font weight | `600` |
| `letter-spacing` | Letter spacing | `-0.025` |
| `line-height` | Line height | `1.5` |
| `text-decoration` | Text decoration | `underline`, `none` |
| `text-case` | Text transform | `uppercase`, `none` |
| `shadow` | Drop shadow definition | CSS shadow string |
| `typography` | Composite typography shorthand | `600 16px/1.5 Inter` |
| `dimension` | Any length with unit | `24px`, `1.5rem` |
| `number` | Unitless number | `4` |
| `rotation` | Rotation angle | `45` |

> **Critical**: Never use `number` where `spacing` or `sizing` is correct. Token type determines where the token can be applied in the UI.

---

## TokenCatalog API

```typescript
// Access the token catalog
const catalog = penpot.library.local.tokens;  // TokenCatalog

// Create a primitive color token
await catalog.createToken({
  name: 'color.blue.500',
  type: 'color',
  value: '#3B82F6',
  description: 'Blue 500 — primary brand blue'
});

// Create a semantic token (references a primitive via expression)
await catalog.createToken({
  name: 'color.bg.primary',
  type: 'color',
  value: '{color.white}',         // Expression syntax: curly braces
  description: 'Primary background — light theme'
});

// Create a spacing token
await catalog.createToken({
  name: 'spacing.md',
  type: 'spacing',
  value: '16',
  description: 'Medium spacing (16px)'
});

// Create a shadow token
await catalog.createToken({
  name: 'shadow.md',
  type: 'shadow',
  value: '0 4px 6px -1px rgba(0,0,0,0.10)',
  description: 'Medium elevation shadow'
});
```

> **Note**: `penpot.library.local.tokens` returns a `TokenCatalog` object. Before coding, call `penpot_api_info` with type `TokenCatalog` to verify the exact method signatures for the current Penpot version.

---

## Expression Syntax (Aliases)

Semantic tokens reference primitive tokens using curly-brace expression syntax:

```
{color.blue.500}              → resolves to #3B82F6
{color.white}                 → resolves to #FFFFFF
{spacing.md}                  → resolves to 16
{radius.lg}                   → resolves to 12
```

**Rules for expressions:**
- Must exactly match a token name that exists in any active token set
- Circular references are not valid (`a = {b}` and `b = {a}`)
- Never copy the raw value — always use an expression. This ensures that changing `color.blue.500` propagates to all semantic aliases.
- For composite tokens (e.g., `typography`), you can reference individual sub-tokens

---

## Library Colors

Library colors are the **style-level representation** of color tokens. They appear in the color picker, can be applied to fills/strokes directly, and support `fillColorRefId` binding in components. Create a library color for every semantic color token.

```typescript
const library = penpot.library.local;

// Create a library color
const color = library.createColor();
color.name = 'color/bg/primary';     // slash-separated path (UI shows as folder/name)
color.color = '#FFFFFF';             // raw hex for light theme default
color.opacity = 1;

return { id: color.id, name: color.name };
```

> Library colors must be created separately from TokenCatalog tokens. They serve different purposes: tokens drive Tokens Studio / W3C workflows; library colors drive the Penpot UI and fill bindings in components.

---

## Library Typographies

Library typographies (also called text styles) are the style-level representation of typography. Components bind text nodes to these via `applyTypography()`.

```typescript
const library = penpot.library.local;

const typo = library.createTypography({
  name: 'Body/Base',
  fontFamily: 'Inter',
  fontStyle: 'Regular',
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5,
  letterSpacing: 0,
});

return { id: typo.id, name: typo.name };
```

> **Verify with `penpot_api_info`**: The exact shape of the `createTypography` argument may vary. Check `LibraryTypography` interface before coding.

### Typography Names to Create

For each typographic role in the system, create a library typography entry. Standard set:

| Name | Family | Size | Weight | Line-height |
|------|--------|------|--------|-------------|
| `Display/Large` | Inter | 48 | 700 | 1.1 |
| `Display/Medium` | Inter | 36 | 700 | 1.2 |
| `Heading/XL` | Inter | 30 | 700 | 1.25 |
| `Heading/LG` | Inter | 24 | 600 | 1.25 |
| `Heading/MD` | Inter | 20 | 600 | 1.3 |
| `Heading/SM` | Inter | 18 | 600 | 1.4 |
| `Body/LG` | Inter | 18 | 400 | 1.6 |
| `Body/MD` | Inter | 16 | 400 | 1.5 |
| `Body/SM` | Inter | 14 | 400 | 1.5 |
| `Label/LG` | Inter | 16 | 500 | 1.25 |
| `Label/MD` | Inter | 14 | 500 | 1.25 |
| `Label/SM` | Inter | 12 | 500 | 1.25 |
| `Caption/MD` | Inter | 12 | 400 | 1.4 |
| `Code/MD` | JetBrains Mono | 14 | 400 | 1.6 |

---

## Idempotency: Check Before Create

Always check for existence before creating any token or library entry:

```typescript
// Check for existing token
const catalog = penpot.library.local.tokens;
const tokens = catalog ? Object.values(catalog) : [];
const existing = tokens.find(t => t.name === 'color.blue.500');
if (existing) {
  return { skipped: true, id: existing.id, name: existing.name };
}

// Check for existing library color
const library = penpot.library.local;
const existingColor = library.colors.find(c => c.name === 'color/bg/primary');
if (existingColor) {
  return { skipped: true, id: existingColor.id };
}

// Check for existing typography
const existingTypo = library.typographies.find(t => t.name === 'Body/MD');
if (existingTypo) {
  return { skipped: true, id: existingTypo.id };
}
```

---

## Creation Order Within Phase 1

Always create in this order to prevent broken expression references:

```
1. Color primitives         (no dependencies)
2. Spacing tokens           (no dependencies)
3. Typography sub-tokens    (no dependencies: size, weight, line-height, etc.)
4. Border-radius tokens     (no dependencies)
5. Shadow tokens            (no dependencies)
6. Semantic color tokens    (depend on primitives — use expressions)
7. Library colors           (depend on semantic color tokens)
8. Library typographies     (depend on typography sub-tokens)
```

---

## Phase 1 Validation Checklist

Before presenting the checkpoint to the user:

- [ ] Every primitive color token exists and has a raw hex value
- [ ] Every semantic color token uses an expression `{token.name}`, not a raw value
- [ ] Semantic tokens resolve (no broken references — expression target must exist)
- [ ] Every spacing token uses type `spacing` (not `number`)
- [ ] Every border-radius token uses type `border-radius` (not `number`)
- [ ] Every typography sub-token has the correct type (`font-size`, `font-weight`, etc.)
- [ ] Library colors exist for every semantic color token
- [ ] Library typographies exist for every typographic role in the scope
- [ ] No duplicate token names (query the full list and check)
- [ ] Token count matches the scope lock plan

---

## Token Creation Anti-Patterns

- ❌ Copying raw hex values into semantic tokens instead of using `{token.name}` expressions
- ❌ Using `number` type for spacing or sizing tokens (type determines applicability in the UI)
- ❌ Creating semantic tokens before the primitive tokens they reference
- ❌ Skipping library typographies — components need these for text binding
- ❌ Creating more than one token with the same name (silent overwrite risk)
- ❌ Mixing naming conventions (dot-notation for some tokens, slash-notation for others)
- ❌ Skipping idempotency checks and duplicating tokens on retry
