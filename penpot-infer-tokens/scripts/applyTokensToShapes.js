/**
 * applyTokensToShapes.js
 *
 * Phase 3 — Bind the semantic tokens created in Phase 2 back to the shapes that
 * use the corresponding values.
 *
 * Uses the native Penpot design-token binding:
 *   shape.applyToken(token: Token, properties: TokenProperty[])
 *
 * Application is ASYNCHRONOUS — effects (resolved value on the shape) settle
 * after ~100ms. Inspect after a short delay to verify.
 *
 * TokenProperty cheat-sheet (use the strings verbatim):
 *   color:           "fill", "strokeColor"
 *   borderRadius:    "all" (shortcut for all 4 corners), or individual corners
 *                    ("borderRadiusTopLeft", "borderRadiusTopRight",
 *                     "borderRadiusBottomRight", "borderRadiusBottomLeft")
 *   dimension:       "x", "y", "strokeWidth"
 *   fontSizes:       "fontSize"
 *   fontWeights:     "fontWeight"
 *   fontFamilies:    "fontFamilies"
 *   letterSpacing:   "letterSpacing"
 *   opacity:         "opacity"
 *   sizing:          "width", "height", "layoutItemMinW", "layoutItemMaxW",
 *                    "layoutItemMinH", "layoutItemMaxH"
 *   spacing:         "rowGap", "columnGap",
 *                    "paddingLeft", "paddingTop", "paddingRight", "paddingBottom",
 *                    "marginLeft", "marginTop", "marginRight", "marginBottom"
 *
 * The MAP constants below are filled with the Phase 1 plan that the user
 * approved: which raw value maps to which semantic token name.
 *
 * Process shapes in batches of 50 via BATCH_START / BATCH_END.
 */

const RUN_ID = 'infer-tokens-REPLACE-ME';

// ── REPLACE: approved value → semantic token name mappings ──────────────────
const COLOR_TOKEN_MAP = {
  '#3b82f6': 'color.brand.primary',
  '#1d4ed8': 'color.brand.hover',
  '#f9fafb': 'color.bg.surface',
  '#111827': 'color.text.primary',
  '#ffffff': 'color.bg.primary',
};

const RADIUS_TOKEN_MAP = {
  4: 'radius.sm',
  8: 'radius.md',
  9999: 'radius.full',
};

const FONT_SIZE_TOKEN_MAP = {
  14: 'font.size.sm',
  16: 'font.size.base',
  20: 'font.size.xl',
};

const FONT_WEIGHT_TOKEN_MAP = {
  400: 'font.weight.regular',
  600: 'font.weight.semibold',
  700: 'font.weight.bold',
};

const SPACING_TOKEN_MAP = {
  4:  'spacing.xs',
  8:  'spacing.sm',
  16: 'spacing.md',
  24: 'spacing.lg',
  32: 'spacing.xl',
};

const BATCH_START = 0;
const BATCH_END   = 50;   // increment by 50 for each successive call
// ─────────────────────────────────────────────────────────────────────────────

function findToken(name) {
  if (!name) return null;
  return penpotUtils.findTokenByName(name) ?? null;
}

// Resolve all the tokens we'll need up-front so we fail loudly if a mapping
// points to a token that wasn't created in Phase 2.
function resolveMap(map) {
  const out = {};
  const missing = [];
  for (const [key, name] of Object.entries(map)) {
    const t = findToken(name);
    if (t) out[key] = t;
    else missing.push({ value: key, tokenName: name });
  }
  return { tokens: out, missing };
}

const colors    = resolveMap(COLOR_TOKEN_MAP);
const radii     = resolveMap(RADIUS_TOKEN_MAP);
const fontSizes = resolveMap(FONT_SIZE_TOKEN_MAP);
const fontWts   = resolveMap(FONT_WEIGHT_TOKEN_MAP);
const spacings  = resolveMap(SPACING_TOKEN_MAP);

const unresolved = [
  ...colors.missing.map(m => ({ ...m, kind: 'color' })),
  ...radii.missing.map(m => ({ ...m, kind: 'radius' })),
  ...fontSizes.missing.map(m => ({ ...m, kind: 'fontSize' })),
  ...fontWts.missing.map(m => ({ ...m, kind: 'fontWeight' })),
  ...spacings.missing.map(m => ({ ...m, kind: 'spacing' })),
];

