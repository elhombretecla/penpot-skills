/**
 * inspectDesignSystem.js
 *
 * Comprehensive discovery script for screen building.
 * Returns all components, library colors, typographies, and tokens
 * from the local library and any connected shared libraries.
 *
 * Run this as the FIRST execute_code call before building any screen section.
 * This script is read-only — it makes NO mutations.
 *
 * Usage: the output gives you IDs for all assets needed to build sections.
 * Copy component IDs and color names into your section scripts.
 */

const library = penpot.library.local;
const page = penpot.currentPage;

// ── Local Library Components ─────────────────────────────────────────────────

const localComponents = library.components.map(c => ({
  id: c.id,
  name: c.name,
  path: c.path || null,
  // Flatten path+name for easy search:
  fullName: c.path ? `${c.path}/${c.name}` : c.name,
}));

// Group by category (first path segment or first word)
function groupByCategory(components) {
  const groups = {};
  for (const c of components) {
    const category = (c.name.split('/')[0] || c.name.split(' ')[0]).toLowerCase();
    if (!groups[category]) groups[category] = [];
    groups[category].push({ id: c.id, name: c.name });
  }
  return groups;
}

// ── Library Colors ───────────────────────────────────────────────────────────

const colors = library.colors.map(c => ({
  id: c.id,
  name: c.name,
  color: c.color,
  opacity: c.opacity,
  // Group label for easy reading:
  group: c.name.includes('/') ? c.name.split('/').slice(0, -1).join('/') : 'root',
}));

// Sort colors by group
const colorsByGroup = colors.reduce((acc, c) => {
  if (!acc[c.group]) acc[c.group] = [];
  acc[c.group].push({ id: c.id, name: c.name, color: c.color, opacity: c.opacity });
  return acc;
}, {});

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

let tokenSummary = { available: false };
try {
  const catalog = library.tokens;
  if (catalog) {
    const allTokens = typeof catalog === 'object' ? Object.values(catalog) : [];
    tokenSummary = {
      available: true,
      total: allTokens.length,
      byType: allTokens.reduce((acc, t) => {
        if (!acc[t.type]) acc[t.type] = [];
        acc[t.type].push({ name: t.name, value: t.value });
        return acc;
      }, {}),
    };
  }
} catch (e) {
  tokenSummary = { available: false, error: e.message };
}

// ── Shared Libraries ─────────────────────────────────────────────────────────

let sharedLibraries = [];
try {
  sharedLibraries = penpot.library.all.map(lib => ({
    fileId: lib.fileId,
    name: lib.name,
    componentCount: lib.components.length,
    colorCount: lib.colors.length,
    typographyCount: lib.typographies.length,
    sampleComponents: lib.components.slice(0, 8).map(c => ({ id: c.id, name: c.name })),
  }));
} catch (_) {
  sharedLibraries = [];
}

// ── Existing Screens on Current Page ─────────────────────────────────────────

const existingFrames = page.findShapes().filter(s =>
  s.type === 'frame' && !s.parentId  // top-level frames only
);

const screenInventory = existingFrames.map(f => ({
  id: f.id,
  name: f.name,
  x: f.x,
  y: f.y,
  width: f.width,
  height: f.height,
  dsbKey: f.getSharedPluginData('dsb', 'key') || null,
}));

// ── Next Available Position ───────────────────────────────────────────────────

let maxX = 0;
for (const frame of existingFrames) {
  maxX = Math.max(maxX, (frame.x || 0) + (frame.width || 0));
}
const suggestedX = maxX > 0 ? maxX + 200 : 0;

// ── Search Helper (for logs — shows fuzzy search results) ────────────────────

const searchTerms = ['button', 'input', 'card', 'nav', 'header', 'badge', 'avatar', 'modal', 'tab', 'icon'];
const quickSearch = {};
for (const term of searchTerms) {
  const matches = localComponents.filter(c => c.name.toLowerCase().includes(term));
  if (matches.length > 0) {
    quickSearch[term] = matches.map(c => ({ id: c.id, name: c.name }));
  }
}

// ── Summary ──────────────────────────────────────────────────────────────────

return {
  currentPage: {
    id: page.id,
    name: page.name,
  },

  // Full asset lists
  components: {
    count: localComponents.length,
    byCategory: groupByCategory(localComponents),
    all: localComponents,
  },

  colors: {
    count: colors.length,
    byGroup: colorsByGroup,
  },

  typographies: {
    count: typographies.length,
    list: typographies,
  },

  tokens: tokenSummary,

  sharedLibraries,

  // Current page state
  existingScreens: {
    count: screenInventory.length,
    frames: screenInventory,
    suggestedNewScreenX: suggestedX,
  },

  // Quick search results — saves a round-trip
  quickSearch,

  // Design system health check
  healthCheck: {
    hasComponents: localComponents.length > 0,
    hasColors: colors.length > 0,
    hasTypographies: typographies.length > 0,
    hasTokens: tokenSummary.available && tokenSummary.total > 0,
    hasSharedLibraries: sharedLibraries.length > 0,
    readyToBuild:
      localComponents.length > 0 &&
      colors.length > 0 &&
      typographies.length > 0,
    warnings: [
      localComponents.length === 0 && 'No local components — import a shared library or run penpot-generate-library first',
      colors.length === 0 && 'No library colors — screens will use hardcoded fills',
      typographies.length === 0 && 'No library typographies — screens will use hardcoded font properties',
    ].filter(Boolean),
  },
};
