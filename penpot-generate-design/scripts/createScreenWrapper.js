/**
 * createScreenWrapper.js
 *
 * Creates the page wrapper frame for a screen.
 * This must be the FIRST execute_code call when building a new screen.
 *
 * Returns the wrapper ID — you MUST store this and pass it to every
 * subsequent section call via buildSection.js.
 *
 * Features:
 * - Automatically positions the wrapper to the right of existing content
 * - Applies vertical flex layout for section stacking
 * - Tags with sharedPluginData for recovery
 * - Idempotent: returns existing wrapper if already created
 */

const page = penpot.currentPage;
const library = penpot.library.local;

// ── Configuration ─────────────────────────────────────────────────────────────
// Customize these for your screen.

const SCREEN_CONFIG = {
  name: 'Homepage',            // ← screen name (becomes the frame name)
  width: 1440,                 // ← standard desktop width; use 390 for mobile
  height: 900,                 // ← initial height (will grow as sections are added)
  bgColorName: 'color/bg/primary', // ← library color name for background
  bgColorFallback: '#FFFFFF',  // ← fallback hex if color not in library
  screenKey: 'screen/homepage', // ← unique key for state tracking (no spaces)
  gapFromExisting: 200,        // ← px gap from rightmost existing content
};

// ── Idempotency Check ─────────────────────────────────────────────────────────

const allShapes = page.findShapes();
const existingWrapper = allShapes.find(
  s => s.getSharedPluginData('dsb', 'key') === SCREEN_CONFIG.screenKey
);

if (existingWrapper) {
  return {
    skipped: true,
    wrapperId: existingWrapper.id,
    name: existingWrapper.name,
    x: existingWrapper.x,
    y: existingWrapper.y,
    width: existingWrapper.width,
    height: existingWrapper.height,
    message: `Wrapper "${SCREEN_CONFIG.name}" already exists. Use wrapperId to append sections.`,
  };
}

// ── Find Clear Space ──────────────────────────────────────────────────────────

const topLevelShapes = allShapes.filter(s => !s.parentId);
let maxX = 0;
for (const shape of topLevelShapes) {
  maxX = Math.max(maxX, (shape.x || 0) + (shape.width || 0));
}

const wrapperX = maxX > 0 ? maxX + SCREEN_CONFIG.gapFromExisting : 0;

// ── Create Wrapper Frame ──────────────────────────────────────────────────────

const wrapper = page.createFrame();
wrapper.name = SCREEN_CONFIG.name;
wrapper.x = wrapperX;
wrapper.y = 0;
wrapper.width = SCREEN_CONFIG.width;
wrapper.height = SCREEN_CONFIG.height;

// Apply background color
const bgColor = library.colors.find(c => c.name === SCREEN_CONFIG.bgColorName);
if (bgColor) {
  wrapper.fills = [{
    fillType: 'solid',
    fillColor: bgColor.color,
    fillOpacity: bgColor.opacity !== undefined ? bgColor.opacity : 1,
    fillColorRefId: bgColor.id,
    fillColorRefFileId: bgColor.fileId,
  }];
} else {
  wrapper.fills = [{
    fillType: 'solid',
    fillColor: SCREEN_CONFIG.bgColorFallback,
    fillOpacity: 1,
  }];
}

// Apply vertical flex layout for section stacking
const layout = wrapper.addFlexLayout();
layout.dir = 'column';
layout.alignItems = 'stretch';  // sections fill wrapper width

// Tag for state tracking and recovery
wrapper.setSharedPluginData('dsb', 'key', SCREEN_CONFIG.screenKey);
wrapper.setSharedPluginData('dsb', 'phase', 'screen-build');

return {
  success: true,
  wrapperId: wrapper.id,
  name: wrapper.name,
  x: wrapper.x,
  y: wrapper.y,
  width: wrapper.width,
  height: wrapper.height,
  bgBound: !!bgColor,
  message: `Wrapper "${SCREEN_CONFIG.name}" created at x=${wrapperX}. ` +
           `Store wrapperId and pass it to each section call.`,
};
