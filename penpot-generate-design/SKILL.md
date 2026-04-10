---
name: penpot-generate-design
description: "Use this skill when the task involves translating an application page, view, or multi-section layout into Penpot. Triggers: 'write to Penpot', 'create in Penpot from code', 'push page to Penpot', 'take this app/page and build it in Penpot', 'create a screen', 'build a landing page in Penpot', 'update the Penpot screen to match code'. This is the preferred workflow skill whenever the user wants to build or update a full page, screen, or view in Penpot from code or a description. Discovers design system components, tokens, and styles via the library API, imports them, and assembles screens incrementally section-by-section using design system tokens instead of hardcoded values."
disable-model-invocation: false
---

# Build / Update Screens from Design System

Use this skill to create or update full-page screens in Penpot by **reusing the published design system** — components, tokens, and styles — rather than drawing primitives with hardcoded values. The key insight: the Penpot file likely has a published design system with components, color/spacing tokens, and typography styles that correspond to the codebase's UI components and tokens. Find and use those instead of drawing boxes with hex colors.

**How it works**: Every design mutation goes through the Penpot MCP `execute_code` tool, which runs arbitrary TypeScript/JavaScript code inside the Penpot Plugin API environment. Use `high_level_overview` for read-only file inspection. Use `penpot_api_info` to look up API types and method signatures before coding.

## Skill Boundaries

- Use this skill when the deliverable is a **Penpot screen** (new or updated) composed of design system component instances.
- If the user wants to generate **code from a Penpot design**, switch to a code-generation workflow.
- If the user wants to create **new reusable components, variants, or tokens**, use the `penpot-generate-library` skill instead.

## Prerequisites

- Penpot MCP server must be connected (local or remote) and the MCP plugin active in Penpot
- The target Penpot file must have a published/shared design system with components, or access to a shared library
- User should provide either:
  - A Penpot file open and focused in the browser tab connected to MCP
  - Or context about which file/page to target (the agent can discover pages via `high_level_overview`)
- Source code or description of the screen to build/update

## Required Workflow

**Follow these steps in order. Do not skip steps.**

### Step 1: Understand the Screen

Before touching Penpot, understand what you're building:

1. If building from code, read the relevant source files to understand the page structure, sections, and which components are used.
2. Identify the major sections of the screen (e.g., Header, Hero, Content Panels, Pricing Grid, FAQ Accordion, Footer).
3. For each section, list the UI components involved (buttons, inputs, cards, navigation pills, accordions, etc.).

### Step 2: Discover Design System — Components, Tokens, and Styles

You need three things from the design system: **components** (buttons, cards, etc.), **tokens** (colors, spacing, radii), and **typographies** (font styles). Never hardcode hex colors or pixel values when design system tokens exist.

#### 2a: Discover components

**Preferred: inspect existing screens first.** If the target file already contains screens using the same design system, inspect existing instances directly via `execute_code` — this gives you an exact, authoritative component map:

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

// Find all component instances on the page
const instances = shapes.filter(s => s.componentId !== undefined);
const uniqueComponents = new Map();

for (const inst of instances) {
  if (!uniqueComponents.has(inst.componentId)) {
    uniqueComponents.set(inst.componentId, {
      componentId: inst.componentId,
      name: inst.name,
      mainComponentId: inst.mainComponentId
    });
  }
}

return [...uniqueComponents.values()];
```

When no existing screens are available, inspect the local library directly:

```typescript
const library = penpot.library.local;
return library.components.map(c => ({
  id: c.id,
  name: c.name,
  path: c.path
}));
```

**Also inspect shared libraries** if the design system lives in a separate file:

```typescript
// List available shared libraries
return penpot.library.all.map(lib => ({
  fileId: lib.fileId,
  name: lib.name,
  componentCount: lib.components.length
}));
```

Build a component map with names and IDs before proceeding.

#### 2b: Discover tokens (colors, spacing, radii)

**Inspect the local token catalog first:**

```typescript
const library = penpot.library.local;
const catalog = library.tokens;

// If tokens API is available
const tokens = catalog ? Object.values(catalog) : [];
return tokens.map(t => ({
  name: t.name,
  type: t.type,
  value: t.value
}));
```

**Also inspect library colors and typographies** (these are the style-level design tokens in Penpot):

```typescript
const library = penpot.library.local;
return {
  colors: library.colors.map(c => ({ id: c.id, name: c.name, color: c.color })),
  typographies: library.typographies.map(t => ({
    id: t.id,
    name: t.name,
    fontFamily: t.fontFamily,
    fontSize: t.fontSize
  }))
};
```

**Inspect an existing screen's bound tokens** for the most authoritative results:

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();
const tokenUsage = new Map();

for (const shape of shapes) {
  // Check fills for color tokens
  if (shape.fills) {
    for (const fill of shape.fills) {
      if (fill.fillColorRefId) {
        tokenUsage.set(fill.fillColorRefId, {
          type: 'color',
          refId: fill.fillColorRefId,
          refFileId: fill.fillColorRefFileId
        });
      }
    }
  }
}

return [...tokenUsage.values()];
```

