/**
 * buildSection.js
 *
 * Template for building one section inside a screen wrapper.
 * Copy this script and customize it for each section of your screen.
 *
 * Pattern: fetch wrapper by ID → build section frame → add components/content → append to wrapper.
 *
 * One section per execute_code call. Never batch multiple sections.
 * After each section, validate with export_shape before proceeding.
 *
 * ⚠️  Replace WRAPPER_ID and section config before running.
 */

const page = penpot.currentPage;
const library = penpot.library.local;

// ── Required: Wrapper ID from createScreenWrapper.js ─────────────────────────
const WRAPPER_ID = 'REPLACE_WITH_WRAPPER_ID_FROM_PREVIOUS_CALL';

// ── Fetch Wrapper ─────────────────────────────────────────────────────────────
const allShapes = page.findShapes();
const wrapper = allShapes.find(s => s.id === WRAPPER_ID);

if (!wrapper) {
  // Fallback: try finding by plugin data key
  const wrapperByKey = allShapes.find(s =>
    s.getSharedPluginData('dsb', 'key') === 'screen/homepage'  // ← update key to match your screen
  );
  if (!wrapperByKey) {
    return {
      error: 'Wrapper not found.',
      tried: [WRAPPER_ID, 'screen/homepage key'],
      hint: 'Re-run createScreenWrapper.js to get the wrapperId, or use inspectDesignSystem.js to find existing frames.',
    };
  }
}

const targetWrapper = wrapper || allShapes.find(s =>
  s.getSharedPluginData('dsb', 'key') === 'screen/homepage'
);

// ── Color Helper ──────────────────────────────────────────────────────────────

function applyColorFill(shape, colorName, fallbackHex = '#E5E7EB') {
  const c = library.colors.find(c => c.name === colorName);
  if (c) {
    shape.fills = [{
      fillType: 'solid',
      fillColor: c.color,
      fillOpacity: c.opacity !== undefined ? c.opacity : 1,
      fillColorRefId: c.id,
      fillColorRefFileId: c.fileId,
    }];
    return { bound: true, id: c.id };
  }
  shape.fills = [{ fillType: 'solid', fillColor: fallbackHex, fillOpacity: 1 }];
  return { bound: false, fallback: fallbackHex };
}

function applyColorStroke(shape, colorName, width = 1, fallbackHex = '#D1D5DB') {
  const c = library.colors.find(c => c.name === colorName);
  if (c) {
    shape.strokes = [{
      strokeType: 'center',
      strokeWidth: width,
      strokeColor: c.color,
      strokeOpacity: c.opacity !== undefined ? c.opacity : 1,
      strokeColorRefId: c.id,
      strokeColorRefFileId: c.fileId,
    }];
    return { bound: true };
  }
  shape.strokes = [{ strokeType: 'center', strokeWidth: width, strokeColor: fallbackHex, strokeOpacity: 1 }];
  return { bound: false };
}

function createText(content, options = {}) {
  const t = page.createText(content);
  t.name = options.name || 'text';
  t.fontSize = options.fontSize || 16;
  t.fontFamily = options.fontFamily || 'Inter';
  t.fontStyle = options.fontStyle || 'Regular';

  if (options.typoName) {
    const typo = library.typographies.find(tp => tp.name === options.typoName);
    if (typo && t.applyTypography) {
      t.applyTypography(typo);
    }
  }

  if (options.colorName) {
    applyColorFill(t, options.colorName, options.colorFallback || '#111827');
  }

  return t;
}

// ── Track created IDs and binding gaps ───────────────────────────────────────

const createdIds = [];
const bindingGaps = [];

// ── Build Section ─────────────────────────────────────────────────────────────
// This is a NavBar example — customize for your section type.

const section = page.createFrame();
section.name = 'nav-bar';
section.width = 1440;
section.height = 64;

const sectionLayout = section.addFlexLayout();
sectionLayout.dir = 'row';
sectionLayout.alignItems = 'center';
sectionLayout.justifyContent = 'space-between';
sectionLayout.padding = { top: 0, right: 32, bottom: 0, left: 32 };

// Background
const bgResult = applyColorFill(section, 'color/bg/primary', '#FFFFFF');
if (!bgResult.bound) bindingGaps.push({ shape: 'nav-bar', expected: 'color/bg/primary', fallback: bgResult.fallback });

// Bottom border
applyColorStroke(section, 'color/border/default', 1);

// ── Left: Logo ────────────────────────────────────────────────────────────────
const logoFrame = page.createFrame();
logoFrame.name = 'logo';
logoFrame.width = 120; logoFrame.height = 32;
logoFrame.fills = [];  // transparent

const logoText = createText('Acme', {
  name: 'logo-text',
  typoName: 'Heading/MD',
  colorName: 'color/text/primary',
  colorFallback: '#111827',
});
logoFrame.appendChild(logoText);
section.appendChild(logoFrame);
createdIds.push(logoFrame.id);

