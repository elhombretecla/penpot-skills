/**
 * createSemanticTokens.js
 *
 * Creates semantic tokens that reference primitive tokens via expressions.
 * Run AFTER createTokenSet.js (primitives must exist before semantic tokens).
 *
 * Semantic tokens use the Penpot expression syntax: {token.name}
 * Example: { name: 'color.bg.primary', value: '{color.white}' }
 *
 * Idempotent: skips any token whose name already exists.
 *
 * ⚠️  Verify expression resolution: if a primitive token is missing, the expression
 *     will produce a broken reference. Always run createTokenSet.js first.
 */

/**
 * Validates that all expression references in a token value exist in the catalog.
 *
 * @param {string} value — e.g. "{color.white}" or "#FFFFFF"
 * @param {Map<string, Object>} existingByName — map of existing token names
 * @returns {{ valid: boolean, missing: string[] }}
 */
function validateExpressions(value, existingByName) {
  const refs = [...value.matchAll(/\{([^}]+)\}/g)].map(m => m[1]);
  const missing = refs.filter(ref => !existingByName.has(ref));
  return { valid: missing.length === 0, missing };
}

/**
 * Creates semantic tokens idempotently.
 *
 * @param {Array<{name: string, type: string, value: string, description?: string}>} tokenDefs
 * @param {string} runId
 * @returns {{ created: Object[], skipped: Object[], errors: Object[], invalidExpressions: Object[] }}
 */
async function createSemanticTokens(tokenDefs, runId) {
  const catalog = penpot.library.local.tokens;
  if (!catalog) {
    return { error: 'TokenCatalog not available.' };
  }

  let existingTokens = [];
  try {
    existingTokens = typeof catalog === 'object' ? Object.values(catalog) : [];
  } catch (e) {
    return { error: 'Failed to read existing tokens: ' + e.message };
  }

  const existingByName = new Map(existingTokens.map(t => [t.name, t]));

  const created = [];
  const skipped = [];
  const errors = [];
  const invalidExpressions = [];

  for (const def of tokenDefs) {
    // Idempotency check
    if (existingByName.has(def.name)) {
      skipped.push({ name: def.name, id: existingByName.get(def.name).id });
      continue;
    }

    // Validate expressions before attempting creation
    if (def.value.includes('{')) {
      const { valid, missing } = validateExpressions(def.value, existingByName);
      if (!valid) {
        invalidExpressions.push({
          name: def.name,
          value: def.value,
          missingRefs: missing,
        });
        errors.push({
          name: def.name,
          error: `Broken expression — referenced tokens not found: ${missing.join(', ')}`,
        });
        continue;
      }
    }

    try {
      const token = await catalog.createToken({
        name: def.name,
        type: def.type,
        value: def.value,
        description: def.description || '',
      });

      created.push({
        name: token.name,
        id: token.id,
        type: token.type,
        value: token.value,
      });

      // Add to local map so subsequent tokens can reference tokens created in this batch
      existingByName.set(def.name, token);
    } catch (e) {
      errors.push({ name: def.name, error: e.message });
    }
  }

  return {
    runId,
    created,
    skipped,
    errors,
    invalidExpressions,
    summary: {
      total: tokenDefs.length,
      createdCount: created.length,
      skippedCount: skipped.length,
      errorCount: errors.length,
    },
  };
}

// ── Example: light theme semantic colors ─────────────────────────────────────

const SEMANTIC_LIGHT_TOKENS = [
  // Background
  { name: 'color.bg.primary',      type: 'color', value: '{color.white}',     description: 'Primary background — light' },
  { name: 'color.bg.secondary',    type: 'color', value: '{color.gray.50}',   description: 'Secondary background — light' },
  { name: 'color.bg.tertiary',     type: 'color', value: '{color.gray.100}',  description: 'Tertiary background — light' },
  { name: 'color.bg.inverse',      type: 'color', value: '{color.gray.900}',  description: 'Inverse background — light' },
  { name: 'color.bg.brand',        type: 'color', value: '{color.blue.500}',  description: 'Brand background — light' },
  { name: 'color.bg.brand-hover',  type: 'color', value: '{color.blue.600}',  description: 'Brand background hover — light' },
  { name: 'color.bg.destructive',  type: 'color', value: '{color.red.500}',   description: 'Destructive background — light' },
  { name: 'color.bg.disabled',     type: 'color', value: '{color.gray.100}',  description: 'Disabled background — light' },

  // Text
  { name: 'color.text.primary',     type: 'color', value: '{color.gray.900}',  description: 'Primary text — light' },
  { name: 'color.text.secondary',   type: 'color', value: '{color.gray.600}',  description: 'Secondary text — light' },
  { name: 'color.text.tertiary',    type: 'color', value: '{color.gray.400}',  description: 'Tertiary text — light' },
  { name: 'color.text.inverse',     type: 'color', value: '{color.white}',     description: 'Inverse text — light' },
  { name: 'color.text.brand',       type: 'color', value: '{color.blue.600}',  description: 'Brand text — light' },
  { name: 'color.text.disabled',    type: 'color', value: '{color.gray.300}',  description: 'Disabled text — light' },
  { name: 'color.text.destructive', type: 'color', value: '{color.red.600}',   description: 'Destructive text — light' },

  // Border
  { name: 'color.border.default',    type: 'color', value: '{color.gray.200}', description: 'Default border — light' },
  { name: 'color.border.strong',     type: 'color', value: '{color.gray.400}', description: 'Strong border — light' },
  { name: 'color.border.focus',      type: 'color', value: '{color.blue.500}', description: 'Focus ring — light' },
  { name: 'color.border.brand',      type: 'color', value: '{color.blue.500}', description: 'Brand border — light' },
  { name: 'color.border.destructive',type: 'color', value: '{color.red.500}',  description: 'Destructive border — light' },
];

const SEMANTIC_DARK_TOKENS = [
  { name: 'color.dark.bg.primary',    type: 'color', value: '{color.gray.900}',  description: 'Primary background — dark' },
  { name: 'color.dark.bg.secondary',  type: 'color', value: '{color.gray.800}',  description: 'Secondary background — dark' },
  { name: 'color.dark.bg.brand',      type: 'color', value: '{color.blue.500}',  description: 'Brand background — dark' },
  { name: 'color.dark.text.primary',  type: 'color', value: '{color.white}',     description: 'Primary text — dark' },
  { name: 'color.dark.text.secondary',type: 'color', value: '{color.gray.400}',  description: 'Secondary text — dark' },
  { name: 'color.dark.text.brand',    type: 'color', value: '{color.blue.400}',  description: 'Brand text — dark' },
  { name: 'color.dark.border.default',type: 'color', value: '{color.gray.700}',  description: 'Default border — dark' },
];

const RUN_ID = 'penpot-dsb-REPLACE-ME';

const result = await createSemanticTokens(
  [...SEMANTIC_LIGHT_TOKENS, ...SEMANTIC_DARK_TOKENS],
  RUN_ID
);

return result;
