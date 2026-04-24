# Phase 3: Token Application — Binding Tokens to Shapes

After the Phase 2 writes have landed (sets exist, tokens are inside them, themes are created), bind semantic tokens to the shapes that use the corresponding values.

---

## The Canonical API

Penpot's Plugin API binds tokens to shapes via a single method:

```typescript
shape.applyToken(token: Token, properties: TokenProperty[]): void
// or equivalently
token.applyToShapes(shapes: Shape[], properties: TokenProperty[]): void
```

**Important properties of this API:**
- It is **asynchronous**. The resolved value settles on the shape after ~100ms. Do not read the result in the same `execute_code` call.
- After binding, `shape.tokens` returns a map `{ [propertyName]: "token.name" }` of current bindings.
- To remove a binding, set the underlying property directly (e.g. `shape.fills = [...]`) — this detaches the token.

---

## TokenProperty Reference

Pass the exact strings below to `applyToken` / `applyToShapes`:

| Token type (creation) | Bindable properties (application) |
|-----------------------|-----------------------------------|
| `color` | `"fill"`, `"strokeColor"` |
| `borderRadius` | `"all"` (shortcut) or `"borderRadiusTopLeft"`, `"borderRadiusTopRight"`, `"borderRadiusBottomRight"`, `"borderRadiusBottomLeft"` |
| `borderWidth` | `"strokeWidth"` |
| `dimension` | `"x"`, `"y"`, `"strokeWidth"` |
| `sizing` | `"width"`, `"height"`, `"layoutItemMinW"`, `"layoutItemMaxW"`, `"layoutItemMinH"`, `"layoutItemMaxH"` |
| `spacing` | `"rowGap"`, `"columnGap"`, `"paddingLeft"`, `"paddingTop"`, `"paddingRight"`, `"paddingBottom"`, `"marginLeft"`, `"marginTop"`, `"marginRight"`, `"marginBottom"` |
| `fontSizes` | `"fontSize"` |
| `fontWeights` | `"fontWeight"` |
| `fontFamilies` | `"fontFamilies"` |
| `letterSpacing` | `"letterSpacing"` |
| `textDecoration` | `"textDecoration"` |
| `textCase` | `"textCase"` |
| `opacity` | `"opacity"` |
| `shadow` | `"shadow"` |
| `typography` (composite) | `"typography"` |
| any token | `"all"` — the token's default property-set |

---

## Binding Fill Colors

```typescript
const page = penpot.currentPage;
const shapes = penpotUtils.findShapes(_ => true, page.root);

// Hex → semantic token name (from the Phase 1 approved plan)
const COLOR_MAP = {
  '#3b82f6': 'color.brand.primary',
  '#111827': 'color.text.primary',
  '#ffffff': 'color.bg.primary',
  '#f9fafb': 'color.bg.surface',
};

// Resolve all tokens up-front — if any is missing, the Phase 2 plan didn't
// land correctly and Phase 3 will silently skip those shapes.
const tokens = {};
for (const [hex, name] of Object.entries(COLOR_MAP)) {
  tokens[hex] = penpotUtils.findTokenByName(name) ?? null;
}

const applied = [];
const skipped = [];

for (const shape of shapes) {
  if (shape.isMainComponent) continue;    // cannot mutate component mains
  if (!shape.fills || shape.fills.length === 0) continue;

  for (const fill of shape.fills) {
    const isSolid = fill.fillType === undefined || fill.fillType === 'solid';
    if (!isSolid || !fill.fillColor) continue;

    const token = tokens[fill.fillColor.toLowerCase()];
    if (token) {
      shape.applyToken(token, ['fill']);
      applied.push({ id: shape.id, name: shape.name, token: token.name });
      break;  // one fill token per shape
    }
  }
}

return { appliedCount: applied.length, applied };
```

---

## Binding Border Radius

```typescript
const RADIUS_MAP = { 4: 'radius.sm', 8: 'radius.md', 9999: 'radius.full' };
const tokens = Object.fromEntries(
  Object.entries(RADIUS_MAP).map(([v, n]) => [v, penpotUtils.findTokenByName(n)])
);

for (const shape of penpotUtils.findShapes(_ => true, penpot.currentPage.root)) {
  if (shape.borderRadius === undefined || shape.borderRadius === null) continue;
  if (shape.borderRadius === 0) continue;
  const token = tokens[Math.round(shape.borderRadius)];
  if (token) shape.applyToken(token, ['all']);  // "all" = all 4 corners
}
```

For asymmetric radii, use the individual corner property strings (see the TokenProperty table above).

---

## Binding Text Properties (fontSize, fontWeight)

Text shapes get per-property bindings:

