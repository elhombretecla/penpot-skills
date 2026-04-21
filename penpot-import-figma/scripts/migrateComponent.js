/**
 * migrateComponent.js
 *
 * Phase 3 — Migrate one Figma component (with variants) to Penpot.
 * PASTE INTO execute_code — customize per component before running.
 *
 * Pattern:
 *   1. Idempotency check
 *   2. Build base frame with correct flex layout
 *   3. Create children recursively (text, inner instances, icons)
 *   4. Apply token-bound fills/strokes
 *   5. Create VariantContainer with all variant frames
 *   6. Tag with plugin data, return IDs
 *
 * Run ONE component per execute_code call.
 * Validate with export_shape after each component.
 *
 * ⚠️  Replace COMPONENT_CONFIG and RUN_ID before running.
 */

const page = penpot.currentPage;
const library = penpot.library.local;

const RUN_ID = 'REPLACE_WITH_RUN_ID';
const FIGMA_COMPONENT_ID = 'REPLACE_WITH_FIGMA_NODE_ID';

// ── Component configuration (from IR) ────────────────────────────────────────
// Replace this with the actual component spec from the IR.

const COMPONENT_CONFIG = {
  name: 'Button',
  hasVariants: true,
  variants: [
    { name: 'Style=Primary, Size=Medium, State=Default', fill: 'color/brand/primary', text: 'color/text/inverse', border: null,                    w: 120, h: 40, radius: 8 },
    { name: 'Style=Primary, Size=Medium, State=Hover',   fill: 'color/brand/primary', text: 'color/text/inverse', border: null,                    w: 120, h: 40, radius: 8 },
    { name: 'Style=Primary, Size=Medium, State=Disabled',fill: 'color/brand/primary', text: 'color/text/inverse', border: null,                    w: 120, h: 40, radius: 8, opacity: 0.4 },
    { name: 'Style=Ghost, Size=Medium, State=Default',   fill: null,                  text: 'color/text/primary', border: 'color/border/default',   w: 120, h: 40, radius: 8 },
    { name: 'Style=Ghost, Size=Medium, State=Hover',     fill: 'color/bg/secondary',  text: 'color/text/primary', border: 'color/border/default',   w: 120, h: 40, radius: 8 },
    { name: 'Style=Danger, Size=Medium, State=Default',  fill: 'color/feedback/error',text: 'color/text/inverse', border: null,                    w: 120, h: 40, radius: 8 },
  ],
  layout: { dir: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: { top: 8, right: 16, bottom: 8, left: 16 } },
  label: { text: 'Button', typo: 'Label/MD', color: 'color/text/inverse' },
};

// ── Idempotency check ─────────────────────────────────────────────────────────

const existingTagged = page.findShapes().find(s =>
  s.getSharedPluginData('figma-import', 'figma_id') === FIGMA_COMPONENT_ID
);
if (existingTagged) {
  return { skipped: true, reason: 'Component already created', existingId: existingTagged.id };
}

// ── Helper: apply library color fill ─────────────────────────────────────────

function applyFill(shape, colorName, fallbackHex = '#E5E7EB') {
  if (!colorName) {
    shape.fills = [];
    return { bound: false };
  }
  const c = library.colors.find(col => col.name === colorName);
  if (c) {
    shape.fills = [{
      fillType: 'solid',
      fillColor: c.color,
      fillOpacity: c.opacity ?? 1,
      fillColorRefId: c.id,
      fillColorRefFileId: c.fileId,
    }];
    return { bound: true, colorId: c.id };
  }
  shape.fills = [{ fillType: 'solid', fillColor: fallbackHex, fillOpacity: 1 }];
  return { bound: false, fallback: fallbackHex };
}

function applyStroke(shape, colorName, width = 1) {
  if (!colorName) { shape.strokes = []; return; }
  const c = library.colors.find(col => col.name === colorName);
  if (c) {
    shape.strokes = [{
      strokeType: 'center',
      strokeWidth: width,
      strokeColor: c.color,
      strokeOpacity: c.opacity ?? 1,
      strokeColorRefId: c.id,
      strokeColorRefFileId: c.fileId,
    }];
  } else {
    shape.strokes = [{ strokeType: 'center', strokeWidth: width, strokeColor: '#D1D5DB', strokeOpacity: 1 }];
  }
}

function createLabel(text, typoName, colorName, colorFallback = '#111827') {
  const t = page.createText(text);
  t.name = 'label';
  const typo = library.typographies.find(tp => tp.name === typoName);
  if (typo && t.applyTypography) {
    t.applyTypography(typo);
  } else {
    t.fontFamily = 'Inter';
    t.fontSize = 14;
    t.fontWeight = 500;
  }
  applyFill(t, colorName, colorFallback);
  return t;
}

// ── Build variant frames ──────────────────────────────────────────────────────

