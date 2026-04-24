# Phase 0: Inspection — Extracting Visual Values

This phase traverses the full shape tree and collects every unique visual value. No writes occur here.

---

## Traversal Strategy

Always call `high_level_overview` first to understand the file structure. Then use `execute_code` to traverse `penpot.currentPage.findShapes()` which returns a flat list of ALL shapes on the current page, including deeply nested children.

**Traversal order**: `findShapes()` returns shapes in layer order (top-level first, then children). Do not try to traverse recursively — `findShapes()` already flattens the tree.

---

## Complete Inspection Script

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

// Accumulators
const colorUsage = new Map();   // hex → { count, shapeIds, roles: Set }
const radiiValues = new Map();  // value → { count, shapeIds }
const spacings = new Map();     // value → { count, sources }
const fontCombos = new Map();   // "family|size|weight" → { count, details }
const shadowValues = [];

for (const shape of shapes) {
  // === FILL COLORS ===
  if (shape.fills) {
    for (const fill of shape.fills) {
      if (fill.fillType === 'solid' && fill.fillColor) {
        const hex = fill.fillColor.toLowerCase();
        if (!colorUsage.has(hex)) colorUsage.set(hex, { count: 0, shapeIds: [], roles: new Set() });
        const entry = colorUsage.get(hex);
        entry.count++;
        entry.shapeIds.push(shape.id);
        // Infer role from shape context
        if (shape.type === 'text') entry.roles.add('text-fill');
        else if (shape.width > 300) entry.roles.add('background');
        else entry.roles.add('element-fill');
      }
    }
  }

  // === STROKE COLORS ===
  if (shape.strokes) {
    for (const stroke of shape.strokes) {
      if (stroke.strokeColor) {
        const hex = stroke.strokeColor.toLowerCase();
        if (!colorUsage.has(hex)) colorUsage.set(hex, { count: 0, shapeIds: [], roles: new Set() });
        colorUsage.get(hex).count++;
        colorUsage.get(hex).shapeIds.push(shape.id);
        colorUsage.get(hex).roles.add('stroke');
      }
    }
  }

  // === BORDER RADIUS ===
  if (shape.borderRadius !== undefined && shape.borderRadius !== null && shape.borderRadius > 0) {
    const r = shape.borderRadius;
    if (!radiiValues.has(r)) radiiValues.set(r, { count: 0, shapeIds: [] });
    radiiValues.get(r).count++;
    radiiValues.get(r).shapeIds.push(shape.id);
  }

  // === TYPOGRAPHY ===
  if (shape.type === 'text' && shape.fontSize) {
    const key = `${shape.fontFamily || 'unknown'}|${shape.fontSize}|${shape.fontWeight || 400}`;
    if (!fontCombos.has(key)) {
      fontCombos.set(key, {
        count: 0,
        shapeIds: [],
        fontFamily: shape.fontFamily,
        fontSize: shape.fontSize,
        fontWeight: shape.fontWeight,
        lineHeight: shape.lineHeight,
        letterSpacing: shape.letterSpacing,
      });
    }
    fontCombos.get(key).count++;
    fontCombos.get(key).shapeIds.push(shape.id);
  }

  // === SPACING (from flex / grid containers) ===
  // The real Penpot API exposes layouts at shape.flex and shape.grid.
  // There is no `shape.layout` property — using it returns undefined and
  // silently produces an empty spacings inventory.
  const addSpacing = (val, source) => {
    if (!val || val === 0) return;
    if (!spacings.has(val)) spacings.set(val, { count: 0, sources: [] });
    spacings.get(val).count++;
    spacings.get(val).sources.push({ shapeId: shape.id, source });
  };

  if (shape.flex) {
    addSpacing(shape.flex.rowGap,        'flex.rowGap');
    addSpacing(shape.flex.columnGap,     'flex.columnGap');
    addSpacing(shape.flex.topPadding,    'flex.paddingTop');
    addSpacing(shape.flex.rightPadding,  'flex.paddingRight');
    addSpacing(shape.flex.bottomPadding, 'flex.paddingBottom');
    addSpacing(shape.flex.leftPadding,   'flex.paddingLeft');
  }
  if (shape.grid) {
    addSpacing(shape.grid.rowGap,    'grid.rowGap');
    addSpacing(shape.grid.columnGap, 'grid.columnGap');
  }
}

return {
  totalShapes: shapes.length,
  colors: [...colorUsage.entries()]
    .map(([hex, v]) => ({ hex, count: v.count, roles: [...v.roles], shapeIds: v.shapeIds.slice(0, 3) }))
    .sort((a, b) => b.count - a.count),
  radii: [...radiiValues.entries()]
    .map(([value, v]) => ({ value, count: v.count }))
    .sort((a, b) => a.value - b.value),
  spacings: [...spacings.entries()]
    .map(([value, v]) => ({ value, count: v.count }))
    .sort((a, b) => a.value - b.value),
  fonts: [...fontCombos.values()]
    .sort((a, b) => b.count - a.count),
};
```

---

## Reading Results

After running the above script, you will have a raw inventory. Present it to the user as a summary:

```
Found N unique colors across X shapes
Found Y unique border-radius values
Found Z unique spacing values from flex layouts
Found W unique font combinations
```

Then proceed to Phase 1 to map these raw values to a token taxonomy.

---

## Handling Missing Data

- **No flex layouts found** (spacings = empty): The design may use fixed position layout. In this case, skip spacing token inference or ask the user to provide the spacing scale manually.
- **No fills found**: Shapes may use strokes only. Proceed with stroke colors.
- **No typography found**: All text may be inside components. Inspect component pages if available.
- **TokenCatalog already has sets/tokens**: read `catalog.sets[].tokens[]` and `catalog.themes[]`. If a matching semantic set already exists, skip Phase 2 creation for those tokens (let the idempotency check in `createInferredTokens.js` handle it) and go straight to Phase 3 application for any shapes that aren't bound yet.
