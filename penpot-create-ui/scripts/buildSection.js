/**
 * buildSection.js
 *
 * Phase 3 — Build one screen section inside an existing wrapper frame.
 * This is a TEMPLATE — customize SECTION_TYPE and CONTENT for each section.
 *
 * USAGE:
 *   1. Replace WRAPPER_ID with the ID returned by the screen wrapper creation call
 *   2. Set SECTION_TYPE to match the section you're building
 *   3. Replace all placeholder content with real, product-specific text
 *   4. Customize fills, colors, and layout to match the Design Direction Card
 *
 * Available SECTION_TYPE presets:
 *   'navbar'       — Top navigation bar (Flex row)
 *   'hero'         — Landing page hero with headline + CTA (Flex column)
 *   'stats-grid'   — 2D grid of metric cards, equal width, aligned rows (Grid)
 *   'feature-grid' — Feature cards arranged in a grid, e.g. 3 cols × 2 rows (Grid)
 *   'sidebar'      — Left navigation sidebar (Flex column)
 *   'page-header'  — Dashboard page header: title + breadcrumb + actions (Flex row)
 *
 * LAYOUT ENGINE CHOICE (see SKILL.md Section 5 and references/03-layout-and-composition.md):
 *   - 1D flow (a row, a stack)          → frame.addFlexLayout()
 *   - 2D alignment (equal cells aligned
 *     across rows AND columns)          → frame.addGridLayout()
 *
 * Before the first addGridLayout() call of the run, verify the exact
 * Grid API shape with penpot_api_info({ type: 'Frame' }). Method names
 * for adding tracks (addColumn/addRow vs. setColumn/setRow, etc.) vary
 * across Penpot versions.
 *
 * NAMING: every frame gets a semantic role name. No 'Frame 1', 'container',
 * 'wrapper', 'box'. Use 'section-hero', 'stats-grid', 'cta-group', etc.
 *
 * ⚠️  REPLACE ALL placeholder strings before running.
 * ⚠️  Validate with export_shape after each section call.
 */

const WRAPPER_ID = 'REPLACE_WITH_WRAPPER_FRAME_ID';
const SECTION_TYPE = 'hero';    // ← set this
const PROFILE = 'PRECISION';
const RUN_ID = 'create-ui-REPLACE-ME';

const page = penpot.currentPage;
const library = penpot.library.local;
const allShapes = page.findShapes();
const wrapper = allShapes.find(s => s.id === WRAPPER_ID);
if (!wrapper) return { error: `Wrapper frame not found: ${WRAPPER_ID}` };

// Helper: get library color
function getColor(name) { return library.colors.find(c => c.name === name); }
function applyFill(shape, colorName) {
  const c = getColor(colorName);
  if (!c) return;
  shape.fills = [{ fillType: 'solid', fillColor: c.color, fillOpacity: c.opacity ?? 1,
    fillColorRefId: c.id, fillColorRefFileId: c.fileId }];
}
function createText(text, { name, size = 15, weight = 400, colorName = 'color/text/primary', lineHeight = 1.5 } = {}) {
  const t = page.createText(text);
  t.name = name || 'text';
  t.fontFamily = 'Inter';
  t.fontSize = size;
  t.fontWeight = weight;
  t.lineHeight = lineHeight;
  if (colorName) applyFill(t, colorName);
  return t;
}

const createdIds = [];

