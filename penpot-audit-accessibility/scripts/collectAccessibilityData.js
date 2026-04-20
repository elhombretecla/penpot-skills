/**
 * collectAccessibilityData.js
 *
 * Phase 1 — Collect all data needed for the accessibility audit from the current page.
 * Read-only. No mutations.
 *
 * Returns structured data for all accessibility checks:
 *   - textNodes: font size, weight, fill color, background color (for contrast)
 *   - interactiveElements: dimensions (for touch target checks)
 *   - images: alt text presence (for 1.1.1)
 *   - headings: structure (for 1.3.1 / 2.4.6)
 *   - focusVariants: component focus states (for 2.4.7)
 *   - colorOnlyIndicators: potential single-color status shapes (for 1.4.1)
 *
 * Usage: paste into execute_code. Pass result to local analysis functions.
 */

const page = penpot.currentPage;
const allShapes = page.findShapes();

// Build parent lookup for background color resolution
const shapesById = new Map(allShapes.map(s => [s.id, s]));

function getEffectiveBg(shape) {
  // Walk up the parent chain to find the first solid fill
  let current = shape;
  let depth = 0;
  while (current && depth < 10) {
    if (current.parentId) {
      const parent = shapesById.get(current.parentId);
      if (parent && parent.fills) {
        const solidFill = parent.fills.find(f => f.fillType === 'solid' && (f.fillOpacity ?? 1) > 0.1);
        if (solidFill) {
          return { color: solidFill.fillColor, opacity: solidFill.fillOpacity ?? 1, shapeName: parent.name };
        }
      }
      current = parent;
    } else {
      break;
    }
    depth++;
  }
  return null; // No solid background found
}

// ── 1. Text nodes (contrast + legibility) ────────────────────────────────────
const textNodes = [];
for (const shape of allShapes) {
  if (shape.type !== 'text' || !shape.fontSize) continue;

  const textFill = shape.fills && shape.fills.find(f => f.fillType === 'solid');
  const bg = getEffectiveBg(shape);

  textNodes.push({
    id: shape.id,
    name: shape.name,
    characters: shape.characters ? shape.characters.substring(0, 80) : '',
    fontSize: shape.fontSize,
    fontWeight: shape.fontWeight || 400,
    lineHeight: shape.lineHeight || null,
    letterSpacing: shape.letterSpacing || 0,
    textColor: textFill?.fillColor || null,
    textOpacity: textFill?.fillOpacity ?? 1,
    bgColor: bg?.color || null,
    bgOpacity: bg?.opacity ?? 1,
    bgSource: bg?.shapeName || null,
  });
}

// ── 2. Interactive elements (touch targets) ───────────────────────────────────
const interactiveElements = [];
for (const shape of allShapes) {
  const name = (shape.name || '').toLowerCase();
  const looksInteractive =
    /button|btn|\bcta\b|link|checkbox|radio|toggle|tab|chip|select|icon-btn|input/.test(name);

  const looksLikeButton =
    shape.type === 'frame' &&
    (shape.width || 0) > 0 && (shape.width || 0) <= 320 &&
    (shape.height || 0) > 0 && (shape.height || 0) <= 80 &&
    shape.fills && shape.fills.some(f => f.fillType === 'solid');

  if (!looksInteractive && !looksLikeButton) continue;

  interactiveElements.push({
    id: shape.id,
    name: shape.name,
    type: shape.type,
    width: Math.round(shape.width || 0),
    height: Math.round(shape.height || 0),
    x: Math.round(shape.x || 0),
    y: Math.round(shape.y || 0),
    isComponentInstance: !!shape.componentId && !shape.isMainComponent,
    hasTextChild: shape.children ? shape.children.some(c => c.type === 'text') : false,
  });
}

// ── 3. Images (alt text) ──────────────────────────────────────────────────────
const images = [];
for (const shape of allShapes) {
  const hasImageFill = shape.fills && shape.fills.some(f => f.fillType === 'image');
  const isImage = shape.type === 'image' || /^img[-_]/i.test(shape.name || '');

  if (!hasImageFill && !isImage) continue;

  let altText = null, isDecorative = false;
  try {
    altText = shape.getPluginData?.('alt') || shape.getPluginData?.('aria-label') || null;
    isDecorative = shape.getPluginData?.('decorative') === 'true';
  } catch (_) {}

  images.push({
    id: shape.id,
    name: shape.name,
    width: Math.round(shape.width || 0),
    height: Math.round(shape.height || 0),
    hasAlt: !!altText,
    altText,
    isDecorative,
  });
}

// ── 4. Heading structure ──────────────────────────────────────────────────────
const headings = allShapes
  .filter(s => s.type === 'text' && (
    /^h[1-6][-_ ]/i.test(s.name || '') ||
    (s.fontSize >= 24 && (s.fontWeight || 400) >= 600) ||
    (s.fontSize >= 36)
  ))
  .sort((a, b) => (a.y || 0) - (b.y || 0))
  .map(s => ({
    id: s.id,
    name: s.name,
    fontSize: s.fontSize,
    fontWeight: s.fontWeight || 400,
    y: Math.round(s.y || 0),
    characters: s.characters ? s.characters.substring(0, 80) : '',
    inferredLevel: s.fontSize >= 48 ? 'h1'
      : s.fontSize >= 36 ? 'h1-h2'
      : s.fontSize >= 28 ? 'h2'
      : s.fontSize >= 24 ? 'h2-h3'
      : 'h3+',
  }));

// ── 5. Color-only indicators ──────────────────────────────────────────────────
const colorOnlyIndicators = allShapes.filter(s => {
  const isSmall = (s.width || 0) <= 16 && (s.height || 0) <= 16;
  const isCircle = s.type === 'ellipse' || (s.borderRadius || 0) >= 999;
  const hasSolidFill = s.fills && s.fills.some(f => f.fillType === 'solid');
  const noTextChildren = !s.children || !s.children.some(c => c.type === 'text');
  return isSmall && isCircle && hasSolidFill && noTextChildren;
}).map(s => ({
  id: s.id,
  name: s.name,
  width: Math.round(s.width || 0),
  height: Math.round(s.height || 0),
  fillColor: s.fills?.find(f => f.fillType === 'solid')?.fillColor || null,
}));

// ── 6. Focus state variants ───────────────────────────────────────────────────
const library = penpot.library.local;
const allComponentNames = library.components.map(c => c.name.toLowerCase());
const focusVariantReport = library.components
  .filter(c => /button|input|link|checkbox|radio|select|toggle/i.test(c.name))
  .map(c => {
    const baseName = c.name.toLowerCase().split('/')[0].split(' ')[0];
    const hasFocus = allComponentNames.some(n => n.includes(baseName) && /focus|focused/.test(n));
    return { id: c.id, name: c.name, hasFocusVariant: hasFocus };
  });

return {
  pageId: page.id,
  pageName: page.name,
  totalShapes: allShapes.length,
  summary: {
    textNodes: textNodes.length,
    interactiveElements: interactiveElements.length,
    images: images.length,
    headings: headings.length,
    colorOnlyIndicators: colorOnlyIndicators.length,
    interactiveComponentsWithFocusCheck: focusVariantReport.length,
  },
  textNodes,
  interactiveElements,
  images,
  headings,
  colorOnlyIndicators,
  focusVariantReport,
};
