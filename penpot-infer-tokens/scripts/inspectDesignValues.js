/**
 * inspectDesignValues.js
 *
 * Phase 0 — Extract all unique visual values from the current Penpot page.
 * Read-only. No mutations.
 *
 * Returns:
 *   - colors: all unique fill and stroke colors with usage counts and roles
 *   - radii: all unique border-radius values
 *   - spacings: all unique gap/padding values from flex layouts
 *   - fonts: all unique font-family/size/weight combinations
 *   - existingTokens: any tokens already in the TokenCatalog
 *
 * Usage: paste into an execute_code call. Returns structured data for Phase 1 inference.
 */

const page = penpot.currentPage;
const shapes = page.findShapes();

const colorUsage = new Map();
const radiiMap = new Map();
const spacingMap = new Map();
const fontMap = new Map();

for (const shape of shapes) {
  // ── Fill colors ──────────────────────────────────────────────────────────
  if (shape.fills) {
    for (const fill of shape.fills) {
      if (fill.fillType === 'solid' && fill.fillColor) {
        const hex = fill.fillColor.toLowerCase();
        if (!colorUsage.has(hex)) {
          colorUsage.set(hex, { count: 0, shapeIds: [], roles: new Set(), alreadyBound: false });
        }
        const entry = colorUsage.get(hex);
        entry.count++;
        if (entry.shapeIds.length < 5) entry.shapeIds.push(shape.id);
        if (shape.type === 'text') entry.roles.add('text-fill');
        else if ((shape.width || 0) > 400) entry.roles.add('background');
        else entry.roles.add('element-fill');
        if (fill.fillColorRefId) entry.alreadyBound = true;
      }
    }
  }

  // ── Stroke colors ─────────────────────────────────────────────────────────
  if (shape.strokes) {
    for (const stroke of shape.strokes) {
      if (stroke.strokeColor) {
        const hex = stroke.strokeColor.toLowerCase();
        if (!colorUsage.has(hex)) {
          colorUsage.set(hex, { count: 0, shapeIds: [], roles: new Set(), alreadyBound: false });
        }
        const entry = colorUsage.get(hex);
        entry.count++;
        if (entry.shapeIds.length < 5) entry.shapeIds.push(shape.id);
        entry.roles.add('stroke');
      }
    }
  }

  // ── Border radius ─────────────────────────────────────────────────────────
  if (shape.borderRadius !== undefined && shape.borderRadius !== null && shape.borderRadius > 0) {
    const r = Math.round(shape.borderRadius);
    if (!radiiMap.has(r)) radiiMap.set(r, { count: 0, shapeIds: [] });
    radiiMap.get(r).count++;
    if (radiiMap.get(r).shapeIds.length < 5) radiiMap.get(r).shapeIds.push(shape.id);
  }

  // ── Typography ────────────────────────────────────────────────────────────
  if (shape.type === 'text' && shape.fontSize) {
    const family = shape.fontFamily || 'unknown';
    const size = shape.fontSize;
    const weight = shape.fontWeight || 400;
    const key = `${family}|${size}|${weight}`;
    if (!fontMap.has(key)) {
      fontMap.set(key, {
        count: 0,
        shapeIds: [],
        fontFamily: family,
        fontSize: size,
        fontWeight: weight,
        lineHeight: shape.lineHeight,
        letterSpacing: shape.letterSpacing,
        sampleText: null,
      });
    }
    const entry = fontMap.get(key);
    entry.count++;
    if (entry.shapeIds.length < 3) entry.shapeIds.push(shape.id);
    if (!entry.sampleText && shape.characters) {
      entry.sampleText = shape.characters.substring(0, 40);
    }
  }

  // ── Flex layout spacings ──────────────────────────────────────────────────
  if (shape.layout) {
    const addSpacing = (val, source) => {
      if (!val || val === 0) return;
      const v = Math.round(val);
      if (!spacingMap.has(v)) spacingMap.set(v, { count: 0, sources: [] });
      spacingMap.get(v).count++;
      if (spacingMap.get(v).sources.length < 5) {
        spacingMap.get(v).sources.push({ shapeId: shape.id, source });
      }
    };

    if (shape.layout.gap) addSpacing(shape.layout.gap, 'gap');
    const p = shape.layout.padding;
    if (p) {
      addSpacing(p.top, 'padding-top');
      addSpacing(p.right, 'padding-right');
      addSpacing(p.bottom, 'padding-bottom');
      addSpacing(p.left, 'padding-left');
    }
  }
}

// ── Check existing TokenCatalog ──────────────────────────────────────────────
let existingTokens = [];
try {
  const catalog = penpot.library.local.tokens;
  if (catalog) {
    existingTokens = Object.values(catalog).map(t => ({
      name: t.name,
      type: t.type,
      value: t.value,
    }));
  }
} catch (_) {}

return {
  pageId: page.id,
  pageName: page.name,
  totalShapes: shapes.length,
  colors: [...colorUsage.entries()]
    .map(([hex, v]) => ({
      hex,
      count: v.count,
      roles: [...v.roles],
      alreadyBound: v.alreadyBound,
      sampleShapeIds: v.shapeIds,
    }))
    .sort((a, b) => b.count - a.count),
  radii: [...radiiMap.entries()]
    .map(([value, v]) => ({ value, count: v.count, sampleShapeIds: v.shapeIds }))
    .sort((a, b) => a.value - b.value),
  spacings: [...spacingMap.entries()]
    .map(([value, v]) => ({ value, count: v.count }))
    .sort((a, b) => a.value - b.value),
  fonts: [...fontMap.values()].sort((a, b) => b.count - a.count),
  existingTokenCount: existingTokens.length,
  existingTokens,
};
