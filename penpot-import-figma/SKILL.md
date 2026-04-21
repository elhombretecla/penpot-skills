---
name: penpot-import-figma
description: "Import and reconstruct Figma designs into Penpot with high fidelity. Use when the user wants to migrate a Figma file, component library, or screen to Penpot — preserving layout behavior (Auto Layout → Flex), component structure and variants, design tokens (Figma Variables → Penpot tokens), and visual hierarchy. This skill bridges the Figma MCP (for reading) and the Penpot MCP (for writing), building an intermediate representation before any Penpot write occurs. This is a professional-grade design migration tool, not a basic importer."
disable-model-invocation: false
---

# Figma → Penpot Migration Skill

Migrate real-world product designs from Figma to Penpot **without losing system integrity or visual quality**. This skill bridges two MCP servers: Figma MCP for reading, Penpot MCP for writing. A translation layer (Intermediate Representation) bridges the gap between their data models.

**How it works**: Figma MCP tools (`get_design_context`, `get_variable_defs`, `get_metadata`, `get_screenshot`) extract structured design data. Claude builds an IR (a structured JSON document). Then Penpot MCP `execute_code` calls reconstruct the design — tokens first, then components, then screens.

**Never assume a 1:1 API mapping exists.** Figma and Penpot have different data models. The IR translation layer is where all model differences are resolved before writing to Penpot.

---

## 1. The One Rule That Matters Most

**This is never a one-shot migration.** A complete Figma file migration requires 30–150+ `execute_code` calls across multiple phases, with mandatory user checkpoints. Attempting to migrate everything in one pass produces broken, incomplete, or unrecoverable results.

**Read the design first. Build a plan. Get approval. Then write.**

---

## 2. MCP Tool Reference

### Figma MCP (READ — extract design data)

| Tool | Purpose |
|------|---------|
| `get_metadata` | File name, pages, component count, published library info |
| `get_design_context` | Full node data for a frame/component: layout, children, fills, strokes, fonts |
| `get_variable_defs` | All Figma Variables: collections, modes, types, values |
| `get_screenshot` | Visual snapshot of any node — use for fidelity comparison |
| `get_libraries` | List published Figma libraries linked to the file |
| `search_design_system` | Search for components in the Figma design system by name |

> Always call `get_metadata` first to understand file scope before calling other Figma tools.

### Penpot MCP (WRITE — create design assets)

| Tool | Purpose |
|------|---------|
| `execute_code` | Run arbitrary Plugin API code. **Primary mutation tool.** |
| `high_level_overview` | Read-only inspection of the current Penpot file. Use before any write. |
| `penpot_api_info` | Query Plugin API type definitions. Use before coding any non-trivial API call. |
| `export_shape` | Export a shape as an image — use for visual fidelity validation. |

---

## 3. Translation Architecture

The migration pipeline has three stages:

```
STAGE 1: EXTRACTION (Figma MCP → IR)
  Read Figma file structure, variables, components, screens
  Resolve Figma-specific concepts into platform-neutral IR
  IR = a JSON document Claude holds in memory + writes to /tmp/

STAGE 2: TRANSLATION (IR → Penpot model)
  Map IR token model to Penpot token catalog
  Map IR layout model to Penpot flex layout
  Map IR component/variant model to Penpot VariantContainer
  Resolve naming conflicts, deduplicate, normalize

STAGE 3: CREATION (Penpot MCP execute_code)
  Tokens first — always
  Components second — dependency order (atoms before molecules)
  Screens last — after design system is complete
```

**The IR is the translation contract.** If extraction produces an incomplete IR, the creation phase will fail. Never skip or rush IR building.

---

## 4. Figma → Penpot Concept Mapping

### Layout

| Figma Concept | Penpot Equivalent | Notes |
|--------------|-------------------|-------|
| Auto Layout (Horizontal) | Flex Layout `dir: 'row'` | Direct mapping |
| Auto Layout (Vertical) | Flex Layout `dir: 'column'` | Direct mapping |
| Auto Layout Gap | `layout.gap` | Direct mapping |
| Auto Layout Padding | `layout.padding` | top/right/bottom/left |
| Auto Layout Align Items | `layout.alignItems` | 'start'\|'center'\|'end'\|'stretch' |
| Auto Layout Justify Content | `layout.justifyContent` | 'start'\|'center'\|'end'\|'space-between' |
| Auto Layout Wrap | `layout.flexWrap = 'wrap'` | Penpot supports wrap |
| Fill Container (H or V) | `shape.horizontalSizing = 'fill'` or verticalSizing | Size mode |
| Hug Contents | `shape.horizontalSizing = 'fit-content'` | Size mode |
| Fixed W/H | Explicit `shape.width` / `shape.height` | Default |
| Absolute position (inside Auto Layout) | `shape.layoutItemAbsolutePosition = true` | Opt out of flex |
| Constraints (Left+Right) | Horizontal fill | Depends on parent |
| Constraints (Center H/V) | `shape.layoutItemHSizingType`/`VSizingType` | Per-item layout |
| Spacing between = Auto | `justifyContent: 'space-between'` | Figma "Auto" spacing |

