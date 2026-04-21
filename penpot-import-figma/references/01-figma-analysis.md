# Phase 0: Figma Analysis

Extract a complete, structured picture of the Figma file before touching Penpot. This phase is read-only. No `execute_code` calls until Phase 2.

---

## 0a. Get File Metadata First

Always start with `get_metadata`. It returns:
- File name, key, pages list
- Last modified date and author
- Component count (published library indicator)
- Linked libraries

```
Tool: get_metadata
Input: { "fileKey": "aBcDeFgH..." }
```

Extract from the response:
- Total page count and page names
- Whether a published component library exists in the file
- Whether external libraries are linked (you'll need to access those separately)

**Scope decision rule:**
- ≤ 5 pages with ≤ 50 components → full migration is feasible in one session
- 5–20 pages or 50–200 components → plan a phased migration, migrate by priority
- 20+ pages or 200+ components → must scope-limit: ask user which pages/components to include in v1

---

## 0b. Extract Design Variables (Figma Tokens)

Call `get_variable_defs` to extract all Figma Variables — these are the design tokens.

```
Tool: get_variable_defs
Input: { "fileKey": "aBcDeFgH..." }
```

The response contains:
- **Collections**: groups of related variables (equivalent to token sets in Penpot)
- **Modes**: per-collection modes (e.g., Light/Dark — equivalent to token themes)
- **Variables**: individual values per mode

### Parsing the Variable Response

For each collection:
```
Collection: "Color Primitives"
  Mode: "Value" (single mode = primitives)
    blue/500: #3B82F6 (COLOR)
    gray/900: #111827 (COLOR)
    white: #FFFFFF (COLOR)

Collection: "Semantic Colors"
  Mode: "Light"
    bg/primary: → alias → Color Primitives / white
    text/primary: → alias → Color Primitives / gray/900
  Mode: "Dark"
    bg/primary: → alias → Color Primitives / gray/900
    text/primary: → alias → Color Primitives / white

Collection: "Spacing"
  Mode: "Value"
    xs: 4 (FLOAT)
    sm: 8 (FLOAT)
    md: 16 (FLOAT)
    lg: 24 (FLOAT)
    xl: 32 (FLOAT)
```

### Variable Type Mapping

| Figma Variable Type | Penpot Token Type | Notes |
|--------------------|-------------------|-------|
| `COLOR` | `color` | Direct hex mapping |
| `FLOAT` | `spacing`, `sizing`, `border-radius`, `number` | Infer from usage context |
| `STRING` | `string` | Font family, etc. |
| `BOOLEAN` | (skip or encode as flag) | No direct equivalent |

**Inferring FLOAT context from name:**
- `spacing/*`, `gap/*`, `padding/*` → `spacing`
- `size/*`, `width/*`, `height/*` → `sizing`
- `radius/*`, `corner/*` → `border-radius`
- `opacity/*` → `opacity`
- `font-size/*`, `line-height/*` → use font-specific token types
- everything else → `number`

### Alias Resolution

Figma aliases (variable references) map to Penpot `{expression}` syntax:
```
Figma alias: Color Primitives / white
Penpot expression: {color.white}

Figma alias: Color Primitives / blue/500
Penpot expression: {color.blue.500}
```

Normalize Figma slash-separated paths → dot-separated for tokens:
- `Color Primitives / blue/500` → `color.blue.500`
- `Semantic Colors / bg/primary` (in Light mode) → `color.bg.primary` in set `semantic/light`

---

## 0c. Extract Design Context for Components

Components may span many pages. Use `get_metadata` page list to identify the "Components" or "Design System" page, then call `get_design_context` on key component nodes.

### Strategy for component extraction:

1. Identify the component library page (often named "Components", "Design System", "Library")
2. For each top-level frame on that page (each represents a component category):
   - Call `get_design_context` with the frame's node ID
   - Extract: component name, variant list, layout properties, fills, children

```
Tool: get_design_context
Input: { "fileKey": "aBcDeFgH...", "nodeId": "123:456" }
```

### What to extract from get_design_context

For each component node, document:

```
Component: Button
  Figma node ID: 123:456
  Figma key: a1b2c3d4...
  Type: COMPONENT_SET (has variants) | COMPONENT (no variants)
  
  Layout:
    layoutMode: HORIZONTAL (Auto Layout)
    primaryAxisAlignItems: CENTER
    counterAxisAlignItems: CENTER
    itemSpacing: 8
    paddingTop: 8, paddingRight: 16, paddingBottom: 8, paddingLeft: 16
    primaryAxisSizingMode: AUTO (hug) | FIXED
    counterAxisSizingMode: AUTO | FIXED
  
  Variants (if COMPONENT_SET):
    Property axes: ["Style", "Size", "State"]
    Variant frames:
      - Style=Primary, Size=Medium, State=Default → width:120, height:40
      - Style=Primary, Size=Medium, State=Hover → ...
      - Style=Ghost, Size=Medium, State=Default → ...
  
  Children:
    - icon-left (INSTANCE of Icon/Arrow)
    - label (TEXT, Inter 14/Medium, fills: [{color: var(--text-inverse)}])
    - icon-right (INSTANCE of Icon/Arrow)
  
  Fills:
    - fillType: SOLID, color: var(--brand-primary) [variable binding]
  
  Corner radius: 8 (bound to variable radius/md)
```

**Variable binding detection**: in `get_design_context` output, look for `boundVariables` in fill/stroke/cornerRadius/text properties. These become token bindings in Penpot.

---

## 0d. Get Visual References (Screenshots)

Before migrating any component or screen, capture its visual reference from Figma.

```
Tool: get_screenshot
Input: { "fileKey": "aBcDeFgH...", "nodeId": "COMPONENT_OR_SCREEN_NODE_ID" }
```

**When to capture screenshots:**
- All screens to be migrated → capture before Phase 4
- All components with variants → capture each variant set before Phase 3
- Key tokens (color palette) → capture the color reference page before Phase 2

Store screenshot references in the IR:
```json
{
  "figmaScreenshot": "data:image/png;base64,...",
  "capturedAt": "2026-04-21T00:00:00Z"
}
```

Or save as a reference note: "Screenshot taken, use as visual reference for fidelity validation."

---

## 0e. Identify Text Styles

Call `get_design_context` on a node with text content to extract text style bindings. Also check the Figma file for published text styles via metadata.

Key text style properties to capture:
```
Text style: "Heading/LG"
  fontFamily: Inter
  fontSize: 24
  fontWeight: 700
  lineHeight: { unit: PERCENT, value: 125 }  →  1.25
  letterSpacing: { unit: PIXELS, value: 0 }  →  0
  textCase: ORIGINAL
  textDecoration: NONE
```

**lineHeight normalization:**
- `PIXELS, 30` → `"30"` (absolute)
- `PERCENT, 125` → `"1.25"` (relative — divide by 100)
- `AUTO` → `"1.2"` (default, use sensible default)

---

## 0f. Identify External Libraries

If the file uses components from external Figma libraries:

```
Tool: get_libraries
Input: { "fileKey": "aBcDeFgH..." }
```

For each linked library:
- Note the library name and key
- Determine if the library is also being migrated (if yes, migrate it first)
- If not, flag those components as "external dependency" in the IR translation gap list

---

## 0g. Scope Lock Output

After analysis, present to the user:

```
FIGMA FILE ANALYSIS COMPLETE

File: "Product Design System" (key: aBcDeFgH)
Pages: 8 total
  → Migrating: Components, Homepage, Dashboard
  → Skipping: Archive, _Scratch, Motion Specs, Prototype Links, Release Notes

TOKENS FOUND:
  Collections: 3 (Color Primitives × 1 mode, Semantic Colors × 2 modes, Spacing × 1 mode)
  Variables: 47 (32 colors, 12 spacing/sizing, 3 radius)
  Text styles: 14

COMPONENTS FOUND: 23
  Atoms: Button (6 variants), Input (4 variants), Checkbox, Toggle, Badge (3 variants), Avatar (3 variants), Icon (48 icons), Divider
  Molecules: Card (2 variants), Modal, Alert (4 variants), Dropdown, Tooltip
  Organisms: NavBar, Sidebar, Footer

SCREENS TO MIGRATE: 2
  Homepage (1440×3200)
  Dashboard (1440×2800)

TRANSLATION GAPS:
  - Icon component: 48 SVG icons — will migrate as paths via SVG export
  - Prototype links: stripped (not applicable to static design)
  - External library "Icons Pro": not accessible — icons will be recreated as placeholders

MIGRATION ORDER:
  Phase 2: Tokens (47 variables → Penpot tokens, 14 text styles → typographies)
  Phase 3: Components (atoms first, then molecules, then organisms)
  Phase 4: Screens (Homepage, then Dashboard)

Approve this scope before I write to Penpot?
```

**Wait for explicit approval.** Do not proceed to IR building until the user approves the scope.

---

## Analysis Anti-Patterns

- ❌ Calling `get_design_context` on the entire file — always target specific node IDs
- ❌ Proceeding to Penpot before understanding the full component dependency tree
- ❌ Assuming variable names from Figma can be used as-is in Penpot (normalize them)
- ❌ Skipping external library detection (results in broken component instances)
- ❌ Not capturing screenshots before migrating (no visual reference = no fidelity check)
- ❌ Including prototype/animation specs in the scope (Penpot static design, not motion)
