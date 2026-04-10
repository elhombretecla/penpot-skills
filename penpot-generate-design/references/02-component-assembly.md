# Component Assembly

This reference covers how to build screens in Penpot by assembling design system components section-by-section. The goal is always to reuse library components, tokens, and typographies rather than drawing raw shapes.

---

## Core Pattern: Wrapper First, Then Sections

**Never build sections as top-level page children and reparent them later.** Reparenting nodes across `execute_code` calls can produce orphaned frames or incorrect layer hierarchy. Instead:

1. Create the **page wrapper frame** first (its own `execute_code` call)
2. Build each **section directly inside the wrapper** (one section per call)
3. Always fetch the wrapper by its returned ID at the start of each section call

This pattern produces a clean, predictable layer tree.

---

## Step 1: Create the Wrapper Frame

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

// Find clear space to the right of existing content
let maxX = 0;
for (const shape of shapes) {
  if (!shape.parentId) {  // top-level shapes only
    maxX = Math.max(maxX, (shape.x || 0) + (shape.width || 0));
  }
}

const wrapper = page.createFrame();
wrapper.name = 'Homepage';
wrapper.x = maxX + 200;  // 200px gap from existing content
wrapper.y = 0;
wrapper.width = 1440;
wrapper.height = 900;     // initial height — grows as sections are added

// Vertical flex layout for sections stacked top-to-bottom
const layout = wrapper.addFlexLayout();
layout.dir = 'column';
layout.alignItems = 'stretch';

wrapper.setSharedPluginData('dsb', 'key', 'screen/homepage');

return { success: true, wrapperId: wrapper.id, x: wrapper.x, y: wrapper.y };
```

---

## Step 2: Build Each Section

At the start of each section call, fetch the wrapper by ID from the previous call:

```typescript
const page = penpot.currentPage;
const allShapes = page.findShapes();
const wrapper = allShapes.find(s => s.id === 'WRAPPER_ID_FROM_PREVIOUS_CALL');
if (!wrapper) return { error: 'Wrapper not found — check wrapperId' };
```

### Section with flex layout

```typescript
const section = page.createFrame();
section.name = 'hero-section';
section.width = 1440;

const layout = section.addFlexLayout();
layout.dir = 'column';
layout.alignItems = 'center';
layout.justifyContent = 'center';
layout.padding = { top: 80, right: 120, bottom: 80, left: 120 };
layout.gap = 24;

wrapper.appendChild(section);
```

### Section with grid layout (e.g. 3-column feature grid)

```typescript
const grid = page.createFrame();
grid.name = 'features-grid';
grid.width = 1440;

const gridLayout = grid.addGridLayout();
// Check penpot_api_info for exact GridLayout API
// gridLayout.rows = ...
// gridLayout.columns = ...

wrapper.appendChild(grid);
```

---

## Component Instance Pattern

### Import from local library

```typescript
const library = penpot.library.local;

// Find component
const btnComponent = library.components.find(c => c.name === 'Button/Primary');
if (!btnComponent) return { error: `Component 'Button/Primary' not found` };

// Create instance
const btn = btnComponent.createInstance();
section.appendChild(btn);
```

### Override text content in an instance

Component instances come with placeholder text. Override text by finding text children:

```typescript
// Find text children inside the instance
const textChildren = btn.findShapes
  ? btn.findShapes().filter(s => s.type === 'text')
  : [];

for (const textNode of textChildren) {
  // Match by name (use high_level_overview to learn the text node names)
  if (textNode.name === 'label' || textNode.name === 'text' || textNode.name === 'button-text') {
    textNode.characters = 'Get Started';
  }
}
```

> **Always inspect a component's layer structure before overriding.** Run `export_shape` on the component to see it visually, then query its shape tree to find the correct text node name.

### Swap a component variant

When you need a specific variant (e.g., Secondary instead of Primary), find the correct component by name:

```typescript
// Style=Secondary, Size=Medium
const secondaryBtn = library.components.find(c => c.name === 'Button/Secondary' || c.name.includes('Secondary'));
```

Or find by path/variants if the library uses paths:

```typescript
const btns = library.components.filter(c => c.name.startsWith('Button'));
// btns may include: 'Button', 'Button/Primary', 'Button/Secondary', 'Button/Ghost'
```

---

## Read Source Code Defaults

When translating code components to Penpot instances, check the component's default prop values in source code, not just what's passed explicitly.

Example:
```tsx
// In the screen:
<Button size="small">Register</Button>

// In the component definition:
function Button({ variant = 'primary', size = 'medium', children }) { … }
```

Even though `variant` is not passed, the default is `primary`. Use `Button/Primary/Small` or the equivalent variant — not the default/base component.

**Consequences of using the wrong variant**: the button will look visually wrong (wrong color, wrong fill). This is easy to miss at a glance in a screenshot.

---

## What to Build Manually vs. Import

| Build manually | Import from library |
|----------------|---------------------|
| Page wrapper frame | Buttons, inputs, cards, nav, etc. |
| Section container frames | Modals, dropdowns, tooltips |
| Layout rows and columns | Avatars, badges, icons |
| Spacers and dividers | Any atom or molecule component |
| Background fills | Library colors (via `fillColorRefId`) |
| Heading/body text (if not a component) | Typography styles |
| Decorative shapes | — |

**Rule of thumb**: if the codebase has a React/Vue/Angular component for it, there's likely a matching Penpot component in the library. Search before building manually.

---

## Handling Missing Components

When a screen section requires a component that doesn't exist in the library:

1. **Search broadly** — try synonyms (see discovery-phase.md search table)
2. **Check shared libraries** — it may be in a separate design system file
3. **Ask the user** — if the component genuinely doesn't exist, confirm whether to:
   - Build it manually (one-off, for this screen only)
   - Create a new library component first (triggers `penpot-generate-library` workflow)
4. **Never silently skip a component** — if a section is incomplete, document what was skipped

---

## Absolute Positioning Fallback

When auto-layout cannot produce the required layout (e.g., overlapping elements, absolutely-positioned dropdowns), use explicit `x`/`y` positioning inside a frame that does not have `addFlexLayout()`:

```typescript
const frame = page.createFrame();
frame.name = 'positioned-container';
// No layout added — children use absolute coordinates

const badge = badgeComponent.createInstance();
badge.x = 200; badge.y = 16;  // explicit position
frame.appendChild(badge);
```

This is the exception, not the rule. Use flex layout for all standard section content.

---

## Section Size Management

Sections using `addFlexLayout()` will auto-size to fit their content. However, when a section needs a fixed minimum height (e.g., a hero with a background), set it explicitly:

```typescript
const hero = page.createFrame();
hero.name = 'hero-section';
hero.width = 1440;
hero.height = 560;  // fixed hero height
// … add flex layout and content
```

Penpot may override the height when flex layout is active. If the section doesn't maintain the desired size, check whether `layout.sizingMode` or equivalent needs to be set — use `penpot_api_info` to verify.

---

## Assembly Anti-Patterns

- ❌ Building sections as top-level page children and reparenting them later
- ❌ Not fetching the wrapper by ID at the start of each section call
- ❌ Creating more than one major section per `execute_code` call
- ❌ Hardcoding hex fills for section backgrounds when library colors exist
- ❌ Building a Button from scratch when `Button/Primary` exists in the library
- ❌ Not overriding placeholder text in component instances
- ❌ Using the wrong variant because the source code's default props weren't checked
- ❌ Skipping `export_shape` validation after building each section
- ❌ Trying to reparent shapes without first checking if the target parent exists