// ─── HERO section ─────────────────────────────────────────────────────────────
if (SECTION_TYPE === 'hero') {
  const section = page.createFrame();
  section.name = 'section-hero';
  section.width = wrapper.width;
  section.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 1 }];

  const layout = section.addFlexLayout();
  layout.dir = 'column';
  layout.alignItems = 'center';
  layout.justifyContent = 'center';
  layout.padding = { top: 120, bottom: 120, left: 120, right: 120 };
  layout.gap = 24;

  // Eyebrow text
  const eyebrow = createText('// OPEN SOURCE · TRUSTED BY 5,000+ TEAMS', {
    name: 'eyebrow', size: 11, weight: 600,
    colorName: 'color/text/brand',
    lineHeight: 1.25,
  });
  section.appendChild(eyebrow);
  createdIds.push(eyebrow.id);

  // Headline — THE most important element on the page
  const headline = createText('Ship faster.\nBreak nothing.', {
    name: 'headline', size: 72, weight: 700,
    colorName: 'color/text/primary',
    lineHeight: 1.05,
  });
  // Note: apply negative tracking in Penpot if API supports letterSpacing
  section.appendChild(headline);
  createdIds.push(headline.id);

  // Subheadline
  const sub = createText(
    'The deployment platform built for teams that move fast. Zero-config infrastructure, instant rollbacks, and real-time observability — all from one dashboard.',
    { name: 'subheadline', size: 18, weight: 400, colorName: 'color/text/secondary', lineHeight: 1.6 }
  );
  section.appendChild(sub);
  createdIds.push(sub.id);

  // CTA row
  const ctaRow = page.createFrame();
  ctaRow.name = 'cta-row';
  ctaRow.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 0 }];
  const ctaLayout = ctaRow.addFlexLayout();
  ctaLayout.dir = 'row';
  ctaLayout.alignItems = 'center';
  ctaLayout.gap = 12;

  // Primary CTA — use Button component instance if available
  const buttonComp = library.components.find(c => c.name.includes('Button/Primary') || c.name === 'Button');
  if (buttonComp) {
    const primaryBtn = buttonComp.createInstance();
    primaryBtn.name = 'cta-primary';
    // Override text
    const textChildren = primaryBtn.findShapes?.()?.filter(s => s.type === 'text') || [];
    textChildren.forEach(tc => { if (tc.name === 'label') tc.characters = 'Start for free'; });
    ctaRow.appendChild(primaryBtn);
    createdIds.push(primaryBtn.id);
  } else {
    // Fallback: build button manually
    const btn = page.createFrame();
    btn.name = 'cta-primary';
    btn.height = 44;
    btn.borderRadius = 8;
    applyFill(btn, 'color/interactive/primary');
    const bl = btn.addFlexLayout();
    bl.dir = 'row'; bl.alignItems = 'center'; bl.justifyContent = 'center';
    bl.padding = { top: 0, bottom: 0, left: 20, right: 20 };
    const btnLabel = createText('Start for free', { name: 'label', size: 15, weight: 500, colorName: 'color/interactive/primary-text' });
    btn.appendChild(btnLabel);
    ctaRow.appendChild(btn);
    createdIds.push(btn.id);
  }

  // Secondary CTA
  const secBtn = page.createFrame();
  secBtn.name = 'cta-secondary';
  secBtn.height = 44;
  secBtn.borderRadius = 8;
  secBtn.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 0 }];
  const borderC = getColor('color/border/strong');
  if (borderC) secBtn.strokes = [{ strokeType: 'inner', strokeColor: borderC.color, strokeOpacity: 1, strokeWidth: 1 }];
  const secLayout = secBtn.addFlexLayout();
  secLayout.dir = 'row'; secLayout.alignItems = 'center'; secLayout.justifyContent = 'center';
  secLayout.padding = { top: 0, bottom: 0, left: 20, right: 20 };
  const secLabel = createText('View docs', { name: 'label', size: 15, weight: 500, colorName: 'color/text/primary' });
  secBtn.appendChild(secLabel);
  ctaRow.appendChild(secBtn);
  createdIds.push(secBtn.id);

  section.appendChild(ctaRow);
  createdIds.push(ctaRow.id);

  wrapper.appendChild(section);
  createdIds.push(section.id);
  section.setSharedPluginData('create-ui', 'run_id', RUN_ID);
  section.setSharedPluginData('create-ui', 'section', 'hero');
}

