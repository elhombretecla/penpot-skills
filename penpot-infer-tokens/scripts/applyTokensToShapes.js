/**
 * applyTokensToShapes.js
 *
 * Phase 3 — Bind semantic library colors to shapes whose fill matches the color value.
 * Processes shapes in the current page. Run in batches (adjust BATCH_START / BATCH_END).
 *
 * Prerequisites:
 *   - Library colors must exist (created after semantic tokens in Phase 2)
 *   - COLOR_MAP must map hex values to library color names (from Phase 1 approved plan)
 *
 * Usage: replace COLOR_MAP and batch indices, then paste into execute_code.
 *
 * ⚠️  Skips shapes that already have fillColorRefId bindings.
 * ⚠️  Skips main component shapes (they cannot be mutated in MCP context).
 */

// ── REPLACE: hex value → library color name (slash-separated, as created in library) ──
const COLOR_MAP = {
  '#3b82f6': 'color/brand/primary',
  '#1d4ed8': 'color/brand/hover',
  '#f9fafb': 'color/bg/surface',
  '#111827': 'color/text/primary',
  '#ffffff': 'color/bg/primary',
};

// Process shapes in batches to avoid timeouts
const BATCH_START = 0;   // ← increment by 50 for each call
const BATCH_END = 50;    // ← BATCH_START + 50
const RUN_ID = 'infer-tokens-REPLACE-ME';
// ──────────────────────────────────────────────────────────────────────────────

const page = penpot.currentPage;
const library = penpot.library.local;
const allShapes = page.findShapes();
const batch = allShapes.slice(BATCH_START, BATCH_END);

// Build lookup: color name → library color object
const colorsByName = new Map(library.colors.map(c => [c.name, c]));

const applied = [];
const skipped = [];
const errors = [];

for (const shape of batch) {
  if (!shape.fills || shape.fills.length === 0) {
    skipped.push({ id: shape.id, reason: 'no fills' });
    continue;
  }

  // Skip main component shapes
  if (shape.isMainComponent) {
    skipped.push({ id: shape.id, name: shape.name, reason: 'main component' });
    continue;
  }

  // Skip already-bound shapes
  const alreadyBound = shape.fills.some(f => f.fillColorRefId);
  if (alreadyBound) {
    skipped.push({ id: shape.id, name: shape.name, reason: 'already bound' });
    continue;
  }

  const newFills = shape.fills.map(fill => {
    if (fill.fillType !== 'solid' || !fill.fillColor) return fill;

    const colorName = COLOR_MAP[fill.fillColor.toLowerCase()];
    if (!colorName) return fill;

    const libraryColor = colorsByName.get(colorName);
    if (!libraryColor) return fill;

    return {
      fillType: 'solid',
      fillColor: libraryColor.color,
      fillOpacity: libraryColor.opacity ?? 1,
      fillColorRefId: libraryColor.id,
      fillColorRefFileId: libraryColor.fileId,
    };
  });

  // Check if any fill was actually changed
  const changed = newFills.some((f, i) => f.fillColorRefId && !shape.fills[i].fillColorRefId);
  if (!changed) {
    skipped.push({ id: shape.id, name: shape.name, reason: 'no matching color in map' });
    continue;
  }

  try {
    shape.fills = newFills;
    applied.push({ id: shape.id, name: shape.name });
  } catch (e) {
    errors.push({ id: shape.id, name: shape.name, error: e.message });
  }
}

return {
  runId: RUN_ID,
  batchRange: `${BATCH_START}–${BATCH_END}`,
  totalInBatch: batch.length,
  appliedCount: applied.length,
  skippedCount: skipped.length,
  errorCount: errors.length,
  applied,
  errors,
  progress: `${BATCH_END} / ${allShapes.length} total shapes processed`,
};
