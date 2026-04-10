---
name: penpot-generate-library
description: "Build or update a professional-grade design system in Penpot from a codebase. Use when the user wants to create tokens (color, spacing, typography, radius), build component libraries, set up theming (light/dark modes), document foundations, or reconcile gaps between code and Penpot. This skill teaches WHAT to build and in WHAT ORDER — it orchestrates multi-phase workflows using the Penpot MCP `execute_code` tool, which runs arbitrary code in the Penpot Plugin API environment."
disable-model-invocation: false
---

# Design System Builder — Penpot MCP Skill

Build professional-grade design systems in Penpot that match code. This skill orchestrates multi-phase workflows across 20–100+ `execute_code` calls, enforcing quality patterns from real-world design systems.

**How it works**: The Penpot MCP exposes an `execute_code` tool that runs arbitrary TypeScript/JavaScript code snippets inside the Penpot Plugin API environment. Use `execute_code` for every design mutation. Use `high_level_overview` for read-only file inspection. Use `penpot_api_info` to look up API types and method signatures.

**Always return data** from `execute_code` using `return` or `penpot.ui.sendMessage()` — the Plugin API is async-capable and TypeScript-typed via `@penpot/plugin-types`.

---

## 1. The One Rule That Matters Most

**This is NEVER a one-shot task.** Building a design system requires 20–100+ `execute_code` calls across multiple phases, with mandatory user checkpoints between them. Any attempt to create everything in one call WILL produce broken, incomplete, or unrecoverable results. Break every operation to the smallest useful unit, validate, get feedback, proceed.

---

## 2. Penpot MCP Tool Reference

The official Penpot MCP server (local or remote) exposes these tools:

| Tool | Purpose |
|------|---------|
| `execute_code` | Run arbitrary Plugin API code on the currently focused page. **Primary mutation tool.** |
| `high_level_overview` | Read-only inspection of the current file structure (pages, layers, components, tokens, styles). Use before any writes. |
| `penpot_api_info` | Query API type definitions and method signatures from `@penpot/plugin-types`. Use when unsure of an API shape. |
| `export_shape` | Export a shape/component as an image. Use for validation screenshots. |
| `import_image` | Import a local image into the file (local MCP only). |

> **MCP context**: MCP always operates on the **currently focused page** in the active Penpot browser tab. If the user changes the focused page, MCP context follows. Never assume page context — always set it explicitly at the start of each `execute_code` call.

---

## 3. Plugin API Essentials (Critical — Read Before Every Call)

These rules govern every `execute_code` call:

```typescript
// ✅ Correct pattern — async, returns data
const page = penpot.currentPage;
const frame = page.createFrame();
frame.name = 'MyFrame';
frame.x = 0; frame.y = 0;
frame.width = 400; frame.height = 300;
return { id: frame.id, name: frame.name };

// ❌ Never assume page — always read penpot.currentPage
// ❌ Never use console.log for output — use return
// ❌ Never call penpot.ui.open() inside execute_code (UI is not available in MCP context)
```

**Key Plugin API facts**:
- Entry point: `penpot` (global, typed as `Penpot` interface)
- Current page: `penpot.currentPage` (type: `Page`)
- Colors: use hex strings (`"#3B82F6"`) or `{ r, g, b, a }` objects where `r/g/b` are 0–255 and `a` is 0–1
- Fonts: use `penpot.fonts` context — check availability before applying
- Components: created via `penpot.currentPage.createComponent(shape)` and accessed through `penpot.library`
- Tokens: managed through `penpot.library.local.tokens` (TokenCatalog API)
- Library colors: `penpot.library.local.createColor({ name, color, opacity })`
- Library typographies: `penpot.library.local.createTypography({ name, fontFamily, fontSize, ... })`
- Variants: use `VariantContainer` and `Variants` interfaces — `penpot.currentPage.createVariantContainer()`
- Plugin data (persistent): `shape.setPluginData(key, value)` / `shape.getPluginData(key)` — available on all shapes
- Shared plugin data: `shape.setSharedPluginData(ns, key, value)` — visible to all plugins

