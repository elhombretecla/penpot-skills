/**
 * createInferredTokens.js
 *
 * Phase 2 — Create global (primitive) and semantic tokens in the Penpot TokenCatalog.
 * Idempotent: skips tokens that already exist.
 *
 * IMPORTANT: Replace GLOBAL_TOKENS and SEMANTIC_TOKENS with the approved token
 * plan from Phase 1 before running. Primitives MUST be created before semantics.
 *
 * Usage: paste into two sequential execute_code calls:
 *   Call 1: run with mode = 'global'  → creates primitive tokens
 *   Call 2: run with mode = 'semantic' → creates semantic tokens
 *
 * ⚠️  Verify TokenCatalog API shape with:
 *     penpot_api_info({ type: 'TokenCatalog' })
 *     penpot_api_info({ type: 'TokenData' })
 */

// ── REPLACE: fill in from approved Phase 1 plan ───────────────────────────
const GLOBAL_TOKENS = [
  // Colors (primitives)
  { name: 'color.blue.500',  type: 'color',         value: '#3B82F6', description: 'Blue 500' },
  { name: 'color.blue.700',  type: 'color',         value: '#1D4ED8', description: 'Blue 700' },
  { name: 'color.gray.50',   type: 'color',         value: '#F9FAFB', description: 'Gray 50' },
  { name: 'color.gray.900',  type: 'color',         value: '#111827', description: 'Gray 900' },
  { name: 'color.white',     type: 'color',         value: '#FFFFFF', description: 'White' },
  // Spacing
  { name: 'spacing.xs',      type: 'spacing',       value: '4',  description: '4px' },
  { name: 'spacing.sm',      type: 'spacing',       value: '8',  description: '8px' },
  { name: 'spacing.md',      type: 'spacing',       value: '16', description: '16px' },
  { name: 'spacing.lg',      type: 'spacing',       value: '24', description: '24px' },
  { name: 'spacing.xl',      type: 'spacing',       value: '32', description: '32px' },
  // Border radius
  { name: 'radius.sm',       type: 'border-radius', value: '4',    description: '4px' },
  { name: 'radius.md',       type: 'border-radius', value: '8',    description: '8px' },
  { name: 'radius.full',     type: 'border-radius', value: '9999', description: 'Full pill' },
  // Typography
  { name: 'font.size.sm',    type: 'font-size',     value: '14', description: '14px' },
  { name: 'font.size.base',  type: 'font-size',     value: '16', description: '16px — body base' },
  { name: 'font.size.xl',    type: 'font-size',     value: '20', description: '20px' },
  { name: 'font.weight.regular',  type: 'font-weight', value: '400', description: 'Regular' },
  { name: 'font.weight.semibold', type: 'font-weight', value: '600', description: 'Semibold' },
  { name: 'font.weight.bold',     type: 'font-weight', value: '700', description: 'Bold' },
];

const SEMANTIC_TOKENS = [
  // Semantic colors (expressions referencing primitives)
  { name: 'color.bg.primary',      type: 'color', value: '{color.white}',    description: 'Primary background' },
  { name: 'color.bg.surface',      type: 'color', value: '{color.gray.50}',  description: 'Surface / card background' },
  { name: 'color.text.primary',    type: 'color', value: '{color.gray.900}', description: 'Primary text' },
  { name: 'color.brand.primary',   type: 'color', value: '{color.blue.500}', description: 'Brand primary — CTA, links' },
  { name: 'color.brand.hover',     type: 'color', value: '{color.blue.700}', description: 'Brand hover state' },
];

const MODE = 'global';  // ← change to 'semantic' for the second call
const RUN_ID = 'infer-tokens-REPLACE-ME'; // ← replace with actual run ID
// ─────────────────────────────────────────────────────────────────────────────

const tokensToCreate = MODE === 'global' ? GLOBAL_TOKENS : SEMANTIC_TOKENS;

async function createTokenBatch(tokenDefs, runId) {
  const catalog = penpot.library.local.tokens;
  if (!catalog) {
    return { error: 'TokenCatalog not available. Call penpot_api_info({ type: "LibraryLocal" }) to verify the tokens API path.' };
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

  for (const def of tokenDefs) {
    if (existingByName.has(def.name)) {
      skipped.push({ name: def.name, id: existingByName.get(def.name).id });
      continue;
    }

    try {
      const token = await catalog.createToken({
        name: def.name,
        type: def.type,
        value: String(def.value),
        description: def.description || '',
      });
      created.push({ name: token.name, id: token.id, type: token.type, value: token.value });
      existingByName.set(def.name, token);
    } catch (e) {
      errors.push({ name: def.name, error: e.message });
    }
  }

  return {
    runId,
    mode: MODE,
    created,
    skipped,
    errors,
    summary: {
      total: tokenDefs.length,
      createdCount: created.length,
      skippedCount: skipped.length,
      errorCount: errors.length,
    },
  };
}

return await createTokenBatch(tokensToCreate, RUN_ID);