// ── Center: Navigation links ──────────────────────────────────────────────────
const navLinks = page.createFrame();
navLinks.name = 'nav-links';
navLinks.fills = [];  // transparent

const navLayout = navLinks.addFlexLayout();
navLayout.dir = 'row';
navLayout.alignItems = 'center';
navLayout.gap = 8;

const linkNames = ['Features', 'Pricing', 'Docs', 'Blog'];
for (const linkName of linkNames) {
  const link = createText(linkName, {
    name: `link-${linkName.toLowerCase()}`,
    typoName: 'Label/MD',
    colorName: 'color/text/secondary',
    colorFallback: '#4B5563',
  });
  navLinks.appendChild(link);
}

section.appendChild(navLinks);
createdIds.push(navLinks.id);

// ── Right: CTA Buttons ────────────────────────────────────────────────────────
const ctaFrame = page.createFrame();
ctaFrame.name = 'cta-group';
ctaFrame.fills = [];

const ctaLayout = ctaFrame.addFlexLayout();
ctaLayout.dir = 'row';
ctaLayout.alignItems = 'center';
ctaLayout.gap = 8;

// Sign In: Ghost button (or create from component if available)
const ghostBtnComponent = library.components.find(c =>
  c.name.toLowerCase().includes('ghost') || c.name.toLowerCase().includes('secondary')
);
if (ghostBtnComponent) {
  const signInBtn = ghostBtnComponent.createInstance();
  // Override label text
  const textNodes = signInBtn.findShapes
    ? signInBtn.findShapes().filter(s => s.type === 'text')
    : [];
  for (const t of textNodes) {
    if (['label', 'text', 'button-text'].includes(t.name)) {
      t.characters = 'Sign In';
    }
  }
  ctaFrame.appendChild(signInBtn);
  createdIds.push(signInBtn.id);
} else {
  // Fallback: manual ghost button
  const signInBtn = page.createFrame();
  signInBtn.name = 'btn-sign-in';
  signInBtn.width = 80; signInBtn.height = 36;
  signInBtn.borderRadius = 8;
  signInBtn.fills = [];

  const signInLayout = signInBtn.addFlexLayout();
  signInLayout.dir = 'row';
  signInLayout.alignItems = 'center';
  signInLayout.justifyContent = 'center';
  signInLayout.padding = { top: 8, right: 16, bottom: 8, left: 16 };

  const signInText = createText('Sign In', {
    name: 'label',
    typoName: 'Label/MD',
    colorName: 'color/text/primary',
    colorFallback: '#111827',
  });
  signInBtn.appendChild(signInText);
  ctaFrame.appendChild(signInBtn);
  createdIds.push(signInBtn.id);
  bindingGaps.push({ shape: 'btn-sign-in', expected: 'Button/Ghost component', fallback: 'manual frame' });
}

// Primary CTA button
const primaryBtnComponent = library.components.find(c =>
  c.name.toLowerCase().includes('primary') && c.name.toLowerCase().includes('button')
);
if (primaryBtnComponent) {
  const ctaBtn = primaryBtnComponent.createInstance();
  const textNodes = ctaBtn.findShapes
    ? ctaBtn.findShapes().filter(s => s.type === 'text')
    : [];
  for (const t of textNodes) {
    if (['label', 'text', 'button-text'].includes(t.name)) {
      t.characters = 'Get Started';
    }
  }
  ctaFrame.appendChild(ctaBtn);
  createdIds.push(ctaBtn.id);
} else {
  // Fallback: manual primary button
  const ctaBtn = page.createFrame();
  ctaBtn.name = 'btn-get-started';
  ctaBtn.width = 120; ctaBtn.height = 36;
  ctaBtn.borderRadius = 8;
  applyColorFill(ctaBtn, 'color/brand/primary', '#3B82F6');

  const ctaBtnLayout = ctaBtn.addFlexLayout();
  ctaBtnLayout.dir = 'row';
  ctaBtnLayout.alignItems = 'center';
  ctaBtnLayout.justifyContent = 'center';

  const ctaBtnText = createText('Get Started', {
    name: 'label',
    typoName: 'Label/MD',
    colorName: 'color/text/inverse',
    colorFallback: '#FFFFFF',
  });
  ctaBtn.appendChild(ctaBtnText);
  ctaFrame.appendChild(ctaBtn);
  createdIds.push(ctaBtn.id);
  bindingGaps.push({ shape: 'btn-get-started', expected: 'Button/Primary component', fallback: 'manual frame' });
}

section.appendChild(ctaFrame);
createdIds.push(ctaFrame.id);

// ── Append Section to Wrapper ─────────────────────────────────────────────────
targetWrapper.appendChild(section);
createdIds.push(section.id);

return {
  success: true,
  sectionId: section.id,
  sectionName: section.name,
  createdIds,
  bindingGaps,
  nextStep: bindingGaps.length > 0
    ? `⚠️  ${bindingGaps.length} binding gap(s). Review before proceeding. Then call export_shape on sectionId to validate visually.`
    : `✅  Section built with full token binding. Call export_shape on sectionId to validate.`,
};