**Always return created IDs** so the state ledger can track them:
```typescript
return {
  pageId: penpot.currentPage.id,
  frameId: frame.id,
  componentId: component.id
};
```

---

## 4. Mandatory Workflow

Every design system build follows this phase order. Skipping or reordering phases causes structural failures that are expensive to undo.

```
Phase 0: DISCOVERY (always first — no execute_code writes yet)
  0a. Analyze codebase → extract tokens, components, naming conventions
  0b. Inspect Penpot file → call high_level_overview to see pages, components, tokens, styles
  0c. Query library → check penpot.library.local for existing colors, typographies, components
  0d. Lock v1 scope → agree on exact token set + component list before any creation
  0e. Map code → Penpot → resolve conflicts (code and Penpot disagree = ask user)
  ✋ USER CHECKPOINT: present full plan, await explicit approval

Phase 1: FOUNDATIONS (tokens first — always before components)
  1a. Create color library tokens (primitives: raw hex values)
  1b. Create semantic color tokens (referencing primitives via token expressions)
  1c. Create spacing tokens
  1d. Create typography tokens (font family, size, weight, line-height, letter-spacing)
  1e. Create border-radius tokens
  1f. Create shadow tokens
  1g. Create typography styles in the library (LibraryTypography)
  → Exit criteria: every token from the agreed plan exists, all names set, all types correct
  ✋ USER CHECKPOINT: show token summary, await approval

Phase 2: FILE STRUCTURE (before components)
  2a. Create page skeleton: Cover → Getting Started → Foundations → Components → Utilities
  2b. Create foundations documentation frames (color swatches, type specimens, spacing bars)
  → Exit criteria: all planned pages exist, foundations docs are navigable
  ✋ USER CHECKPOINT: show page list + export_shape screenshot, await approval

Phase 3: COMPONENTS (one at a time — never batch)
  For EACH component (dependency order: atoms before molecules):
    3a. Create a dedicated page for the component
    3b. Build base frame/group with flex layout + fill, stroke, radius bound to tokens
    3c. Create component from the base shape: penpot.currentPage.createComponent(shape)
    3d. Build variants: createVariantContainer() + add variant frames
    3e. Add documentation frame on the page (title, description, usage notes)
    3f. Validate: high_level_overview (structure) + export_shape (visual)
    3g. Optional: document component→code mapping in plugin data
    → Exit criteria: variant count correct, all token bindings verified, screenshot looks right
    ✋ USER CHECKPOINT per component: show screenshot, await approval before next component

Phase 4: INTEGRATION + QA (final pass)
  4a. Accessibility audit (contrast ratios, min touch targets 44×44px)
  4b. Naming audit (no duplicates, no unnamed nodes, consistent casing)
  4c. Token binding audit (no hardcoded fills/strokes remaining in components)
  4d. Final review screenshots of every page via export_shape
  ✋ USER CHECKPOINT: complete sign-off
```

---

## 5. Critical Rules

