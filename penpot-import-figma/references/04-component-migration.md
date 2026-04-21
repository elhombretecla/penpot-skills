# Phase 3: Component Migration

Translate Figma components into Penpot components, preserving variant structure, layout behavior, and token bindings. **Complete Phase 2 (tokens) before starting this phase.**

---

## Component Migration Sequence

For each component (in dependency order from the IR):

```
3a. Get Figma design context → extract the component's shape tree
3b. Take Figma screenshot → save as visual reference
3c. Translate layout spec (Auto Layout → Flex)
3d. Create Penpot base frame with correct layout
3e. Create child shapes recursively
3f. Apply token-bound fills, strokes, and typography
3g. Wrap as Penpot component
3h. If variants: createVariantContainer() + build each variant frame
3i. Validate: export_shape vs. Figma screenshot
3j. Tag with plugin data, update state ledger
✋ USER CHECKPOINT: compare screenshots, approve before next component
```

---

## 3a. Extract Component from Figma

Call `get_design_context` for the component (or component set):

```
Tool: get_design_context
Input: { fileKey: "aBcDeFgH", nodeId: "FIGMA_COMPONENT_NODE_ID" }
```

Parse the response to build a component shape spec:

```javascript
// Component shape spec (Claude-internal structure, not Penpot API)
const componentSpec = {
  name: "Button",
  layout: {
    type: "flex",
    dir: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: { top: 8, right: 16, bottom: 8, left: 16 },
    hSizing: "fit-content",
    vSizing: "fit-content",
  },
  fills: [{ type: "color-ref", colorName: "color/brand/primary", fallbackHex: "#3B82F6" }],
  borderRadius: 8,    // or tokenName: "radius.md"
  children: [
    {
      name: "icon-left",
      type: "instance",
      componentRef: "Icon",
      visible: false,  // optional in default variant
    },
    {
      name: "label",
      type: "text",
      content: "Button",
      typography: "Label/MD",
      colorRef: "color/text/inverse",
      colorFallback: "#FFFFFF",
    },
  ],
  variants: [
    // ... (see variant building section)
  ],
};
```

---

## 3b. Create the Base Component Frame

Create the main frame first, then wrap it as a component. Do NOT attempt to create the component directly — build the shape tree first.

```typescript
const page = penpot.currentPage;
const library = penpot.library.local;

const RUN_ID = 'REPLACE_WITH_RUN_ID';
const FIGMA_NODE_ID = 'REPLACE_WITH_FIGMA_NODE_ID';

// Idempotency: check if component already exists
const existingComponent = library.components.find(c =>
  c.getSharedPluginData && c.getSharedPluginData('figma-import', 'figma_id') === FIGMA_NODE_ID
);
if (existingComponent) {
  return { skipped: true, componentId: existingComponent.id };
}

// Helper: apply library color fill
function applyColorFill(shape, colorName, fallbackHex) {
  const c = library.colors.find(col => col.name === colorName);
  if (c) {
    shape.fills = [{
      fillType: 'solid',
      fillColor: c.color,
      fillOpacity: c.opacity ?? 1,
      fillColorRefId: c.id,
      fillColorRefFileId: c.fileId,
    }];
    return { bound: true, id: c.id };
  }
  shape.fills = [{ fillType: 'solid', fillColor: fallbackHex, fillOpacity: 1 }];
  return { bound: false, fallback: fallbackHex };
}

// Helper: create text with typography binding
function createText(content, typoName, colorName, colorFallback) {
  const t = page.createText(content);
  if (typoName) {
    const typo = library.typographies.find(tp => tp.name === typoName);
    if (typo && t.applyTypography) t.applyTypography(typo);
    else { t.fontFamily = 'Inter'; t.fontSize = 14; }
  }
  if (colorName) applyColorFill(t, colorName, colorFallback ?? '#111827');
  return t;
}

// Build base frame
const base = page.createFrame();
base.name = 'Button';
base.width = 120;
base.height = 40;
base.borderRadius = 8;

const layout = base.addFlexLayout();
layout.dir = 'row';
layout.alignItems = 'center';
layout.justifyContent = 'center';
layout.padding = { top: 8, right: 16, bottom: 8, left: 16 };
layout.gap = 8;

// Apply fill via library color (token-bound)
applyColorFill(base, 'color/brand/primary', '#3B82F6');

// Create label child
const label = createText('Button', 'Label/MD', 'color/text/inverse', '#FFFFFF');
label.name = 'label';
base.appendChild(label);

// Tag with plugin data
base.setSharedPluginData('figma-import', 'run_id', RUN_ID);
base.setSharedPluginData('figma-import', 'figma_id', FIGMA_NODE_ID);
base.setSharedPluginData('figma-import', 'entity_type', 'component-base');

// Wrap as component
const component = page.createComponent(base);

return {
  componentId: component.id,
  mainFrameId: base.id,
  name: base.name,
};
```