```typescript
const sizeMap   = { 14: 'font.size.sm', 16: 'font.size.base', 20: 'font.size.xl' };
const weightMap = { 400: 'font.weight.regular', 600: 'font.weight.semibold', 700: 'font.weight.bold' };

const sizeTokens   = Object.fromEntries(Object.entries(sizeMap).map(([v,n])   => [v, penpotUtils.findTokenByName(n)]));
const weightTokens = Object.fromEntries(Object.entries(weightMap).map(([v,n]) => [v, penpotUtils.findTokenByName(n)]));

for (const shape of penpotUtils.findShapes(s => s.type === 'text', penpot.currentPage.root)) {
  if (shape.isMainComponent) continue;

  const sizeTok = sizeTokens[Math.round(shape.fontSize)];
  if (sizeTok) shape.applyToken(sizeTok, ['fontSize']);

  const weightTok = weightTokens[Number(shape.fontWeight)];
  if (weightTok) shape.applyToken(weightTok, ['fontWeight']);
}
```

---

## Binding Spacing (Flex / Grid Containers)

Spacing tokens bind to gap and padding properties on `shape.flex` or `shape.grid` containers:

```typescript
const SPACING_MAP = { 4: 'spacing.xs', 8: 'spacing.sm', 16: 'spacing.md', 24: 'spacing.lg', 32: 'spacing.xl' };
const tokens = Object.fromEntries(
  Object.entries(SPACING_MAP).map(([v, n]) => [v, penpotUtils.findTokenByName(n)])
);

for (const shape of penpotUtils.findShapes(_ => true, penpot.currentPage.root)) {
  if (shape.flex) {
    const f = shape.flex;
    const bind = (value, prop) => {
      if (!value) return;
      const t = tokens[Math.round(value)];
      if (t) shape.applyToken(t, [prop]);
    };
    bind(f.rowGap,        'rowGap');
    bind(f.columnGap,     'columnGap');
    bind(f.topPadding,    'paddingTop');
    bind(f.rightPadding,  'paddingRight');
    bind(f.bottomPadding, 'paddingBottom');
    bind(f.leftPadding,   'paddingLeft');
  }
  if (shape.grid) {
    // grid containers have rowGap / columnGap; padding too if present in the API
  }
}
```

> Real property names on `shape.flex` and `shape.grid`: `rowGap`, `columnGap`, `topPadding`, `rightPadding`, `bottomPadding`, `leftPadding`. There is **no** `shape.layout.gap` — that is a common mistake.

---

## Application Order

Apply bindings in this order to avoid interference:

1. **Fill colors** (most shapes, highest impact)
2. **Stroke colors**
3. **Border radius** (normalise to token scale values)
4. **Text `fontSize`, `fontWeight`** (text nodes only)
5. **Flex / Grid spacing** (gap + padding)

---

## Batch Size

Process shapes in batches of 50 per `execute_code` call to avoid timeout. Return applied IDs and track progress in the state ledger.

---

## Validation After Application

Token application is **asynchronous** — the `resolvedValue` settles after ~100ms. To validate, run a subsequent `execute_code` call (or add a small delay) and read `shape.tokens`:

```typescript
// Run ~100ms after application
const page = penpot.currentPage;
const sample = penpotUtils.findShapes(_ => true, page.root).slice(0, 20);

const bound = sample
  .filter(s => s.tokens && Object.keys(s.tokens).length > 0)
  .map(s => ({ id: s.id, name: s.name, tokens: s.tokens }));

const unbound = sample
  .filter(s => !s.tokens || Object.keys(s.tokens).length === 0)
  .map(s => ({ id: s.id, name: s.name }));

return { boundCount: bound.length, unboundCount: unbound.length, bound, unbound };
```

For visual validation, run `export_shape` on a representative bound shape and confirm the rendered color matches the token's resolved value.

---

## Edge Cases

- **Main component shapes**: `shape.isMainComponent === true` — cannot be mutated in the MCP context. Skip them; any component instances on the page will pick up their main's bindings automatically.
- **Gradient fills**: `applyToken` with `"fill"` on a gradient shape may not work as expected — tokens map cleanly only to solid fills. Verify with `penpot_api_info({ type: 'Fill' })` if needed.
- **Multiple fills/strokes**: apply the token to the first matching fill and break. If a shape legitimately has multiple solid fills requiring different tokens, that is unusual — flag it in Phase 1.
- **Already-bound shapes**: check `shape.tokens[property]` before re-binding. If the binding already exists and matches, skip.

---

## Library Colors (Optional, for Component Fills)

Separately from the token binding above, Penpot also has **library colors** (accessed via `penpot.library.local.colors`). These are a different system used by component fills and the color picker UI. If the inferred design system will be consumed as a component library, also create a library color for each semantic color token — see `penpot-generate-library/references/02-token-creation.md` for the pattern. This is not required for token binding to work; it is an additional affordance for designers.