**Design system rules**:
1. **Tokens BEFORE components** — components reference tokens. No token = no component.
2. **Inspect before creating** — run `high_level_overview` first, never assume the file is empty.
3. **One page per component** *(default)* — exception: tightly related atoms (e.g., Input + Label) may share a page with clear section separation.
4. **Bind visual properties to tokens** *(default)* — fills, strokes, radius, spacing. Exceptions: fixed geometry (icon pixel sizes, static dividers).
5. **Type every token correctly** — Penpot token types: `color`, `spacing`, `sizing`, `border-radius`, `border-width`, `opacity`, `font-family`, `font-size`, `font-weight`, `letter-spacing`, `typography`, `shadow`, `number`, `rotation`, `dimension`, `text-case`, `text-decoration`.
6. **Use `setSharedPluginData` for build metadata** — tag every created shape with run ID, phase, and logical key so workflows are resumable.
7. **Never duplicate token values** — semantic tokens reference primitive tokens via expressions (e.g., `{color.blue.500}`), never copy raw values.
8. **Position variants explicitly** — after creating a VariantContainer, set `x/y/width/height` on each variant frame; they may stack at (0,0) by default.
9. **Deterministic naming** — use consistent, unique node names for idempotent cleanup and resumability. Track created node IDs via return values and the state ledger.
10. **No destructive cleanup** — cleanup scripts identify nodes by name convention or returned IDs, not by guessing.
11. **Validate before proceeding** — never build on unvalidated work. `high_level_overview` after every phase, `export_shape` after each component.
12. **NEVER parallelize `execute_code` calls** — Penpot state mutations must be strictly sequential.
13. **Never hallucinate IDs** — always read IDs from the state ledger returned by previous calls. Never reconstruct or guess an ID from memory.
14. **Explicit phase approval** — at each checkpoint, name the next phase explicitly. "Looks good" is not approval to proceed to Phase 3 if you asked about Phase 1.

---

## 6. Token Architecture

Penpot's token system uses a **flat token catalog** organized by token sets and themes. Unlike Figma variables (which use collections + modes), Penpot tokens are managed via the `TokenCatalog` API:

```typescript
// Token sets group related tokens
const catalog = penpot.library.local.tokens;  // TokenCatalog

// Creating a color token
await catalog.createToken({
  name: 'color.blue.500',
  type: 'color',
  value: '#3B82F6',
  description: 'Primary blue'
});

// Creating a semantic token (references a primitive via expression)
await catalog.createToken({
  name: 'color.bg.primary',
  type: 'color',
  value: '{color.blue.500}',   // Expression syntax
  description: 'Primary background color'
});

// Creating a spacing token
await catalog.createToken({
  name: 'spacing.md',
  type: 'spacing',
  value: '16',
  description: 'Medium spacing'
});
```

**Token themes** (equivalent to Figma variable modes):
```typescript
// TokenTheme maps token sets to active/inactive state
// Light theme activates the "color/light" set; Dark theme activates "color/dark"
```

| Complexity | Pattern |
|-----------|---------|
| < 50 tokens | Single token set, define light and dark values as separate named tokens |
| 50–200 tokens | **Standard**: `primitives` set (raw values) + `color/light` + `color/dark` sets + `spacing` set + `typography` set |
| 200+ tokens | **Advanced**: Multiple sets with themes (Light/Dark × Contrast × Brand) |

Standard recommended layout:
```
Token set: "primitives"
  color.blue.500 = #3B82F6
  color.gray.900 = #111827
  color.white = #FFFFFF

Token set: "color/light"
  color.bg.primary = {color.white}
  color.text.primary = {color.gray.900}

Token set: "color/dark"
  color.bg.primary = {color.gray.900}
  color.text.primary = {color.white}

Token set: "spacing"
  spacing.xs = 4
  spacing.sm = 8
  spacing.md = 16
  spacing.lg = 24
  spacing.xl = 32

Token set: "typography"
  typography.body.fontSize = 16
  typography.body.lineHeight = 1.5
  typography.heading.fontSize = 32
```

---

## 7. State Management (Required for Long Workflows)

### Plugin Data Tagging

Tag every created **shape** immediately after creation:
```typescript
frame.setSharedPluginData('dsb', 'run_id', RUN_ID);
frame.setSharedPluginData('dsb', 'phase', 'phase3');
frame.setSharedPluginData('dsb', 'key', 'component/button');
```

To query tagged shapes later:
```typescript
const shapes = penpot.currentPage.findShapes();
const myShape = shapes.find(s =>
  s.getSharedPluginData('dsb', 'key') === 'component/button'
);
```

### State File (Disk Persistence)

