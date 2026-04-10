/**
 * createLibraryColors.js
 *
 * Creates library colors and library typographies in the Penpot local library.
 * These are the style-level tokens that appear in the color picker and text panel,
 * and are used for fillColorRefId bindings in component fills/strokes.
 *
 * Run AFTER createSemanticTokens.js (tokens must exist first so color values
 * are already decided and we can sync the hex values).
 *
 * Idempotent: skips any color/typography whose name already exists.
 *
 * ⚠️  Library colors and TokenCatalog tokens are separate systems in Penpot.
 *     Both must be created. Tokens drive the W3C/Token Studio workflow;
 *     library colors drive the Penpot UI and component fill bindings.
 *
 * ⚠️  Verify `library.createColor()` and `library.createTypography()` signatures:
 *     penpot_api_info({ type: 'PenpotLibrary' })
 *     penpot_api_info({ type: 'LibraryColor' })
 *     penpot_api_info({ type: 'LibraryTypography' })
 */

const library = penpot.library.local;

// ── Library Colors ───────────────────────────────────────────────────────────

/**
 * @typedef {Object} LibraryColorDef
 * @property {string} name    — slash-notation path (e.g. "color/bg/primary")
 * @property {string} color   — raw hex (e.g. "#FFFFFF")
 * @property {number} [opacity] — 0–1, defaults to 1
 */

/**
 * Creates library colors idempotently.
 * @param {LibraryColorDef[]} colorDefs
 * @param {string} runId
 */
function createLibraryColors(colorDefs, runId) {
  const existing = new Map(library.colors.map(c => [c.name, c]));

  const created = [];
  const skipped = [];
  const errors = [];

  for (const def of colorDefs) {
    if (existing.has(def.name)) {
      skipped.push({ name: def.name, id: existing.get(def.name).id });
      continue;
    }

    try {
      const color = library.createColor();
      color.name = def.name;
      color.color = def.color;
      color.opacity = def.opacity !== undefined ? def.opacity : 1;

      created.push({ name: color.name, id: color.id, color: color.color });
      existing.set(def.name, color);
    } catch (e) {
      errors.push({ name: def.name, error: e.message });
    }
  }

  return { created, skipped, errors };
}

// ── Library Typographies ─────────────────────────────────────────────────────

/**
 * @typedef {Object} LibraryTypographyDef
 * @property {string} name          — Title Case with slash (e.g. "Body/MD")
 * @property {string} fontFamily    — e.g. "Inter"
 * @property {string} [fontStyle]   — e.g. "Regular", "Medium", "SemiBold", "Bold"
 * @property {number} [fontSize]    — e.g. 16
 * @property {number} [fontWeight]  — e.g. 400, 500, 600, 700
 * @property {number} [lineHeight]  — e.g. 1.5
 * @property {number} [letterSpacing] — e.g. 0, -0.025
 */

/**
 * Creates library typographies idempotently.
 * @param {LibraryTypographyDef[]} typoDefs
 * @param {string} runId
 */
function createLibraryTypographies(typoDefs, runId) {
  const existing = new Map(library.typographies.map(t => [t.name, t]));

  const created = [];
  const skipped = [];
  const errors = [];

  for (const def of typoDefs) {
    if (existing.has(def.name)) {
      skipped.push({ name: def.name, id: existing.get(def.name).id });
      continue;
    }

    try {
      const typo = library.createTypography({
        name: def.name,
        fontFamily: def.fontFamily,
        fontStyle: def.fontStyle || 'Regular',
        fontSize: def.fontSize || 16,
        fontWeight: def.fontWeight || 400,
        lineHeight: def.lineHeight || 1.5,
        letterSpacing: def.letterSpacing || 0,
      });

      created.push({ name: typo.name, id: typo.id });
      existing.set(def.name, typo);
    } catch (e) {
      errors.push({ name: def.name, error: e.message });
    }
  }

  return { created, skipped, errors };
}

// ── Definitions ──────────────────────────────────────────────────────────────

