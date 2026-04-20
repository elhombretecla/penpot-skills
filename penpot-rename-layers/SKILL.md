---
name: penpot-rename-layers
description: "Semantically rename layers in a Penpot design using HTML semantic element names as convention. Use when the user wants to rename layers to reflect their semantic role (nav, header, footer, section, article, button, input, h1, p, img, etc.), clean up auto-generated layer names, or prepare a design for handoff with meaningful layer names. Triggers: 'rename layers', 'semantic layer names', 'rename to HTML elements', 'clean up layer names', 'fix layer naming', 'add semantic names to layers'."
disable-model-invocation: false
---

# Semantic Layer Renaming — Penpot MCP Skill

Analyze an existing Penpot design and rename every layer using HTML semantic element naming conventions. The skill infers each layer's semantic role from its visual properties, position, children, and context — then proposes renames for user approval before applying them.

**How it works**: Inspection and renaming both go through the Penpot MCP `execute_code` tool. Use `high_level_overview` for initial file structure. Use `penpot_api_info` to verify API signatures.

---

## 1. The One Rule That Matters Most

**Never rename layers without showing the user the full rename plan first.** Layer names drive handoff, code export, and component binding. Incorrect names can corrupt downstream workflows. Always present the before/after mapping and wait for approval.

---

## 2. Mandatory Workflow

```
Phase 0: INSPECTION (read-only)
  0a. Call high_level_overview to see file structure
  0b. Decide scope with user: current page, selected frame, or full file
  0c. Traverse all shapes via execute_code — collect id, name, type, position, size, children, fills, fontFamily, fontSize, fontWeight
  ✋ Show layer inventory to user — confirm scope before analysis

Phase 1: INFERENCE (analysis — no writes)
  1a. Apply semantic inference rules (see Section 4) to each layer
  1b. Propose new names following naming conventions (see Section 5)
  1c. Flag ambiguous cases that need user input
  ✋ USER CHECKPOINT: present full before/after rename table, await explicit approval

Phase 2: RENAMING (writes)
  2a. Rename layers one parent group at a time (top-level → children)
  2b. Use shape.name = 'new-name' for each shape
  2c. After each group, validate via high_level_overview or export_shape
  ✋ USER CHECKPOINT: show export_shape screenshot of renamed area, sign-off
```

---

## 3. Penpot MCP Tool Reference

| Tool | Purpose |
|------|---------|
| `execute_code` | Run arbitrary Plugin API code. **Primary tool.** |
| `high_level_overview` | Read-only layer tree and file structure inspection. |
| `penpot_api_info` | Query API type definitions and method signatures. |
| `export_shape` | Export shape as image for visual validation. |

---

## 4. Semantic Inference Rules

### 4a. Layout-Level Frames (top-level shapes)

Inspect position, size relative to page, and child content:

| Signal | Inferred Element |
|--------|-----------------|
| Full page width, anchored at top, contains links or nav items | `header` > `nav` |
| Full page width, anchored at top, contains logo + actions | `header` |
| Full page width, anchored at bottom | `footer` |
| Full page width, large height, primary content area | `main` |
| Full page width, mid-page, groups related content | `section` |
| Card shape (moderate size, shadow or border, self-contained content) | `article` |
| Sidebar-like, vertical list of links | `aside` > `nav` |
| Modal/overlay (positioned absolutely, centered, high z-order hint from layer order) | `dialog` |
| Form container (contains inputs and a submit button) | `form` |

### 4b. Interactive Elements

| Signal | Inferred Element |
|--------|-----------------|
| Small frame (≤ 200×56px), solid fill, text child | `button` |
| Frame with border only (no fill or transparent fill), text child, wide and short | `input` |
| Small square/circle, checkmark icon child | `input[type=checkbox]` |
| Circle with dot child or filled circle | `input[type=radio]` |
| Wide frame, dropdown icon child | `select` |
| Horizontal range/thumb shape | `input[type=range]` |
| Toggle shape (pill + circle child) | `input[type=checkbox]` (role=switch) |

### 4c. Text Nodes

