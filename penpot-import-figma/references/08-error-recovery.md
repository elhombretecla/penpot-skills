# Error Recovery

Protocols for handling errors, incomplete sessions, and unexpected Penpot state during a Figma migration.

---

## Error Response Protocol

When any `execute_code` call fails:

1. **STOP** — do not retry blindly
2. **Read the error** carefully — the message usually tells you exactly what's wrong
3. **Inspect current state** with `high_level_overview` or a read-only `execute_code`
4. **Fix the root cause** — then retry with the corrected script
5. **If still unclear**: call `penpot_api_info` to verify the API signature

Failed `execute_code` calls are atomic — if an error occurs mid-script, nothing is created (Penpot rolls back the transaction). Always verify with `high_level_overview` before assuming a partial write occurred.

---

## Common Error Types and Fixes

### "Cannot read property X of null/undefined"

**Cause**: Shape or component not found (wrong ID, wrong page context).

```typescript
// Bad: assumes shape exists
const shape = page.findShapes().find(s => s.id === WRAPPER_ID);
shape.appendChild(child); // crashes if not found

// Good: guard first
const shape = page.findShapes().find(s => s.id === WRAPPER_ID);
if (!shape) return { error: 'Shape not found', wantedId: WRAPPER_ID, hint: 'Check state ledger for correct ID' };
```

**Recovery**: Re-run the inspection query to find the actual ID:
```typescript
// Find wrapper by plugin data instead of ID
const candidates = page.findShapes().filter(s =>
  s.getSharedPluginData('figma-import', 'entity_type') === 'screen'
);
return candidates.map(s => ({ id: s.id, name: s.name }));
```

---

### Component creation fails silently (no ID returned)

**Cause**: `page.createComponent()` may not work on all Penpot versions, or the passed shape was already a component.

**Recovery**: Verify with a query:
```typescript
const library = penpot.library.local;
const recent = library.components.slice(-5);
return recent.map(c => ({ id: c.id, name: c.name }));
```

If the component appears in the list, creation succeeded — the return value was the issue. Update the state ledger with the ID from this query.

---

### "Font not found" or typography doesn't apply

**Cause**: The font family used in Figma is not installed in the Penpot instance.

**Detection**:
```typescript
// Check font availability before applying
const fonts = penpot.fonts;
const interFonts = fonts ? fonts.filter(f => f.family === 'Inter') : [];
return { interAvailable: interFonts.length > 0, total: fonts ? fonts.length : 0 };
```

**Recovery options:**
1. Use a system fallback font (e.g., `'Inter'` → `'Roboto'` or `'Open Sans'`)
2. Ask the user to install the required fonts in their Penpot instance
3. Record the gap: `{ type: 'font-unavailable', fontFamily: 'Inter', fallback: 'Roboto' }`

---

### Token alias expression doesn't resolve

**Cause**: Referenced primitive token doesn't exist yet, was created with a different name, or the expression syntax is wrong.

**Detection**:
```typescript
const catalog = penpot.library.local.tokens;
const expressionTokens = Object.values(catalog || {}).filter(t => t.value && t.value.startsWith('{'));
const issues = expressionTokens.filter(t => {
  const ref = t.value.slice(1, -1);
  return !Object.values(catalog).find(pt => pt.name === ref);
});
return { unresolvedAliases: issues.map(t => ({ name: t.name, value: t.value })) };
```

**Fix**: Create the missing primitive token, or correct the expression in the semantic token.

---

### VariantContainer frames stack at origin (0,0)

**Cause**: Variant frames were created but their position was not set after being added to the container.

**Fix**: Set explicit x/y on each variant frame:
```typescript
const container = page.findShapes().find(s => s.id === CONTAINER_ID);
if (!container) return { error: 'Container not found' };

const variantFrames = container.children || [];
const COL_WIDTH = 160;
const ROW_HEIGHT = 80;
const GAP = 24;
const COLS = 3;

variantFrames.forEach((frame, i) => {
  frame.x = container.x + (i % COLS) * (COL_WIDTH + GAP);
  frame.y = container.y + Math.floor(i / COLS) * (ROW_HEIGHT + GAP);
});

return { fixed: true, variantCount: variantFrames.length };
```

---

### Context truncation / session resume

When the conversation context is truncated (common in long migrations), re-establish state before continuing:

**Step 1**: Read the on-disk IR
```bash
cat /tmp/figma-import-ir-REPLACE_RUN_ID.json
```

**Step 2**: Inspect Penpot for tagged shapes
```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();
const tagged = shapes.filter(s => s.getSharedPluginData('figma-import', 'run_id') === 'REPLACE_RUN_ID');

return tagged.map(s => ({
  id: s.id,
  name: s.name,
  entityType: s.getSharedPluginData('figma-import', 'entity_type'),
  figmaId: s.getSharedPluginData('figma-import', 'figma_id'),
}));
```

**Step 3**: Call `high_level_overview` to get current file state

**Step 4**: Reconcile the IR with actual Penpot state:
- Update `penpotStatus: "created"` and `penpotId` for shapes found in Penpot
- Identify first entity still `penpotStatus: "pending"` → resume from there

**Continuation prompt to give the user:**
> "I'm resuming a Figma → Penpot migration. Run ID: {RUN_ID}. Load the `penpot-import-figma` skill and resume from the last completed step."

---

## Cleanup: Safe Removal of Migration Artifacts

If a migration run needs to be restarted from scratch:

```typescript
const page = penpot.currentPage;
const RUN_ID = 'REPLACE_WITH_RUN_ID';

// DRY RUN FIRST — see what would be removed
const shapes = page.findShapes();
const taggedShapes = shapes.filter(s => s.getSharedPluginData('figma-import', 'run_id') === RUN_ID);

return {
  dryRun: true,
  wouldRemove: taggedShapes.length,
  shapes: taggedShapes.map(s => ({ id: s.id, name: s.name, type: s.type })),
  message: 'Review this list, then run with dryRun=false to confirm deletion',
};

// ACTUAL DELETION (only after dry run confirmed by user)
// const DRY_RUN = false; // change to false to confirm
// if (!DRY_RUN) {
//   for (const s of taggedShapes) { s.remove(); }
//   return { removed: taggedShapes.length };
// }
```

**Never clean up without a dry run confirmed by the user.** Tagged shapes may include work the user wants to keep even if the run was partial.

---

## Recovery Anti-Patterns

- ❌ Retrying a failed `execute_code` without reading the error
- ❌ Assuming a partial write occurred when `execute_code` errored — always verify
- ❌ Deleting shapes without a dry run and user confirmation
- ❌ Rebuilding entire components because one variant frame was wrong — fix the specific variant
- ❌ Skipping the on-disk state file and relying on memory after a long session
- ❌ Using name-based cleanup (risks removing user-owned shapes with similar names)
