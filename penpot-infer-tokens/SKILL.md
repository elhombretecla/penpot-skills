---
name: penpot-infer-tokens
description: "Infer design tokens from an existing Penpot design and apply them back to the elements. Use when the user wants to extract tokens from a design that uses hardcoded values, create a proper token system (global + semantic sets) from existing visual properties, or sync tokens to elements after inferring them. Triggers: 'extract tokens from this design', 'infer tokens', 'create tokens from existing design', 'tokenize this design', 'create a token system from these elements', 'apply tokens to shapes'."
disable-model-invocation: false
---

# Infer Design Tokens — Penpot MCP Skill

Traverse an existing Penpot design, extract all hardcoded visual values, propose a W3C-compliant token taxonomy (**global** set with raw primitives + **semantic** set with aliases), get user approval, create the tokens in the TokenCatalog, and apply semantic tokens back to every element.

**How it works**: Every inspection and mutation goes through the Penpot MCP `execute_code` tool. Use `high_level_overview` for read-only file state. Use `penpot_api_info` to verify API signatures before coding.

---

## 1. The One Rule That Matters Most

**Never create tokens without user approval.** The inference phase is analysis-only. Only proceed to creation after the user has reviewed and confirmed the proposed token plan. Incorrect token names are hard to rename at scale.

---

## 2. Mandatory Workflow

Follow this phase order strictly.

```
Phase 0: INSPECTION (read-only — no execute_code writes)
  0a. Call high_level_overview to understand file structure
  0b. Traverse ALL shapes on the target page via execute_code
  0c. Collect every unique visual value:
      - Fill colors (hex/rgba) and their usage count
      - Stroke colors and widths
      - Border radii values
      - Font families, sizes, weights, line-heights
      - Flex layout gap and padding values
      - Shadow definitions
  0d. Cluster similar values (snap spacing to 4px grid, group close colors)
  ✋ Present the raw extracted values — no naming yet, just the inventory

Phase 1: INFERENCE (analysis — no writes)
  1a. Map raw values to a W3C token taxonomy:
      - global set: primitives (color.blue.500 = #3B82F6)
      - semantic set: aliases ({color.blue.500} → color.bg.primary)
  1b. Propose token names following naming conventions (see Section 6)
  1c. Show a full mapping table: value → global token → semantic token → shapes affected
  ✋ USER CHECKPOINT: present full token plan, await explicit approval before any creation

Phase 2: CREATION (writes begin — land the plan in the Penpot file)
  In Penpot, tokens MUST live inside a Set. Themes are presets that activate
  specific sets together. Phase 2 creates all three layers:
  2a. Create Token SETS (e.g. `primitives`, `color/light`, `color/dark`,
      `spacing`, `radius`, `typography`) via `catalog.addSet({ name })`
  2b. Add PRIMITIVE tokens to their set(s) via `set.addToken({ type, name, value })`
      — raw values, type-correct (camelCase: `borderRadius`, `fontSizes`, `fontWeights`)
  2c. Add SEMANTIC tokens to their set(s) — expressions `{token.name}` referencing
      primitives. Primitives must exist first or the expression breaks.
  2d. Create THEMES via `catalog.addTheme({ group, name })` and attach active sets
      with `theme.addSet(set)` (e.g. Mode/Light → primitives + color/light)
  2e. Validate: query `catalog.sets` / `catalog.themes` and confirm everything exists
  ✋ USER CHECKPOINT: show sets/tokens/themes counts, await approval before applying

Phase 3: APPLICATION (bind tokens to shapes)
  Use the native `shape.applyToken(token, properties)` binding — not the older
  library-color `fillColorRefId` indirection. Token application is ASYNCHRONOUS
  (effects settle after ~100ms).
  3a. For each shape with a fill matching a token value → `applyToken(t, ['fill'])`
  3b. For each shape with a stroke matching a token value → `applyToken(t, ['strokeColor'])`
  3c. For each shape with a border radius → `applyToken(t, ['all'])`
  3d. For each text node → `applyToken(t, ['fontSize'])` and `['fontWeight']`
  3e. For each flex/grid container → bind gap and padding spacing tokens
  3f. Validate: inspect a sample via `shape.tokens` to confirm bindings
  ✋ USER CHECKPOINT: show export_shape screenshot + binding summary, sign-off
```

