/**
 * createInferredTokens.js
 *
 * Phase 2 — Write the approved Phase 1 plan back into the Penpot file.
 *
 * This is what actually lands tokens in Penpot. It creates, in order:
 *   1. Token Sets       (containers — tokens must live inside a set)
 *   2. Tokens in sets   (primitives first, semantic second — ordering is meaningful)
 *   3. Token Themes     (presets that activate specific sets)
 *
 * Idempotent: skips sets, tokens, and themes that already exist.
 *
 * Replace `PLAN` with the Phase 1 structure the user approved, then run once via
 * execute_code. Sets/themes can reference slash-grouped names (e.g. 'color/light'),
 * which appear as folders in the Penpot Tokens panel.
 *
 * ── Verified Penpot Plugin API surface ──────────────────────────────────────
 *   penpot.library.local.tokens              → TokenCatalog
 *   catalog.sets: TokenSet[]                 (read)
 *   catalog.themes: TokenTheme[]             (read)
 *   catalog.addSet({ name }): TokenSet
 *   catalog.addTheme({ group, name }): TokenTheme
 *   set.tokens: Token[]
 *   set.addToken({ type, name, value }): Token        (synchronous)
 *   theme.activeSets: TokenSet[]
 *   theme.addSet(set): void
 *
 *   TokenType ∈
 *     "color" | "dimension" | "spacing" | "typography" | "shadow" | "opacity"
 *     | "borderRadius" | "borderWidth"
 *     | "fontWeights" | "fontSizes" | "fontFamilies"
 *     | "letterSpacing" | "textDecoration" | "textCase"
 *
 *   NOTE: types are camelCase and plural where the API defines them that way
 *   (fontSizes/fontWeights/fontFamilies). Do NOT use kebab-case — the API
 *   rejects "border-radius", "font-size", etc.
 *
 *   Semantic tokens reference primitives via {token.name} expressions, e.g.
 *     { type: 'color', name: 'color.bg.primary', value: '{color.white}' }
 */

const RUN_ID = 'infer-tokens-REPLACE-ME';

// ── The approved token plan ──────────────────────────────────────────────────
// `sets`   — ordered list of sets to create. Primitive sets first; semantic sets
//            reference them via {…} expressions and must come after.
// `themes` — presets. Each lists `activeSetNames` that will be attached to the
//            theme (must match a name in `sets` above, or an already-existing set).

const PLAN = {
  sets: [
    {
      name: 'primitives',
      tokens: [
        // Color primitives
        { type: 'color', name: 'color.blue.500', value: '#3B82F6' },
        { type: 'color', name: 'color.blue.700', value: '#1D4ED8' },
        { type: 'color', name: 'color.gray.50',  value: '#F9FAFB' },
        { type: 'color', name: 'color.gray.900', value: '#111827' },
        { type: 'color', name: 'color.white',    value: '#FFFFFF' },

        // Spacing
        { type: 'spacing', name: 'spacing.xs', value: '4'  },
        { type: 'spacing', name: 'spacing.sm', value: '8'  },
        { type: 'spacing', name: 'spacing.md', value: '16' },
        { type: 'spacing', name: 'spacing.lg', value: '24' },
        { type: 'spacing', name: 'spacing.xl', value: '32' },

        // Border radius (note: camelCase, not 'border-radius')
        { type: 'borderRadius', name: 'radius.sm',   value: '4'    },
        { type: 'borderRadius', name: 'radius.md',   value: '8'    },
        { type: 'borderRadius', name: 'radius.full', value: '9999' },

        // Font sizes (note: PLURAL — 'fontSizes', not 'font-size')
        { type: 'fontSizes', name: 'font.size.sm',   value: '14' },
        { type: 'fontSizes', name: 'font.size.base', value: '16' },
        { type: 'fontSizes', name: 'font.size.xl',   value: '20' },

        // Font weights (note: PLURAL — 'fontWeights')
        { type: 'fontWeights', name: 'font.weight.regular',  value: '400' },
        { type: 'fontWeights', name: 'font.weight.semibold', value: '600' },
        { type: 'fontWeights', name: 'font.weight.bold',     value: '700' },
      ],
    },
    {
      name: 'color/light',
      tokens: [
        { type: 'color', name: 'color.bg.primary',    value: '{color.white}'    },
        { type: 'color', name: 'color.bg.surface',    value: '{color.gray.50}'  },
        { type: 'color', name: 'color.text.primary',  value: '{color.gray.900}' },
        { type: 'color', name: 'color.brand.primary', value: '{color.blue.500}' },
        { type: 'color', name: 'color.brand.hover',   value: '{color.blue.700}' },
      ],
    },
    // Add color/dark, typography, shadow, etc. sets here from the approved plan.
  ],

  themes: [
    // Each theme activates a subset of sets. Only one theme per group can be
    // active at a time — use the `group` axis for light/dark, density, brand, etc.
    { group: 'Mode', name: 'Light', activeSetNames: ['primitives', 'color/light'] },
    // { group: 'Mode', name: 'Dark',  activeSetNames: ['primitives', 'color/dark'] },
  ],
};
// ─────────────────────────────────────────────────────────────────────────────

