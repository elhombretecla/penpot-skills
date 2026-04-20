# Phase 1: Data Collection — Accessibility Inspection

All data collection is read-only via `execute_code`. Run this phase before any analysis.

---

## Master Collection Script

Run this single script to collect all data needed for all accessibility checks in one call:

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

const textNodes = [];
const interactiveElements = [];
const images = [];
const allShapes = [];

for (const shape of shapes) {
  // ── Text nodes (for contrast + legibility checks) ─────────────────────────
  if (shape.type === 'text' && shape.fontSize) {
    const textFill = shape.fills && shape.fills.find(f => f.fillType === 'solid');
    const parent = shapes.find(s => s.id === shape.parentId);
    const bgFill = parent && parent.fills && parent.fills.find(f => f.fillType === 'solid');

    textNodes.push({
      id: shape.id,
      name: shape.name,
      fontSize: shape.fontSize,
      fontWeight: shape.fontWeight || 400,
      lineHeight: shape.lineHeight || null,
      letterSpacing: shape.letterSpacing || 0,
      textColor: textFill?.fillColor || null,
      textOpacity: textFill?.fillOpacity ?? 1,
      bgColor: bgFill?.fillColor || null,
      bgOpacity: bgFill?.fillOpacity ?? 1,
      characters: shape.characters ? shape.characters.substring(0, 80) : '',
      parentId: shape.parentId,
      parentName: parent?.name || null,
    });
  }

  // ── Interactive elements (for touch target + focus checks) ────────────────
  const name = (shape.name || '').toLowerCase();
  const isInteractiveByName = /button|btn|link|checkbox|radio|toggle|tab|chip|select|cta|icon-btn/.test(name);
  const isInteractiveBySize = shape.type === 'frame' &&
    (shape.width || 0) <= 300 && (shape.height || 0) <= 80 &&
    shape.fills && shape.fills.length > 0;

  if (isInteractiveByName || isInteractiveBySize) {
    interactiveElements.push({
      id: shape.id,
      name: shape.name,
      type: shape.type,
      width: Math.round(shape.width || 0),
      height: Math.round(shape.height || 0),
      x: Math.round(shape.x || 0),
      y: Math.round(shape.y || 0),
      hasTextChild: shape.children ? shape.children.some(c => c.type === 'text') : false,
      isComponentInstance: !!shape.componentId && !shape.isMainComponent,
    });
  }

  // ── Images (for alt text check) ──────────────────────────────────────────
  const hasImageFill = shape.fills && shape.fills.some(f => f.fillType === 'image');
  const isImageType = shape.type === 'image';
  const isNamedImage = /^img/i.test(shape.name || '');

  if (hasImageFill || isImageType || isNamedImage) {
    let altText = null;
    let isDecorative = false;
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

  // ── All shapes summary ────────────────────────────────────────────────────
  allShapes.push({
    id: shape.id,
    name: shape.name,
    type: shape.type,
    width: Math.round(shape.width || 0),
    height: Math.round(shape.height || 0),
  });
}

// ── Check for component focus variants ───────────────────────────────────────
const library = penpot.library.local;
const componentNames = library.components.map(c => c.name.toLowerCase());
const focusVariantReport = library.components
  .filter(c => /button|input|link|checkbox|radio|select|toggle/i.test(c.name))
  .map(c => ({
    id: c.id,
    name: c.name,
    hasFocusVariant: componentNames.some(n =>
      n.includes(c.name.toLowerCase().split('/')[0]) &&
      /focus|focused/.test(n)
    ),
  }));

return {
  pageId: page.id,
  pageName: page.name,
  totalShapes: shapes.length,
  textNodeCount: textNodes.length,
  interactiveElementCount: interactiveElements.length,
  imageCount: images.length,
  textNodes,
  interactiveElements,
  images,
  focusVariantReport,
};
```

---

## Handling Large Pages

If a page has > 500 shapes, split the collection into two calls:
1. First call: collect `textNodes` and `images`
2. Second call: collect `interactiveElements` and `focusVariantReport`

This avoids timeout issues in `execute_code`.