const page = penpot.currentPage;
const allShapes = penpotUtils.findShapes(_ => true, page.root);
const batch = allShapes.slice(BATCH_START, BATCH_END);

const applied = [];
const skipped = [];
const errors  = [];

for (const shape of batch) {
  // Main-component shapes cannot be mutated in the MCP context
  if (shape.isMainComponent) {
    skipped.push({ id: shape.id, name: shape.name, reason: 'main component' });
    continue;
  }

  const actions = [];

  try {
    // Fills → "fill"
    if (shape.fills && shape.fills.length > 0) {
      for (const fill of shape.fills) {
        const isSolid = fill.fillType === undefined || fill.fillType === 'solid';
        if (!isSolid || !fill.fillColor) continue;
        const token = colors.tokens[fill.fillColor.toLowerCase()];
        if (token) {
          shape.applyToken(token, ['fill']);
          actions.push({ token: token.name, property: 'fill' });
          break; // one fill token per shape
        }
      }
    }

    // Strokes → "strokeColor"
    if (shape.strokes && shape.strokes.length > 0) {
      for (const stroke of shape.strokes) {
        if (!stroke.strokeColor) continue;
        const token = colors.tokens[stroke.strokeColor.toLowerCase()];
        if (token) {
          shape.applyToken(token, ['strokeColor']);
          actions.push({ token: token.name, property: 'strokeColor' });
          break;
        }
      }
    }

    // Border radius → "all" (covers all 4 corners)
    if (shape.borderRadius !== undefined && shape.borderRadius !== null && shape.borderRadius > 0) {
      const token = radii.tokens[Math.round(shape.borderRadius)];
      if (token) {
        shape.applyToken(token, ['all']);
        actions.push({ token: token.name, property: 'all (borderRadius)' });
      }
    }

    // Text: fontSize + fontWeight
    if (shape.type === 'text') {
      if (shape.fontSize !== undefined && shape.fontSize !== null) {
        const token = fontSizes.tokens[Math.round(shape.fontSize)];
        if (token) {
          shape.applyToken(token, ['fontSize']);
          actions.push({ token: token.name, property: 'fontSize' });
        }
      }
      if (shape.fontWeight !== undefined && shape.fontWeight !== null) {
        const token = fontWts.tokens[Number(shape.fontWeight)];
        if (token) {
          shape.applyToken(token, ['fontWeight']);
          actions.push({ token: token.name, property: 'fontWeight' });
        }
      }
    }

    // Flex layout spacings: rowGap, columnGap, padding
    if (shape.flex) {
      const f = shape.flex;
      const tryApply = (value, property) => {
        if (value === undefined || value === null || value === 0) return;
        const token = spacings.tokens[Math.round(value)];
        if (!token) return;
        shape.applyToken(token, [property]);
        actions.push({ token: token.name, property });
      };
      tryApply(f.rowGap,        'rowGap');
      tryApply(f.columnGap,     'columnGap');
      tryApply(f.topPadding,    'paddingTop');
      tryApply(f.rightPadding,  'paddingRight');
      tryApply(f.bottomPadding, 'paddingBottom');
      tryApply(f.leftPadding,   'paddingLeft');
    }

    // Grid layout spacings (same properties)
    if (shape.grid) {
      const g = shape.grid;
      const tryApply = (value, property) => {
        if (value === undefined || value === null || value === 0) return;
        const token = spacings.tokens[Math.round(value)];
        if (!token) return;
        shape.applyToken(token, [property]);
        actions.push({ token: token.name, property });
      };
      tryApply(g.rowGap,    'rowGap');
      tryApply(g.columnGap, 'columnGap');
    }

    if (actions.length === 0) {
      skipped.push({ id: shape.id, name: shape.name, reason: 'no matching values' });
    } else {
      applied.push({ id: shape.id, name: shape.name, type: shape.type, actions });
    }
  } catch (e) {
    errors.push({ id: shape.id, name: shape.name, error: e.message });
  }
}

return {
  runId: RUN_ID,
  batchRange: `${BATCH_START}–${BATCH_END}`,
  totalInBatch: batch.length,
  appliedCount: applied.length,
  skippedCount: skipped.length,
  errorCount: errors.length,
  unresolvedMappings: unresolved,
  applied,
  errors,
  progress: `${Math.min(BATCH_END, allShapes.length)} / ${allShapes.length} shapes`,
  note: 'Token binding is asynchronous — resolved values settle after ~100ms. Re-inspect to verify.',
};
