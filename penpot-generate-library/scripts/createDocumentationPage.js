/**
 * createDocumentationPage.js
 *
 * Creates structured documentation pages and frames in Penpot:
 * - Cover page (1440 × 900)
 * - Foundations page (scrollable, with color swatches, type specimens, spacing bars)
 * - Component doc frame (_Doc) below each component's variant container
 *
 * Run in Phase 2, AFTER tokens and library colors exist (Phase 1),
 * BEFORE building components (Phase 3).
 *
 * ⚠️  Check penpot_api_info({ type: 'Page' }) for createPage() signature.
 */

const page = penpot.currentPage;
const library = penpot.library.local;

const RUN_ID = 'penpot-dsb-REPLACE-ME';  // ← replace with actual run ID

// ── Utilities ────────────────────────────────────────────────────────────────

function makeColorFill(colorName, fallbackHex = '#E5E7EB', fallbackOpacity = 1) {
  const c = library.colors.find(c => c.name === colorName);
  if (!c) return { fillType: 'solid', fillColor: fallbackHex, fillOpacity: fallbackOpacity };
  return {
    fillType: 'solid',
    fillColor: c.color,
    fillOpacity: c.opacity !== undefined ? c.opacity : 1,
    fillColorRefId: c.id,
    fillColorRefFileId: c.fileId,
  };
}

function createText(text, options = {}) {
  const t = page.createText(text);
  t.name = options.name || 'text';
  t.fontSize = options.fontSize || 16;
  t.fontFamily = options.fontFamily || 'Inter';
  t.fontStyle = options.fontStyle || 'Regular';
  if (options.color) {
    t.fills = [makeColorFill(options.color, options.colorFallback || '#111827')];
  }
  if (options.x !== undefined) t.x = options.x;
  if (options.y !== undefined) t.y = options.y;
  return t;
}

function tagShape(shape, phase, key) {
  shape.setSharedPluginData('dsb', 'run_id', RUN_ID);
  shape.setSharedPluginData('dsb', 'phase', phase);
  shape.setSharedPluginData('dsb', 'key', key);
}

// ── Cover Page ───────────────────────────────────────────────────────────────

/**
 * Creates the Cover documentation frame on the current page.
 * Call this after navigating to the Cover page.
 */
function createCoverFrame(systemName, version = 'v1.0.0', tagline = '') {
  // Idempotency check
  const existing = page.findShapes().find(s =>
    s.getSharedPluginData('dsb', 'key') === 'doc/cover'
  );
  if (existing) return { skipped: true, id: existing.id };

  const cover = page.createFrame();
  cover.name = 'Cover';
  cover.x = 0; cover.y = 0;
  cover.width = 1440; cover.height = 900;
  cover.fills = [makeColorFill('color/brand/primary', '#3B82F6')];

  // Title
  const title = createText(systemName, {
    name: 'system-name',
    fontSize: 64,
    fontStyle: 'Bold',
    color: 'color/text/inverse',
    colorFallback: '#FFFFFF',
    x: 120, y: 320,
  });

  // Tagline
  const taglineText = createText(tagline || 'Design System', {
    name: 'tagline',
    fontSize: 24,
    fontStyle: 'Regular',
    color: 'color/text/inverse',
    colorFallback: '#FFFFFF',
    x: 120, y: 408,
  });

  // Version
  const versionText = createText(version, {
    name: 'version',
    fontSize: 14,
    color: 'color/text/inverse',
    colorFallback: '#FFFFFF',
    x: 120, y: 460,
  });

  // Bottom color bar
  const colorBar = page.createFrame();
  colorBar.name = 'color-bar';
  colorBar.x = 0; colorBar.y = 892;
  colorBar.width = 1440; colorBar.height = 8;
  const barLayout = colorBar.addFlexLayout();
  barLayout.dir = 'row';

  const barColors = ['color/brand/primary', 'color/status/success', 'color/status/warning', 'color/status/error'];
  barColors.forEach((colorName, i) => {
    const swatch = page.createFrame();
    swatch.name = `bar-${i}`;
    swatch.width = 360; swatch.height = 8;
    swatch.fills = [makeColorFill(colorName, ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][i])];
    colorBar.appendChild(swatch);
  });

  cover.appendChild(title);
  cover.appendChild(taglineText);
  cover.appendChild(versionText);
  cover.appendChild(colorBar);

  tagShape(cover, 'phase2', 'doc/cover');
  return { id: cover.id, name: cover.name };
}

// ── Foundations: Color Swatches Section ──────────────────────────────────────