**Search strategy** — try multiple terms since naming varies across design systems:
- **Primitive colors:** "gray", "blue", "brand", "white", "neutral"
- **Semantic colors:** "background", "surface", "text", "border", "foreground"
- **Spacing/sizing:** "spacing", "space", "radius", "gap", "padding"

If `high_level_overview` or token queries return nothing, try `penpot_api_info` to check the exact token API shape for the current Penpot version.

#### 2c: Discover typography styles

```typescript
const library = penpot.library.local;
return library.typographies.map(t => ({
  id: t.id,
  name: t.name,
  fontFamily: t.fontFamily,
  fontStyle: t.fontStyle,
  fontSize: t.fontSize,
  lineHeight: t.lineHeight,
  letterSpacing: t.letterSpacing
}));
```

Search broadly — a "Heading Large" might be named "heading/lg", "h1", "display", or "title-large" depending on the design system.

### Step 3: Create the Page Wrapper Frame First

**Do NOT build sections as top-level page children and reparent them later** — moving nodes across `execute_code` calls with child insertion can produce orphaned frames. Instead, create the wrapper first, then build each section directly inside it.

Create the page wrapper in its own `execute_code` call. Position it away from existing content and return its ID:

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

// Find clear space to the right of existing content
let maxX = 0;
for (const shape of shapes) {
  if (!shape.parentId) { // top-level shapes only
    maxX = Math.max(maxX, (shape.x || 0) + (shape.width || 0));
  }
}

const wrapper = page.createFrame();
wrapper.name = 'Homepage';
wrapper.x = maxX + 200;
wrapper.y = 0;
wrapper.width = 1440;
wrapper.height = 900; // will grow as sections are added

const layout = wrapper.addFlexLayout();
layout.dir = 'column';
layout.alignItems = 'center';

wrapper.setSharedPluginData('dsb', 'key', 'screen/homepage');

return { success: true, wrapperId: wrapper.id };
```

### Step 4: Build Each Section Inside the Wrapper

**This is the most important step.** Build one section at a time, each in its own `execute_code` call. At the start of each script, fetch the wrapper by ID and append new content directly to it.

```typescript
const page = penpot.currentPage;
const createdIds: string[] = [];

// Fetch wrapper by ID returned from Step 3
const allShapes = page.findShapes();
const wrapper = allShapes.find(s => s.id === 'WRAPPER_ID_FROM_STEP_3');
if (!wrapper) return { error: 'Wrapper not found' };

// Import a component instance from the local library
const library = penpot.library.local;
const buttonComponent = library.components.find(c => c.name === 'Button/Primary');
if (!buttonComponent) return { error: 'Button component not found' };

// Build section frame with token-bound colors (not hardcoded hex)
const section = page.createFrame();
section.name = 'Header';

const layout = section.addFlexLayout();
layout.dir = 'row';
layout.alignItems = 'center';
layout.justifyContent = 'space-between';
layout.padding = { top: 16, right: 32, bottom: 16, left: 32 };

// Apply color from library color (token-bound)
const bgColor = library.colors.find(c => c.name === 'color/bg/primary');
if (bgColor) {
  section.fills = [{
    fillType: 'solid',
    fillColor: bgColor.color,
    fillOpacity: bgColor.opacity ?? 1,
    fillColorRefId: bgColor.id,
    fillColorRefFileId: bgColor.fileId
  }];
}

// Create a component instance
const btnInstance = buttonComponent.createInstance();
section.appendChild(btnInstance);
createdIds.push(btnInstance.id);

// Append section to wrapper
wrapper.appendChild(section);
createdIds.push(section.id);

