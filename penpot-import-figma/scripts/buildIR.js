/**
 * buildIR.js
 *
 * Phase 1 — Build and write the Intermediate Representation (IR) to disk.
 * NOT an execute_code script — runs in Claude's reasoning context.
 *
 * The IR is the translation contract between Figma data (read via Figma MCP)
 * and Penpot creation (written via Penpot MCP execute_code).
 *
 * Usage:
 *   1. Collect all Figma MCP responses (metadata, variable_defs, design_context)
 *   2. Run analyzeFigmaStructure.js parsing functions on the responses
 *   3. Feed the parsed data into buildIR() to produce the IR document
 *   4. Write the IR to /tmp/figma-import-ir-{RUN_ID}.json
 *   5. Present the IR summary to the user for approval
 *   6. After approval, proceed to Phase 2 (Penpot token creation)
 */

const fs = require('fs');

/**
 * Build the full IR document from parsed Figma data.
 *
 * @param {object} options
 * @param {string} options.runId - Unique ID for this migration run
 * @param {string} options.figmaFileKey - Figma file key
 * @param {string} options.figmaFileName - Figma file name
 * @param {object} options.scope - What to migrate { pages, components, excludePages }
 * @param {object} options.parsedTokens - Output of parseVariableDefs()
 * @param {object[]} options.parsedComponents - Output of parseComponentSpec() per component
 * @param {object[]} options.parsedScreens - Screen specs derived from get_design_context
 * @param {object[]} options.parsedTypographies - Text style specs
 * @param {object[]} options.parsedColors - Color style specs
 */
function buildIR({
  runId,
  figmaFileKey,
  figmaFileName,
  scope,
  parsedTokens,
  parsedComponents = [],
  parsedScreens = [],
  parsedTypographies = [],
  parsedColors = [],
}) {
  // Build dependency-ordered component list
  const orderedComponents = topologicalSort(parsedComponents);

  // Collect all translation gaps
  const allGaps = [
    ...parsedTokens.translationGaps,
    ...parsedComponents.flatMap(c => c.translationGaps || []),
  ];

  // Build IR
  const ir = {
    meta: {
      runId,
      figmaFileKey,
      figmaFileName,
      createdAt: new Date().toISOString(),
      scope: {
        migrateTokens: true,
        migrateComponents: parsedComponents.length > 0,
        migrateScreens: (scope.screens || []).map(s => s.name),
        excludePages: scope.excludePages || [],
      },
    },

    tokens: {
      sets: parsedTokens.tokenSets,
      themes: parsedTokens.themes,
    },

    colors: parsedColors.map(c => ({
      figmaStyleId: c.figmaStyleId,
      name: toLibraryColorName(c.name),
      hex: c.hex,
      opacity: c.opacity ?? 1,
      penpotStatus: 'pending',
      penpotId: null,
    })),

    typographies: parsedTypographies.map(t => ({
      figmaStyleId: t.figmaStyleId,
      name: t.name,
      fontFamily: t.fontFamily,
      fontStyle: t.fontStyle,
      fontSize: String(t.fontSize),
      fontWeight: String(t.fontWeight),
      lineHeight: normalizeLineHeight(t.lineHeight, t.lineHeightUnit),
      letterSpacing: String(t.letterSpacing || 0),
      penpotStatus: 'pending',
      penpotId: null,
    })),

    components: orderedComponents.map(c => ({
      ...c,
      buildOrder: orderedComponents.indexOf(c),
      penpotStatus: 'pending',
      penpotComponentId: null,
      penpotVariantContainerId: null,
    })),

    screens: parsedScreens.map(s => ({
      figmaId: s.figmaId,
      name: s.name,
      page: s.page,
      width: s.width,
      height: s.height,
      sections: s.sections.map(sec => ({
        ...sec,
        penpotStatus: 'pending',
        penpotFrameId: null,
      })),
      penpotStatus: 'pending',
      penpotFrameId: null,
    })),

    translationGaps: allGaps,

    state: {
      phase: 'ir-built',
      lastCompletedStep: null,
      completedSteps: [],
    },
  };

  return ir;
}

/**
 * Write the IR to disk.
 */
function writeIR(ir, filePath) {
  const path = filePath || `/tmp/figma-import-ir-${ir.meta.runId}.json`;
  fs.writeFileSync(path, JSON.stringify(ir, null, 2), 'utf8');
  return path;
}

/**
 * Read IR from disk (for resume).
 */