const catalog = penpot.library.local.tokens;
if (!catalog) {
  return {
    error: 'TokenCatalog not available at penpot.library.local.tokens. ' +
           'Verify with penpot_api_info({ type: "Library" }) that this Penpot version exposes tokens.',
  };
}

const existingSetsByName = new Map(catalog.sets.map(s => [s.name, s]));
const existingThemesByKey = new Map(
  catalog.themes.map(t => [t.group + '|' + t.name, t])
);

const setResults = [];
const tokenResults = { created: [], skipped: [], errors: [] };
const themeResults = [];

// 1. Create / reuse sets and add their tokens
for (const setDef of PLAN.sets) {
  let set = existingSetsByName.get(setDef.name);
  let setCreated = false;

  if (!set) {
    try {
      set = catalog.addSet({ name: setDef.name });
      existingSetsByName.set(setDef.name, set);
      setCreated = true;
    } catch (e) {
      setResults.push({ name: setDef.name, error: 'addSet failed: ' + e.message });
      continue;
    }
  }

  const existingTokensByName = new Map(set.tokens.map(t => [t.name, t]));

  for (const def of setDef.tokens) {
    if (existingTokensByName.has(def.name)) {
      tokenResults.skipped.push({ set: setDef.name, name: def.name });
      continue;
    }
    try {
      const token = set.addToken({
        type: def.type,
        name: def.name,
        value: String(def.value),
      });
      existingTokensByName.set(def.name, token);
      tokenResults.created.push({
        set: setDef.name,
        name: token.name,
        type: token.type,
        value: token.value,
      });
    } catch (e) {
      tokenResults.errors.push({
        set: setDef.name,
        name: def.name,
        type: def.type,
        value: def.value,
        error: e.message,
      });
    }
  }

  setResults.push({
    name: setDef.name,
    created: setCreated,
    tokenCount: set.tokens.length,
  });
}

// 2. Create / reuse themes and attach their active sets
for (const themeDef of PLAN.themes) {
  const key = themeDef.group + '|' + themeDef.name;
  let theme = existingThemesByKey.get(key);
  let themeCreated = false;

  if (!theme) {
    try {
      theme = catalog.addTheme({ group: themeDef.group, name: themeDef.name });
      existingThemesByKey.set(key, theme);
      themeCreated = true;
    } catch (e) {
      themeResults.push({
        group: themeDef.group,
        name: themeDef.name,
        error: 'addTheme failed: ' + e.message,
      });
      continue;
    }
  }

  const alreadyActive = new Set(theme.activeSets.map(s => s.name));
  const attached = [];
  const missing = [];

  for (const setName of themeDef.activeSetNames) {
    if (alreadyActive.has(setName)) continue;
    const targetSet = existingSetsByName.get(setName);
    if (!targetSet) {
      missing.push(setName);
      continue;
    }
    try {
      theme.addSet(targetSet);
      attached.push(setName);
    } catch (e) {
      themeResults.push({
        group: themeDef.group,
        name: themeDef.name,
        attachError: { setName, error: e.message },
      });
    }
  }

  themeResults.push({
    group: themeDef.group,
    name: themeDef.name,
    created: themeCreated,
    attachedSets: attached,
    missingSets: missing,
    totalActiveSets: theme.activeSets.length,
  });
}

return {
  runId: RUN_ID,
  sets: setResults,
  tokens: {
    createdCount: tokenResults.created.length,
    skippedCount: tokenResults.skipped.length,
    errorCount: tokenResults.errors.length,
    created: tokenResults.created,
    errors: tokenResults.errors,
  },
  themes: themeResults,
  summary: {
    setsInCatalog: catalog.sets.length,
    themesInCatalog: catalog.themes.length,
    note: 'If any token type was rejected, verify it uses camelCase (borderRadius, fontSizes, fontWeights, fontFamilies, letterSpacing, textDecoration, textCase).',
  },
};
