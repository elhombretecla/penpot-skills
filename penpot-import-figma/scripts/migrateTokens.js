/**
 * migrateTokens.js
 *
 * Phase 2 — Create tokens, library colors, and library typographies in Penpot.
 * PASTE INTO execute_code (one set at a time).
 *
 * Run in this order:
 *   1. Primitive tokens (raw values, no aliases)
 *   2. Semantic tokens (alias expressions like {color.white})
 *   3. Other tokens (spacing, radius, shadow)
 *   4. Library colors (for fillColorRefId binding)
 *   5. Library typographies
 *
 * ⚠️  Replace TOKEN_SET_DATA and RUN_ID before running.
 * ⚠️  Run each set in a separate execute_code call. Never combine all sets into one call.
 */

const RUN_ID = 'REPLACE_WITH_RUN_ID';

// ── Token set to create in this call ─────────────────────────────────────────
// Replace this array with the token set from the IR for this call.
// For primitive colors, use raw hex values.
// For semantic tokens, use {expression} values.

const TOKEN_SET_DATA = [
  // EXAMPLE — replace with actual tokens from the IR:
  { name: 'color.blue.50',  type: 'color', value: '#EFF6FF', description: 'Blue tint 50' },
  { name: 'color.blue.500', type: 'color', value: '#3B82F6', description: 'Blue base' },
  { name: 'color.blue.700', type: 'color', value: '#1D4ED8', description: 'Blue dark' },
  { name: 'color.gray.50',  type: 'color', value: '#F9FAFB', description: 'Gray tint 50' },
  { name: 'color.gray.500', type: 'color', value: '#6B7280', description: 'Gray mid' },
  { name: 'color.gray.900', type: 'color', value: '#111827', description: 'Gray darkest' },
  { name: 'color.white',    type: 'color', value: '#FFFFFF', description: 'Pure white' },
  { name: 'color.black',    type: 'color', value: '#000000', description: 'Pure black' },
];

// ── Create tokens ─────────────────────────────────────────────────────────────

const catalog = penpot.library.local.tokens;
const existingTokens = catalog ? Object.values(catalog) : [];

const created = [];
const skipped = [];
const errors = [];

for (const tokenDef of TOKEN_SET_DATA) {
  // Idempotency: skip if already exists
  const existing = existingTokens.find(t => t.name === tokenDef.name);
  if (existing) {
    skipped.push({ name: tokenDef.name, id: existing.id });
    continue;
  }

  try {
    const t = await catalog.createToken({
      name: tokenDef.name,
      type: tokenDef.type,
      value: tokenDef.value,
      ...(tokenDef.description ? { description: tokenDef.description } : {}),
    });
    created.push({ name: t.name, id: t.id, type: t.type });
  } catch (e) {
    errors.push({ name: tokenDef.name, error: e.message });
  }
}

return {
  runId: RUN_ID,
  setSize: TOKEN_SET_DATA.length,
  created: created.length,
  skipped: skipped.length,
  errors: errors.length,
  errorDetails: errors,
  createdTokens: created,
  nextStep: errors.length > 0
    ? `⚠️  ${errors.length} token(s) failed. Fix errors before proceeding.`
    : `✅  ${created.length} tokens created, ${skipped.length} skipped. Proceed to next token set or Phase 3.`,
};

// =============================================================================
// TEMPLATE B: Create Library Colors
// Use in a separate execute_code call for Step 4 (library colors).
// =============================================================================

