# Phase 3: Component Creation

Components are built one at a time, in dependency order, with all visual properties bound to tokens. Each component gets its own page. No component is considered complete until it has been validated visually via `export_shape`.

---

## Dependency Ordering

Build atoms before any molecule that contains them. A broken atom propagates errors to every molecule.

```
Tier 0 (primitives — no dependencies):
  Icon, Spinner, Divider, Spacer

Tier 1 (atoms — depend only on tokens):
  Button, Input, Checkbox, Radio, Toggle, Badge, Avatar, Tag, Tooltip

Tier 2 (molecules — depend on Tier 0–1):
  InputGroup (Input + Icon), ButtonGroup (Button + Button),
  Card (Avatar + Badge + Button), Alert (Icon + Button),
  Dropdown (Input + Icon + Tag), SearchBar (Input + Button + Icon)

Tier 3 (organisms — depend on Tier 0–2):
  NavBar (Button + Avatar + InputGroup + Icon),
  DataTable (Checkbox + Badge + Button + Divider),
  Form (Input + InputGroup + Button + Toggle),
  PageHeader (Heading + Badge + Button)
```

Before building any component, confirm its dependencies exist:

```typescript
const library = penpot.library.local;
const deps = ['Icon', 'Spinner'];
const missing = deps.filter(name => !library.components.find(c => c.name === name));
if (missing.length > 0) {
  return { error: 'Missing dependencies', missing };
}
```

---

## Component Build Pattern

For each component, follow this exact sequence:

```
3a. Create a dedicated page for the component
3b. Build the base frame with flex layout + token-bound fills/strokes/radius
3c. Add text children, icon slots, inner frames
3d. Bind all visual properties to tokens
3e. Create the component: page.createComponent(frame)
3f. Build the variant container: page.createVariantContainer()
3g. Add variant frames (one per combination) with correct property names
3h. Tag all created shapes with sharedPluginData
3i. Add a documentation frame on the same page
3j. Validate: high_level_overview + export_shape
```

---

## Base Frame Construction

Every base frame must use auto-layout (flex). Never use absolute positioning for component content.

```typescript
const page = penpot.currentPage;

// Create base frame
const frame = page.createFrame();
frame.name = 'Button';
frame.x = 100;
frame.y = 100;
frame.width = 120;
frame.height = 40;

// Apply flex layout
const layout = frame.addFlexLayout();
layout.dir = 'row';
layout.alignItems = 'center';
layout.justifyContent = 'center';
layout.padding = { top: 8, right: 16, bottom: 8, left: 16 };
layout.gap = 8;

// Bind fill to library color (token-bound)
const library = penpot.library.local;
const bgColor = library.colors.find(c => c.name === 'color/bg/brand');
if (bgColor) {
  frame.fills = [{
    fillType: 'solid',
    fillColor: bgColor.color,
    fillOpacity: bgColor.opacity ?? 1,
    fillColorRefId: bgColor.id,
    fillColorRefFileId: bgColor.fileId
  }];
}

// Bind border radius to token
// Note: check penpot_api_info for exact token-binding API on shapes
frame.borderRadius = 8;  // fallback raw value until token binding API is confirmed

// Tag for state tracking
frame.setSharedPluginData('dsb', 'run_id', RUN_ID);
frame.setSharedPluginData('dsb', 'phase', 'phase3');
frame.setSharedPluginData('dsb', 'key', 'component/button/base');

return { id: frame.id };
```

> **Important**: The exact API for binding tokens to shape properties (radius, padding) may differ from fill bindings. Call `penpot_api_info` with type `Shape` or `Frame` to verify the token-binding methods for the current Penpot version.

---

## Variant Container

Penpot uses `VariantContainer` to group component variants, analogous to a Figma component set.

```typescript
const page = penpot.currentPage;

// Create the variant container
const container = page.createVariantContainer();
container.name = 'Button';
container.x = 100;
container.y = 200;

// The container auto-generates a main component grid
// Add each variant as a frame inside the container
// See createComponentWithVariants.js for the full implementation
```

### Variant Axes and Naming

Map component props to variant property names. Penpot variant properties use `Property=Value` syntax:

| Prop in code | Variant property in Penpot | Values |
|-------------|---------------------------|--------|
| `variant` or `type` | `Style` | `Primary`, `Secondary`, `Ghost`, `Destructive` |
| `size` | `Size` | `Small`, `Medium`, `Large` |
| internal state | `State` | `Default`, `Hover`, `Active`, `Disabled`, `Loading` |
| `disabled` | (fold into State) | `Disabled` |
| `loading` | (fold into State) | `Loading` |
| `iconLeft` / `iconRight` | `Icon` | `None`, `Left`, `Right`, `Both` |
| `checked` | `Checked` | `True`, `False` |

**Naming rules:**
- Property names: `PascalCase` — `Size`, `Style`, `State`
- Values: `Title Case` — `Primary`, `Small`, `Default`
- Use `True`/`False` for boolean props, not `Yes`/`No` or `On`/`Off`

---

## Variant Matrix and the 30-Combination Cap

When Size × Style × State exceeds 30 variants, you must split or prune.

### Calculating the matrix

```
Button: Size(3) × Style(4) × State(5) = 60 combinations → too many

Strategies:
  1. Reduce State: Default + Hover + Disabled = 3 states → 36 → still too many
  2. Reduce Style: Primary + Secondary + Ghost = 3 → 27 → OK ✓
  3. Split: ButtonBase (Style × Size) + separate StateLayer
  4. Accept partial coverage: build Size × Style grid, document states separately
```

**Recommended split pattern** when a component has too many combinations:

| Container | Axes | Combinations |
|-----------|------|-------------|
| `Button` (main) | Size × Style | 3 × 4 = 12 |
| `Button/States` (reference) | State × (one Size × Style) | 5 × 1 = 5 |

Use the main container for library consumption. The states reference is for documentation only.

---

## Grid Layout for Variant Containers

Organize the variant grid so it reads left→right as State, top→bottom as Size × Style:

```
         Default   Hover    Active   Disabled  Loading
SM/Pri   [ btn ]  [ btn ]  [ btn ]  [ btn ]   [ btn ]
SM/Sec   [ btn ]  [ btn ]  [ btn ]  [ btn ]   [ btn ]
MD/Pri   [ btn ]  [ btn ]  [ btn ]  [ btn ]   [ btn ]
MD/Sec   [ btn ]  [ btn ]  [ btn ]  [ btn ]   [ btn ]
LG/Pri   [ btn ]  [ btn ]  [ btn ]  [ btn ]   [ btn ]
LG/Sec   [ btn ]  [ btn ]  [ btn ]  [ btn ]   [ btn ]
```

Positioning formula:

```typescript
const COL_GAP = 24;  // horizontal gap between variants
const ROW_GAP = 16;  // vertical gap between rows
const FRAME_W = 120; // width of one variant frame (adjust per component)
const FRAME_H = 40;  // height of one variant frame

// col = state index (0 = Default, 1 = Hover, …)
// row = (sizeIndex * styleCount) + styleIndex

const x = col * (FRAME_W + COL_GAP);
const y = row * (FRAME_H + ROW_GAP);
```

**Always set position explicitly** after adding frames to a VariantContainer — they may stack at (0,0) by default.

---

## Token Binding in Components

Every visual property must reference a library color (for fills/strokes) or a raw token value (for radius/spacing). Never use hardcoded hex or pixel values.

### Fill binding (color tokens)

```typescript
const bgColor = library.colors.find(c => c.name === 'color/bg/brand');
if (bgColor) {
  frame.fills = [{
    fillType: 'solid',
    fillColor: bgColor.color,
    fillOpacity: bgColor.opacity ?? 1,
    fillColorRefId: bgColor.id,
    fillColorRefFileId: bgColor.fileId
  }];
}
```

### Stroke binding

```typescript
const strokeColor = library.colors.find(c => c.name === 'color/border/default');
if (strokeColor) {
  frame.strokes = [{
    strokeType: 'center',
    strokeWidth: 1,
    strokeColor: strokeColor.color,
    strokeOpacity: strokeColor.opacity ?? 1,
    strokeColorRefId: strokeColor.id,
    strokeColorRefFileId: strokeColor.fileId
  }];
}
```

### Text binding (typography)