### Components & Variants

| Figma Concept | Penpot Equivalent | Notes |
|--------------|-------------------|-------|
| Component | Component (via `page.createComponent()`) | Penpot has main+instances |
| Component Instance | `component.createInstance()` | Always derive from main |
| Variant Property | Variant property on VariantContainer | `property=value` format |
| Variant Set (Component Group) | `page.createVariantContainer()` | Wraps variant frames |
| Component Property (boolean, text, instance swap) | `shape.componentProperties` | Partial Penpot support |
| Nested Instance | Inner `createInstance()` inside component | Always create inner components first |

### Tokens & Styles

| Figma Concept | Penpot Equivalent | Notes |
|--------------|-------------------|-------|
| Variable Collection | Token Set | Penpot uses flat sets, not collections |
| Variable Mode | Token Theme | Light/Dark mode → separate token sets |
| Color Variable | Token `type: 'color'` | Hex value or `{reference}` expression |
| Number Variable | Token `type: 'spacing'` or `sizing` or `number` | Depends on usage context |
| String Variable | Token `type: 'string'` | Font families, etc. |
| Boolean Variable | (no direct equivalent) | Encode as a named flag token if needed |
| Color Style | Library Color (`library.createColor()`) | Also create as token for binding |
| Text Style | Library Typography + token | `library.createTypography()` |
| Effect Style (shadow) | Token `type: 'shadow'` | Penpot shadow token |
| Effect Style (blur) | Applied directly as shape property | No token type for blur |
| Grid Style | Frame grid property | `frame.grids = [...]` |

### Shapes

| Figma Node Type | Penpot Shape Type | Notes |
|----------------|------------------|-------|
| FRAME | Frame (`createFrame()`) | Includes artboards |
| GROUP | Group (`createGroup()`) | |
| RECTANGLE | Rectangle (`createRectangle()`) | |
| TEXT | Text (`createText()`) | |
| VECTOR / BOOLEAN_OPERATION | Path (`createPath()`) | Import via export+reimport if complex |
| ELLIPSE | Circle (`createCircle()`) | |
| LINE | Path with two points | |
| INSTANCE | Component instance | |
| COMPONENT | Component main | |
| IMAGE | Image shape | |
| STAR / POLYGON | Path | Export as SVG, import via path |

---

## 5. Mandatory Workflow

Every migration follows this phase order. Skipping phases causes structural failures.

```
Phase 0: FIGMA ANALYSIS (read-only — no Penpot writes yet)
  0a. Get Figma file metadata → understand scope, pages, component count
  0b. Get Figma variables → extract all token collections, modes, values
  0c. Get design context for each page → understand layout structure
  0d. Take screenshots of key screens/components → save as visual reference
  0e. Build IR overview: count tokens, components, screens to migrate
  ✋ USER CHECKPOINT: scope lock — what to migrate, in what order, any exclusions

Phase 1: IR BUILDING (analysis only — no Penpot writes)
  1a. Build token IR: map Figma variables + styles → Penpot token model
  1b. Build component IR: list all Figma components, variant axes, dependencies
  1c. Build screen IR: list frames to migrate, section breakdown
  1d. Resolve naming: normalize names to Penpot conventions (dot-notation tokens, slash colors)
  1e. Identify layout types: which frames use Auto Layout vs. absolute positioning
  1f. Flag translation gaps: elements that cannot be mapped 1:1
  → Write IR to /tmp/figma-import-ir-{RUN_ID}.json
  ✋ USER CHECKPOINT: present IR summary, translation gaps, approved naming

Phase 2: PENPOT FOUNDATION (tokens + library — before components)
  2a. Inspect Penpot file → high_level_overview, check for existing tokens/components
  2b. Create primitive token set in Penpot (raw hex values, sizes)
  2c. Create semantic token sets per mode (light/dark using {reference} expressions)
  2d. Create library colors (for fill/stroke binding via colorRefId)
  2e. Create library typographies
  2f. Validate: all tokens exist, names match IR, expressions resolve
  ✋ USER CHECKPOINT: token summary, any naming conflicts

Phase 3: COMPONENT MIGRATION (one component at a time — never batch)
  For EACH component (dependency order: atoms first):
    3a. Get Figma component design context → extract shape tree, layout, styling
    3b. Translate layout properties (Auto Layout → flex layout spec)
    3c. Create Penpot component frame with correct flex layout
    3d. Create children shapes with correct token bindings
    3e. If variants exist: createVariantContainer() + build each variant
    3f. Validate: export_shape screenshot, compare to Figma screenshot
    ✋ USER CHECKPOINT per component (or per batch of simple atoms): approve before next

Phase 4: SCREEN MIGRATION (section by section — never full-page at once)
  For EACH screen:
    4a. Create wrapper frame (correct artboard dimensions)
    4b. Migrate each section independently
    4c. Bind component instances from the migrated library (not manual reconstruction)
    4d. Apply token-bound fills/strokes — never hardcode hex
    4e. Validate: export_shape section screenshots, compare to Figma screenshots
    ✋ USER CHECKPOINT per screen: side-by-side comparison before proceeding

Phase 5: FIDELITY QA (mandatory final pass)
  5a. Visual diff: Figma screenshot vs. Penpot export_shape for each screen
  5b. Token audit: find any hardcoded fills/strokes remaining
  5c. Component audit: verify all instances link to migrated components, not manual shapes
  5d. Naming audit: no unnamed nodes, consistent naming conventions
  5e. Layout audit: verify flex layouts render correctly, no collapsed frames
  ✋ USER CHECKPOINT: sign off or list issues for a second pass
```

