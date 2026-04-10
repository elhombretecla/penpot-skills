# Phase 2: Documentation Creation

Documentation is built before components but after foundations. This phase creates the page skeleton and all documentation frames so that every subsequent component has a home to land in.

---

## Page Skeleton

Create pages in this order. Page order in Penpot reflects navigation order in the left panel.

```
1. Cover            — Identity page: system name, version, tagline, color bar
2. Getting Started  — How to connect the library and use it in designs
3. Foundations      — Visual documentation: colors, typography, spacing, radius, shadows
4. Components       — Index page listing all components with links to their pages
5. [Component pages] — One page per component (created in Phase 3)
6. Utilities        — Miscellaneous: icon grid, illustration slots, motion tokens
```

### Creating Pages

```typescript
// Create pages in order — each in its own execute_code call
const newPage = penpot.createPage();
newPage.name = 'Cover';
return { id: newPage.id, name: newPage.name };
```

> Verify `penpot.createPage()` signature with `penpot_api_info` — the method may require arguments in some Penpot versions.

**Check before creating:**

```typescript
const existing = penpot.pages.find(p => p.name === 'Cover');
if (existing) return { skipped: true, id: existing.id };
```

---

## Cover Page

The cover page communicates the identity of the design system at a glance.

### Layout

```
Frame: "Cover" (1440 × 900)
  ├── bg-gradient (frame, full bleed, brand color fill)
  ├── content (frame, flex column, centered)
  │   ├── system-name (text, Display/Large, white)
  │   ├── tagline (text, Body/LG, white 80% opacity)
  │   ├── version (text, Label/SM, white 60% opacity) — e.g. "v1.0.0"
  │   └── metadata (text, Caption/MD) — e.g. "Last updated: 2025-01"
  └── color-bar (frame, flex row, height 8px)
      ├── swatch-1 (frame, color.blue.500, flex 1)
      ├── swatch-2 (frame, color.blue.300, flex 1)
      └── swatch-n (frame, …, flex 1)
```

```typescript
const page = penpot.currentPage;

const cover = page.createFrame();
cover.name = 'Cover';
cover.x = 0; cover.y = 0;
cover.width = 1440; cover.height = 900;

// Background fill bound to brand color
const library = penpot.library.local;
const bgColor = library.colors.find(c => c.name === 'color/bg/brand');
if (bgColor) {
  cover.fills = [{
    fillType: 'solid',
    fillColor: bgColor.color,
    fillOpacity: bgColor.opacity ?? 1,
    fillColorRefId: bgColor.id,
    fillColorRefFileId: bgColor.fileId
  }];
}

// Title text
const title = page.createText('Design System');
title.name = 'system-name';
title.x = 120; title.y = 300;
title.fontSize = 64;
title.fontFamily = 'Inter';
title.fontStyle = 'Bold';
title.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 1 }];

cover.appendChild(title);

cover.setSharedPluginData('dsb', 'run_id', RUN_ID);
cover.setSharedPluginData('dsb', 'phase', 'phase2');
cover.setSharedPluginData('dsb', 'key', 'doc/cover');

return { id: cover.id };
```

---

## Foundations Page

The foundations page documents every visual primitive: colors, typography, spacing, radius, and shadows. It must be scrollable (tall, 1440px wide) with clear section separators.

### Overall Structure

```
Frame: "Foundations" (1440 × auto — grows with content)
  ├── section: Colors         (y = 80)
  ├── section: Typography     (y = 80 + colors-height + 80)
  ├── section: Spacing        (y = …)
  ├── section: Border Radius  (y = …)
  └── section: Shadows        (y = …)
```

Each section follows this inner pattern:
```
Section frame (frame, flex column, gap 32)
  ├── section-header (frame, flex row, border-bottom)
  │   ├── section-title (text, Heading/LG)
  │   └── section-description (text, Body/SM)
  └── content (frame, flex row wrap, gap 16)
      └── [item cards]
```

---

### Color Swatches

For each library color, create a swatch card:

```typescript
function createColorSwatch(page, color, x, y) {
  const card = page.createFrame();
  card.name = `swatch/${color.name}`;
  card.x = x; card.y = y;
  card.width = 160; card.height = 120;
  card.borderRadius = 8;

  const layout = card.addFlexLayout();
  layout.dir = 'column';

  // Color preview
  const preview = page.createFrame();
  preview.name = 'preview';
  preview.width = 160; preview.height = 80;
  preview.fills = [{
    fillType: 'solid',
    fillColor: color.color,
    fillOpacity: color.opacity ?? 1,
    fillColorRefId: color.id,
    fillColorRefFileId: color.fileId
  }];

  // Label
  const label = page.createText(color.name);
  label.name = 'name';
  label.fontSize = 11;
  label.fontFamily = 'Inter';

  const value = page.createText(color.color.toUpperCase());
  value.name = 'hex';
  value.fontSize = 10;

  card.appendChild(preview);
  card.appendChild(label);
  card.appendChild(value);

  return card;
}
```

