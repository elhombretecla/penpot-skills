/**
 * rehydrateState.js
 *
 * Reconstructs the design system build state map from the current Penpot file.
 * Run at session start, after context truncation, or when resuming an interrupted build.
 *
 * Scans all pages for shapes tagged with 'dsb' sharedPluginData,
 * then cross-references with tokens, library colors, typographies, components,
 * and pages to produce a complete { key → id } map.
 *
 * Pair with the on-disk state file: /tmp/dsb-penpot-state-{RUN_ID}.json
 * The on-disk file is authoritative for phase/step tracking;
 * this script is authoritative for live entity IDs.
 */

const library = penpot.library.local;

// ── Scan All Pages for DSB-Tagged Shapes ─────────────────────────────────────

const taggedNodes = {};
const originalPage = penpot.currentPage;
const originalPageId = originalPage.id;

// We can only query shapes on the current page via findShapes().
// For a full scan, we'll check only the current page here.
// To scan all pages, the user must run this on each page separately.
const currentPageShapes = originalPage.findShapes();

for (const shape of currentPageShapes) {
  const key = shape.getSharedPluginData('dsb', 'key');
  const runId = shape.getSharedPluginData('dsb', 'run_id');
  const phase = shape.getSharedPluginData('dsb', 'phase');

  if (key) {
    taggedNodes[key] = {
      id: shape.id,
      name: shape.name,
      type: shape.type,
      runId: runId || null,
      phase: phase || null,
    };
  }
}

// ── Tokens ───────────────────────────────────────────────────────────────────

const tokenMap = {};
let tokenCount = 0;

try {
  const catalog = library.tokens;
  if (catalog) {
    const tokens = typeof catalog === 'object' ? Object.values(catalog) : [];
    for (const t of tokens) {
      tokenMap[t.name] = { id: t.id, type: t.type, value: t.value };
      tokenCount++;
    }
  }
} catch (e) {
  tokenMap['__error'] = e.message;
}

// ── Library Colors ───────────────────────────────────────────────────────────

const colorMap = {};
for (const c of library.colors) {
  colorMap[c.name] = { id: c.id, color: c.color, opacity: c.opacity };
}

// ── Library Typographies ─────────────────────────────────────────────────────

const typographyMap = {};
for (const t of library.typographies) {
  typographyMap[t.name] = {
    id: t.id,
    fontFamily: t.fontFamily,
    fontSize: t.fontSize,
    fontWeight: t.fontWeight,
  };
}

// ── Components ───────────────────────────────────────────────────────────────

const componentMap = {};
for (const c of library.components) {
  componentMap[c.name] = { id: c.id, path: c.path || null };
}

// ── Pages ────────────────────────────────────────────────────────────────────

const pageMap = {};
for (const p of penpot.pages) {
  pageMap[p.name] = { id: p.id };
}

// ── Group Tagged Nodes by Phase ───────────────────────────────────────────────

const byPhase = {};
for (const [key, node] of Object.entries(taggedNodes)) {
  const phase = node.phase || 'unknown';
  if (!byPhase[phase]) byPhase[phase] = {};
  byPhase[phase][key] = node;
}

// ── Detect Unique Run IDs ────────────────────────────────────────────────────

const runIds = new Set(
  Object.values(taggedNodes)
    .map(n => n.runId)
    .filter(Boolean)
);

// ── Summary ──────────────────────────────────────────────────────────────────

const summary = {
  scannedPage: { id: originalPageId, name: originalPage.name },
  taggedNodeCount: Object.keys(taggedNodes).length,
  tokenCount,
  colorCount: Object.keys(colorMap).length,
  typographyCount: Object.keys(typographyMap).length,
  componentCount: Object.keys(componentMap).length,
  pageCount: Object.keys(pageMap).length,
  runIds: [...runIds],
  phases: Object.keys(byPhase),
};

// ── Recommend Next Steps ─────────────────────────────────────────────────────

const recommendations = [];

if (tokenCount === 0) {
  recommendations.push('No tokens found — Phase 1 (token creation) may not have run yet.');
}
if (Object.keys(colorMap).length === 0) {
  recommendations.push('No library colors found — run createLibraryColors.js.');
}
if (Object.keys(typographyMap).length === 0) {
  recommendations.push('No library typographies found — run createLibraryColors.js (it handles typographies too).');
}
if (Object.keys(componentMap).length === 0 && Object.keys(taggedNodes).length > 0) {
  recommendations.push('No library components found yet — Phase 3 (component creation) may not have run.');
}
if (!pageMap['Cover']) {
  recommendations.push('Cover page not found — Phase 2 (file structure) may not have run.');
}

return {
  // Primary maps — use these to rebuild state ledger
  taggedNodes,
  tokens: tokenMap,
  colors: colorMap,
  typographies: typographyMap,
  components: componentMap,
  pages: pageMap,

  // Grouped view
  byPhase,

  // Summary and diagnostics
  summary,
  recommendations,

  // Instruction for resumption
  note: 'Cross-reference this output with /tmp/dsb-penpot-state-{RUN_ID}.json to identify the resume point. ' +
        'Run this script on each page separately to get tagged nodes across all pages.',
};