---

## 6. IR (Intermediate Representation) Structure

The IR is the translation contract between Figma data and Penpot creation. Write it to disk before Phase 2.

```json
{
  "meta": {
    "runId": "figma-import-001",
    "figmaFileKey": "aBcDeFgH...",
    "figmaFileName": "Product Design System",
    "createdAt": "2026-04-21T00:00:00Z",
    "scope": {
      "migrateTokens": true,
      "migrateComponents": true,
      "migrateScreens": ["Homepage", "Dashboard"],
      "excludePages": ["Archive", "_Scratch"]
    }
  },
  "tokens": {
    "sets": {
      "primitives": [
        { "figmaCollectionId": "...", "figmaVariableId": "...", "name": "color.blue.500", "type": "color", "value": "#3B82F6", "penpotStatus": "pending" }
      ],
      "semantic/light": [
        { "name": "color.bg.primary", "type": "color", "value": "{color.white}", "penpotStatus": "pending" }
      ],
      "semantic/dark": [
        { "name": "color.bg.primary", "type": "color", "value": "{color.gray.900}", "penpotStatus": "pending" }
      ],
      "spacing": [
        { "name": "spacing.md", "type": "spacing", "value": "16", "penpotStatus": "pending" }
      ]
    },
    "themes": [
      { "name": "Light", "activeSets": ["primitives", "semantic/light", "spacing"] },
      { "name": "Dark", "activeSets": ["primitives", "semantic/dark", "spacing"] }
    ]
  },
  "colors": [
    { "figmaStyleId": "...", "name": "color/brand/primary", "hex": "#3B82F6", "opacity": 1, "penpotStatus": "pending" }
  ],
  "typographies": [
    {
      "figmaStyleId": "...", "name": "Heading/LG", "fontFamily": "Inter", "fontSize": "24",
      "fontWeight": "700", "lineHeight": "1.25", "letterSpacing": "0", "penpotStatus": "pending"
    }
  ],
  "components": [
    {
      "figmaId": "...", "figmaKey": "...",
      "name": "Button", "path": "atoms",
      "dependency": [],
      "layout": { "type": "flex", "dir": "row", "alignItems": "center", "justifyContent": "center", "padding": { "top": 8, "right": 16, "bottom": 8, "left": 16 }, "gap": 8 },
      "variants": [
        { "properties": { "Style": "Primary", "Size": "Medium", "State": "Default" }, "fills": ["color/brand/primary"], "width": 120, "height": 40 },
        { "properties": { "Style": "Ghost", "Size": "Medium", "State": "Default" }, "fills": [], "border": "color/border/default", "width": 120, "height": 40 }
      ],
      "translationGaps": [],
      "penpotStatus": "pending",
      "penpotComponentId": null
    }
  ],
  "screens": [
    {
      "figmaId": "...", "name": "Homepage", "page": "Design",
      "width": 1440, "height": 3200,
      "sections": [
        { "name": "nav-bar", "figmaId": "...", "components": ["NavBar"], "penpotStatus": "pending" }
      ],
      "penpotStatus": "pending",
      "penpotFrameId": null
    }
  ],
  "translationGaps": [
    { "figmaId": "...", "type": "COMPLEX_VECTOR", "reason": "Boolean path operations not directly mappable — will be replaced with SVG path", "resolution": "export-reimport" }
  ]
}
```

