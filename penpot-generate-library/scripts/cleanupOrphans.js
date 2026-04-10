/**
 * cleanupOrphans.js
 *
 * Safely removes shapes tagged with a specific dsb run_id from the current page.
 * Use this to clean up a failed or partial phase before retrying.
 *
 * Safety guarantees:
 * - Only removes shapes that have a matching 'dsb' / 'run_id' tag
 * - Never removes shapes by name pattern (avoids collateral damage)
 * - Removes deepest nodes first to avoid parent-deleted errors
 * - Optionally scoped to a specific phase or key prefix
 *
 * ⚠️  DESTRUCTIVE — this will permanently remove tagged shapes.
 *     Review the DRY RUN output before setting dryRun = false.
 */

const page = penpot.currentPage;

// ── Configuration ─────────────────────────────────────────────────────────────
// Replace these values before running.

const TARGET_RUN_ID = 'penpot-dsb-REPLACE-ME';   // ← required: run ID to clean
const SCOPE_PHASE = null;                          // ← optional: 'phase1', 'phase2', 'phase3', null = all phases
const SCOPE_KEY_PREFIX = null;                     // ← optional: 'component/button' to clean only button nodes
const DRY_RUN = true;                              // ← set to false to actually delete

// ── Utilities ────────────────────────────────────────────────────────────────

/**
 * Returns the depth of a node in the shape tree (root page children = depth 1).
 * @param {Object} shape
 * @returns {number}
 */
function getDepth(shape) {
  let depth = 0;
  let current = shape;
  while (current && current.parentId) {
    depth++;
    // In Penpot, parentId is available on shapes
    // We approximate depth by traversing parentId chain
    const parent = page.findShapes().find(s => s.id === current.parentId);
    if (!parent) break;
    current = parent;
    if (depth > 20) break; // Safety cap to avoid infinite loops
  }
  return depth;
}

// ── Find Shapes to Remove ─────────────────────────────────────────────────────

const allShapes = page.findShapes();

const candidates = allShapes.filter(shape => {
  const shapeRunId = shape.getSharedPluginData('dsb', 'run_id');
  if (shapeRunId !== TARGET_RUN_ID) return false;

  if (SCOPE_PHASE) {
    const shapePhase = shape.getSharedPluginData('dsb', 'phase');
    if (shapePhase !== SCOPE_PHASE) return false;
  }

  if (SCOPE_KEY_PREFIX) {
    const shapeKey = shape.getSharedPluginData('dsb', 'key') || '';
    if (!shapeKey.startsWith(SCOPE_KEY_PREFIX)) return false;
  }

  return true;
});

// ── Sort: Deepest First ───────────────────────────────────────────────────────
// Remove children before parents to avoid Penpot errors.

const candidatesWithDepth = candidates.map(s => ({
  shape: s,
  depth: getDepth(s),
  id: s.id,
  name: s.name,
  type: s.type,
  dsbKey: s.getSharedPluginData('dsb', 'key'),
  dsbPhase: s.getSharedPluginData('dsb', 'phase'),
}));

candidatesWithDepth.sort((a, b) => b.depth - a.depth);  // deepest first

// ── Dry Run Report ────────────────────────────────────────────────────────────

if (DRY_RUN) {
  return {
    dryRun: true,
    targetRunId: TARGET_RUN_ID,
    scopePhase: SCOPE_PHASE,
    scopeKeyPrefix: SCOPE_KEY_PREFIX,
    wouldRemove: candidatesWithDepth.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      depth: c.depth,
      dsbKey: c.dsbKey,
      dsbPhase: c.dsbPhase,
    })),
    count: candidatesWithDepth.length,
    message: `DRY RUN — ${candidatesWithDepth.length} shape(s) would be removed. ` +
             `Set DRY_RUN = false to execute.`,
  };
}

// ── Execute Removal ───────────────────────────────────────────────────────────

const removedIds = [];
const errors = [];

for (const { shape, id, name } of candidatesWithDepth) {
  try {
    shape.remove();
    removedIds.push({ id, name });
  } catch (e) {
    // Parent may have already been removed — that's OK
    if (e.message && e.message.includes('already removed')) {
      removedIds.push({ id, name, note: 'already removed (parent deleted first)' });
    } else {
      errors.push({ id, name, error: e.message });
    }
  }
}

return {
  dryRun: false,
  targetRunId: TARGET_RUN_ID,
  scopePhase: SCOPE_PHASE,
  scopeKeyPrefix: SCOPE_KEY_PREFIX,
  removedCount: removedIds.length,
  removedIds,
  errors,
  message: errors.length === 0
    ? `Successfully removed ${removedIds.length} shape(s).`
    : `Removed ${removedIds.length} shape(s) with ${errors.length} error(s). Review errors before proceeding.`,
};