/*
const RUN_ID = 'REPLACE_WITH_RUN_ID';
const library = penpot.library.local;

const LIBRARY_COLOR_DATA = [
  // EXAMPLE — replace with actual colors from the IR:
  { name: 'color/bg/primary',     hex: '#FFFFFF', opacity: 1 },
  { name: 'color/bg/secondary',   hex: '#F9FAFB', opacity: 1 },
  { name: 'color/text/primary',   hex: '#111827', opacity: 1 },
  { name: 'color/text/secondary', hex: '#6B7280', opacity: 1 },
  { name: 'color/text/inverse',   hex: '#FFFFFF', opacity: 1 },
  { name: 'color/brand/primary',  hex: '#3B82F6', opacity: 1 },
  { name: 'color/border/default', hex: '#F3F4F6', opacity: 1 },
  { name: 'color/feedback/error', hex: '#EF4444', opacity: 1 },
  { name: 'color/feedback/success', hex: '#10B981', opacity: 1 },
  { name: 'color/feedback/warning', hex: '#F59E0B', opacity: 1 },
];

const createdColors = [];
const skippedColors = [];
const colorErrors = [];

for (const colorDef of LIBRARY_COLOR_DATA) {
  const existing = library.colors.find(c => c.name === colorDef.name);
  if (existing) {
    skippedColors.push({ name: colorDef.name, id: existing.id });
    continue;
  }
  try {
    const c = library.createColor();
    c.name = colorDef.name;
    c.color = colorDef.hex;
    c.opacity = colorDef.opacity ?? 1;
    createdColors.push({ name: c.name, id: c.id });
  } catch (e) {
    colorErrors.push({ name: colorDef.name, error: e.message });
  }
}

return {
  runId: RUN_ID,
  created: createdColors.length,
  skipped: skippedColors.length,
  errors: colorErrors.length,
  createdColors,
  colorMap: createdColors.reduce((m, c) => { m[c.name] = c.id; return m; }, {}),
};
*/

// =============================================================================
// TEMPLATE C: Create Library Typographies
// Use in a separate execute_code call for Step 5.
// =============================================================================

/*
const RUN_ID = 'REPLACE_WITH_RUN_ID';
const library = penpot.library.local;

const TYPOGRAPHY_DATA = [
  // EXAMPLE — replace with actual typography specs from the IR:
  { name: 'Heading/2XL', fontFamily: 'Inter', fontStyle: 'Bold',    fontSize: '36', lineHeight: '1.2',  letterSpacing: '-0.01' },
  { name: 'Heading/XL',  fontFamily: 'Inter', fontStyle: 'Bold',    fontSize: '30', lineHeight: '1.25', letterSpacing: '0'     },
  { name: 'Heading/LG',  fontFamily: 'Inter', fontStyle: 'Bold',    fontSize: '24', lineHeight: '1.25', letterSpacing: '0'     },
  { name: 'Heading/MD',  fontFamily: 'Inter', fontStyle: 'SemiBold',fontSize: '20', lineHeight: '1.3',  letterSpacing: '0'     },
  { name: 'Body/LG',     fontFamily: 'Inter', fontStyle: 'Regular', fontSize: '18', lineHeight: '1.6',  letterSpacing: '0'     },
  { name: 'Body/MD',     fontFamily: 'Inter', fontStyle: 'Regular', fontSize: '16', lineHeight: '1.5',  letterSpacing: '0'     },
  { name: 'Body/SM',     fontFamily: 'Inter', fontStyle: 'Regular', fontSize: '14', lineHeight: '1.5',  letterSpacing: '0'     },
  { name: 'Label/MD',    fontFamily: 'Inter', fontStyle: 'Medium',  fontSize: '14', lineHeight: '1.2',  letterSpacing: '0'     },
  { name: 'Label/SM',    fontFamily: 'Inter', fontStyle: 'Medium',  fontSize: '12', lineHeight: '1.2',  letterSpacing: '0.02'  },
  { name: 'Caption/MD',  fontFamily: 'Inter', fontStyle: 'Regular', fontSize: '12', lineHeight: '1.4',  letterSpacing: '0'     },
];

const createdTypos = [];
const skippedTypos = [];
const typoErrors = [];

for (const td of TYPOGRAPHY_DATA) {
  const existing = library.typographies.find(t => t.name === td.name);
  if (existing) {
    skippedTypos.push({ name: td.name, id: existing.id });
    continue;
  }
  try {
    const typo = library.createTypography();
    typo.name = td.name;
    typo.fontFamily = td.fontFamily;
    typo.fontStyle = td.fontStyle;
    typo.fontSize = td.fontSize;
    typo.lineHeight = td.lineHeight;
    typo.letterSpacing = td.letterSpacing;
    createdTypos.push({ name: typo.name, id: typo.id });
  } catch (e) {
    typoErrors.push({ name: td.name, error: e.message });
  }
}

return {
  runId: RUN_ID,
  created: createdTypos.length,
  skipped: skippedTypos.length,
  errors: typoErrors.length,
  createdTypos,
  typoMap: createdTypos.reduce((m, t) => { m[t.name] = t.id; return m; }, {}),
};
*/