Map by font size and weight. Use the predominant body font size as the baseline (16px default):

| Signal | Inferred Element |
|--------|-----------------|
| fontSize ≥ 36 OR (fontSize ≥ 28 AND fontWeight ≥ 600) | `h1` |
| fontSize ≥ 24 AND fontWeight ≥ 600 | `h2` |
| fontSize ≥ 20 AND fontWeight ≥ 500 | `h3` |
| fontSize ≥ 18 AND fontWeight ≥ 500 | `h4` |
| fontSize ≥ 16 AND fontWeight ≥ 500 | `h5` |
| fontSize 14–17, fontWeight 400, long text | `p` |
| fontSize ≤ 13 | `small` or `caption` |
| Short text near an input | `label` |
| Short decorative text, uppercase, letter-spacing > 0 | `span` (overline/eyebrow) |
| Link-like text (blue/underline) | `a` |
| List items (repeated text shapes at same indent level) | `li` |

### 4d. Media & Icons

| Signal | Inferred Element |
|--------|-----------------|
| Rectangle with image fill | `img` |
| Vector/path shape, small (≤ 32px) | `icon` or `svg` |
| Rectangle with video-like aspect ratio (16:9, 4:3) and no text | `video` |
| Horizontal line | `hr` |

### 4e. Grouping Containers

| Signal | Inferred Element |
|--------|-----------------|
| Flex container, row direction, contains nav links | `nav > ul` |
| Flex container, wrapping grid of cards | `ul` (card list) |
| Single card in a grid | `li > article` |
| Tab bar with multiple tab items | `[role=tablist]` > `[role=tab]` |
| Breadcrumb trail | `nav[aria-label=breadcrumb]` |

---

## 5. Naming Conventions

Use **kebab-case** for layer names. Combine the semantic element with a descriptor when multiple instances exist on the same level. Append BEM-style modifiers for state or variant context.

### Pattern

```
{element}                     → single instance, unambiguous role
{element}-{descriptor}        → when multiple same elements exist
{element}--{modifier}         → state or variant (hover, active, error, etc.)
{parent}__{child-element}     → BEM child relationship (optional, for deep nesting)
```

### Examples

```
header
header > nav
header > nav > ul
header > nav > ul > li (×N)   (use li-home, li-about, li-contact for named items)
header > button-cta

main
main > section-hero
main > section-hero > h1
main > section-hero > p
main > section-hero > button-primary
main > section-features
main > section-features > ul
main > section-features > ul > li-feature-1

footer
footer > nav-links
footer > p-copyright

article-card
article-card > img-thumbnail
article-card > h3-title
article-card > p-description
article-card > button-read-more

form-login
form-login > label-email
form-login > input-email
form-login > label-password
form-login > input-password
form-login > button-submit
```

### Special Cases

- **Component instances**: keep the component name, add `-instance` suffix only if the layer is a detached copy (`article-card-instance`).
- **Decorative shapes**: prefix with `deco-` (`deco-divider`, `deco-blob`, `deco-gradient`).
- **Wrapper/container frames** with no semantic role: use `div-{descriptor}` (`div-hero-content`, `div-card-grid`).
- **Icons inside buttons**: `icon-{name}` (`icon-arrow`, `icon-close`).

---

## 6. Inspection Script

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

const layerInfo = shapes.map(shape => ({
  id: shape.id,
  name: shape.name,
  type: shape.type,
  x: shape.x,
  y: shape.y,
  width: shape.width,
  height: shape.height,
  parentId: shape.parentId,
  childIds: shape.children ? shape.children.map(c => c.id) : [],
  fills: shape.fills ? shape.fills.map(f => ({ type: f.fillType, color: f.fillColor })) : [],
  // Text properties
  fontFamily: shape.fontFamily || null,
  fontSize: shape.fontSize || null,
  fontWeight: shape.fontWeight || null,
  characters: shape.characters ? shape.characters.substring(0, 40) : null,
  // Stroke
  strokes: shape.strokes ? shape.strokes.length : 0,
  // Border radius
  borderRadius: shape.borderRadius || null,
  // Component
  componentId: shape.componentId || null,
}));