// ─── STATS GRID section ───────────────────────────────────────────────────────
// 2D alignment: N equal-width cards that must share top/left edges across rows.
// This is a textbook Grid case — NOT a flex row.
else if (SECTION_TYPE === 'stats-grid' || SECTION_TYPE === 'stats-row') {
  // Outer section: Flex column (title-group + grid), 1D flow
  const section = page.createFrame();
  section.name = 'section-stats';
  section.width = wrapper.width;
  applyFill(section, 'color/bg/primary');

  const sectionLayout = section.addFlexLayout();
  sectionLayout.dir = 'column';
  sectionLayout.alignItems = 'stretch';
  sectionLayout.padding = { top: 24, bottom: 24, left: 24, right: 24 };
  sectionLayout.gap = 16;

  // ← REPLACE with real product metrics
  const metrics = [
    { label: 'Monthly Revenue', value: '$48,230', change: '+12.4%', positive: true },
    { label: 'Active Users', value: '12,847', change: '+8.1%', positive: true },
    { label: 'Churn Rate', value: '2.3%', change: '-0.4%', positive: true },
    { label: 'Deployments Today', value: '342', change: '+23', positive: true },
  ];

  // Inner grid: 2D — equal columns, rows flow as metrics are added
  const grid = page.createFrame();
  grid.name = 'stats-grid';
  grid.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 0 }];

  const gridLayout = grid.addGridLayout();
  gridLayout.dir = 'row';
  // One flex column per metric; rows expand to content.
  // Verify addColumn/addRow signatures with penpot_api_info on first use.
  for (let i = 0; i < metrics.length; i++) {
    gridLayout.addColumn('flex', 1);
  }
  gridLayout.addRow('auto');
  gridLayout.rowGap = 16;
  gridLayout.columnGap = 16;

  for (const metric of metrics) {
    const card = page.createFrame();
    card.name = `metric-${metric.label.toLowerCase().replace(/\s+/g, '-')}`;
    card.borderRadius = PROFILE === 'WARM' ? 16 : 8;
    applyFill(card, 'color/bg/primary');
    const borderC = getColor('color/border/default');
    if (borderC) card.strokes = [{ strokeType: 'inner', strokeColor: borderC.color, strokeOpacity: 1, strokeWidth: 1 }];

    // Card internals: 1D vertical stack — Flex column
    const cardLayout = card.addFlexLayout();
    cardLayout.dir = 'column';
    cardLayout.alignItems = 'start';
    cardLayout.padding = { top: 20, bottom: 20, left: 20, right: 20 };
    cardLayout.gap = 8;

    const metricLabel = createText(metric.label, { name: 'metric-label', size: 12, weight: 500, colorName: 'color/text/secondary' });
    card.appendChild(metricLabel);

    const metricValue = createText(metric.value, { name: 'metric-value', size: 28, weight: 700, colorName: 'color/text/primary', lineHeight: 1.1 });
    card.appendChild(metricValue);

    const changeText = createText(metric.change + ' vs last month', {
      name: 'metric-change', size: 12, weight: 500,
      colorName: metric.positive ? 'color/feedback/success' : 'color/feedback/error',
    });
    card.appendChild(changeText);

    grid.appendChild(card);
    createdIds.push(card.id);
  }

  section.appendChild(grid);
  createdIds.push(grid.id);

  wrapper.appendChild(section);
  createdIds.push(section.id);
  section.setSharedPluginData('create-ui', 'run_id', RUN_ID);
  section.setSharedPluginData('create-ui', 'section', 'stats-grid');
}