function readIR(runId, filePath) {
  const path = filePath || `/tmp/figma-import-ir-${runId}.json`;
  if (!fs.existsSync(path)) return null;
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

/**
 * Update a specific entity in the IR after creation in Penpot.
 */
function markCreated(ir, entityType, figmaId, penpotId, extraFields = {}) {
  let entities;
  if (entityType === 'token') entities = Object.values(ir.tokens.sets).flat();
  else if (entityType === 'color') entities = ir.colors;
  else if (entityType === 'typography') entities = ir.typographies;
  else if (entityType === 'component') entities = ir.components;
  else if (entityType === 'screen') entities = ir.screens;
  else return;

  const entity = entities.find(e => e.figmaId === figmaId || e.figmaStyleId === figmaId);
  if (entity) {
    entity.penpotStatus = 'created';
    if (entityType === 'component') entity.penpotComponentId = penpotId;
    else if (entityType === 'screen') entity.penpotFrameId = penpotId;
    else entity.penpotId = penpotId;
    Object.assign(entity, extraFields);
  }
}

/**
 * Get all pending entities of a given type.
 */
function getPending(ir, entityType) {
  if (entityType === 'component') return ir.components.filter(c => c.penpotStatus === 'pending');
  if (entityType === 'screen') return ir.screens.filter(s => s.penpotStatus === 'pending');
  if (entityType === 'color') return ir.colors.filter(c => c.penpotStatus === 'pending');
  if (entityType === 'typography') return ir.typographies.filter(t => t.penpotStatus === 'pending');
  return [];
}

/**
 * Build the IR summary for user presentation.
 */
function buildIRSummary(ir) {
  const tokenSets = Object.keys(ir.tokens.sets);
  const totalTokens = Object.values(ir.tokens.sets).reduce((sum, set) => sum + set.length, 0);

  const componentsByLayer = groupByDependencyLayer(ir.components);

  const gaps = ir.translationGaps;
  const highImpactGaps = gaps.filter(g => g.impact === 'high');
  const mediumImpactGaps = gaps.filter(g => g.impact === 'medium');
  const lowImpactGaps = gaps.filter(g => g.impact !== 'high' && g.impact !== 'medium');

  return `
IR BUILT — Migration Plan

TOKENS
  Token sets: ${tokenSets.length} (${tokenSets.join(', ')})
  Total tokens: ${totalTokens}
  Themes: ${ir.tokens.themes.length > 0 ? ir.tokens.themes.map(t => t.name).join(', ') : 'none'}
  Library colors: ${ir.colors.length}
  Library typographies: ${ir.typographies.length}

COMPONENTS (build order)
${Object.entries(componentsByLayer)
  .map(([layer, comps]) => `  Layer ${layer}: ${comps.map(c => `${c.name} (${c.variants?.length || 0} variants)`).join(', ')}`)
  .join('\n')}
  Total: ${ir.components.length} components

SCREENS
${ir.screens.map(s => `  ${s.name} (${s.width}×${s.height}, ${s.sections.length} sections)`).join('\n')}

TRANSLATION GAPS (${gaps.length} total)
${highImpactGaps.map(g => `  🔴 HIGH: ${g.name || g.type} — ${g.reason}`).join('\n')}
${mediumImpactGaps.map(g => `  ⚠️  MED: ${g.name || g.type} — ${g.reason}`).join('\n')}
${lowImpactGaps.slice(0, 3).map(g => `  ℹ️  LOW: ${g.name || g.type} — ${g.reason}`).join('\n')}
${lowImpactGaps.length > 3 ? `  ... and ${lowImpactGaps.length - 3} more low-impact gaps` : ''}

Approve this plan before I write to Penpot?
`.trim();
}

// ── Helper functions ──────────────────────────────────────────────────────────

/**
 * Topological sort of components by dependency order.
 * Components with no dependencies come first.
 */
function topologicalSort(components) {
  const visited = new Set();
  const result = [];

  function visit(comp) {
    if (visited.has(comp.figmaId)) return;
    visited.add(comp.figmaId);

    // Visit dependencies first
    for (const depId of (comp.dependency || [])) {
      const dep = components.find(c => c.figmaId === depId);
      if (dep) visit(dep);
    }

    result.push(comp);
  }

  for (const comp of components) {
    visit(comp);
  }

  return result;
}

function groupByDependencyLayer(components) {
  const layers = {};
  components.forEach((c, i) => {
    const layer = c.dependency?.length > 0 ? 'depends' : '0';
    if (!layers[layer]) layers[layer] = [];
    layers[layer].push(c);
  });
  return layers;
}

function toLibraryColorName(figmaStyleName) {
  // Convert Figma style name to Penpot library color slash-notation
  return figmaStyleName
    .replace(/\s*\/\s*/g, '/')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-/]/g, '');
}

function normalizeLineHeight(value, unit) {
  if (!value) return '1.5';
  if (unit === 'PIXELS' || unit === 'px') return String(value);
  if (unit === 'PERCENT' || unit === '%') return String(value / 100);
  if (unit === 'AUTO') return '1.2';
  return String(value);
}

module.exports = { buildIR, writeIR, readIR, markCreated, getPending, buildIRSummary };