---

## 3. Penpot MCP Tool Reference

| Tool | Purpose |
|------|---------|
| `execute_code` | Run arbitrary Plugin API code. **Primary tool.** |
| `high_level_overview` | Read-only file inspection — pages, layers, components, tokens, styles. |
| `penpot_api_info` | Query API type definitions and method signatures. |
| `export_shape` | Export shape/frame as image for visual validation. |

> MCP always operates on the **currently focused page**. Explicitly read `penpot.currentPage` at the start of every call.

---

## 3b. Penpot Design Tokens API (verified surface)

This skill writes directly to Penpot's Design Tokens system. Memorise this surface — it is the source of truth for what lands in the file.

```typescript
// Catalog = the entire token system for the local library
const catalog = penpot.library.local.tokens;   // TokenCatalog

catalog.sets:    TokenSet[]                    // read
catalog.themes:  TokenTheme[]                  // read
catalog.addSet({ name }): TokenSet             // create a new set
catalog.addTheme({ group, name }): TokenTheme  // create a new theme

// Sets = token containers. Tokens only exist inside a set.
set.name:    string
set.active:  boolean                           // toggleActive() to flip
set.tokens:  Token[]
set.addToken({ type, name, value }): Token     // synchronous

// Themes = presets that activate specific sets. Only one theme per group active.
theme.group:       string
theme.name:        string
theme.active:      boolean                     // toggleActive()
theme.activeSets:  TokenSet[]
theme.addSet(set): void                        // attach a set to this theme
theme.removeSet(set): void

// Token types (camelCase, plural where the API uses plurals):
//   "color" | "dimension" | "spacing" | "typography" | "shadow" | "opacity"
//   | "borderRadius" | "borderWidth"
//   | "fontWeights" | "fontSizes" | "fontFamilies"
//   | "letterSpacing" | "textDecoration" | "textCase"
//
// Token values are strings:
//   "#3B82F6"          (direct value)
//   "16"               (numeric value — still a string)
//   "{color.white}"    (reference to another token in any active set)

// Binding a token to a shape
shape.applyToken(token, ["fill"]);             // ASYNC — ~100ms to settle
token.applyToShapes([shape1, shape2], ["fill"]);

// Discovery helpers
penpotUtils.tokenOverview();                   // { setName: { type: [tokenName, ...] } }
penpotUtils.findTokenByName(name);             // returns first match or null
penpotUtils.findTokensByName(name);            // all matches across sets
penpotUtils.getTokenSet(token);                // the set that contains a token
```

**Common pitfalls** (the ones that silently break "creation"):
- ❌ `catalog.createToken(...)` — this method does not exist. Tokens are added to **sets**.
- ❌ `'border-radius'`, `'font-size'`, `'font-weight'` — wrong. Use camelCase + plural: `'borderRadius'`, `'fontSizes'`, `'fontWeights'`.
- ❌ Passing `description` to `addToken` — not part of the signature; silently ignored or rejected depending on version.
- ❌ Creating tokens without any sets — they have nowhere to live.
- ❌ Using `shape.layout.gap` — not a real property. Use `shape.flex.rowGap` / `shape.flex.columnGap` / `shape.flex.topPadding`, etc., or `shape.grid.rowGap`.
- ❌ `Object.values(catalog)` to enumerate tokens — iterate `catalog.sets[].tokens[]` instead.

---

## 4. Inspection Strategy

### 4a. Collect all visual values

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

const fills = new Map();      // hex → { count, shapeIds }
const strokes = new Map();
const radii = new Set();
const fonts = new Map();       // "family|size|weight" → { count, shapeIds }
const spacings = new Set();
const shadows = new Set();

