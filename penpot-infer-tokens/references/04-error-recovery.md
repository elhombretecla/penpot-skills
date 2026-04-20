# Error Recovery — penpot-infer-tokens

---

## Common Errors and Fixes

### TokenCatalog not available

**Error**: `penpot.library.local.tokens` is `undefined` or `null`

**Fix**:
1. Call `penpot_api_info({ type: 'LibraryLocal' })` to see the exact shape of the library object.
2. The tokens API path may differ between Penpot versions. Try `penpot.library.local.tokenSets` or `penpot.library.local.tokenThemes` as alternatives.
3. If the API is unavailable in the current Penpot version, fall back to creating only library colors (skip TokenCatalog tokens).

---

### Token creation fails with "duplicate name"

**Error**: Token already exists with the same name

**Fix**: The idempotency check in `createInferredTokens.js` should prevent this. If it still occurs, the token was likely created in a previous partial run. Query the catalog, find the existing token ID, add it to the state ledger, and skip creation.

---

### Expression reference fails (broken alias)

**Error**: Semantic token value `{color.blue.500}` fails — referenced token does not exist

**Fix**: Primitives must be created before semantics. Check that all tokens referenced in expressions exist in the catalog. If a primitive is missing, create it first.

---

### Shape fill binding fails

**Error**: `Cannot set property fills of ...` or similar

**Fix**:
1. Some shapes may be inside a component main. Component main shapes cannot be directly modified via Plugin API in MCP context.
2. Detect component shapes: `if (shape.isMainComponent) skip`.
3. Apply bindings only to non-component shapes.

---

### fillColorRefId not persisting

**Symptom**: Binding appears successful in `execute_code` return, but on next inspection `fillColorRefId` is not present.

**Fix**: Verify the library color `fileId` is correct. `fillColorRefFileId` must match `penpot.currentFile.id` for local colors. Re-read the library color after creation to confirm its `fileId`.

---

## Partial Recovery

If the skill fails mid-phase, read the state ledger at `/tmp/infer-tokens-state-{RUN_ID}.json` and the current TokenCatalog to reconstruct which tokens were created. Resume from the last completed phase.

```typescript
const catalog = penpot.library.local.tokens;
const existing = catalog ? Object.values(catalog) : [];
return {
  existingCount: existing.length,
  tokens: existing.map(t => ({ id: t.id, name: t.name, type: t.type })),
};
```