> Write this to `/tmp/figma-import-ir-{RUN_ID}.json` after Phase 1. Re-read at the start of every session turn. Update `penpotStatus` and created IDs as each entity is created.

---

## 7. State Management

### Plugin Data Tagging

Tag every created Penpot shape immediately after creation:

```typescript
shape.setSharedPluginData('figma-import', 'run_id', 'RUN_ID');
shape.setSharedPluginData('figma-import', 'figma_id', 'FIGMA_NODE_ID');
shape.setSharedPluginData('figma-import', 'entity_type', 'component|screen|token');
```

This enables:
- Resume after context truncation
- Idempotency checks (skip if already created)
- Safe cleanup (target only tagged shapes)

### State Ledger (on disk)

Update the IR file at every phase boundary. Mark each entity:
```json
{ "penpotStatus": "created", "penpotId": "abc123...", "createdAt": "..." }
```

### Resume Protocol

At session start or after context truncation:
1. Re-read `/tmp/figma-import-ir-{RUN_ID}.json`
2. Call `high_level_overview` on the Penpot file
3. Query tagged shapes to reconcile IR with actual Penpot state
4. Identify where to resume (first entity with `penpotStatus: "pending"`)

---

## 8. Critical Rules

1. **IR before creation** — never write to Penpot without a complete, user-approved IR
2. **Tokens before components, components before screens** — dependency order is non-negotiable
3. **One component per phase turn** — complex components need validation before moving on
4. **Bind to tokens, never hardcode** — all fills/strokes must use `fillColorRefId` where a library color exists
5. **Get Figma screenshot before migrating** — you need the visual reference before recreating
6. **Validate with export_shape after every component** — compare side by side with Figma screenshot
7. **Never flatten Auto Layout into absolute positioning** — this destroys scalability
8. **Never combine multiple components into one VariantContainer unless they are true Figma variants** — maintain 1:1 component structure
9. **Log all translation gaps** — items that cannot be mapped 1:1 must be documented in IR and surfaced to user
10. **Sequential execute_code calls only** — never parallelize Penpot mutations
11. **Never guess IDs** — always read from IR state ledger or live Penpot queries
12. **Idempotent scripts** — check for existence before creating, tag all creations

---

## 9. Translation Gaps and Fallback Strategies

Some Figma features have no direct Penpot equivalent. When you encounter them:

| Figma Feature | Penpot Fallback | Quality Impact |
|--------------|----------------|----------------|
| Complex boolean vector paths | Export as SVG from Figma → import to Penpot | Low — visually identical |
| Prototype links / interactions | Strip (not applicable to static design) | None for static designs |
| Plugin-generated content | Reconstruct from visual reference | Medium |
| Component Properties (boolean, instance swap) | Encode as variant or document as limitation | Medium |
| Figma-specific constraints in nested frames | Translate to equivalent flex sizing | Low if done carefully |
| Advanced gradient types (diamond, angular) | Approximate with radial/linear | Medium |
| Effect: Layer Blur | Apply via Penpot blur property on shape | Low |
| Multiple fills (stacked) | Penpot supports multiple fills — direct mapping | Low |
| Variable aliasing (mode-specific values) | Separate token sets per mode — standard Penpot pattern | Low |
| Figma Community file externals | Must obtain the source file separately | High — flag to user |

---

## 10. User Checkpoints

Mandatory. Never proceed without explicit approval.

| After | Required artifacts | Ask |
|-------|--------------------|-----|
| Phase 0 (scope) | File summary: N pages, M components, K tokens, screens list | "Here's what I found in Figma. What should I migrate?" |
| Phase 1 (IR) | IR summary: token count, component list, screens, translation gaps | "Here's my migration plan. Approve before I write to Penpot?" |
| Phase 2 (tokens) | Token summary + any naming conflicts | "Tokens created. Review before migrating components?" |
| Each component | Figma screenshot vs. Penpot export_shape | "Here's [Component] migrated. Does it match Figma?" |
| Each screen | Side-by-side Figma vs. Penpot comparison | "Screen migrated. Approve or list issues?" |
| Phase 5 (QA) | Full audit report + screenshots | "Migration complete. Sign off or address remaining gaps?" |

---

## 11. Naming Convention Translation

Figma and Penpot use different naming conventions. Normalize during IR building.