---

## 3c. Build Variants with VariantContainer

For Figma Component Sets (multiple variants), create a `VariantContainer` in Penpot.

### Variant building strategy

1. Create the VariantContainer first
2. Add each variant frame to it
3. Position variant frames in a grid layout (avoid stacking at 0,0)
4. Apply correct fills, strokes, sizing per variant

```typescript
const page = penpot.currentPage;
const library = penpot.library.local;

const CONTAINER_X = 100;
const CONTAINER_Y = 100;

// VariantContainer wraps all variants of one component
const container = page.createVariantContainer();
container.name = 'Button';
container.x = CONTAINER_X;
container.y = CONTAINER_Y;

// Variant grid layout
const COLS = 3;       // Style variants (Primary, Ghost, Danger)
const COL_WIDTH = 160;
const ROW_HEIGHT = 80;
const GAP = 24;

// All variant combinations
const variants = [
  { style: 'Primary', size: 'Medium', state: 'Default', fill: 'color/brand/primary', text: 'color/text/inverse',   w: 120, h: 40 },
  { style: 'Primary', size: 'Medium', state: 'Hover',   fill: 'color/brand/primary', text: 'color/text/inverse',   w: 120, h: 40 },
  { style: 'Ghost',   size: 'Medium', state: 'Default', fill: null,                  text: 'color/text/primary',   w: 120, h: 40 },
  { style: 'Ghost',   size: 'Medium', state: 'Hover',   fill: null,                  text: 'color/text/primary',   w: 120, h: 40 },
  { style: 'Danger',  size: 'Medium', state: 'Default', fill: 'color/feedback/error', text: 'color/text/inverse',  w: 120, h: 40 },
];

const createdVariants = [];

variants.forEach((v, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);

  const frame = page.createFrame();
  frame.name = `Style=${v.style}, Size=${v.size}, State=${v.state}`;
  frame.x = CONTAINER_X + col * (COL_WIDTH + GAP);
  frame.y = CONTAINER_Y + row * (ROW_HEIGHT + GAP);
  frame.width = v.w;
  frame.height = v.h;
  frame.borderRadius = 8;

  // Layout
  const fl = frame.addFlexLayout();
  fl.dir = 'row';
  fl.alignItems = 'center';
  fl.justifyContent = 'center';
  fl.padding = { top: 8, right: 16, bottom: 8, left: 16 };
  fl.gap = 8;

  // Fill
  if (v.fill) {
    const c = library.colors.find(col => col.name === v.fill);
    if (c) {
      frame.fills = [{ fillType: 'solid', fillColor: c.color, fillOpacity: c.opacity ?? 1, fillColorRefId: c.id, fillColorRefFileId: c.fileId }];
    } else {
      frame.fills = [];
    }
  } else {
    frame.fills = [];
    // Add stroke for ghost
    frame.strokes = [{ strokeType: 'center', strokeWidth: 1, strokeColor: '#D1D5DB', strokeOpacity: 1 }];
  }

  // Label
  const labelColor = library.colors.find(col => col.name === v.text);
  const label = page.createText('Button');
  label.name = 'label';
  label.fontFamily = 'Inter';
  label.fontSize = 14;
  if (labelColor) {
    label.fills = [{ fillType: 'solid', fillColor: labelColor.color, fillOpacity: 1, fillColorRefId: labelColor.id, fillColorRefFileId: labelColor.fileId }];
  }
  frame.appendChild(label);

  // Tag
  frame.setSharedPluginData('figma-import', 'run_id', 'REPLACE_WITH_RUN_ID');
  frame.setSharedPluginData('figma-import', 'entity_type', 'variant-frame');

  container.appendChild(frame);
  createdVariants.push({ name: frame.name, id: frame.id, x: frame.x, y: frame.y });
});

return {
  containerId: container.id,
  variantCount: createdVariants.length,
  variants: createdVariants,
};
```