/**
 * Creates a grid of color swatches from all library colors.
 * Groups them by folder path (text before the last slash).
 */
function createColorSwatchSection(startX = 80, startY = 120) {
  const existing = page.findShapes().find(s =>
    s.getSharedPluginData('dsb', 'key') === 'doc/foundations/colors'
  );
  if (existing) return { skipped: true, id: existing.id };

  const section = page.createFrame();
  section.name = 'section-colors';
  section.x = startX; section.y = startY;
  const layout = section.addFlexLayout();
  layout.dir = 'column';
  layout.gap = 32;

  const sectionTitle = createText('Colors', {
    name: 'section-title',
    fontSize: 20,
    fontStyle: 'SemiBold',
    color: 'color/text/primary',
    colorFallback: '#111827',
  });
  section.appendChild(sectionTitle);

  const grid = page.createFrame();
  grid.name = 'swatches-grid';
  const gridLayout = grid.addFlexLayout();
  gridLayout.dir = 'row';
  gridLayout.wrap = 'wrap';
  gridLayout.gap = 16;

  library.colors.forEach(c => {
    const card = page.createFrame();
    card.name = `swatch/${c.name}`;
    card.width = 160; card.height = 120;
    card.borderRadius = 8;
    const cardLayout = card.addFlexLayout();
    cardLayout.dir = 'column';

    const preview = page.createFrame();
    preview.name = 'preview';
    preview.width = 160; preview.height = 80;
    preview.fills = [{
      fillType: 'solid',
      fillColor: c.color,
      fillOpacity: c.opacity !== undefined ? c.opacity : 1,
      fillColorRefId: c.id,
      fillColorRefFileId: c.fileId,
    }];

    const nameLabel = createText(c.name, { name: 'name', fontSize: 10, color: 'color/text/secondary', colorFallback: '#4B5563' });
    const hexLabel = createText(c.color.toUpperCase(), { name: 'hex', fontSize: 10, color: 'color/text/tertiary', colorFallback: '#9CA3AF' });

    card.appendChild(preview);
    card.appendChild(nameLabel);
    card.appendChild(hexLabel);
    grid.appendChild(card);
  });

  section.appendChild(grid);
  tagShape(section, 'phase2', 'doc/foundations/colors');
  return { id: section.id };
}

// ── Foundations: Typography Specimens ────────────────────────────────────────

function createTypographySection(startX = 80, startY = 500) {
  const existing = page.findShapes().find(s =>
    s.getSharedPluginData('dsb', 'key') === 'doc/foundations/typography'
  );
  if (existing) return { skipped: true, id: existing.id };

  const section = page.createFrame();
  section.name = 'section-typography';
  section.x = startX; section.y = startY;
  const layout = section.addFlexLayout();
  layout.dir = 'column';
  layout.gap = 16;

  const sectionTitle = createText('Typography', {
    name: 'section-title',
    fontSize: 20,
    fontStyle: 'SemiBold',
    color: 'color/text/primary',
    colorFallback: '#111827',
  });
  section.appendChild(sectionTitle);

  library.typographies.forEach(t => {
    const row = page.createFrame();
    row.name = `specimen/${t.name}`;
    row.width = 1280; row.height = 56;
    const rowLayout = row.addFlexLayout();
    rowLayout.dir = 'row';
    rowLayout.alignItems = 'center';
    rowLayout.gap = 40;
    rowLayout.padding = { top: 8, right: 16, bottom: 8, left: 16 };

    const sample = createText('The quick brown fox', {
      name: 'sample',
      fontSize: t.fontSize || 16,
      fontFamily: t.fontFamily,
      fontStyle: t.fontStyle || 'Regular',
      color: 'color/text/primary',
      colorFallback: '#111827',
    });

    const meta = createText(
      `${t.name}  ·  ${t.fontFamily} ${t.fontWeight || 400} / ${t.fontSize || 16}px / lh ${t.lineHeight || 1.5}`,
      { name: 'meta', fontSize: 11, color: 'color/text/tertiary', colorFallback: '#9CA3AF' }
    );

    row.appendChild(sample);
    row.appendChild(meta);
    section.appendChild(row);
  });

  tagShape(section, 'phase2', 'doc/foundations/typography');
  return { id: section.id };
}

// ── Component Doc Frame ───────────────────────────────────────────────────────

/**
 * Creates a _Doc frame below a component's variant container.
 * Call from a Phase 3 execute_code after the variant container is positioned.
 *
 * @param {Object} opts
 * @param {string} opts.componentName — e.g. "Button"
 * @param {string} opts.description   — brief description of the component
 * @param {Array<{name: string, values: string, description: string}>} [opts.props]
 * @param {string} [opts.usageNotes]
 * @param {number} opts.yOffset        — y position (below the variant container)
 */
