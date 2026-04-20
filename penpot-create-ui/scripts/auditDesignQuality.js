/**
 * auditDesignQuality.js
 *
 * Phase 4 — Inspect the current screen for measurable quality metrics.
 * Read-only. Returns data for the self-evaluation framework in references/05.
 *
 * Run this after Phase 3 (screen assembly) to collect evidence for the critique.
 * The actual scoring is done in Claude's context (not in execute_code).
 *
 * USAGE: Set SCREEN_FRAME_ID to the screen wrapper's ID.
 * Returns a structured audit report for each quality criterion.
 */

const SCREEN_FRAME_ID = 'REPLACE_WITH_SCREEN_FRAME_ID';
const BRAND_COLOR_HEX = '#6366F1';  // ← replace with actual brand/accent color hex

const page = penpot.currentPage;
const allShapes = page.findShapes();
const screenFrame = allShapes.find(s => s.id === SCREEN_FRAME_ID);
if (!screenFrame) return { error: `Screen frame not found: ${SCREEN_FRAME_ID}` };

const screenShapes = screenFrame.findShapes ? screenFrame.findShapes() : allShapes.filter(s => s.parentId === SCREEN_FRAME_ID);

// ── 1. Spacing consistency ────────────────────────────────────────────────────
const topLevelChildren = (screenFrame.children || []).map(c => ({ id: c.id, name: c.name, y: c.y || 0, height: c.height || 0 }));
const sorted = topLevelChildren.sort((a, b) => a.y - b.y);
const sectionGaps = [];
for (let i = 1; i < sorted.length; i++) {
  const prev = sorted[i-1];
  const curr = sorted[i];
  const gap = curr.y - (prev.y + prev.height);
  sectionGaps.push({
    between: [prev.name, curr.name],
    gap,
    isOnGrid: gap % 8 === 0,
    isNegative: gap < 0,
  });
}

// ── 2. Typography diversity ───────────────────────────────────────────────────
const textNodes = screenShapes.filter(s => s.type === 'text' && s.fontSize);
const fontSizeSet = new Set(textNodes.map(s => s.fontSize));
const fontWeightSet = new Set(textNodes.map(s => s.fontWeight || 400));
const typeSizes = [...fontSizeSet].sort((a, b) => a - b);
const typeWeights = [...fontWeightSet].sort();

const typeAudit = {
  distinctSizes: typeSizes.length,
  sizes: typeSizes,
  distinctWeights: typeWeights.length,
  weights: typeWeights,
  tooManySizes: typeSizes.length > 5,
  hasHeadingWeights: typeWeights.some(w => w >= 600),
  smallestSize: Math.min(...typeSizes),
  largestSize: Math.max(...typeSizes),
  sizeHierarchySpread: Math.max(...typeSizes) - Math.min(...typeSizes),
};

// ── 3. Color usage ────────────────────────────────────────────────────────────
const brandHex = BRAND_COLOR_HEX.toLowerCase();
const allFills = screenShapes.flatMap(s => s.fills || []).filter(f => f.fillType === 'solid' && f.fillColor);
const brandFillCount = allFills.filter(f => f.fillColor.toLowerCase() === brandHex).length;
const totalFills = allFills.length;
const brandFillRatio = totalFills > 0 ? (brandFillCount / totalFills) : 0;

// Check for pure black/white (anti-pattern)
const pureBlack = allFills.filter(f => f.fillColor === '#000000');
const pureWhite = allFills.filter(f => f.fillColor === '#FFFFFF');

// ── 4. Component binding check ────────────────────────────────────────────────
// Find shapes that look like buttons but aren't component instances
const buttonLikeNonComponents = screenShapes.filter(s =>
  s.type === 'frame' &&
  (s.height >= 28 && s.height <= 56) &&
  (s.width >= 60 && s.width <= 280) &&
  s.fills && s.fills.some(f => f.fillType === 'solid') &&
  !s.componentId
);

const componentInstances = screenShapes.filter(s => !!s.componentId && !s.isMainComponent);

// ── 5. Hardcoded fill check (should all be library-bound) ─────────────────────
const hardcodedFills = screenShapes
  .filter(s => s.fills && s.fills.some(f => f.fillType === 'solid' && !f.fillColorRefId))
  .map(s => ({
    id: s.id,
    name: s.name,
    fills: (s.fills || []).filter(f => f.fillType === 'solid' && !f.fillColorRefId).map(f => f.fillColor),
  }));

// ── 6. Non-component button count ────────────────────────────────────────────
const manualButtonCount = buttonLikeNonComponents.length;
const componentInstanceCount = componentInstances.length;

// ── 7. Content quality check (no Lorem Ipsum, no generic placeholder) ─────────
const loremNodes = textNodes.filter(s =>
  s.characters && /lorem ipsum|title here|description text|placeholder|your text|heading goes here/i.test(s.characters)
);

// ── Compile report ────────────────────────────────────────────────────────────
return {
  screenFrameId: SCREEN_FRAME_ID,
  totalShapes: screenShapes.length,

  spacingAudit: {
    sectionCount: topLevelChildren.length,
    sectionGaps,
    offGridGaps: sectionGaps.filter(g => !g.isOnGrid),
    negativeGaps: sectionGaps.filter(g => g.isNegative),
    uniqueGapValues: [...new Set(sectionGaps.map(g => g.gap))].sort((a, b) => a - b),
    passesConsistency: sectionGaps.filter(g => !g.isOnGrid).length === 0,
  },

  typographyAudit: {
    ...typeAudit,
    passes: !typeAudit.tooManySizes && typeAudit.hasHeadingWeights && typeAudit.smallestSize >= 10,
  },

  colorAudit: {
    totalFills,
    brandFillCount,
    brandFillRatio: Math.round(brandFillRatio * 100) + '%',
    brandOverused: brandFillRatio > 0.25,
    hasPureBlack: pureBlack.length > 0,
    hasPureWhite: pureWhite.length > 0,
    pureBlackInstances: pureBlack.length,
    pureWhiteInstances: pureWhite.length,
    passes: !pureBlack.length && brandFillRatio <= 0.25,
  },

  componentAudit: {
    componentInstances: componentInstanceCount,
    manualButtonLike: manualButtonCount,
    passes: manualButtonCount === 0,
    warning: manualButtonCount > 0
      ? `${manualButtonCount} button-like shapes are not component instances`
      : null,
  },

  tokenBindingAudit: {
    hardcodedFillCount: hardcodedFills.length,
    hardcodedFills: hardcodedFills.slice(0, 10), // first 10 for review
    passes: hardcodedFills.length === 0,
  },

  contentAudit: {
    loremIpsumFound: loremNodes.length,
    loremNodes: loremNodes.map(s => ({ name: s.name, text: s.characters?.substring(0, 60) })),
    passes: loremNodes.length === 0,
  },

  overallFlags: [
    ...(sectionGaps.filter(g => !g.isOnGrid).length > 0 ? ['Off-grid spacing found'] : []),
    ...(typeAudit.tooManySizes ? [`Too many type sizes: ${typeAudit.distinctSizes}`] : []),
    ...(pureBlack.length > 0 ? ['Pure #000000 fills found'] : []),
    ...(brandFillRatio > 0.25 ? ['Brand color overused (> 25% of fills)'] : []),
    ...(manualButtonCount > 0 ? [`${manualButtonCount} non-component button-like shapes`] : []),
    ...(loremNodes.length > 0 ? ['Placeholder text found'] : []),
  ],
};
