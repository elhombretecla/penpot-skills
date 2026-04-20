/**
 * renameLayer.js
 *
 * Phase 2 — Apply the approved rename map to shapes via execute_code.
 * Processes shapes in the current page. Run after user approves the rename plan.
 *
 * IMPORTANT: Replace RENAME_MAP with the approved plan from Phase 1.
 * Keys are shape IDs, values are the new semantic names.
 *
 * Idempotent: if a shape already has the target name, it is skipped.
 * Safe: skips main component shapes and already-semantic names.
 *
 * Usage: paste into execute_code. For large rename sets, split into batches of 100.
 */

// ── REPLACE: shape ID → new semantic name (from approved Phase 1 plan) ───────
const RENAME_MAP = {
  'SHAPE_ID_1': 'header',
  'SHAPE_ID_2': 'header > nav',
  'SHAPE_ID_3': 'button-cta',
  'SHAPE_ID_4': 'h1-headline',
  'SHAPE_ID_5': 'p-subheadline',
  // ... full approved list
};

const RUN_ID = 'rename-layers-REPLACE-ME';
// ──────────────────────────────────────────────────────────────────────────────

const page = penpot.currentPage;
const shapes = page.findShapes();

// Build lookup by ID for O(1) access
const shapesById = new Map(shapes.map(s => [s.id, s]));

const renamed = [];
const skipped = [];
const errors = [];

for (const [shapeId, newName] of Object.entries(RENAME_MAP)) {
  const shape = shapesById.get(shapeId);

  if (!shape) {
    errors.push({ id: shapeId, error: 'Shape not found on current page' });
    continue;
  }

  // Skip main component shapes
  if (shape.isMainComponent) {
    skipped.push({ id: shapeId, name: shape.name, reason: 'main component — rename in component editor' });
    continue;
  }

  // Skip if already renamed
  if (shape.name === newName) {
    skipped.push({ id: shapeId, name: shape.name, reason: 'already has target name' });
    continue;
  }

  try {
    const oldName = shape.name;
    shape.name = newName;
    renamed.push({ id: shapeId, oldName, newName });
  } catch (e) {
    errors.push({ id: shapeId, oldName: shape.name, newName, error: e.message });
  }
}

return {
  runId: RUN_ID,
  renamedCount: renamed.length,
  skippedCount: skipped.length,
  errorCount: errors.length,
  renamed,
  skipped,
  errors,
};