const COLOR_DEFS = [
  // Brand
  { name: 'color/brand/primary',       color: '#3B82F6', opacity: 1 },
  { name: 'color/brand/primary-hover', color: '#2563EB', opacity: 1 },
  { name: 'color/brand/primary-active',color: '#1D4ED8', opacity: 1 },

  // Background
  { name: 'color/bg/primary',    color: '#FFFFFF', opacity: 1 },
  { name: 'color/bg/secondary',  color: '#F9FAFB', opacity: 1 },
  { name: 'color/bg/tertiary',   color: '#F3F4F6', opacity: 1 },
  { name: 'color/bg/inverse',    color: '#111827', opacity: 1 },
  { name: 'color/bg/brand',      color: '#3B82F6', opacity: 1 },
  { name: 'color/bg/disabled',   color: '#F3F4F6', opacity: 1 },
  { name: 'color/bg/overlay',    color: '#000000', opacity: 0.5 },

  // Text
  { name: 'color/text/primary',      color: '#111827', opacity: 1 },
  { name: 'color/text/secondary',    color: '#4B5563', opacity: 1 },
  { name: 'color/text/tertiary',     color: '#9CA3AF', opacity: 1 },
  { name: 'color/text/inverse',      color: '#FFFFFF', opacity: 1 },
  { name: 'color/text/brand',        color: '#2563EB', opacity: 1 },
  { name: 'color/text/disabled',     color: '#D1D5DB', opacity: 1 },
  { name: 'color/text/destructive',  color: '#DC2626', opacity: 1 },

  // Border
  { name: 'color/border/default',     color: '#E5E7EB', opacity: 1 },
  { name: 'color/border/strong',      color: '#9CA3AF', opacity: 1 },
  { name: 'color/border/focus',       color: '#3B82F6', opacity: 1 },
  { name: 'color/border/destructive', color: '#EF4444', opacity: 1 },

  // Status
  { name: 'color/status/success',  color: '#10B981', opacity: 1 },
  { name: 'color/status/warning',  color: '#F59E0B', opacity: 1 },
  { name: 'color/status/error',    color: '#EF4444', opacity: 1 },
  { name: 'color/status/info',     color: '#3B82F6', opacity: 1 },
];

const TYPOGRAPHY_DEFS = [
  // Display
  { name: 'Display/Large',    fontFamily: 'Inter', fontStyle: 'Bold',     fontSize: 48, fontWeight: 700, lineHeight: 1.1,  letterSpacing: -0.025 },
  { name: 'Display/Medium',   fontFamily: 'Inter', fontStyle: 'Bold',     fontSize: 36, fontWeight: 700, lineHeight: 1.2,  letterSpacing: -0.025 },
  { name: 'Display/Small',    fontFamily: 'Inter', fontStyle: 'SemiBold', fontSize: 30, fontWeight: 600, lineHeight: 1.25, letterSpacing: -0.025 },

  // Heading
  { name: 'Heading/XL',   fontFamily: 'Inter', fontStyle: 'Bold',     fontSize: 24, fontWeight: 700, lineHeight: 1.25, letterSpacing: -0.025 },
  { name: 'Heading/LG',   fontFamily: 'Inter', fontStyle: 'SemiBold', fontSize: 20, fontWeight: 600, lineHeight: 1.3,  letterSpacing: 0 },
  { name: 'Heading/MD',   fontFamily: 'Inter', fontStyle: 'SemiBold', fontSize: 18, fontWeight: 600, lineHeight: 1.4,  letterSpacing: 0 },
  { name: 'Heading/SM',   fontFamily: 'Inter', fontStyle: 'SemiBold', fontSize: 16, fontWeight: 600, lineHeight: 1.4,  letterSpacing: 0 },

  // Body
  { name: 'Body/LG',      fontFamily: 'Inter', fontStyle: 'Regular', fontSize: 18, fontWeight: 400, lineHeight: 1.6, letterSpacing: 0 },
  { name: 'Body/MD',      fontFamily: 'Inter', fontStyle: 'Regular', fontSize: 16, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 },
  { name: 'Body/SM',      fontFamily: 'Inter', fontStyle: 'Regular', fontSize: 14, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 },

  // Label
  { name: 'Label/LG',     fontFamily: 'Inter', fontStyle: 'Medium', fontSize: 16, fontWeight: 500, lineHeight: 1.25, letterSpacing: 0 },
  { name: 'Label/MD',     fontFamily: 'Inter', fontStyle: 'Medium', fontSize: 14, fontWeight: 500, lineHeight: 1.25, letterSpacing: 0 },
  { name: 'Label/SM',     fontFamily: 'Inter', fontStyle: 'Medium', fontSize: 12, fontWeight: 500, lineHeight: 1.25, letterSpacing: 0.025 },

  // Caption / Code
  { name: 'Caption/MD',   fontFamily: 'Inter',           fontStyle: 'Regular', fontSize: 12, fontWeight: 400, lineHeight: 1.4, letterSpacing: 0 },
  { name: 'Code/MD',      fontFamily: 'JetBrains Mono',  fontStyle: 'Regular', fontSize: 14, fontWeight: 400, lineHeight: 1.6, letterSpacing: 0 },
];

// ── Execute ──────────────────────────────────────────────────────────────────

const RUN_ID = 'penpot-dsb-REPLACE-ME';

const colorResult = createLibraryColors(COLOR_DEFS, RUN_ID);
const typoResult = createLibraryTypographies(TYPOGRAPHY_DEFS, RUN_ID);

return {
  runId: RUN_ID,
  colors: {
    created: colorResult.created,
    skipped: colorResult.skipped.length,
    errors: colorResult.errors,
  },
  typographies: {
    created: typoResult.created,
    skipped: typoResult.skipped.length,
    errors: typoResult.errors,
  },
  summary: {
    colorsCreated: colorResult.created.length,
    typographiesCreated: typoResult.created.length,
    totalErrors: colorResult.errors.length + typoResult.errors.length,
  },
};
