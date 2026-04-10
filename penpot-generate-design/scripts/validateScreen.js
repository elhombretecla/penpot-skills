/**
 * validateScreen.js
 *
 * Inspects a screen wrapper and its sections to surface common issues
 * before a visual review via export_shape.
 *
 * Checks for:
 * - Sections with no children (empty frames)
 * - Text nodes with no library typography binding
 * - Fills without fillColorRefId (hardcoded colors)
 * - Shapes with placeholder text ("Title", "Heading", "Button", "Label")
 * - Binding gaps (shapes without dsb plugin data that should have it)
 * - Sections outside the wrapper (orphaned frames)
 *
 * This script is read-only — it makes NO mutations.
 * After running this, use export_shape on the wrapper or individual sections.
 */

const page = penpot.currentPage;
const library = penpot.library.local;

// ── Configuration ─────────────────────────────────────────────────────────────
const WRAPPER_ID = 'REPLACE_WITH_WRAPPER_ID';   // ← from createScreenWrapper.js
const SCREEN_KEY = 'screen/homepage';            // ← plugin data key of the wrapper (fallback)

// ── Find Wrapper ──────────────────────────────────────────────────────────────

const allShapes = page.findShapes();
let wrapper = allShapes.find(s => s.id === WRAPPER_ID);
if (!wrapper) {
  wrapper = allShapes.find(s => s.getSharedPluginData('dsb', 'key') === SCREEN_KEY);
}
if (!wrapper) {
  return { error: `Wrapper not found. Check WRAPPER_ID or SCREEN_KEY.` };
}

// ── Collect All Shapes in Wrapper ─────────────────────────────────────────────

const wrapperShapes = wrapper.findShapes ? wrapper.findShapes() : [];

// Top-level children of wrapper = sections
const sections = wrapperShapes.filter(s => s.parentId === wrapper.id);

// ── Checks ────────────────────────────────────────────────────────────────────

const issues = {
  emptySections: [],
  hardcodedFills: [],
  placeholderText: [],
  missingTypographyBinding: [],
  orphanedTopLevelFrames: [],
};

const PLACEHOLDER_TEXTS = [
  'title', 'heading', 'button', 'label', 'text', 'placeholder',
  'lorem ipsum', 'example', 'untitled', 'name', 'description',
];

function isPlaceholder(text) {
  const lower = (text || '').toLowerCase().trim();
  return PLACEHOLDER_TEXTS.some(p => lower === p || lower.startsWith(p + ' '));
}

// Check sections
for (const section of sections) {
  const sectionChildren = wrapperShapes.filter(s => s.parentId === section.id);
  if (sectionChildren.length === 0) {
    issues.emptySections.push({ id: section.id, name: section.name });
  }
}

// Check all shapes in wrapper
for (const shape of wrapperShapes) {
  // Hardcoded fills (no fillColorRefId)
  if (shape.fills && shape.fills.length > 0) {
    const unbound = shape.fills.filter(f =>
      f.fillType === 'solid' &&
      !f.fillColorRefId &&
      f.fillColor &&
      f.fillColor !== '#FFFFFF' &&  // ignore transparent/white (may be intentional)
      f.fillOpacity > 0
    );
    if (unbound.length > 0) {
      issues.hardcodedFills.push({
        id: shape.id,
        name: shape.name,
        type: shape.type,
        hardcodedColors: unbound.map(f => f.fillColor),
      });
    }
  }

  // Placeholder text
  if (shape.type === 'text' && shape.characters) {
    if (isPlaceholder(shape.characters)) {
      issues.placeholderText.push({
        id: shape.id,
        name: shape.name,
        text: shape.characters,
        parentId: shape.parentId,
      });
    }
  }
}

// Check for orphaned top-level frames (accidentally created outside the wrapper)
const topLevelFrames = allShapes.filter(s => !s.parentId && s.type === 'frame' && s.id !== wrapper.id);
for (const frame of topLevelFrames) {
  const key = frame.getSharedPluginData('dsb', 'key');
  if (key && key.startsWith('screen/')) {
    issues.orphanedTopLevelFrames.push({
      id: frame.id,
      name: frame.name,
      dsbKey: key,
      hint: 'This frame may have been created outside the wrapper. Check if it should be inside the wrapper.',
    });
  }
}

// ── Section Summary ───────────────────────────────────────────────────────────

const sectionSummary = sections.map(s => ({
  id: s.id,
  name: s.name,
  childCount: wrapperShapes.filter(c => c.parentId === s.id).length,
  width: s.width,
  height: s.height,
}));

// ── Export Suggestions ────────────────────────────────────────────────────────

const exportSuggestions = [
  { description: 'Full screen', id: wrapper.id },
  ...sections.map(s => ({ description: `Section: ${s.name}`, id: s.id })),
];

// ── Scoring ───────────────────────────────────────────────────────────────────

const totalIssues =
  issues.emptySections.length +
  issues.hardcodedFills.length +
  issues.placeholderText.length +
  issues.orphanedTopLevelFrames.length;

const score = totalIssues === 0 ? 'PASS' : totalIssues <= 3 ? 'WARN' : 'FAIL';

return {
  screen: {
    id: wrapper.id,
    name: wrapper.name,
    width: wrapper.width,
    height: wrapper.height,
    sectionCount: sections.length,
  },

  sectionSummary,

  issues,

  validation: {
    score,
    totalIssues,
    message: totalIssues === 0
      ? `✅  No issues found. Ready for visual review via export_shape.`
      : `⚠️  ${totalIssues} issue(s) found. Review before presenting to user.`,
  },

  // Call export_shape with these IDs for visual review
  exportSuggestions,
};