Write the state ledger to disk at every phase boundary — conversation context gets truncated in long workflows:

```
/tmp/dsb-penpot-state-{RUN_ID}.json
```

Re-read at the start of every turn. State ledger structure:
```json
{
  "runId": "penpot-ds-build-001",
  "phase": "phase3",
  "step": "component-button",
  "entities": {
    "tokenIds": {
      "color.blue.500": "token-id-...",
      "spacing.md": "token-id-..."
    },
    "pages": {
      "Cover": "page-id-...",
      "Button": "page-id-..."
    },
    "components": {
      "Button": "component-id-..."
    },
    "colors": {
      "color/brand/primary": "color-id-..."
    }
  },
  "pendingValidations": ["Button:screenshot"],
  "completedSteps": ["phase0", "phase1", "phase2", "component-avatar"]
}
```

### Idempotency

Before every create, check if the entity already exists:
```typescript
// Check for existing token
const existing = await catalog.getTokens().find(t => t.name === 'color.blue.500');
if (existing) {
  return { skipped: true, id: existing.id };
}

// Check for existing page
const existingPage = penpot.pages.find(p => p.name === 'Button');
if (existingPage) {
  return { skipped: true, id: existingPage.id };
}
```

**Resume protocol**: at session start or after context truncation, call `high_level_overview` to scan all pages, components, and tokens. Reconstruct the `{key → id}` map from the response and the on-disk state file.

**Continuation prompt** (give to the user when resuming in a new chat):
> "I'm continuing a Penpot design system build. Run ID: {RUN_ID}. Load the penpot-generate-library skill and resume from the last completed step."

---

## 8. Library Component vs. Reuse Decision Matrix

Inspect FIRST in Phase 0, then again immediately before each component creation.

```typescript
// Inspect existing library assets
const library = penpot.library.local;
const existingComponents = library.components;
const existingColors = library.colors;
const existingTypographies = library.typographies;
```

**Reuse if** all of these are true:
- Component structure matches your needs (same variant axes, compatible layout)
- Token binding model is compatible (uses same or aliasable tokens)
- Naming conventions match the target file
- Component is editable (not locked in a remote shared library)