function createComponentDocFrame(opts) {
  const { componentName, description, props = [], usageNotes = '', yOffset } = opts;

  const key = `doc/component/${componentName.toLowerCase()}`;
  const existing = page.findShapes().find(s => s.getSharedPluginData('dsb', 'key') === key);
  if (existing) return { skipped: true, id: existing.id };

  const doc = page.createFrame();
  doc.name = '_Doc';
  doc.x = 0; doc.y = yOffset;
  doc.width = 1440;
  doc.fills = [makeColorFill('color/bg/secondary', '#F9FAFB')];

  const layout = doc.addFlexLayout();
  layout.dir = 'column';
  layout.gap = 24;
  layout.padding = { top: 48, right: 80, bottom: 80, left: 80 };

  const title = createText(componentName, {
    name: 'doc-title',
    fontSize: 24,
    fontStyle: 'SemiBold',
    color: 'color/text/primary',
    colorFallback: '#111827',
  });

  const divider = page.createFrame();
  divider.name = 'doc-divider';
  divider.width = 1280; divider.height = 1;
  divider.fills = [makeColorFill('color/border/default', '#E5E7EB')];

  const descText = createText(description, {
    name: 'doc-description',
    fontSize: 16,
    color: 'color/text/secondary',
    colorFallback: '#4B5563',
  });

  doc.appendChild(title);
  doc.appendChild(divider);
  doc.appendChild(descText);

  if (props.length > 0) {
    const propsTitle = createText('Props', {
      name: 'props-title',
      fontSize: 14,
      fontStyle: 'SemiBold',
      color: 'color/text/primary',
      colorFallback: '#111827',
    });
    doc.appendChild(propsTitle);

    for (const prop of props) {
      const propRow = page.createFrame();
      propRow.name = `prop-row/${prop.name}`;
      const propLayout = propRow.addFlexLayout();
      propLayout.dir = 'row';
      propLayout.gap = 24;

      const propName = createText(prop.name, { name: 'prop-name', fontSize: 13, fontStyle: 'Medium', color: 'color/text/primary', colorFallback: '#111827' });
      const propValues = createText(prop.values, { name: 'prop-values', fontSize: 13, color: 'color/text/brand', colorFallback: '#2563EB' });
      const propDesc = createText(prop.description, { name: 'prop-desc', fontSize: 13, color: 'color/text/secondary', colorFallback: '#4B5563' });

      propRow.appendChild(propName);
      propRow.appendChild(propValues);
      propRow.appendChild(propDesc);
      doc.appendChild(propRow);
    }
  }

  if (usageNotes) {
    const usageTitle = createText('Usage Notes', {
      name: 'usage-title',
      fontSize: 14,
      fontStyle: 'SemiBold',
      color: 'color/text/primary',
      colorFallback: '#111827',
    });
    const usageText = createText(usageNotes, {
      name: 'usage-notes',
      fontSize: 14,
      color: 'color/text/secondary',
      colorFallback: '#4B5563',
    });
    doc.appendChild(usageTitle);
    doc.appendChild(usageText);
  }

  tagShape(doc, 'phase2', key);
  return { id: doc.id, name: doc.name };
}

// ── Example invocation ───────────────────────────────────────────────────────
// Uncomment the function you need and adjust parameters:

// Cover page (navigate to Cover page first):
// return createCoverFrame('Acme Design System', 'v1.0.0', 'Consistent. Accessible. Fast.');

// Foundations sections (navigate to Foundations page first):
// return createColorSwatchSection(80, 120);

// Component doc frame (navigate to component page first, after building its variant container):
return createComponentDocFrame({
  componentName: 'Button',
  description: 'Trigger actions and navigation. Available in Primary, Secondary, and Ghost styles with Small, Medium, and Large sizes.',
  props: [
    { name: 'Style',   values: 'Primary | Secondary | Ghost | Destructive', description: 'Visual hierarchy level' },
    { name: 'Size',    values: 'Small | Medium | Large',                    description: 'Touch target and text size' },
    { name: 'State',   values: 'Default | Hover | Active | Disabled | Loading', description: 'Interaction state' },
    { name: 'Icon',    values: 'None | Left | Right | Both',                description: 'Optional icon placement' },
  ],
  usageNotes: 'Use Primary for the single highest-priority action per view. Use Secondary for supporting actions. Use Ghost for low-emphasis actions in dense contexts.',
  yOffset: 800,  // ← adjust to be below the variant container
});
