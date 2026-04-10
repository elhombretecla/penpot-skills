/**
 * inspectFileStructure.js
 *
 * Read-only discovery script. Returns a comprehensive structural inventory of the
 * current Penpot file: pages, components, library colors, library typographies,
 * tokens, and existing plugin data tags.
 *
 * Usage: paste into an execute_code call at the start of Phase 0 (after high_level_overview).
 * This script makes NO mutations.
 */

const file = penpot.currentFile;
const originalPage = penpot.currentPage;
const library = penpot.library.local;

// ── Pages ────────────────────────────────────────────────────────────────────
const pages = penpot.pages.map(p => ({
  id: p.id,
  name: p.name,
  childCount: (() => {
    try {
      // Navigate to each page to count top-level shapes
      // Note: page.children may not be available without navigating
      return p.id === originalPage.id ? originalPage.findShapes().length : '(navigate to count)';
    } catch (_) {
      return 'unknown';
    }
  })()
}));

// ── Library Components ───────────────────────────────────────────────────────
const components = library.components.map(c => ({
  id: c.id,
  name: c.name,
  path: c.path || null,
}));

// ── Library Colors ───────────────────────────────────────────────────────────
const colors = library.colors.map(c => ({
  id: c.id,
  name: c.name,
  color: c.color,
  opacity: c.opacity,
}));

// ── Library Typographies ─────────────────────────────────────────────────────
const typographies = library.typographies.map(t => ({
  id: t.id,
  name: t.name,
  fontFamily: t.fontFamily,
  fontStyle: t.fontStyle,
  fontSize: t.fontSize,
  fontWeight: t.fontWeight,
  lineHeight: t.lineHeight,
  letterSpacing: t.letterSpacing,
}));

// ── Tokens ───────────────────────────────────────────────────────────────────
let tokens = [];
try {
  const catalog = library.tokens;
  if (catalog) {
    const raw = typeof catalog === 'object' ? Object.values(catalog) : [];
    tokens = raw.map(t => ({
      id: t.id,
      name: t.name,
      type: t.type,
      value: t.value,
      description: t.description || null,
    }));
  }
} catch (e) {
  tokens = [{ error: 'Token catalog unavailable: ' + e.message }];
}

// ── Plugin Data Tags (existing DSB tags) ─────────────────────────────────────
const currentPageShapes = originalPage.findShapes();
const taggedShapes = currentPageShapes
  .map(s => {
    const key = s.getSharedPluginData('dsb', 'key');
    const runId = s.getSharedPluginData('dsb', 'run_id');
    const phase = s.getSharedPluginData('dsb', 'phase');
    if (key || runId) {
      return {
        id: s.id,
        name: s.name,
        type: s.type,
        dsbKey: key,
        dsbRunId: runId,
        dsbPhase: phase,
      };
    }
    return null;
  })
  .filter(Boolean);

// ── Shared Libraries ─────────────────────────────────────────────────────────
let sharedLibraries = [];
try {
  sharedLibraries = penpot.library.all.map(lib => ({
    fileId: lib.fileId,
    name: lib.name,
    componentCount: lib.components.length,
    colorCount: lib.colors.length,
    typographyCount: lib.typographies.length,
  }));
} catch (_) {
  sharedLibraries = [];
}

// ── Summary ──────────────────────────────────────────────────────────────────
return {
  file: {
    id: file.id,
    name: file.name,
  },
  currentPage: {
    id: originalPage.id,
    name: originalPage.name,
  },
  pages,
  library: {
    componentCount: components.length,
    components,
    colorCount: colors.length,
    colors,
    typographyCount: typographies.length,
    typographies,
    tokenCount: tokens.length,
    tokens,
  },
  taggedShapesOnCurrentPage: taggedShapes,
  sharedLibraries,
  summary: {
    isEmpty:
      components.length === 0 &&
      colors.length === 0 &&
      typographies.length === 0 &&
      tokens.length === 0,
    hasTokens: tokens.length > 0,
    hasComponents: components.length > 0,
    hasColors: colors.length > 0,
    hasTypographies: typographies.length > 0,
    hasDSBTags: taggedShapes.length > 0,
  },
};
