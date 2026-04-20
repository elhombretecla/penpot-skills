# Phase 2: Renaming Strategy

Executing the approved rename plan safely and efficiently.

---

## Batch Strategy

Rename in parent-before-children order. Since `findShapes()` returns shapes in layer order (parents first), process them in that order.

**Batch size**: up to 100 renames per `execute_code` call. The rename operation is cheap (just setting `shape.name`), so larger batches are fine.

---

## Renaming Component Instances

When a shape is a component instance (`shape.componentId` is set), renaming `shape.name` only overrides the instance name — it does NOT rename the master component. This is usually fine for handoff purposes.

However, note in the rename plan: "⚠️ This is a component instance. Renaming here only affects this instance. To rename all instances, rename the master component."

---

## Preserving Layers the User Didn't Ask to Rename

Only rename layers that:
1. Are auto-generated (`Frame N`, `Rectangle N`, etc.)
2. Are explicitly in the user-approved rename map

Never rename:
- Component main shapes
- Layers the user marked as "keep as is"
- Layers already following the naming convention

---

## Validation After Renaming

After each batch of renames, call `export_shape` on the parent frame to visually confirm the rename did not break layout. Also call `high_level_overview` to see the updated layer tree.

```typescript
// Spot-check: verify a sample of renamed shapes
const page = penpot.currentPage;
const shapes = page.findShapes();

// REPLACE_WITH_EXPECTED_MAP: { shapeId → expectedName }
const EXPECTED = {
  'SHAPE_ID_1': 'header',
  'SHAPE_ID_2': 'nav',
};

const results = Object.entries(EXPECTED).map(([id, expectedName]) => {
  const shape = shapes.find(s => s.id === id);
  return {
    id,
    expectedName,
    actualName: shape ? shape.name : 'NOT FOUND',
    ok: shape ? shape.name === expectedName : false,
  };
});

return { results, allOk: results.every(r => r.ok) };
```

---

## Undo Guidance

The Plugin API does not expose an undo API. If renames need to be undone:
1. The state ledger at `/tmp/rename-layers-state-{RUN_ID}.json` contains the `old → new` map.
2. Provide the user a script that inverts the map (new → old) and re-runs the rename.
3. Alternatively, the user can use Penpot's built-in Ctrl+Z undo.