for (const shape of shapes) {
  // Fill colors
  if (shape.fills) {
    for (const fill of shape.fills) {
      if (fill.fillType === 'solid' && fill.fillColor) {
        const key = fill.fillColor.toLowerCase();
        if (!fills.has(key)) fills.set(key, { count: 0, shapeIds: [] });
        fills.get(key).count++;
        fills.get(key).shapeIds.push(shape.id);
      }
    }
  }

  // Border radius
  if (shape.borderRadius !== undefined && shape.borderRadius !== null) {
    radii.add(shape.borderRadius);
  }

  // Typography (text nodes)
  if (shape.type === 'text') {
    const key = `${shape.fontFamily}|${shape.fontSize}|${shape.fontWeight}`;
    if (!fonts.has(key)) fonts.set(key, { count: 0, shapeIds: [], fontFamily: shape.fontFamily, fontSize: shape.fontSize, fontWeight: shape.fontWeight });
    fonts.get(key).count++;
    fonts.get(key).shapeIds.push(shape.id);
  }
}

return {
  fillColors: [...fills.entries()].map(([hex, v]) => ({ hex, ...v })).sort((a, b) => b.count - a.count),
  radii: [...radii].sort((a, b) => a - b),
  fonts: [...fonts.values()].sort((a, b) => b.count - a.count),
};
```

### 4b. Collect spacing values from flex layouts

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();
const spacings = new Set();

for (const shape of shapes) {
  // Flex gap
  if (shape.layout) {
    if (shape.layout.gap) spacings.add(shape.layout.gap);
    if (shape.layout.padding) {
      const p = shape.layout.padding;
      if (p.top) spacings.add(p.top);
      if (p.right) spacings.add(p.right);
      if (p.bottom) spacings.add(p.bottom);
      if (p.left) spacings.add(p.left);
    }
  }
}

return { spacings: [...spacings].sort((a, b) => a - b) };
```

---

## 5. Token Inference Rules

### Color Inference

1. **Cluster by hue**: group colors within ±10° hue and ±15% lightness into the same family.
2. **Identify the scale**: if you find 4–10 variants of the same hue, it's a color scale (100–900). Name the closest to 50% lightness as `500`.
3. **Detect role from usage**:
   - Dark colors on text nodes → `color.text.*`
   - Light colors on large background frames → `color.bg.*`
   - Colors on stroke-only shapes → `color.border.*`
   - Brand hue appearing on CTAs → `color.brand.*`
4. **Always separate global from semantic**:
   - Global (primitive): `color.blue.500 = #3B82F6` — raw values, never applied to shapes directly
   - Semantic: `color.bg.primary = {color.blue.500}` — these are applied to shapes

### Spacing Inference

1. Snap all values to the nearest 4px grid increment.
2. Map to scale:
   - 0–2px → `spacing.1` (keep exact)
   - 4px → `spacing.xs`
   - 8px → `spacing.sm`
   - 12px → `spacing.sm-plus` (if needed) or round to nearest
   - 16px → `spacing.md`
   - 24px → `spacing.lg`
   - 32px → `spacing.xl`
   - 48px → `spacing.2xl`
   - 64px → `spacing.3xl`
   - Other values → `spacing.{value}` as custom token

### Border Radius Inference

- 0 → `radius.none`
- 2–4 → `radius.sm`
- 6–8 → `radius.md`
- 10–14 → `radius.lg`
- 16–20 → `radius.xl`
- ≥ 999 → `radius.full`
- Other values → `radius.{value}` as custom token

### Typography Inference

- Cluster by font-size into a type scale (xs/sm/base/lg/xl/2xl/3xl/4xl)
- Map by weight: 300=light, 400=regular, 500=medium, 600=semibold, 700=bold, 800=extrabold
- Identify roles: largest bold text = heading, body text = body, small labels = label/caption

---

## 6. Naming Conventions (W3C Standard)

Follow **dot-notation** for tokens (W3C Design Token format):

```
global set:
  color.{family}.{scale}        → color.blue.500, color.gray.100
  color.{name}                  → color.white, color.black
  spacing.{t-shirt}             → spacing.xs, spacing.sm, spacing.md
  radius.{t-shirt}              → radius.sm, radius.md, radius.full
  font.size.{t-shirt}           → font.size.sm, font.size.base, font.size.xl
  font.weight.{name}            → font.weight.regular, font.weight.bold
  font.family.{name}            → font.family.sans, font.family.mono

semantic set:
  color.bg.{role}               → color.bg.primary, color.bg.surface, color.bg.overlay
  color.text.{role}             → color.text.primary, color.text.secondary, color.text.disabled
  color.border.{role}           → color.border.default, color.border.strong, color.border.focus
  color.brand.{role}            → color.brand.primary, color.brand.secondary
  color.feedback.{role}         → color.feedback.success, color.feedback.error, color.feedback.warning
```

