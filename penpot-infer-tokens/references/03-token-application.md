# Phase 3: Token Application — Binding Tokens to Shapes

After tokens are created and approved, bind semantic tokens back to the shapes that use the corresponding values.

---

## What "Applying a Token" Means

In Penpot, binding a fill to a library color makes the shape's fill reference the library color by ID. This means:
- The shape's fill visually stays the same (same hex)
- The fill is now linked to the library color via `fillColorRefId`
- If the library color changes, the shape's fill updates automatically

For the token binding to work properly, you must **also create a library color** for each semantic token (as described in `penpot-generate-library/references/02-token-creation.md`). Tokens alone (TokenCatalog) do not bind to fills — you need the library color.

---

## Binding Fill Colors

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();
const library = penpot.library.local;

// REPLACE WITH ACTUAL MAP: hex value → semantic library color name
const COLOR_MAP = {
  '#3b82f6': 'color/brand/primary',
  '#111827': 'color/text/primary',
  '#ffffff': 'color/bg/primary',
  '#f9fafb': 'color/bg/surface',
};

// Build a lookup from library color name → color object
const colorsByName = new Map(library.colors.map(c => [c.name, c]));

const applied = [];
const skipped = [];
const errors = [];

for (const shape of shapes) {
  if (!shape.fills) continue;

  // Skip shapes that already have token bindings
  const alreadyBound = shape.fills.some(f => f.fillColorRefId);
  if (alreadyBound) {
    skipped.push({ id: shape.id, name: shape.name, reason: 'already bound' });
    continue;
  }

  const newFills = [...shape.fills];
  let changed = false;

  for (let i = 0; i < newFills.length; i++) {
    const fill = newFills[i];
    if (fill.fillType !== 'solid' || !fill.fillColor) continue;

    const colorName = COLOR_MAP[fill.fillColor.toLowerCase()];
    if (!colorName) continue;

    const libraryColor = colorsByName.get(colorName);
    if (!libraryColor) continue;

    newFills[i] = {
      fillType: 'solid',
      fillColor: libraryColor.color,
      fillOpacity: libraryColor.opacity ?? 1,
      fillColorRefId: libraryColor.id,
      fillColorRefFileId: libraryColor.fileId,
    };
    changed = true;
  }

  if (changed) {
    try {
      shape.fills = newFills;
      applied.push({ id: shape.id, name: shape.name });
    } catch (e) {
      errors.push({ id: shape.id, name: shape.name, error: e.message });
    }
  }
}

return {
  appliedCount: applied.length,
  skippedCount: skipped.length,
  errorCount: errors.length,
  applied,
  errors,
};
```

---

## Binding Border Radius

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

// REPLACE WITH ACTUAL MAP: pixel value → token name
// Note: Penpot may not yet support programmatic token binding to borderRadius via the Plugin API.
// Verify with penpot_api_info({ type: 'Shape' }) before using.
// If token binding isn't available, set the raw value using shape.borderRadius = N
const RADIUS_MAP = {
  4: 4,    // radius.sm
  8: 8,    // radius.md
  12: 12,  // radius.lg
  9999: 9999, // radius.full
};

const applied = [];

for (const shape of shapes) {
  if (shape.borderRadius === undefined || shape.borderRadius === null) continue;

  const normalized = RADIUS_MAP[shape.borderRadius];
  if (normalized !== undefined && normalized !== shape.borderRadius) {
    shape.borderRadius = normalized;
    applied.push({ id: shape.id, name: shape.name, radius: normalized });
  }
}

return { appliedCount: applied.length, applied };
```

---

## Application Order

Apply bindings in this order to avoid interference:

1. **Fill colors** (most shapes, highest impact)
2. **Stroke colors** (same pattern as fills, use `strokeColorRefId`)
3. **Border radius** (normalize to token scale values)
4. **Text font size** (bind to font.size tokens — verify API availability)

---

## Batch Size

Process shapes in batches of 50 per `execute_code` call to avoid timeout. Return applied IDs and track progress in the state ledger.

---

## Validation After Application

After each batch, spot-check bindings:

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

// Check a sample of shapes
const sample = shapes.slice(0, 20);
const bindings = sample
  .filter(s => s.fills && s.fills.some(f => f.fillColorRefId))
  .map(s => ({
    id: s.id,
    name: s.name,
    fillRefId: s.fills.find(f => f.fillColorRefId)?.fillColorRefId,
  }));

const unbound = sample
  .filter(s => s.fills && s.fills.some(f => !f.fillColorRefId && f.fillType === 'solid' && f.fillColor))
  .map(s => ({ id: s.id, name: s.name }));

return { boundCount: bindings.length, unboundCount: unbound.length, unbound };
```

---

## Limitations

- **Text token binding**: Penpot may not expose a direct API to bind `font-size` tokens to text node properties via Plugin API. Verify with `penpot_api_info({ type: 'Text' })`. If unavailable, only set the raw value and document the manual binding needed.
- **Gradient fills**: Token binding only works for `solid` fills. Gradient fills with color stops cannot be token-bound via the Plugin API.
- **Stroke token binding**: Check `penpot_api_info({ type: 'Stroke' })` for `strokeColorRefId` availability. Follow the same pattern as fill binding if available.
