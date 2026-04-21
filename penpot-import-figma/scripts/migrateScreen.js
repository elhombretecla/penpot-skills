/**
 * migrateScreen.js
 *
 * Phase 4 — Migrate one Figma screen (artboard) to Penpot.
 * PASTE INTO execute_code — ONE SECTION PER CALL.
 *
 * Usage:
 *   Step 1: Run Template A to create the wrapper frame → save wrapperId
 *   Step 2: Run Template B once per section, replacing WRAPPER_ID and section config
 *   Step 3: Validate each section with export_shape before the next
 *
 * ⚠️  Replace all REPLACE_WITH_* placeholders before running.
 */

// =============================================================================
// TEMPLATE A: Create Screen Wrapper
// Run this ONCE per screen. Save the returned wrapperId for all section calls.
// =============================================================================

const page = penpot.currentPage;
const library = penpot.library.local;

const RUN_ID = 'REPLACE_WITH_RUN_ID';
const FIGMA_SCREEN_ID = 'REPLACE_WITH_FIGMA_SCREEN_NODE_ID';
const SCREEN_NAME = 'REPLACE_WITH_SCREEN_NAME';       // e.g., 'Homepage'
const SCREEN_WIDTH = 1440;                             // match Figma artboard width
const SCREEN_HEIGHT = 4000;                            // approximate; sections will fill

// Check idempotency
const existing = page.findShapes().find(s =>
  s.getSharedPluginData('figma-import', 'figma_id') === FIGMA_SCREEN_ID
);
if (existing) {
  return { skipped: true, wrapperId: existing.id, wrapperName: existing.name };
}

// Find clear canvas space to the right of existing content
const allShapes = page.findShapes();
let maxX = 0;
for (const s of allShapes) {
  if (!s.parentId) maxX = Math.max(maxX, (s.x || 0) + (s.width || 0));
}

// Create wrapper frame
const wrapper = page.createFrame();
wrapper.name = SCREEN_NAME;
wrapper.x = maxX + 200;
wrapper.y = 0;
wrapper.width = SCREEN_WIDTH;
wrapper.height = SCREEN_HEIGHT;

// Vertical flex — sections stack top to bottom
const wLayout = wrapper.addFlexLayout();
wLayout.dir = 'column';
wLayout.alignItems = 'stretch';
wLayout.gap = 0;

// Background
const bgColor = library.colors.find(c => c.name === 'color/bg/primary');
if (bgColor) {
  wrapper.fills = [{
    fillType: 'solid',
    fillColor: bgColor.color,
    fillOpacity: bgColor.opacity ?? 1,
    fillColorRefId: bgColor.id,
    fillColorRefFileId: bgColor.fileId,
  }];
} else {
  wrapper.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 1 }];
}

// Tag
wrapper.setSharedPluginData('figma-import', 'run_id', RUN_ID);
wrapper.setSharedPluginData('figma-import', 'figma_id', FIGMA_SCREEN_ID);
wrapper.setSharedPluginData('figma-import', 'entity_type', 'screen');

return {
  wrapperId: wrapper.id,
  wrapperName: wrapper.name,
  x: wrapper.x,
  y: wrapper.y,
  nextStep: `Wrapper created. Save wrapperId "${wrapper.id}" and run section scripts next.`,
};

// =============================================================================
// TEMPLATE B: Build One Section
// Paste and customize this for each section of the screen.
// Run after Template A. Replace WRAPPER_ID with the returned wrapperId.
// =============================================================================