```typescript
const text = page.createText('Label');
text.name = 'label';
text.fontSize = 14;
text.fontFamily = 'Inter';
text.fontStyle = 'Medium';

// Apply library typography if supported
const typo = library.typographies.find(t => t.name === 'Label/MD');
if (typo && text.applyTypography) {
  text.applyTypography(typo);
}

// Token-bound fill for text color
const textColor = library.colors.find(c => c.name === 'color/text/inverse');
if (textColor) {
  text.fills = [{
    fillType: 'solid',
    fillColor: textColor.color,
    fillOpacity: textColor.opacity ?? 1,
    fillColorRefId: textColor.id,
    fillColorRefFileId: textColor.fileId
  }];
}
```

### Properties that must always be bound to tokens

| Property | Token type | Never hardcode when |
|----------|-----------|---------------------|
| Background fill | `color` | A semantic color token exists |
| Text fill | `color` | A text color token exists |
| Stroke color | `color` | A border color token exists |
| Stroke width | `border-width` | A border-width token exists |
| Corner radius | `border-radius` | A radius token exists |
| Padding | `spacing` | A spacing token exists |
| Gap | `spacing` | A spacing token exists |

### Fixed values (OK to hardcode)

- Icon pixel sizes (16, 20, 24px) — these are fixed design constants, not tokens
- Static dividers (1px height) — structural, not stylistic
- Layout grid dimensions (column count, max-width) — these are page-level, not component-level
- Artboard/page dimensions

---

## Inner Structure Patterns

### Button (with optional icon slots)

```
Button (frame, flex row, token fills)
  ├── icon-left (frame, 16×16, hidden by default — use boolean component prop)
  ├── label (text, Library Typography bound)
  └── icon-right (frame, 16×16, hidden by default)
```

### Input

```
Input (frame, flex row, token fills, stroke)
  ├── icon-left (frame, optional)
  ├── text-value (text, placeholder style)
  └── icon-right (frame, optional — clear/search icon)
```

### Card

```
Card (frame, flex column, token fills, radius, shadow)
  ├── card-image (frame, fixed height, fills)
  ├── card-body (frame, flex column, padding tokens)
  │   ├── card-title (text, Heading/MD typography)
  │   ├── card-description (text, Body/SM typography)
  │   └── card-footer (frame, flex row)
  │       ├── badge-slot (Badge instance)
  │       └── action-slot (Button instance)
```

---

## Plugin Data Tagging (Required)

Tag every created shape immediately after creation:

```typescript
// Tag the container
container.setSharedPluginData('dsb', 'run_id', RUN_ID);
container.setSharedPluginData('dsb', 'phase', 'phase3');
container.setSharedPluginData('dsb', 'key', 'component/button');

// Tag each variant frame
variantFrame.setSharedPluginData('dsb', 'run_id', RUN_ID);
variantFrame.setSharedPluginData('dsb', 'phase', 'phase3');
variantFrame.setSharedPluginData('dsb', 'key', `component/button/variant/${variantKey}`);
```

---

## Component Validation Checklist

After building each component, verify before presenting the checkpoint:

- [ ] VariantContainer exists on a dedicated page
- [ ] Variant count matches the planned matrix (no missing combinations)
- [ ] Each variant frame has all variant properties set
- [ ] No hardcoded hex fills — all colors use `fillColorRefId`
- [ ] No hardcoded radius pixel values — check token binding
- [ ] Text nodes use library typography or explicit font tokens
- [ ] Auto-layout is active on all container frames (not absolute positioning)
- [ ] All shapes are tagged with `sharedPluginData`
- [ ] `export_shape` screenshot confirms visual correctness

---

## Component Creation Anti-Patterns

- ❌ Creating a molecule before its atom dependencies exist
- ❌ Hardcoding any fill/stroke/radius/spacing value in a component
- ❌ Not positioning variants after creating a VariantContainer (they stack at 0,0)
- ❌ Building a variant per icon (creates variant explosion — use an inner icon instance swap)
- ❌ Exceeding 30 variants without splitting into sub-components
- ❌ Using absolute positioning instead of flex layout inside component frames
- ❌ Forgetting to tag shapes with sharedPluginData (breaks rehydration and cleanup)
- ❌ Building multiple components in a single `execute_code` call
- ❌ Moving to the next component before the current one is screenshot-validated