const bindingGaps = [];
const CANVAS_X = 200;
const CANVAS_Y = 200;
const COLS = 3;
const COL_GAP = 24;
const ROW_GAP = 24;

if (COMPONENT_CONFIG.hasVariants) {
  // Create VariantContainer
  const container = page.createVariantContainer();
  container.name = COMPONENT_CONFIG.name;
  container.x = CANVAS_X;
  container.y = CANVAS_Y;

  const variantIds = [];

  COMPONENT_CONFIG.variants.forEach((v, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const colWidth = v.w + COL_GAP;
    const rowHeight = v.h + ROW_GAP;

    const frame = page.createFrame();
    frame.name = v.name;
    frame.x = CANVAS_X + col * colWidth;
    frame.y = CANVAS_Y + row * rowHeight;
    frame.width = v.w;
    frame.height = v.h;
    frame.borderRadius = v.radius ?? 8;

    if (v.opacity !== undefined) frame.opacity = v.opacity;

    // Layout
    const fl = frame.addFlexLayout();
    fl.dir = COMPONENT_CONFIG.layout.dir;
    fl.alignItems = COMPONENT_CONFIG.layout.alignItems;
    fl.justifyContent = COMPONENT_CONFIG.layout.justifyContent;
    fl.gap = COMPONENT_CONFIG.layout.gap;
    fl.padding = COMPONENT_CONFIG.layout.padding;

    // Fill
    const fillResult = applyFill(frame, v.fill, '#3B82F6');
    if (!fillResult.bound && v.fill) {
      bindingGaps.push({ variant: v.name, expected: v.fill, fallback: fillResult.fallback });
    }

    // Border
    if (v.border) applyStroke(frame, v.border, 1);

    // Label
    const label = createLabel(
      COMPONENT_CONFIG.label.text,
      COMPONENT_CONFIG.label.typo,
      v.text ?? COMPONENT_CONFIG.label.color,
    );
    frame.appendChild(label);

    // Tag
    frame.setSharedPluginData('figma-import', 'run_id', RUN_ID);
    frame.setSharedPluginData('figma-import', 'entity_type', 'variant-frame');

    container.appendChild(frame);
    variantIds.push({ name: frame.name, id: frame.id });
  });

  // Tag container
  container.setSharedPluginData('figma-import', 'run_id', RUN_ID);
  container.setSharedPluginData('figma-import', 'figma_id', FIGMA_COMPONENT_ID);
  container.setSharedPluginData('figma-import', 'entity_type', 'component');

  return {
    success: true,
    containerId: container.id,
    componentName: container.name,
    variantCount: variantIds.length,
    variants: variantIds,
    bindingGaps,
    nextStep: bindingGaps.length > 0
      ? `⚠️  ${bindingGaps.length} binding gap(s). Review, then run export_shape on containerId.`
      : `✅  Component migrated. Run export_shape on containerId to validate visually.`,
  };

} else {
  // Single component (no variants) — wrap base frame as component

  const base = page.createFrame();
  base.name = COMPONENT_CONFIG.name;
  base.x = CANVAS_X;
  base.y = CANVAS_Y;
  base.width = COMPONENT_CONFIG.variants[0]?.w ?? 120;
  base.height = COMPONENT_CONFIG.variants[0]?.h ?? 40;
  base.borderRadius = COMPONENT_CONFIG.variants[0]?.radius ?? 8;

  const fl = base.addFlexLayout();
  fl.dir = COMPONENT_CONFIG.layout.dir;
  fl.alignItems = COMPONENT_CONFIG.layout.alignItems;
  fl.justifyContent = COMPONENT_CONFIG.layout.justifyContent;
  fl.gap = COMPONENT_CONFIG.layout.gap;
  fl.padding = COMPONENT_CONFIG.layout.padding;

  const firstVariant = COMPONENT_CONFIG.variants[0] || {};
  applyFill(base, firstVariant.fill, '#3B82F6');
  if (firstVariant.border) applyStroke(base, firstVariant.border, 1);

  const label = createLabel(
    COMPONENT_CONFIG.label.text,
    COMPONENT_CONFIG.label.typo,
    COMPONENT_CONFIG.label.color,
  );
  base.appendChild(label);

  // Tag
  base.setSharedPluginData('figma-import', 'run_id', RUN_ID);
  base.setSharedPluginData('figma-import', 'figma_id', FIGMA_COMPONENT_ID);
  base.setSharedPluginData('figma-import', 'entity_type', 'component');

  // Wrap as Penpot component
  const component = page.createComponent(base);

  return {
    success: true,
    componentId: component.id,
    mainFrameId: base.id,
    componentName: base.name,
    bindingGaps,
    nextStep: `✅  Component created. Run export_shape on mainFrameId to validate.`,
  };
}
