/**
 * createTokenSet.js
 *
 * Creates a batch of primitive tokens in the Penpot TokenCatalog.
 * Primitive tokens hold raw values (no expressions). These are created in Phase 1a.
 *
 * Idempotent: skips any token whose name already exists in the catalog.
 *
 * Usage: embed this function in an execute_code call, then invoke it with
 * a list of token definitions. Always return the result for state ledger tracking.
 *
 * ⚠️  Before using, verify the TokenCatalog API shape with:
 *     penpot_api_info({ type: 'TokenCatalog' })
 *     penpot_api_info({ type: 'TokenData' })
 */

/**
 * @typedef {Object} TokenDefinition
 * @property {string} name        — dot-notation name (e.g. "color.blue.500")
 * @property {string} type        — Penpot token type ("color", "spacing", "border-radius", etc.)
 * @property {string} value       — raw value (e.g. "#3B82F6" or "16")
 * @property {string} [description] — optional human-readable description
 */

/**
 * Creates multiple tokens idempotently.
 *
 * @param {TokenDefinition[]} tokenDefs
 * @param {string} runId — state ledger run ID for tracking
 * @returns {{ created: Object[], skipped: Object[], errors: Object[] }}
 */
async function createTokenSet(tokenDefs, runId) {
  const catalog = penpot.library.local.tokens;
  if (!catalog) {
    return { error: 'TokenCatalog not available. Check penpot_api_info for the correct API path.' };
  }

  // Build a lookup map of existing tokens for O(1) idempotency checks
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
    // Idempotency check
    if (existingByName.has(def.name)) {
      const existing = existingByName.get(def.name);
      skipped.push({ name: def.name, id: existing.id, reason: 'already exists' });
      continue;
    }

    try {
      const token = await catalog.createToken({
        name: def.name,
        type: def.type,
        value: String(def.value),
        description: def.description || '',
      });

      created.push({
        name: token.name,
        id: token.id,
        type: token.type,
        value: token.value,
      });

      // Update local lookup to prevent duplicate creation within this batch
      existingByName.set(def.name, token);
    } catch (e) {
      errors.push({
        name: def.name,
        error: e.message,
      });
    }
  }

  return {
    runId,
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

// ── Example invocation ───────────────────────────────────────────────────────
// Replace this with your actual token list from the scope lock plan.

const PRIMITIVE_COLOR_TOKENS = [
  { name: 'color.blue.50',   type: 'color', value: '#EFF6FF', description: 'Blue 50' },
  { name: 'color.blue.100',  type: 'color', value: '#DBEAFE', description: 'Blue 100' },
  { name: 'color.blue.200',  type: 'color', value: '#BFDBFE', description: 'Blue 200' },
  { name: 'color.blue.300',  type: 'color', value: '#93C5FD', description: 'Blue 300' },
  { name: 'color.blue.400',  type: 'color', value: '#60A5FA', description: 'Blue 400' },
  { name: 'color.blue.500',  type: 'color', value: '#3B82F6', description: 'Blue 500 — primary brand' },
  { name: 'color.blue.600',  type: 'color', value: '#2563EB', description: 'Blue 600' },
  { name: 'color.blue.700',  type: 'color', value: '#1D4ED8', description: 'Blue 700' },
  { name: 'color.blue.800',  type: 'color', value: '#1E40AF', description: 'Blue 800' },
  { name: 'color.blue.900',  type: 'color', value: '#1E3A8A', description: 'Blue 900' },

  { name: 'color.gray.50',   type: 'color', value: '#F9FAFB', description: 'Gray 50' },
  { name: 'color.gray.100',  type: 'color', value: '#F3F4F6', description: 'Gray 100' },
  { name: 'color.gray.200',  type: 'color', value: '#E5E7EB', description: 'Gray 200' },
  { name: 'color.gray.300',  type: 'color', value: '#D1D5DB', description: 'Gray 300' },
  { name: 'color.gray.400',  type: 'color', value: '#9CA3AF', description: 'Gray 400' },
  { name: 'color.gray.500',  type: 'color', value: '#6B7280', description: 'Gray 500' },
  { name: 'color.gray.600',  type: 'color', value: '#4B5563', description: 'Gray 600' },
  { name: 'color.gray.700',  type: 'color', value: '#374151', description: 'Gray 700' },
  { name: 'color.gray.800',  type: 'color', value: '#1F2937', description: 'Gray 800' },
  { name: 'color.gray.900',  type: 'color', value: '#111827', description: 'Gray 900' },

  { name: 'color.white',     type: 'color', value: '#FFFFFF', description: 'White' },
  { name: 'color.black',     type: 'color', value: '#000000', description: 'Black' },
];

const SPACING_TOKENS = [
  { name: 'spacing.xs',  type: 'spacing', value: '4',  description: 'Extra small (4px)' },
  { name: 'spacing.sm',  type: 'spacing', value: '8',  description: 'Small (8px)' },
  { name: 'spacing.md',  type: 'spacing', value: '16', description: 'Medium (16px)' },
  { name: 'spacing.lg',  type: 'spacing', value: '24', description: 'Large (24px)' },
  { name: 'spacing.xl',  type: 'spacing', value: '32', description: 'Extra large (32px)' },
  { name: 'spacing.2xl', type: 'spacing', value: '48', description: '2x Extra large (48px)' },
  { name: 'spacing.3xl', type: 'spacing', value: '64', description: '3x Extra large (64px)' },
];

const RADIUS_TOKENS = [
  { name: 'radius.none', type: 'border-radius', value: '0',    description: 'No radius' },
  { name: 'radius.sm',   type: 'border-radius', value: '4',    description: 'Small radius' },
  { name: 'radius.md',   type: 'border-radius', value: '8',    description: 'Medium radius' },
  { name: 'radius.lg',   type: 'border-radius', value: '12',   description: 'Large radius' },
  { name: 'radius.xl',   type: 'border-radius', value: '16',   description: 'Extra large radius' },
  { name: 'radius.2xl',  type: 'border-radius', value: '24',   description: '2x Extra large radius' },
  { name: 'radius.full', type: 'border-radius', value: '9999', description: 'Full pill radius' },
];

const RUN_ID = 'penpot-dsb-REPLACE-ME';  // ← replace with actual run ID from state ledger

// Run: create all primitive tokens
const result = await createTokenSet(
  [...PRIMITIVE_COLOR_TOKENS, ...SPACING_TOKENS, ...RADIUS_TOKENS],
  RUN_ID
);

return result;