// ─── FEATURE GRID section ─────────────────────────────────────────────────────
// 2D alignment: equal-width feature cards that line up across rows.
// Grid is the correct engine; Flex-row-with-wrap is a mis-translation here.
else if (SECTION_TYPE === 'feature-grid') {
  // Outer section: Flex column (title-group → grid), 1D vertical flow
  const section = page.createFrame();
  section.name = 'section-features';
  section.width = wrapper.width;
  applyFill(section, 'color/bg/primary');

  const sectionLayout = section.addFlexLayout();
  sectionLayout.dir = 'column';
  sectionLayout.alignItems = 'center';
  sectionLayout.padding = { top: 120, bottom: 120, left: 120, right: 120 };
  sectionLayout.gap = 48;

  // Title group — 1D vertical stack
  const titleGroup = page.createFrame();
  titleGroup.name = 'title-group';
  titleGroup.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 0 }];
  const tgLayout = titleGroup.addFlexLayout();
  tgLayout.dir = 'column';
  tgLayout.alignItems = 'center';
  tgLayout.gap = 12;

  const eyebrow = createText('FEATURES', {
    name: 'eyebrow', size: 11, weight: 600,
    colorName: 'color/text/brand', lineHeight: 1.2,
  });
  titleGroup.appendChild(eyebrow);
  const heading = createText('Everything you need to ship', {
    name: 'heading', size: 40, weight: 700,
    colorName: 'color/text/primary', lineHeight: 1.15,
  });
  titleGroup.appendChild(heading);
  const sub = createText(
    'Primitives that compose into whatever you need — without configuration, hidden complexity, or vendor lock-in.',
    { name: 'subheading', size: 17, weight: 400, colorName: 'color/text/secondary', lineHeight: 1.6 }
  );
  titleGroup.appendChild(sub);
  section.appendChild(titleGroup);
  createdIds.push(titleGroup.id);

  // ← REPLACE with real product features
  const features = [
    { title: 'Zero-config deploys', body: 'Push to main. That is the deploy. No YAML, no wizards, no surprises.' },
    { title: 'Instant rollbacks', body: 'Every deploy is immutable. Roll back in a single click — no re-builds.' },
    { title: 'Global edge network', body: 'Requests land on the nearest of 240 points of presence in under 50ms.' },
    { title: 'Real-time observability', body: 'Logs, traces, and metrics in one timeline. Root-cause in minutes.' },
    { title: 'Built-in previews', body: 'Every pull request gets a live URL. Review the product, not the diff.' },
    { title: 'Typed configuration', body: 'Infrastructure as TypeScript. Autocomplete, refactors, CI checks.' },
  ];

  // Inner grid: 3 columns × auto rows
  const COLS = 3;
  const grid = page.createFrame();
  grid.name = 'feature-grid';
  grid.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 0 }];

  const gridLayout = grid.addGridLayout();
  gridLayout.dir = 'row';
  for (let i = 0; i < COLS; i++) {
    gridLayout.addColumn('flex', 1);
  }
  const rowCount = Math.ceil(features.length / COLS);
  for (let r = 0; r < rowCount; r++) {
    gridLayout.addRow('auto');
  }
  gridLayout.rowGap = 32;
  gridLayout.columnGap = 24;

  for (const feature of features) {
    // Feature card internals: 1D vertical stack
    const card = page.createFrame();
    card.name = `feature-${feature.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
    card.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 0 }];

    const cardLayout = card.addFlexLayout();
    cardLayout.dir = 'column';
    cardLayout.alignItems = 'start';
    cardLayout.padding = { top: 0, bottom: 0, left: 0, right: 0 };
    cardLayout.gap = 8;

    const title = createText(feature.title, { name: 'feature-title', size: 17, weight: 600, colorName: 'color/text/primary', lineHeight: 1.3 });
    card.appendChild(title);
    const body = createText(feature.body, { name: 'feature-body', size: 15, weight: 400, colorName: 'color/text/secondary', lineHeight: 1.6 });
    card.appendChild(body);

    grid.appendChild(card);
    createdIds.push(card.id);
  }

  section.appendChild(grid);
  createdIds.push(grid.id);

  wrapper.appendChild(section);
  createdIds.push(section.id);
  section.setSharedPluginData('create-ui', 'run_id', RUN_ID);
  section.setSharedPluginData('create-ui', 'section', 'feature-grid');
}

// ─── NAVBAR section ───────────────────────────────────────────────────────────
else if (SECTION_TYPE === 'navbar') {
  const navbar = page.createFrame();
  navbar.name = 'navbar';
  navbar.width = wrapper.width;
  navbar.height = 56;
  applyFill(navbar, 'color/bg/primary');
  const borderC = getColor('color/border/default');
  if (borderC) navbar.strokes = [{ strokeType: 'inner', strokeColor: borderC.color, strokeOpacity: 1, strokeWidth: 1 }];

  const navLayout = navbar.addFlexLayout();
  navLayout.dir = 'row';
  navLayout.alignItems = 'center';
  navLayout.justifyContent = 'space-between';
  navLayout.padding = { top: 0, bottom: 0, left: 24, right: 24 };

  // Logo area
  const logo = page.createFrame();
  logo.name = 'logo';
  logo.height = 32;
  logo.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 0 }];
  const logoLayout = logo.addFlexLayout();
  logoLayout.dir = 'row'; logoLayout.alignItems = 'center'; logoLayout.gap = 8;
  const logoText = createText('Acme', { name: 'logo-wordmark', size: 16, weight: 700, colorName: 'color/text/primary' });
  logo.appendChild(logoText);
  navbar.appendChild(logo);
  createdIds.push(logo.id);

  // Nav links
  const navLinks = page.createFrame();
  navLinks.name = 'nav-links';
  navLinks.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 0 }];
  const linksLayout = navLinks.addFlexLayout();
  linksLayout.dir = 'row'; linksLayout.alignItems = 'center'; linksLayout.gap = 8;

  // ← REPLACE with real nav items
  const links = ['Product', 'Docs', 'Pricing', 'Blog'];
  for (const linkText of links) {
    const link = createText(linkText, { name: `nav-${linkText.toLowerCase()}`, size: 14, weight: 500, colorName: 'color/text/secondary' });
    navLinks.appendChild(link);
    createdIds.push(link.id);
  }
  navbar.appendChild(navLinks);
  createdIds.push(navLinks.id);

  // Actions
  const actions = page.createFrame();
  actions.name = 'nav-actions';
  actions.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 0 }];
  const actionsLayout = actions.addFlexLayout();
  actionsLayout.dir = 'row'; actionsLayout.alignItems = 'center'; actionsLayout.gap = 8;

  const signIn = createText('Sign in', { name: 'sign-in', size: 14, weight: 500, colorName: 'color/text/secondary' });
  actions.appendChild(signIn);

  // Primary CTA button
  const ctaBtn = page.createFrame();
  ctaBtn.name = 'nav-cta';
  ctaBtn.height = 32;
  ctaBtn.borderRadius = PROFILE === 'WARM' ? 10 : 6;
  applyFill(ctaBtn, 'color/interactive/primary');
  const ctaLayout = ctaBtn.addFlexLayout();
  ctaLayout.dir = 'row'; ctaLayout.alignItems = 'center'; ctaLayout.justifyContent = 'center';
  ctaLayout.padding = { top: 0, bottom: 0, left: 14, right: 14 };
  const ctaLabel = createText('Get started', { name: 'label', size: 13, weight: 500, colorName: 'color/interactive/primary-text' });
  ctaBtn.appendChild(ctaLabel);
  actions.appendChild(ctaBtn);
  createdIds.push(ctaBtn.id);

  navbar.appendChild(actions);
  createdIds.push(actions.id);
  wrapper.appendChild(navbar);
  createdIds.push(navbar.id);
  navbar.setSharedPluginData('create-ui', 'run_id', RUN_ID);
  navbar.setSharedPluginData('create-ui', 'section', 'navbar');
}

// ─── PAGE HEADER section (dashboard) ─────────────────────────────────────────
else if (SECTION_TYPE === 'page-header') {
  const header = page.createFrame();
  header.name = 'page-header';
  header.width = wrapper.width;
  applyFill(header, 'color/bg/primary');
  const borderC = getColor('color/border/default');
  if (borderC) header.strokes = [{ strokeType: 'inner', strokeColor: borderC.color, strokeOpacity: 1, strokeWidth: 1 }];

  const headerLayout = header.addFlexLayout();
  headerLayout.dir = 'row';
  headerLayout.alignItems = 'center';
  headerLayout.justifyContent = 'space-between';
  headerLayout.padding = { top: 20, bottom: 20, left: 24, right: 24 };

  // Left: breadcrumb + title
  const titleGroup = page.createFrame();
  titleGroup.name = 'title-group';
  titleGroup.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 0 }];
  const tgLayout = titleGroup.addFlexLayout();
  tgLayout.dir = 'column'; tgLayout.alignItems = 'start'; tgLayout.gap = 4;

  // ← REPLACE with actual page title
  const breadcrumb = createText('Dashboard / Overview', { name: 'breadcrumb', size: 12, weight: 400, colorName: 'color/text/tertiary' });
  titleGroup.appendChild(breadcrumb);
  const title = createText('Overview', { name: 'page-title', size: 20, weight: 600, colorName: 'color/text/primary', lineHeight: 1.25 });
  titleGroup.appendChild(title);
  header.appendChild(titleGroup);
  createdIds.push(titleGroup.id);

  // Right: primary action
  const actionBtn = page.createFrame();
  actionBtn.name = 'action-primary';
  actionBtn.height = 36;
  actionBtn.borderRadius = PROFILE === 'WARM' ? 12 : 6;
  applyFill(actionBtn, 'color/interactive/primary');
  const aLayout = actionBtn.addFlexLayout();
  aLayout.dir = 'row'; aLayout.alignItems = 'center'; aLayout.justifyContent = 'center';
  aLayout.padding = { top: 0, bottom: 0, left: 16, right: 16 };
  // ← REPLACE with actual action label
  const aLabel = createText('New deployment', { name: 'label', size: 14, weight: 500, colorName: 'color/interactive/primary-text' });
  actionBtn.appendChild(aLabel);
  header.appendChild(actionBtn);
  createdIds.push(actionBtn.id);

  wrapper.appendChild(header);
  createdIds.push(header.id);
  header.setSharedPluginData('create-ui', 'run_id', RUN_ID);
  header.setSharedPluginData('create-ui', 'section', 'page-header');
}

else {
  return { error: `Unknown SECTION_TYPE: ${SECTION_TYPE}. Valid: navbar, hero, stats-grid, feature-grid, sidebar, page-header` };
}

return {
  runId: RUN_ID,
  sectionType: SECTION_TYPE,
  wrapperId: WRAPPER_ID,
  createdCount: createdIds.length,
  createdIds,
};