return { totalShapes: shapes.length, layers: layerInfo };
```

---

## 7. Rename Script

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

// REPLACE_WITH_RENAME_MAP: object mapping shapeId → new name
// Generated in Phase 1 from the approved rename plan
const RENAME_MAP = {
  'SHAPE_ID_1': 'header',
  'SHAPE_ID_2': 'nav',
  'SHAPE_ID_3': 'button-cta',
  // ... full approved list
};

const renamed = [];
const errors = [];

for (const shape of shapes) {
  const newName = RENAME_MAP[shape.id];
  if (!newName) continue;

  try {
    const oldName = shape.name;
    shape.name = newName;
    renamed.push({ id: shape.id, oldName, newName });
  } catch (e) {
    errors.push({ id: shape.id, error: e.message });
  }
}

return {
  renamedCount: renamed.length,
  errorCount: errors.length,
  renamed,
  errors,
};
```

---

## 8. Handling Ambiguous Cases

Some layers cannot be inferred with confidence. Flag these to the user:

- Frames with only icon children (could be `button`, `a`, or `div`)
- Text nodes with mixed sizes/weights in one frame
- Shapes that look like both `input` and `button` (similar size, both have fill and text)
- Frames with image fill AND text overlay (could be `figure`, `article`, or `div`)
- Repeated shapes that might be `li` items or individual `section` elements

**When uncertain**: present the shape with a screenshot via `export_shape` and ask the user to confirm the intended role.

---

## 9. Critical Rules

1. **Present the full rename map before executing any renames** — user must approve.
2. **Never rename component main shapes** — only instances and non-component shapes. Renaming a component's main shape changes it for all instances.
3. **Scope to the current page** unless the user explicitly requests renaming across pages.
4. **Preserve existing semantic names** — if a layer already has a meaningful name (not "Frame 12" or "Rectangle"), flag it and ask before overwriting.
5. **Never parallelize `execute_code` calls** — always sequential.
6. **Process top-down** — rename parents before children to avoid confusion in the layer tree.
7. **Return all renamed IDs** — track in state ledger for undo guidance.

---

## 10. State Management

Write rename plan to disk at phase boundary:

```
/tmp/rename-layers-state-{RUN_ID}.json
```

```json
{
  "runId": "rename-001",
  "pageId": "page-id-...",
  "phase": "phase2",
  "renameMap": {
    "shape-id-1": { "old": "Frame 3", "new": "header", "approved": true },
    "shape-id-2": { "old": "Rectangle", "new": "button-cta", "approved": true }
  },
  "pendingAmbiguous": ["shape-id-5", "shape-id-9"],
  "completedRenames": ["shape-id-1", "shape-id-2"]
}
```

---

## 11. Anti-Patterns

- ❌ Renaming without user approval of the full plan
- ❌ Renaming component main shapes (breaks all instances)
- ❌ Using generic names like `container`, `wrapper` when a semantic element fits
- ❌ Using PascalCase for layer names (reserve PascalCase for component names)
- ❌ Skipping ambiguous cases instead of flagging them to the user
- ❌ Renaming layers that already have descriptive, correct names
- ❌ Using tag names without descriptors when multiple instances exist (`button`, `button`, `button` instead of `button-cta`, `button-secondary`, `button-ghost`)

---

## 12. Supporting Files

### References

| File | Read during |
|------|------------|
| `references/01-inspection-phase.md` | Phase 0 — shape traversal, layer tree structure, component detection |
| `references/02-semantic-inference.md` | Phase 1 — inference rules deep dive, edge cases, ambiguity handling |
| `references/03-renaming-strategy.md` | Phase 2 — rename execution, batch strategy, validation |

### Scripts

| Script | Use for |
|--------|---------|
| `scripts/inspectLayerStructure.js` | Phase 0 — full shape inventory with all properties needed for inference |
| `scripts/inferSemanticNames.js` | Phase 1 (runs locally) — apply inference rules and generate rename map |
| `scripts/renameLayer.js` | Phase 2 — apply approved rename map to shapes via execute_code |