Group swatches by category: primitives, background, text, border, interactive.

---

### Typography Specimens

For each library typography, create a specimen card that shows the typeface in context:

```typescript
function createTypographySpecimen(page, typo, x, y) {
  const card = page.createFrame();
  card.name = `specimen/${typo.name}`;
  card.x = x; card.y = y;
  card.width = 640;
  card.borderRadius = 4;

  const layout = card.addFlexLayout();
  layout.dir = 'row';
  layout.alignItems = 'center';
  layout.gap = 24;
  layout.padding = { top: 16, right: 24, bottom: 16, left: 24 };

  // Sample text
  const sample = page.createText('The quick brown fox jumps over the lazy dog');
  sample.name = 'sample';
  sample.fontSize = typo.fontSize;
  sample.fontFamily = typo.fontFamily;
  sample.fontStyle = typo.fontStyle || 'Regular';

  // Metadata
  const meta = page.createText(
    `${typo.name}\n${typo.fontFamily} ${typo.fontWeight} / ${typo.fontSize}px / ${typo.lineHeight}`
  );
  meta.name = 'meta';
  meta.fontSize = 11;

  card.appendChild(sample);
  card.appendChild(meta);
  return card;
}
```

---

### Spacing Scale Bars

Visualize the spacing scale as horizontal bars of increasing width:

```typescript
const spacingTokens = [
  { name: 'spacing.xs', value: 4 },
  { name: 'spacing.sm', value: 8 },
  { name: 'spacing.md', value: 16 },
  { name: 'spacing.lg', value: 24 },
  { name: 'spacing.xl', value: 32 },
  { name: 'spacing.2xl', value: 48 },
  { name: 'spacing.3xl', value: 64 },
];

let yOffset = 0;
for (const token of spacingTokens) {
  const row = page.createFrame();
  row.name = `spacing-bar/${token.name}`;
  row.x = 0; row.y = yOffset;
  row.height = 24;

  const layout = row.addFlexLayout();
  layout.dir = 'row';
  layout.alignItems = 'center';
  layout.gap = 16;

  const bar = page.createFrame();
  bar.name = 'bar';
  bar.width = token.value * 3;  // scale for visibility
  bar.height = 16;
  bar.borderRadius = 2;

  const bgColor = library.colors.find(c => c.name === 'color/bg/brand');
  if (bgColor) {
    bar.fills = [{
      fillType: 'solid',
      fillColor: bgColor.color,
      fillOpacity: bgColor.opacity ?? 1,
      fillColorRefId: bgColor.id,
      fillColorRefFileId: bgColor.fileId
    }];
  }

  const label = page.createText(`${token.name} — ${token.value}px`);
  label.fontSize = 12;

  row.appendChild(bar);
  row.appendChild(label);
  yOffset += 32;
}
```

---

### Border Radius Demonstrations

Show each radius value applied to a square:

```typescript
const radiusTokens = [
  { name: 'radius.none', value: 0 },
  { name: 'radius.sm', value: 4 },
  { name: 'radius.md', value: 8 },
  { name: 'radius.lg', value: 12 },
  { name: 'radius.xl', value: 16 },
  { name: 'radius.full', value: 9999 },
];

let xOffset = 0;
for (const token of radiusTokens) {
  const demo = page.createFrame();
  demo.name = `radius-demo/${token.name}`;
  demo.x = xOffset; demo.y = 0;
  demo.width = 80; demo.height = 80;
  demo.borderRadius = token.value;

  const bgColor = library.colors.find(c => c.name === 'color/bg/brand');
  if (bgColor) {
    demo.fills = [{
      fillType: 'solid',
      fillColor: bgColor.color,
      fillOpacity: 0.15,
      fillColorRefId: bgColor.id,
      fillColorRefFileId: bgColor.fileId
    }];
  }

  const label = page.createText(`${token.name}\n${token.value === 9999 ? 'full' : token.value + 'px'}`);
  label.name = 'label';
  label.fontSize = 10;
  label.x = xOffset; label.y = 90;

  xOffset += 100;
}
```

---

### Shadow Elevation Cards

Show each shadow level applied to a card:

```typescript
const shadowDefs = [
  { name: 'shadow.sm', offsetY: 1, blur: 2, spread: 0, opacity: 0.05 },
  { name: 'shadow.md', offsetY: 4, blur: 6, spread: -1, opacity: 0.10 },
  { name: 'shadow.lg', offsetY: 10, blur: 15, spread: -3, opacity: 0.15 },
  { name: 'shadow.xl', offsetY: 20, blur: 25, spread: -5, opacity: 0.20 },
];

let xOffset = 0;
for (const s of shadowDefs) {
  const card = page.createFrame();
  card.name = `shadow-demo/${s.name}`;
  card.x = xOffset; card.y = 40;
  card.width = 120; card.height = 80;
  card.borderRadius = 8;
  card.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 1 }];

  // Apply shadow
  card.shadows = [{
    shadowType: 'drop-shadow',
    offsetX: 0,
    offsetY: s.offsetY,
    blur: s.blur,
    spread: s.spread,
    color: { r: 0, g: 0, b: 0, a: s.opacity }
  }];

  const label = page.createText(s.name);
  label.name = 'label';
  label.fontSize = 10;
  label.x = xOffset; label.y = 20;

  xOffset += 160;
}
```

---

## Component Documentation Frames

Each component page must include a `_Doc` frame below the variant container, documenting the component's purpose, props, and usage notes.

```
[Component Page]
  ├── Button (VariantContainer — main grid at y = 0)
  └── _Doc (frame at y = grid_height + 80)
      ├── doc-title (text, "Button", Heading/LG)
      ├── doc-divider (frame, 1px height, color/border/default fill)
      ├── doc-description (text, Body/MD)
      ├── doc-props (frame, flex column)
      │   ├── prop-row/size (frame)
      │   ├── prop-row/style (frame)
      │   └── prop-row/state (frame)
      ├── doc-usage (text, Heading/SM: "Usage Notes")
      └── doc-notes (text, Body/SM)
```

```typescript
function createComponentDocFrame(page, componentName, description, props, yOffset, runId) {
  const doc = page.createFrame();
  doc.name = '_Doc';
  doc.x = 0; doc.y = yOffset;
  doc.width = 1440;

  const layout = doc.addFlexLayout();
  layout.dir = 'column';
  layout.gap = 24;
  layout.padding = { top: 48, right: 80, bottom: 80, left: 80 };

  // Title
  const title = page.createText(componentName);
  title.name = 'doc-title';
  title.fontSize = 24;
  title.fontFamily = 'Inter';
  title.fontStyle = 'SemiBold';

  // Divider
  const divider = page.createFrame();
  divider.name = 'doc-divider';
  divider.width = 1280; divider.height = 1;

  // Description
  const desc = page.createText(description);
  desc.name = 'doc-description';
  desc.fontSize = 16;

  doc.appendChild(title);
  doc.appendChild(divider);
  doc.appendChild(desc);

  doc.setSharedPluginData('dsb', 'run_id', runId);
  doc.setSharedPluginData('dsb', 'phase', 'phase2');
  doc.setSharedPluginData('dsb', 'key', `doc/component/${componentName.toLowerCase()}`);

  return { id: doc.id };
}
```

---

## Section Separator Pattern

Between major sections on the foundations page, use a named separator frame:

```typescript
const separator = page.createFrame();
separator.name = '——— TYPOGRAPHY ———';
separator.x = 0; separator.y = currentY;
separator.width = 1440; separator.height = 64;
separator.fills = [{ fillType: 'solid', fillColor: '#F3F4F6', fillOpacity: 1 }];

const label = page.createText('Typography');
label.name = 'section-label';
label.fontSize = 12;
label.fontFamily = 'Inter';
label.fontStyle = 'SemiBold';
label.fills = [{ fillType: 'solid', fillColor: '#6B7280', fillOpacity: 1 }];
separator.appendChild(label);
```

---

## Documentation Quality Standards

| Item | Standard |
|------|----------|
| Page width | 1440px (all documentation pages) |
| Section spacing | 80px between sections |
| Content padding | 80px horizontal margins |
| Color swatch size | 160 × 120px (includes preview + label) |
| Typography specimen width | 640px |
| Spacing bar height | 24px |
| Component doc frame top margin | 80px below the last variant row |
| Font for labels/metadata | Inter, 10–12px |

---

## Documentation Anti-Patterns

- ❌ Skipping the Cover or Foundations pages (these are required, not optional)
- ❌ Putting component documentation on the Foundations page
- ❌ Creating documentation frames after components (creates forward references that may break state tracking)
- ❌ Using hardcoded colors in documentation swatches (swatch fill must use `fillColorRefId`)
- ❌ Leaving spacing bars or radius demos with unlabeled values
- ❌ Skipping the `_Doc` frame for a component (documentation must travel with the component)