---

## 3d. Variant Matrix Management

**When to split variants:**

Figma may have a large variant matrix that exceeds what is practical in Penpot. If total variants > 30:
1. Identify which axes drive the most visual change (usually Style > State > Size)
2. Propose splitting: create separate VariantContainers for each Style variant, with Size+State as the axes within each
3. Present the split plan to the user before building

**Property naming in variants:**

Penpot variant frame names encode properties as `Property=Value` pairs:
```
✅  "Style=Primary, Size=Medium, State=Default"
✅  "Size=SM, Checked=True"
❌  "button-primary-medium-default"   ← flat name, loses variant structure
❌  "Primary / Medium / Default"       ← wrong separator
```

---

## 3e. Handling Nested Instances

When a Figma component contains instances of other components (e.g., Button uses Icon):

1. **The inner component must already exist in Penpot** (dependency ordering)
2. Create an instance of the inner component inside the outer component

```typescript
// Find the Icon component already migrated to Penpot
const iconComponent = library.components.find(c => c.name === 'Icon');
if (!iconComponent) return { error: 'Icon component not found — migrate it first' };

// Create instance inside the parent frame
const iconInstance = iconComponent.createInstance();
iconInstance.name = 'icon-left';
iconInstance.width = 16;
iconInstance.height = 16;

parentFrame.appendChild(iconInstance);
```

---

## 3f. Component Documentation Frame

After creating each component, add a documentation frame on the same page:

```typescript
const docFrame = page.createFrame();
docFrame.name = `${componentName}/_Doc`;
docFrame.x = container.x + container.width + 64;
docFrame.y = container.y;
docFrame.width = 400;
docFrame.height = 200;
docFrame.fills = [{ fillType: 'solid', fillColor: '#F9FAFB', fillOpacity: 1 }];
docFrame.borderRadius = 8;

const title = page.createText(componentName);
title.name = 'doc-title';
title.fontFamily = 'Inter';
title.fontSize = 16;
title.fills = [{ fillType: 'solid', fillColor: '#111827', fillOpacity: 1 }];
docFrame.appendChild(title);

const desc = page.createText(`Migrated from Figma. Variants: ${variantCount}. Figma ID: ${figmaNodeId}`);
desc.name = 'doc-desc';
desc.fontFamily = 'Inter';
desc.fontSize = 12;
desc.fills = [{ fillType: 'solid', fillColor: '#6B7280', fillOpacity: 1 }];
docFrame.appendChild(desc);

return { docFrameId: docFrame.id };
```

---

## Component Migration Anti-Patterns

- ❌ Creating a VariantContainer before its child shapes are ready (pass shapes to it)
- ❌ Migrating a component that depends on another not yet migrated
- ❌ Using hardcoded hex fills instead of library color `fillColorRefId`
- ❌ Breaking a Figma Component Set into separate unrelated components (keep as VariantContainer)
- ❌ Not naming variant frames with `Property=Value` format (loses variant functionality)
- ❌ Skipping the visual validation screenshot after each component
- ❌ Creating more than one component per `execute_code` call for complex components
- ❌ Migrating private Figma components (named `_Base`, `_Internal`) as top-level library components
