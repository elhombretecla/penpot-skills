/**
 * validateFidelity.js
 *
 * Phase 5 — Final fidelity audit of a migrated design.
 * PASTE INTO execute_code to run the full audit.
 *
 * Checks:
 *   1. Hardcoded fills (shapes not bound to library colors)
 *   2. Unbound text nodes (no typography reference)
 *   3. Orphan component instances (componentId not in local library)
 *   4. Empty frames (no children, no fill)
 *   5. Generic/unnamed nodes
 *   6. Shapes NOT tagged with figma-import plugin data (may be orphans)
 *   7. Token summary (counts vs. expected from IR)
 *
 * Returns a structured audit report.
 *
 * ⚠️  Replace RUN_ID and EXPECTED_COUNTS before running.
 */

const page = penpot.currentPage;
const library = penpot.library.local;

const RUN_ID = 'REPLACE_WITH_RUN_ID';

// Expected counts from the IR (replace with actual IR values)
const EXPECTED_COUNTS = {
  tokens: 47,
  libraryColors: 32,
  typographies: 14,
  components: 15,
};

const allShapes = page.findShapes();
const issues = [];

// ── 1. Hardcoded color fills ──────────────────────────────────────────────────

const shapesWithHardcoded = allShapes.filter(s => {
  if (!s.fills || s.fills.length === 0) return false;
  return s.fills.some(f =>
    f.fillType === 'solid' &&
    !f.fillColorRefId &&
    f.fillColor !== '#FFFFFF' &&
    f.fillColor !== undefined
  );
});

if (shapesWithHardcoded.length > 0) {
  issues.push({
    type: 'hardcoded-fill',
    severity: 'warning',
    count: shapesWithHardcoded.length,
    message: `${shapesWithHardcoded.length} shapes with unbound (hardcoded) fills`,
    shapes: shapesWithHardcoded.slice(0, 10).map(s => ({
      id: s.id,
      name: s.name,
      fill: s.fills.find(f => !f.fillColorRefId)?.fillColor,
    })),
  });
}

// ── 2. Unbound text nodes ─────────────────────────────────────────────────────

const allText = allShapes.filter(s => s.type === 'text');
const unboundText = allText.filter(s => !s.typographyRefId);

// Allow some unbound text (labels, one-off overrides), flag if > threshold
const TEXT_BINDING_THRESHOLD = 15;
if (unboundText.length > TEXT_BINDING_THRESHOLD) {
  issues.push({
    type: 'unbound-text',
    severity: 'info',
    count: unboundText.length,
    message: `${unboundText.length} text nodes without typography binding (threshold: ${TEXT_BINDING_THRESHOLD})`,
    note: 'Some unbound text is normal (component overrides, one-off labels)',
  });
}

// ── 3. Orphan component instances ─────────────────────────────────────────────

const instances = allShapes.filter(s => s.componentId);
const orphans = instances.filter(s => {
  const localMatch = library.components.find(c => c.id === s.componentId);
  return !localMatch;
});

if (orphans.length > 0) {
  issues.push({
    type: 'orphan-instance',
    severity: 'warning',
    count: orphans.length,
    message: `${orphans.length} component instances not linked to any local library component`,
    shapes: orphans.slice(0, 5).map(s => ({ id: s.id, name: s.name, componentId: s.componentId })),
  });
}

// ── 4. Empty frames ───────────────────────────────────────────────────────────

const emptyFrames = allShapes.filter(s => {
  if (s.type !== 'frame') return false;
  const hasChildren = s.children && s.children.length > 0;
  const hasFill = s.fills && s.fills.length > 0 && s.fills[0].fillColor;
  return !hasChildren && !hasFill;
});

if (emptyFrames.length > 0) {
  issues.push({
    type: 'empty-frame',
    severity: 'warning',
    count: emptyFrames.length,
    message: `${emptyFrames.length} empty frames (no children, no fill)`,
    shapes: emptyFrames.slice(0, 5).map(s => ({ id: s.id, name: s.name, x: s.x, y: s.y })),
  });
}