/*
const page = penpot.currentPage;
const library = penpot.library.local;

const RUN_ID = 'REPLACE_WITH_RUN_ID';
const WRAPPER_ID = 'REPLACE_WITH_WRAPPER_ID_FROM_TEMPLATE_A';

// ── Section configuration (from IR) ──────────────────────────────────────────
// Customize this per section. Example: NavBar section.

const SECTION_CONFIG = {
  name: 'nav-bar',
  type: 'navbar',   // navbar | hero | content | pricing | footer | custom
  width: 1440,
  height: 64,
  bgColor: 'color/bg/primary',
  bgFallback: '#FFFFFF',
  border: {
    position: 'bottom',
    color: 'color/border/default',
    width: 1,
  },
  layout: {
    dir: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: { top: 0, right: 32, bottom: 0, left: 32 },
    gap: 0,
  },
};

// ── Find wrapper ──────────────────────────────────────────────────────────────

const allShapes = page.findShapes();
const wrapper = allShapes.find(s => s.id === WRAPPER_ID)
  || allShapes.find(s => s.getSharedPluginData('figma-import', 'entity_type') === 'screen');

if (!wrapper) {
  return { error: 'Wrapper not found', hint: 'Re-run Template A to recreate the wrapper' };
}

// ── Helper functions ──────────────────────────────────────────────────────────

function applyFill(shape, colorName, fallbackHex) {
  const c = library.colors.find(col => col.name === colorName);
  if (c) {
    shape.fills = [{ fillType: 'solid', fillColor: c.color, fillOpacity: c.opacity ?? 1, fillColorRefId: c.id, fillColorRefFileId: c.fileId }];
    return { bound: true };
  }
  if (fallbackHex) shape.fills = [{ fillType: 'solid', fillColor: fallbackHex, fillOpacity: 1 }];
  return { bound: false };
}

function applyStroke(shape, colorName, position, width) {
  const c = library.colors.find(col => col.name === colorName);
  const strokeColor = c ? c.color : '#E5E7EB';
  const refId = c ? c.id : undefined;
  const refFileId = c ? c.fileId : undefined;
  shape.strokes = [{
    strokeType: position || 'center',
    strokeWidth: width || 1,
    strokeColor,
    strokeOpacity: 1,
    ...(refId ? { strokeColorRefId: refId, strokeColorRefFileId: refFileId } : {}),
  }];
}

function createText(content, typoName, colorName, colorFallback) {
  const t = page.createText(content);
  t.name = 'text';
  const typo = typoName ? library.typographies.find(tp => tp.name === typoName) : null;
  if (typo && t.applyTypography) t.applyTypography(typo);
  else { t.fontFamily = 'Inter'; t.fontSize = 14; }
  applyFill(t, colorName, colorFallback || '#111827');
  return t;
}

// ── Build section ─────────────────────────────────────────────────────────────

const bindingGaps = [];
const section = page.createFrame();
section.name = SECTION_CONFIG.name;
section.width = SECTION_CONFIG.width;
section.height = SECTION_CONFIG.height;

const fl = section.addFlexLayout();
fl.dir = SECTION_CONFIG.layout.dir;
fl.alignItems = SECTION_CONFIG.layout.alignItems;
fl.justifyContent = SECTION_CONFIG.layout.justifyContent;
fl.gap = SECTION_CONFIG.layout.gap || 0;
fl.padding = SECTION_CONFIG.layout.padding;

const bgResult = applyFill(section, SECTION_CONFIG.bgColor, SECTION_CONFIG.bgFallback);
if (!bgResult.bound) bindingGaps.push({ shape: SECTION_CONFIG.name, expected: SECTION_CONFIG.bgColor, fallback: SECTION_CONFIG.bgFallback });

if (SECTION_CONFIG.border) applyStroke(section, SECTION_CONFIG.border.color, SECTION_CONFIG.border.position, SECTION_CONFIG.border.width);

// ── Section-specific content ─────────────────────────────────────────────────
// Customize this block based on the section type.

if (SECTION_CONFIG.type === 'navbar') {
  // Left: Logo
  const logo = createText('Brand', 'Heading/MD', 'color/text/primary', '#111827');
  logo.name = 'logo';
  section.appendChild(logo);

  // Center: Nav links
  const navLinks = page.createFrame();
  navLinks.name = 'nav-links';
  navLinks.fills = [];
  const navLayout = navLinks.addFlexLayout();
  navLayout.dir = 'row'; navLayout.alignItems = 'center'; navLayout.gap = 32;

  for (const link of ['Product', 'Pricing', 'Docs']) {
    const l = createText(link, 'Label/MD', 'color/text/secondary', '#6B7280');
    l.name = `link-${link.toLowerCase()}`;
    navLinks.appendChild(l);
  }
  section.appendChild(navLinks);

  // Right: CTA
  const primaryBtn = library.components.find(c => c.name.includes('Primary') || c.name.toLowerCase().includes('button'));
  if (primaryBtn) {
    const btn = primaryBtn.createInstance();
    const textNodes = btn.findShapes ? btn.findShapes().filter(s => s.type === 'text') : [];
    if (textNodes[0]) textNodes[0].characters = 'Get Started';
    section.appendChild(btn);
  } else {
    bindingGaps.push({ shape: 'cta-button', expected: 'Button/Primary component', fallback: 'manual frame' });
    const ctaBtn = page.createFrame();
    ctaBtn.name = 'cta-button';
    ctaBtn.width = 120; ctaBtn.height = 36; ctaBtn.borderRadius = 8;
    applyFill(ctaBtn, 'color/brand/primary', '#3B82F6');
    const ctaText = createText('Get Started', 'Label/MD', 'color/text/inverse', '#FFFFFF');
    ctaBtn.appendChild(ctaText);
    section.appendChild(ctaBtn);
  }
}

// ── Append to wrapper ─────────────────────────────────────────────────────────

section.setSharedPluginData('figma-import', 'run_id', RUN_ID);
section.setSharedPluginData('figma-import', 'entity_type', 'section');
wrapper.appendChild(section);

return {
  success: true,
  sectionId: section.id,
  sectionName: section.name,
  bindingGaps,
  nextStep: bindingGaps.length > 0
    ? `⚠️  ${bindingGaps.length} binding gap(s). Review, then run export_shape on sectionId.`
    : `✅  Section built. Run export_shape on sectionId to validate visually.`,
};
*/