**Rebuild if** any of these:
- Variant model incompatible (different property names, wrong axis structure)
- Token model incompatible (hardcoded values, different token schema)
- Ownership issue (can't modify the shared library)

**Wrap if** visual match but API incompatible:
- Use the existing component as an instance inside a new wrapper component
- Expose a clean variant API on the wrapper

**Three-way priority**: local existing → shared library → create new.

---

## 9. User Checkpoints

Mandatory. Design decisions require human judgment.

| After | Required artifacts | Ask |
|-------|-------------------|-----|
| Discovery + scope lock | Token list, component list, gap analysis | "Here's my plan. Approve before I create anything?" |
| Foundations | Token summary (N tokens, K sets, M themes), typography list | "All tokens created. Review before file structure?" |
| File structure | Page list + screenshot | "Pages set up. Review before components?" |
| Each component | export_shape screenshot of component page | "Here's [Component] with N variants. Correct?" |
| Each conflict (code ≠ Penpot) | Show both versions | "Code says X, Penpot has Y. Which wins?" |
| Final QA | Per-page screenshots + audit report | "Complete. Sign off?" |

**If user rejects**: fix before moving on. Never build on rejected work.

---

## 10. Naming Conventions

Match existing file conventions. If starting fresh:

**Tokens** (dot-separated for Penpot, matching W3C Design Token format):
```
color.bg.primary        color.text.secondary      color.border.default
color.blue.500          color.gray.900
spacing.xs  spacing.sm  spacing.md  spacing.lg  spacing.xl  spacing.2xl
radius.none  radius.sm  radius.md  radius.lg  radius.full
typography.body.fontSize    typography.heading.lineHeight
shadow.sm  shadow.md  shadow.lg
```

**Component names**: `Button`, `Input`, `Card`, `Avatar`, `Badge`, `Checkbox`, `Toggle`

**Variant naming**: Penpot uses property=value pairs on variant frames. Name your variant frames descriptively:
- `Size=Medium, Style=Primary, State=Default`
- `Size=Small, Style=Secondary, State=Hover`

**Page separators / section frames**: Use frames named `---` or `——— COMPONENTS ———` to visually separate sections on a page.

**Layer naming**: `kebab-case` for frames/groups (`button-container`, `icon-left`), `PascalCase` for components (`Button`, `InputField`).

---

## 11. Per-Phase Anti-Patterns

**Phase 0 anti-patterns:**
- ❌ Starting to create anything before scope is locked with user
- ❌ Ignoring existing file conventions and imposing new ones
- ❌ Skipping `high_level_overview` before planning component creation

**Phase 1 anti-patterns:**
- ❌ Hardcoding hex values in semantic tokens instead of referencing primitives via `{token.name}` expressions
- ❌ Using wrong token types (e.g., using `number` where `spacing` is correct)
- ❌ Skipping typography library entries (LibraryTypography) — components need them for text bindings
- ❌ Creating component tokens before agreeing on token taxonomy

**Phase 2 anti-patterns:**
- ❌ Skipping the cover page or foundations documentation frames
- ❌ Putting multiple unrelated components on one page
- ❌ Not creating visual documentation (color swatches, spacing scale bars)

**Phase 3 anti-patterns:**
- ❌ Creating components before foundations tokens exist
- ❌ Hardcoding any fill/stroke/spacing/radius value in a component (bind everything to tokens)
- ❌ Not positioning variants after creating a VariantContainer
- ❌ Building a variant per icon (use INSTANCE_SWAP-equivalent: nested component swap)
- ❌ Variant matrix explosion without splitting (> 30 combinations = split into sub-component)

**General anti-patterns:**
- ❌ Retrying a failed `execute_code` without reading the error first
- ❌ Using name-prefix matching for cleanup (risks deleting user-owned nodes)
- ❌ Building on unvalidated work from the previous step
- ❌ Skipping user checkpoints to "save time"
- ❌ Parallelizing `execute_code` calls (always sequential)
- ❌ Guessing/hallucinating node or token IDs from memory (always read from state ledger)
- ❌ Writing massive inline scripts instead of composing small, focused operations
- ❌ Starting Phase 3 because the user said "build the button" without completing Phases 0–2

---

## 12. Helper Code Snippets

Reusable patterns to embed in `execute_code` calls:

### Inspect file structure
```typescript
const file = penpot.currentFile;
const page = penpot.currentPage;
const library = penpot.library.local;

return {
  fileId: file.id,
  fileName: file.name,
  pageId: page.id,
  pageName: page.name,
  allPages: penpot.pages.map(p => ({ id: p.id, name: p.name })),
  componentCount: library.components.length,
  colorCount: library.colors.length,
  typographyCount: library.typographies.length,
  tokenCount: library.tokens ? Object.keys(library.tokens).length : 0
};
```

### Create a frame with flex layout
```typescript
const page = penpot.currentPage;
const frame = page.createFrame();
frame.name = 'button-base';
frame.x = 100; frame.y = 100;
frame.width = 120; frame.height = 40;
frame.fills = [{ fillType: 'solid', fillColor: '#3B82F6', fillOpacity: 1 }];
frame.borderRadius = 8;

const layout = frame.addFlexLayout();
layout.dir = 'row';
layout.alignItems = 'center';
layout.justifyContent = 'center';
layout.padding = { top: 8, right: 16, bottom: 8, left: 16 };
layout.gap = 8;

frame.setSharedPluginData('dsb', 'run_id', 'RUN_ID_HERE');
frame.setSharedPluginData('dsb', 'key', 'base/button');

return { id: frame.id, name: frame.name };
```

### Create a library color
```typescript
const library = penpot.library.local;
const color = library.createColor();
color.name = 'color/brand/primary';
color.color = '#3B82F6';
color.opacity = 1;
return { id: color.id, name: color.name };
```

### Create a text element
```typescript
const page = penpot.currentPage;
const text = page.createText('Button Label');
text.name = 'label';
text.x = 0; text.y = 0;
text.fontSize = 14;
text.fontFamily = 'Inter';
text.fontStyle = 'Medium';
text.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 1 }];
return { id: text.id };
```

### Create a component
```typescript
const page = penpot.currentPage;
// First build the shape tree, then wrap as component
const frame = page.createFrame();
frame.name = 'Button';
// ... add children ...

const component = page.createComponent(frame);
// component is now a LibraryComponent
return { componentId: component.id, mainId: frame.id };
```

### Find shape by plugin data key
```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();
const target = shapes.find(
  s => s.getSharedPluginData('dsb', 'key') === 'component/button'
);
return target ? { id: target.id, name: target.name } : { found: false };
```

---

## 13. Reference Resources

| Resource | When to use |
|----------|------------|
| `penpot_api_info` tool | Look up any Plugin API type, method signature, or property before coding |
| `high_level_overview` tool | Inspect current file state at start of each phase |
| https://doc.plugins.penpot.app/ | Full Plugin API TypeDoc reference |
| https://help.penpot.app/mcp/ | MCP server setup and tool reference |
| https://github.com/penpot/penpot/tree/develop/mcp | Source code for MCP tools and Plugin Bridge |
| https://github.com/penpot/penpot-plugins-samples | Plugin code examples and patterns |

**Before using any API method not shown in this skill**, call `penpot_api_info` to verify the exact signature. The Plugin API evolves rapidly — never assume from memory.

---

## 14. Supporting Files

Read these before or during each phase. They contain detailed patterns, API examples, and anti-patterns that are too long to fit in this skill.

### References (deep-dive guides per phase)

| File | Read during |
|------|------------|
| `references/01-discovery-phase.md` | Phase 0 — codebase analysis, Penpot inspection, mapping table, scope lock |
| `references/02-token-creation.md` | Phase 1 — token set architecture, TokenCatalog API, expression syntax, library colors/typographies |
| `references/03-component-creation.md` | Phase 3 — dependency ordering, VariantContainer, variant matrix, token binding |
| `references/04-documentation-creation.md` | Phase 2 — cover page, foundations swatches, type specimens, component doc frames |
| `references/05-naming-conventions.md` | All phases — dot-notation tokens, slash-notation colors, PascalCase components, Property=Value variants |
| `references/06-error-recovery.md` | On any error — recovery protocol, sharedPluginData tagging, state ledger, cleanup patterns |

### Scripts (paste into execute_code calls)

| Script | Use for |
|--------|---------|
| `scripts/inspectFileStructure.js` | Phase 0 — read-only file inventory (pages, tokens, components, colors, typographies) |
| `scripts/createTokenSet.js` | Phase 1a — create primitive tokens (color, spacing, radius) idempotently |
| `scripts/createSemanticTokens.js` | Phase 1b — create semantic tokens with `{expression}` aliases |
| `scripts/createLibraryColors.js` | Phase 1c/d — create library colors and library typographies |
| `scripts/createComponentWithVariants.js` | Phase 3 — build VariantContainer with full variant grid |
| `scripts/createDocumentationPage.js` | Phase 2 + Phase 3 — cover page, foundations sections, component `_Doc` frames |
| `scripts/validateCreation.js` | End of each phase — verify tokens, colors, typographies, shapes exist as expected |
| `scripts/rehydrateState.js` | Session resume — reconstruct `{key → id}` map from current file state |
| `scripts/cleanupOrphans.js` | After errors — safely remove shapes tagged with a run_id (dry run first) |

> Scripts are templates — always replace `REPLACE-ME` placeholders (RUN_ID, component names, etc.) before running.