**Never mix global and semantic in the same token set.**

---

## 7. Token Application Rules

Use the native Penpot token binding API:

```typescript
// Apply a semantic color token to a shape's fill
const token = penpotUtils.findTokenByName('color.bg.primary');
if (token) shape.applyToken(token, ['fill']);

// Border radius — 'all' covers all 4 corners
shape.applyToken(radiusToken, ['all']);

// Text node — bind fontSize and fontWeight separately
textShape.applyToken(fontSizeToken, ['fontSize']);
textShape.applyToken(fontWeightToken, ['fontWeight']);

// Flex / Grid container spacing
container.applyToken(spacingToken, ['rowGap']);
container.applyToken(spacingToken, ['paddingTop']);
```

**TokenProperty cheat sheet** (strings passed to `applyToken`):
- Color: `"fill"`, `"strokeColor"`
- Border radius: `"all"` (or individual corners: `borderRadiusTopLeft`, `borderRadiusTopRight`, `borderRadiusBottomRight`, `borderRadiusBottomLeft`)
- Text: `"fontSize"`, `"fontWeight"`, `"fontFamilies"`, `"letterSpacing"`, `"textCase"`, `"textDecoration"`
- Spacing: `"rowGap"`, `"columnGap"`, `"paddingLeft"`, `"paddingTop"`, `"paddingRight"`, `"paddingBottom"`, `"marginLeft/Top/Right/Bottom"`
- Sizing: `"width"`, `"height"`, `"x"`, `"y"`, `"strokeWidth"`, `"opacity"`, `"rotation"`
- Shadow: `"shadow"`
- Typography (composite): `"typography"`

**Application priority order** (apply semantic tokens, not primitives):
1. Fill colors → `applyToken(t, ['fill'])`
2. Stroke colors → `applyToken(t, ['strokeColor'])`
3. Border radius → `applyToken(t, ['all'])`
4. Text `fontSize` / `fontWeight` (text nodes only)
5. Gap/padding in `shape.flex` / `shape.grid` containers

**Important notes**:
- Application is **asynchronous** — resolved values settle after ~100ms. Re-inspect to verify.
- `shape.tokens` returns a `{ [propertyName]: "token.name" }` map of current bindings.
- Skip `shape.isMainComponent` shapes — component main shapes cannot be mutated via the Plugin API in MCP context.
- Apply **semantic** tokens (`color.bg.primary`), never primitives (`color.blue.500`), to shapes.
- To remove a token binding, set the raw property directly (e.g. `shape.fills = [...]`).

---

## 8. Critical Rules

1. **Inspect first, infer second, create third, apply last** — never skip phases.
2. **Always propose the full token plan before creating** — user must approve the naming.
3. **Sets before tokens** — tokens can only be added to a set. Create the set with `catalog.addSet({ name })` first, then `set.addToken(...)`.
4. **Primitives before semantics** — semantic tokens use `{expression}` syntax referencing primitives. Create primitives first or expressions will fail.
5. **Themes last** — themes reference existing sets via `theme.addSet(set)`. Create the sets before attaching them to a theme.
6. **Correct token types** — use camelCase, plural where the API uses plurals: `borderRadius`, `fontSizes`, `fontWeights`, `fontFamilies`, `letterSpacing`, `textDecoration`, `textCase`. Never kebab-case.
7. **One token per unique visual role** — if two shapes have the same hex but different semantic roles (one is bg, one is a brand color), create two semantic tokens pointing to the same primitive.
8. **Idempotency** — check if a set / token / theme already exists before creating. Skip if it does.
9. **Never parallelize `execute_code` calls** — Penpot state mutations must be strictly sequential.
10. **Validate after each batch** — read `catalog.sets[]` / `catalog.themes[]` after creation to confirm everything exists. Export a bound shape after application to visually confirm.
11. **Return IDs** from every `execute_code` call — track them in the state ledger.
12. **Token binding is async** — `shape.applyToken(...)` settles after ~100ms. Do not immediately read the resolved value in the same call.

