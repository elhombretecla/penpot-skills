# Phase 4: Screen Migration

Reconstruct Figma screens (artboards/frames) in Penpot using the migrated component library and tokens. This phase runs after Phase 3 (all required components migrated).

---

## Core Principle

Screens are **assembled from instances**, not rebuilt from scratch.

The component library you migrated in Phase 3 should be the source of truth. When a Figma screen uses a Button, the Penpot screen should use a Button component instance — not a manually reconstructed button-shaped frame.

**Build order within each screen:**
1. Create the wrapper frame (artboard)
2. Build sections top-to-bottom, one `execute_code` call per section
3. Use component instances for every recognizable design system element
4. Apply token-bound fills to section backgrounds
5. Validate each section with `export_shape` before moving on

---

## 4a. Take Figma Screenshot Before Migrating

Before writing anything to Penpot, capture a visual reference for each screen:

```
Tool: get_screenshot
Input: { fileKey: "aBcDeFgH", nodeId: "SCREEN_FRAME_NODE_ID" }
```

Also call `get_design_context` on the screen frame to extract its section structure:

```
Tool: get_design_context
Input: { fileKey: "aBcDeFgH", nodeId: "SCREEN_FRAME_NODE_ID" }
```

From the context response, extract:
- Total artboard dimensions (width, height)
- Top-level children (each is a section)
- Per-section: name, dimensions, y-offset, component instances used

---

## 4b. Create the Page and Wrapper Frame

Create the Penpot screen on the correct page. If the Figma file has multiple pages, create the screen on the matching Penpot page.

```typescript
const page = penpot.currentPage;
const library = penpot.library.local;

const RUN_ID = 'REPLACE_WITH_RUN_ID';
const SCREEN_NAME = 'Homepage';
const SCREEN_WIDTH = 1440;
const SCREEN_HEIGHT = 3200;  // will grow as sections are added

// Find clear canvas space
const shapes = page.findShapes();
let maxX = 0;
for (const s of shapes) {
  if (!s.parentId) maxX = Math.max(maxX, (s.x || 0) + (s.width || 0));
}

const wrapper = page.createFrame();
wrapper.name = SCREEN_NAME;
wrapper.x = maxX + 200;
wrapper.y = 0;
wrapper.width = SCREEN_WIDTH;
wrapper.height = SCREEN_HEIGHT;
wrapper.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 1 }];

// No flex layout on the wrapper itself — sections will stack with absolute positioning
// or use a vertical flex layout if the Figma screen uses one
// For most screens: use vertical flex on the wrapper
const layout = wrapper.addFlexLayout();
layout.dir = 'column';
layout.alignItems = 'stretch';  // full-width sections
layout.gap = 0;

wrapper.setSharedPluginData('figma-import', 'run_id', RUN_ID);
wrapper.setSharedPluginData('figma-import', 'entity_type', 'screen');
wrapper.setSharedPluginData('figma-import', 'figma_id', 'FIGMA_SCREEN_NODE_ID');

return { wrapperId: wrapper.id, wrapperName: wrapper.name };
```

---

## 4c. Build Each Section

Build one section per `execute_code` call. At the start of each call, fetch the wrapper by ID.

### Section types and their translation:

**Full-width background sections** (hero, footer, feature blocks):
```typescript
const section = page.createFrame();
section.name = 'hero';
section.width = 1440;
section.height = 560;

const layout = section.addFlexLayout();
layout.dir = 'column';
layout.alignItems = 'center';
layout.justifyContent = 'center';
layout.gap = 24;
layout.padding = { top: 80, right: 80, bottom: 80, left: 80 };

// Token-bound background
const bg = library.colors.find(c => c.name === 'color/brand/primary');
if (bg) {
  section.fills = [{ fillType: 'solid', fillColor: bg.color, fillOpacity: bg.opacity ?? 1, fillColorRefId: bg.id, fillColorRefFileId: bg.fileId }];
}
```

**Navigation bar** (component instance):
```typescript
// Find the migrated NavBar component
const navbarComponent = library.components.find(c => c.name === 'NavBar');
if (!navbarComponent) {
  // Fallback: build manually (log binding gap)
  bindingGaps.push({ shape: 'nav-bar', expected: 'NavBar component', fallback: 'manual frame' });
  // ... build manually
} else {
  const navbarInstance = navbarComponent.createInstance();
  // Override text content in child instances
  const textNodes = navbarInstance.findShapes().filter(s => s.type === 'text');
  // ... override as needed
  section.appendChild(navbarInstance);
}
```