// ── 5. Generic/unnamed nodes ─────────────────────────────────────────────────

const GENERIC_NAMES = ['Frame', 'Rectangle', 'Group', 'Ellipse', 'Text', 'Line', 'Path', 'Vector'];
const unnamedOrGeneric = allShapes.filter(s =>
  !s.name || s.name.trim() === '' || GENERIC_NAMES.includes(s.name)
);

if (unnamedOrGeneric.length > 0) {
  issues.push({
    type: 'naming',
    severity: 'info',
    count: unnamedOrGeneric.length,
    message: `${unnamedOrGeneric.length} unnamed or generic-named nodes`,
    note: 'Rename these for better Penpot layer panel readability',
  });
}

// ── 6. Untagged shapes (potential orphans from failed scripts) ────────────────

const untaggedFrames = allShapes.filter(s =>
  s.type === 'frame' &&
  !s.getSharedPluginData('figma-import', 'run_id') &&
  !s.parentId // only top-level frames
);

if (untaggedFrames.length > 0) {
  issues.push({
    type: 'untagged',
    severity: 'info',
    count: untaggedFrames.length,
    message: `${untaggedFrames.length} top-level frames without figma-import plugin data tag`,
    note: 'These may be pre-existing content or partially migrated frames',
    shapes: untaggedFrames.map(s => ({ id: s.id, name: s.name })),
  });
}

// ── 7. Design system counts vs. expected ─────────────────────────────────────

const tokenCount = library.tokens ? Object.values(library.tokens).length : 0;
const colorCount = library.colors.length;
const typoCount = library.typographies.length;
const componentCount = library.components.length;

const countMismatches = [];
if (EXPECTED_COUNTS.tokens > 0 && tokenCount < EXPECTED_COUNTS.tokens) {
  countMismatches.push({ type: 'tokens', expected: EXPECTED_COUNTS.tokens, actual: tokenCount });
}
if (EXPECTED_COUNTS.libraryColors > 0 && colorCount < EXPECTED_COUNTS.libraryColors) {
  countMismatches.push({ type: 'libraryColors', expected: EXPECTED_COUNTS.libraryColors, actual: colorCount });
}
if (EXPECTED_COUNTS.typographies > 0 && typoCount < EXPECTED_COUNTS.typographies) {
  countMismatches.push({ type: 'typographies', expected: EXPECTED_COUNTS.typographies, actual: typoCount });
}
if (EXPECTED_COUNTS.components > 0 && componentCount < EXPECTED_COUNTS.components) {
  countMismatches.push({ type: 'components', expected: EXPECTED_COUNTS.components, actual: componentCount });
}

if (countMismatches.length > 0) {
  issues.push({
    type: 'count-mismatch',
    severity: 'error',
    count: countMismatches.length,
    message: `${countMismatches.length} design system asset counts below expected`,
    mismatches: countMismatches,
  });
}

// ── Summary ───────────────────────────────────────────────────────────────────

const errorCount = issues.filter(i => i.severity === 'error').length;
const warningCount = issues.filter(i => i.severity === 'warning').length;
const infoCount = issues.filter(i => i.severity === 'info').length;

return {
  runId: RUN_ID,
  auditPassed: errorCount === 0 && warningCount === 0,
  issueCount: issues.length,
  errorCount,
  warningCount,
  infoCount,
  issues,
  designSystem: {
    tokens: tokenCount,
    libraryColors: colorCount,
    typographies: typoCount,
    components: componentCount,
  },
  expected: EXPECTED_COUNTS,
  pageStats: {
    totalShapes: allShapes.length,
    frames: allShapes.filter(s => s.type === 'frame').length,
    textNodes: allText.length,
    componentInstances: instances.length,
  },
  conclusion: errorCount > 0
    ? `❌ Migration has ${errorCount} error(s) requiring attention before sign-off.`
    : warningCount > 0
    ? `⚠️  Migration complete with ${warningCount} warning(s). Review before sign-off.`
    : `✅  Migration audit passed. Ready for sign-off.`,
};