---

## 9. State Management

Write the state ledger to disk at phase boundaries:

```
/tmp/infer-tokens-state-{RUN_ID}.json
```

Structure:
```json
{
  "runId": "infer-tokens-001",
  "phase": "phase2",
  "pageId": "page-id-...",
  "extractedValues": {
    "colors": [{ "hex": "#3B82F6", "count": 12, "shapeIds": ["..."] }],
    "radii": [4, 8, 16],
    "spacings": [8, 16, 24],
    "fonts": [{ "fontFamily": "Inter", "fontSize": 16, "fontWeight": 400 }]
  },
  "plan": {
    "sets": [
      { "name": "primitives",  "tokens": [ /* { type, name, value } */ ] },
      { "name": "color/light", "tokens": [ /* semantic tokens */ ] }
    ],
    "themes": [
      { "group": "Mode", "name": "Light", "activeSetNames": ["primitives", "color/light"] }
    ]
  },
  "createdSetIds":   { "primitives": "set-id-...", "color/light": "set-id-..." },
  "createdTokenIds": { "color.blue.500": "token-id-...", "color.bg.primary": "token-id-..." },
  "createdThemeIds": { "Mode/Light": "theme-id-..." },
  "appliedShapeIds": ["shape-id-..."],
  "completedPhases": ["phase0", "phase1"]
}
```

---

## 10. Anti-Patterns

- ❌ Creating tokens without user approval of the naming plan
- ❌ Calling `catalog.createToken(...)` — not an API. Use `catalog.addSet(...)` then `set.addToken(...)`
- ❌ Creating tokens without first creating a Set — tokens have nowhere to live
- ❌ Using kebab-case token types (`'border-radius'`, `'font-size'`) — the API rejects them. Use `'borderRadius'`, `'fontSizes'`, `'fontWeights'`, `'fontFamilies'`.
- ❌ Skipping themes — without themes, users can't switch between light/dark or brand variants. Themes are how the token system is navigated in the UI.
- ❌ Applying primitive tokens directly to shapes (always use semantic tokens)
- ❌ Creating semantic tokens before the primitives they reference
- ❌ Hardcoding values in semantic tokens instead of using `{expression}` syntax
- ❌ Using `shape.layout.gap` / `shape.layout.padding` during inspection — not real properties. Use `shape.flex.rowGap` / `shape.flex.topPadding` etc., or `shape.grid.*`.
- ❌ Using `fillColorRefId` indirection for token binding — the canonical API is `shape.applyToken(token, ['fill'])`
- ❌ Skipping idempotency checks (re-running creates duplicates)
- ❌ Renaming existing tokens that shapes are already bound to (silently breaks bindings)
- ❌ Inferring tokens from only one layer — always traverse the full shape tree
- ❌ Guessing token IDs — always read from the TokenCatalog or state ledger

---

## 11. Supporting Files

### References

| File | Read during |
|------|------------|
| `references/01-inspection-phase.md` | Phase 0 — shape traversal, value extraction, clustering |
| `references/02-token-inference.md` | Phase 1 — naming rules, taxonomy patterns, color clustering |
| `references/03-token-application.md` | Phase 3 — token binding, fillColorRefId, text bindings |
| `references/04-error-recovery.md` | On any error — partial state, retry patterns |

### Scripts

| Script | Use for |
|--------|---------|
| `scripts/inspectDesignValues.js` | Phase 0 — extract all unique visual values + existing sets/themes/tokens from the page |
| `scripts/createInferredTokens.js` | Phase 2 — idempotently create Sets, add Tokens (primitives + semantic), and create Themes with active-set attachments |
| `scripts/applyTokensToShapes.js` | Phase 3 — bind semantic tokens to matching shapes via `shape.applyToken(token, properties)` |

> Phase 1 (inference / naming) runs entirely in Claude's context — no script needed.
> It produces the `PLAN` structure that gets pasted into `createInferredTokens.js`.
