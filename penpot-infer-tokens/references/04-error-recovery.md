# Error Recovery — penpot-infer-tokens

---

## Common Errors and Fixes

### TokenCatalog not available

**Error**: `penpot.library.local.tokens` is `undefined` or `null`

**Fix**:
1. Call `penpot_api_info({ type: 'Library' })` and `penpot_api_info({ type: 'TokenCatalog' })` to confirm the API is present in this Penpot version.
2. If the API is unavailable in the current build, fall back to creating library colors only (`library.createColor()`) and document that the token layer cannot be populated in this file.

---

### `catalog.createToken is not a function`

**Cause**: The older scripts used `catalog.createToken(...)` — that method does not exist.

**Fix**: Tokens must be added to a **Set**:
```typescript
const set = catalog.addSet({ name: 'primitives' });      // or reuse existing: catalog.sets.find(...)
set.addToken({ type: 'color', name: 'color.blue.500', value: '#3B82F6' });
```

---

### `set.addToken` rejects the token / token type not recognised

**Cause**: Wrong `type` string. Common mistakes:
- `'border-radius'` → should be `'borderRadius'`
- `'font-size'`     → should be `'fontSizes'`   (plural)
- `'font-weight'`   → should be `'fontWeights'` (plural)
- `'font-family'`   → should be `'fontFamilies'` (plural)
- `'letter-spacing'`→ should be `'letterSpacing'`
- Anything kebab-case in general — the API uses camelCase.

Valid values: `"color" | "dimension" | "spacing" | "typography" | "shadow" | "opacity" | "borderRadius" | "borderWidth" | "fontWeights" | "fontSizes" | "fontFamilies" | "letterSpacing" | "textDecoration" | "textCase"`.

---

### Token created but doesn't appear in the Tokens panel

**Cause**: No theme is active, or the set the token is in is not attached to any active theme.

**Fix**: Make sure the set is attached to a theme:
```typescript
const theme = catalog.themes.find(t => t.group === 'Mode' && t.name === 'Light')
           || catalog.addTheme({ group: 'Mode', name: 'Light' });
const set = catalog.sets.find(s => s.name === 'primitives');
if (!theme.activeSets.includes(set)) theme.addSet(set);
if (!theme.active) theme.toggleActive();
```

Alternatively, activate the set directly: `if (!set.active) set.toggleActive();` — but note this puts the catalog into a "custom" state (all themes disabled). Prefer theme activation.

---

### Expression reference fails (broken alias)

**Error**: Semantic token value `{color.blue.500}` fails — referenced token does not exist or is not in an active set.

**Fix**:
1. Primitives must be created before semantics. If the PLAN in `createInferredTokens.js` orders the primitive set first, the script handles this correctly.
2. The referenced token must exist in an **active** set in the current theme. Check that `theme.activeSets` includes the primitives set.
3. Use `penpotUtils.findTokenByName('color.blue.500')` to verify the token is discoverable.

---

### Shape token binding fails

**Error**: `shape.applyToken is not a function` or `Cannot read properties of undefined`

**Fix**:
1. Confirm the shape is a real `Shape` — `penpot.root` is the page root and behaves differently.
2. Some shapes may be inside a component main (`shape.isMainComponent === true`). Component main shapes cannot be directly mutated via Plugin API in MCP context. Skip them.
3. Confirm the `token` argument is a real Token from the catalog — if `penpotUtils.findTokenByName(...)` returned `null`, you're passing `null` to `applyToken`.

---

### Token applied but shape's resolved value didn't update

**Symptom**: `shape.applyToken(token, ['fill'])` returned without error, but on immediate inspection the fill still shows the raw hex.

**Cause**: Token application is **asynchronous**. The resolved value settles after ~100ms.

**Fix**: Either wait (`await new Promise(r => setTimeout(r, 150))`) before reading back, or verify in a subsequent `execute_code` call. For validation, read `shape.tokens` (the binding map) — that updates synchronously once the call returns.

---

### Spacing / padding not detected during inspection

**Symptom**: `inspectDesignValues.js` returns `spacings: []` even though the design clearly uses flex with gaps.

**Cause**: Older versions of the script read `shape.layout.gap` / `shape.layout.padding` — these are not real properties in the current Penpot API.

**Fix**: The real properties are on `shape.flex` and `shape.grid`:
```typescript
shape.flex.rowGap
shape.flex.columnGap
shape.flex.topPadding
shape.flex.rightPadding
shape.flex.bottomPadding
shape.flex.leftPadding
shape.grid.rowGap
shape.grid.columnGap
```

The updated `inspectDesignValues.js` already uses these. If you still see empty spacings, check that the frames are actual flex/grid containers (`if (shape.flex) { … }`) — a board without `addFlexLayout()` has no `flex` property.

---

## Partial Recovery

If the skill fails mid-phase, read the state ledger at `/tmp/infer-tokens-state-{RUN_ID}.json` and the current TokenCatalog to reconstruct which sets/tokens/themes were created. Resume from the last completed phase.

```typescript
const catalog = penpot.library.local.tokens;
if (!catalog) return { error: 'No catalog' };

const sets = catalog.sets.map(s => ({
  id: s.id, name: s.name, active: s.active,
  tokens: s.tokens.map(t => ({ name: t.name, type: t.type, value: t.value })),
}));
const themes = catalog.themes.map(t => ({
  id: t.id, group: t.group, name: t.name, active: t.active,
  activeSets: t.activeSets.map(s => s.name),
}));

return { sets, themes };
```