**Content grids** (card repeaters):
```typescript
// 3-column feature card grid
const grid = page.createFrame();
grid.name = 'feature-grid';
grid.width = 1440;
grid.fills = [];

const gridLayout = grid.addFlexLayout();
gridLayout.dir = 'row';
gridLayout.alignItems = 'start';
gridLayout.justifyContent = 'center';
gridLayout.gap = 24;
gridLayout.padding = { top: 64, right: 80, bottom: 64, left: 80 };

const cardComponent = library.components.find(c => c.name === 'Card' || c.name.toLowerCase().includes('card'));
const cardContents = ['Real-time collaboration', 'Design tokens', 'Open source'];

for (const content of cardContents) {
  if (cardComponent) {
    const card = cardComponent.createInstance();
    const headings = card.findShapes().filter(s => s.type === 'text' && s.name.includes('title'));
    if (headings[0]) headings[0].characters = content;
    grid.appendChild(card);
  }
}
section.appendChild(grid);
```

---

## 4d. Component Instance Text Overrides

Every component instance comes with default/placeholder text. Override after creating the instance:

```typescript
// Pattern: find text children by name or position, then override
function overrideText(instance, textNodeName, newContent) {
  const textNodes = instance.findShapes
    ? instance.findShapes().filter(s => s.type === 'text')
    : [];
  // Try exact name match first
  let target = textNodes.find(s => s.name === textNodeName);
  // Fall back to first text node if name not found
  if (!target) target = textNodes[0];
  if (target) {
    target.characters = newContent;
    return true;
  }
  return false;
}

// Usage:
overrideText(btnInstance, 'label', 'Get Started');
overrideText(cardInstance, 'card-title', 'Feature Name');
overrideText(badgeInstance, 'text', 'New');
```

---

## 4e. Binding Gaps Tracking

Track every fill/stroke or component that couldn't be bound to a token or component instance:

```typescript
const bindingGaps = [];

// When a color token is missing:
const bgColor = library.colors.find(c => c.name === 'color/bg/secondary');
if (!bgColor) {
  section.fills = [{ fillType: 'solid', fillColor: '#F9FAFB', fillOpacity: 1 }];
  bindingGaps.push({
    shape: 'features-section',
    expected: 'color/bg/secondary',
    fallback: '#F9FAFB',
    impact: 'low',
  });
}

// When a component is missing:
if (!navbarComponent) {
  bindingGaps.push({
    shape: 'nav-bar',
    expected: 'NavBar component instance',
    fallback: 'manual frame reconstruction',
    impact: 'medium',
  });
}

// Return gaps for user review:
return { success: true, sectionId: section.id, bindingGaps };
```

If any `impact: 'high'` gaps exist, pause and ask the user before continuing.

---

## 4f. Section Validation

After each section, validate visually:

```
Tool: export_shape
Input: { shapeId: SECTION_ID }
```

Compare the exported shape against:
1. The Figma screenshot captured in Phase 0
2. Mental checklist:
   - [ ] Correct background color (token-bound)
   - [ ] Typography matches Figma (size, weight, color)
   - [ ] Component instances visible and correct variant
   - [ ] No placeholder text remaining ("Title", "Heading", "Button Label")
   - [ ] Layout proportions correct (padding, gaps, widths)
   - [ ] No clipped/cropped text (frame too small)
   - [ ] No overlapping elements (layout collision)

If issues found: fix with a targeted `execute_code` call on the specific element. Do not rebuild the entire section.

---

## 4g. Screen Completion Checkpoint

After all sections are built and validated, present a final side-by-side comparison:

```
SCREEN MIGRATED: Homepage

Sections completed: 5/5
  ✅ NavBar
  ✅ Hero
  ✅ Feature Grid (3 cards)
  ✅ Pricing (3 tiers)
  ✅ Footer

Binding gaps: 2
  ⚠️  hero-background: color/brand/gradient not found → fallback to solid #3B82F6 (medium impact)
  ℹ️  social-icons: Icon/Twitter not migrated → placeholder rectangles (low impact)

Compare the Penpot export with the Figma screenshot. Approve or list issues?
```

---

## Screen Migration Anti-Patterns

- ❌ Building sections before migrating the required components
- ❌ Hardcoding hex fills when a library color exists (breaks design system link)
- ❌ Building component shapes manually instead of using `createInstance()` (breaks library connection)
- ❌ Not capturing Figma screenshots before migrating (no visual reference for comparison)
- ❌ Building multiple sections in one `execute_code` call (hard to debug, hard to roll back)
- ❌ Ignoring binding gaps or not tracking them (user can't see what didn't translate)
- ❌ Setting explicit height on the wrapper frame before all sections are added (causes clipping)
- ❌ Applying absolute positioning to sections in a flex column wrapper (sections won't stack)