| Figma pattern | Penpot convention | Example |
|--------------|-------------------|---------|
| `color/brand/primary` (slash-separated) | `color.brand.primary` for tokens, `color/brand/primary` for library colors | Tokens use dots; library colors use slashes |
| `Heading Large` (space-separated) | `Heading/LG` | Typographies: slash-separated, abbreviated size |
| `Button/Primary/Medium/Default` (deep slash) | Token: dot; Component: `Button` + variant `Style=Primary, Size=Medium, State=Default` | Flatten variant path into properties |
| Component group prefix `_` | Omit underscore prefix | `_Base` → `Base` (private components) |
| `(deprecated)` suffix | Do not migrate | Skip deprecated components unless explicitly requested |
| CamelCase layer names | `kebab-case` for frames, `PascalCase` for components | `buttonIcon` → `button-icon` |

---

## 12. Anti-Patterns (Do Not Do These)

**Migration anti-patterns:**
- ❌ Writing to Penpot before the IR is built and approved
- ❌ Creating screens before the component library is migrated
- ❌ Using hardcoded hex fills when library colors exist
- ❌ Flattening Auto Layout frames into static absolute-positioned shapes
- ❌ Treating every Figma frame as a Penpot frame — groups and sections may be better choices
- ❌ Migrating deprecated Figma components without flagging them
- ❌ Creating Penpot components with hardcoded values instead of token bindings
- ❌ Running `get_design_context` on the entire file at once — always work page by page, component by component
- ❌ Skipping `get_screenshot` — you need the visual reference before recreating
- ❌ Ignoring translation gaps — document them all in the IR

**Penpot anti-patterns:**
- ❌ Parallelizing `execute_code` calls (always sequential)
- ❌ Guessing/hallucinating Penpot node IDs (always read from state ledger)
- ❌ Creating a component for a shape that is only used once in the design (use plain frames instead)
- ❌ Breaking a Figma component into non-reusable static layers
- ❌ Skipping user checkpoints to "save time"
- ❌ Building on unvalidated work

---

## 13. Supporting Files

Read these during the corresponding phase.

### References

| File | Read during |
|------|------------|
| `references/01-figma-analysis.md` | Phase 0 — Figma MCP tool usage, data extraction patterns |
| `references/02-ir-building.md` | Phase 1 — building and writing the IR document |
| `references/03-token-migration.md` | Phase 2 — translating Figma Variables + Styles → Penpot tokens + colors |
| `references/04-component-migration.md` | Phase 3 — Figma Component → Penpot VariantContainer, dependency ordering |
| `references/05-layout-translation.md` | Phases 3–4 — Auto Layout → Flex Layout rules and edge cases |
| `references/06-screen-migration.md` | Phase 4 — screen wrapper, section-by-section reconstruction |
| `references/07-validation.md` | Phase 5 + after each component — fidelity checks, screenshot comparison |
| `references/08-error-recovery.md` | On any error — recovery protocol, partial cleanup, resume patterns |

### Scripts

| Script | Use for |
|--------|---------|
| `scripts/analyzeFigmaStructure.js` | Phase 0 — build a structural summary of Figma data returned by MCP |
| `scripts/buildIR.js` | Phase 1 — assemble and write the IR JSON document |
| `scripts/migrateTokens.js` | Phase 2 — create tokens, library colors, typographies in Penpot |
| `scripts/migrateComponent.js` | Phase 3 — create one migrated component with variants and token bindings |
| `scripts/migrateScreen.js` | Phase 4 — create wrapper + build sections from migrated components |
| `scripts/validateFidelity.js` | Phase 5 — audit tokens, components, hardcoded values, naming |

> Scripts are templates — replace `REPLACE-ME` placeholders before running.

---

## 14. Example Agent Usage

```
User (agent): "Migrate the Figma file at figma.com/design/aBcDeFgH/Product-DS to Penpot.
               Include the component library and the Homepage + Dashboard screens."

Agent actions:
  1. Call get_metadata with fileKey "aBcDeFgH"
  2. Call get_variable_defs to extract all Figma variables
  3. Call get_design_context on "Components" page nodes
  4. Call get_screenshot on key screens for visual reference
  5. Build IR → write to /tmp/figma-import-ir-001.json
  6. Present scope lock to user → await approval
  7. Call high_level_overview on target Penpot file
  8. Execute migrateTokens.js → create tokens + library colors
  9. Checkpoint: show token summary
 10. Execute migrateComponent.js for each component (Button, Input, Card...)
 11. Checkpoint: show screenshot comparison after each
 12. Execute migrateScreen.js for Homepage, then Dashboard
 13. Checkpoint: show side-by-side comparisons
 14. Execute validateFidelity.js → show final audit report
 15. Final sign-off
```