return { success: true, createdIds };
```

After each section, validate with `export_shape` before moving on. Look closely for cropped/clipped text and overlapping elements — these are the most common issues and easy to miss at a glance.

#### Override instance text

Component instances come with placeholder text. Override text content directly on the text children of the instance:

```typescript
// Find text children inside the instance and override
const textChildren = btnInstance.findShapes().filter(s => s.type === 'text');
for (const textNode of textChildren) {
  if (textNode.name === 'label' || textNode.name === 'text') {
    textNode.characters = 'Get Started';
  }
}
```

#### Read source code defaults carefully

When translating code components to Penpot instances, check the component's default prop values in the source code, not just what's explicitly passed. For example, `<Button size="small">Register</Button>` with no variant prop — check the component definition to find `variant = "primary"` as the default. Selecting the wrong variant produces a visually incorrect result that's easy to miss.

#### What to build manually vs. import from design system

| Build manually | Import from design system |
|----------------|--------------------------|
| Page wrapper frame | **Components**: buttons, cards, inputs, nav, etc. |
| Section container frames | **Library colors**: fills and strokes bound to color tokens |
| Layout grids (rows, columns) | **Typography styles**: heading, body, caption, etc. |
| Spacer/divider shapes | **Shadow/blur styles** |

**Never hardcode hex colors or pixel spacing** when a design system token exists. Bind fills to library colors using `fillColorRefId` and `fillColorRefFileId`. Apply typography via `LibraryTypography` references. This keeps the screen linked to the design system.

### Step 5: Validate the Full Screen

After composing all sections, call `export_shape` on the full page frame and compare against the source. Fix any issues with targeted `execute_code` calls — don't rebuild the entire screen.

**Screenshot individual sections, not just the full page.** A full-page screenshot at reduced resolution hides text truncation, wrong colors, and placeholder text. Use `export_shape` on each section by ID to catch:
- **Cropped/clipped text** — frame sizing cutting off content
- **Overlapping content** — elements stacking due to incorrect sizing or missing flex layout
- Placeholder text still showing ("Title", "Heading", "Button")
- Wrong component variants (e.g., Secondary instead of Primary button)
- Incorrect token bindings (wrong color applied)

### Step 6: Updating an Existing Screen

When updating rather than creating from scratch:

1. Use `high_level_overview` to inspect the existing screen structure.
2. Identify which sections need updating and which can stay.
3. For each section that needs changes:
   - Locate existing nodes by ID (from the overview) or by name using `findShapes()`
   - Swap component instances if the design system component changed
   - Update text content, variant properties, or layout as needed
   - Remove deprecated sections
   - Add new sections
4. Validate with `export_shape` after each modification.

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

// Find existing section to update
const existingSection = shapes.find(s => s.name === 'Header' && s.type === 'frame');
if (!existingSection) return { error: 'Section not found' };

// Find and update a specific child instance
const btnInstance = existingSection.findShapes().find(
  s => s.componentId && s.name === 'Button/Primary'
);

if (btnInstance) {
  // Update text content
  const label = btnInstance.findShapes().find(s => s.name === 'label');
  if (label) label.characters = 'New CTA Text';
}

return { success: true, mutatedIds: [existingSection.id] };
```

## Error Recovery

1. **STOP** on error — do not retry immediately.
2. **Read the error message carefully** to understand what went wrong.
3. If the error is unclear, call `high_level_overview` or `export_shape` to inspect the current file state.
4. Use `penpot_api_info` to verify the exact API signature if the method call failed.
5. **Fix the script** based on the error and retry — failed `execute_code` calls are atomic (nothing is created if a script errors mid-way only if Penpot rolls back; validate before assuming clean state).

Because this skill works incrementally (one section per call), errors are naturally scoped to a single section. Previous sections from successful calls remain intact.

## Best Practices

- **Always inspect before building.** The design system likely has the component, token, or style you need. Manual construction and hardcoded values should be the exception, not the rule.
- **Search broadly.** Try synonyms and partial terms. A "NavigationPill" might be found under "pill", "nav", "tab", or "chip". For tokens, search "color", "spacing", "radius", etc.
- **Prefer design system tokens over hardcoded values.** Use library color references for fills and strokes. Use typography styles for text. This keeps the screen linked to the design system and updatable.
- **Prefer component instances over manual builds.** Instances stay linked to the source component and update when the design system evolves.
- **Work section by section.** Never build more than one major section per `execute_code` call.
- **Return node IDs from every call.** You'll need them to reference nodes in subsequent calls and for error recovery.
- **Validate visually after each section.** Use `export_shape` to catch issues early, including at section level not just full-page.
- **Match existing conventions.** If the file already has screens, match their naming, sizing, and layout patterns.
- **Use `penpot_api_info` when unsure.** The Plugin API evolves — verify method signatures before coding rather than guessing.

---

## Supporting Files

Read these before or during execution. They contain detailed patterns and code examples.

### References

| File | Read when |
|------|----------|
| `references/01-discovery-phase.md` | Before Step 2 — component search strategy, mapping code→Penpot, shared library inspection |
| `references/02-component-assembly.md` | Before Step 3/4 — wrapper-first pattern, instance creation, text overrides, manual vs. import decision |
| `references/03-token-binding.md` | During section building — fillColorRefId, typography binding, spacing from tokens, binding gaps |
| `references/04-error-recovery.md` | On any error — partial cleanup, missing components, wrapper lost, update patterns |

### Scripts (paste into execute_code calls)

| Script | Use for |
|--------|---------|
| `scripts/inspectDesignSystem.js` | Step 2 — discover all components, colors, typographies, tokens; quick search; existing screen inventory |
| `scripts/createScreenWrapper.js` | Step 3 — create page wrapper frame with flex layout and position it correctly |
| `scripts/buildSection.js` | Step 4 — template for building one section (NavBar example); customize per section type |
| `scripts/validateScreen.js` | Step 5 — check for empty sections, hardcoded fills, placeholder text, orphaned frames |

> Scripts are templates — replace `REPLACE_WITH_WRAPPER_ID` and other placeholders before running. Each section needs its own customized copy of `buildSection.js`.
