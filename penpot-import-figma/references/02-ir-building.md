# Phase 1: Building the Intermediate Representation (IR)

The IR is the translation contract between Figma data and Penpot creation. It is a structured JSON document built from Figma MCP output and resolved to Penpot's data model **before any Penpot write occurs**.

Building the IR is an analysis step only. No `execute_code` calls until Phase 2.

---

## Why the IR Exists

Figma and Penpot have incompatible data models:

| Concern | Figma model | Penpot model |
|---------|------------|--------------|
| Token sets | Variable Collections with Modes | Flat token sets with Themes |
| Component variants | Component Set (flat variant property matrix) | VariantContainer wrapping variant frames |
| Color references | Variable alias or style reference | `fillColorRefId` + library color |
| Layout | Auto Layout with primary/counter axis sizing | Flex Layout with sizing modes |
| Component scope | Fully private components included in every file | Library components published per file |

The IR resolves these differences in a single, inspectable document before any creation occurs. This allows the user to review and approve the translation decisions before Penpot is touched.

---

## IR Document Location

Write the IR to disk immediately after Phase 1 completes:

```
/tmp/figma-import-ir-{RUN_ID}.json
```

Use a stable, unique `RUN_ID` (e.g., `figma-import-{fileKey-prefix}-{date}`). Re-read this file at the start of every session turn to restore state.

---

## IR Building Process

### Step 1: Normalize token names

Convert Figma variable/style names to Penpot naming conventions:

```
Figma name → IR token name

Color Primitives / blue / 500   →  color.blue.500    (primitive set)
Semantic Colors / bg / primary  →  color.bg.primary  (semantic set)
Spacing / md                    →  spacing.md
Radius / lg                     →  radius.lg
Text styles / Heading / Large   →  Heading/LG         (typography name — keep slash)
```

**Rules:**
- Token names: dot-separated, lowercase, no spaces
- Typography names: slash-separated, PascalCase category, abbreviated size (SM/MD/LG/XL/2XL)
- Library color names: slash-separated (matching existing Penpot convention)
- Remove collection prefix when it duplicates the type: `Color Primitives / blue/500` → `color.blue.500` (not `color-primitives.color.blue.500`)

### Step 2: Resolve variable aliases

Figma aliases → Penpot `{expression}` syntax:

```
Figma alias:
  Semantic Colors / bg / primary (Light mode) = alias → Color Primitives / white

IR resolution:
  token name: "color.bg.primary"
  token set: "semantic/light"
  token value: "{color.white}"  ← converted alias
```

**Alias resolution algorithm:**
1. Find the referenced variable by ID
2. Convert its IR name (already normalized)
3. Wrap in `{...}`: `{color.white}`
4. If the alias chain has multiple hops (alias → alias → raw value), resolve to the final raw value and record the chain in the IR for documentation

### Step 3: Determine token sets and themes

```
Figma Collections with single mode   →  Single Penpot token set (name = collection name normalized)
Figma Collections with multiple modes  →  One token set per mode

Example:
  Collection "Semantic Colors" with modes [Light, Dark]
  →  IR token sets: "semantic/light", "semantic/dark"
  →  IR themes:
       { name: "Light", activeSets: ["primitives", "semantic/light", "spacing"] }
       { name: "Dark",  activeSets: ["primitives", "semantic/dark",  "spacing"] }
```

### Step 4: Build component dependency graph

Before listing components, determine the build order by detecting dependencies:

```
Button uses Icon → Icon must be built before Button
Card uses Button, Avatar → Button and Avatar must be built before Card
NavBar uses Button, Avatar → all atoms before organisms
```

**Dependency detection rules:**
- A component depends on another if it contains an INSTANCE of that component
- Check `get_design_context` output for `type: INSTANCE` children and their `componentId`
- Build a directed acyclic graph (DAG) and topologically sort it

Dependency order categories:
```
Layer 0 (no dependencies):  Icon, Avatar (simple), Divider
Layer 1 (depends on layer 0): Button, Input, Checkbox, Toggle, Badge
Layer 2 (depends on layer 1): Card, Alert, Dropdown, Tooltip, Modal
Layer 3 (depends on layer 2): NavBar, Sidebar, DataTable, Form
```

### Step 5: Translate layout properties per component

For each component in the IR, translate Figma layout → Penpot flex spec:

```
Figma:
  layoutMode: HORIZONTAL
  primaryAxisAlignItems: CENTER
  counterAxisAlignItems: CENTER
  itemSpacing: 8
  paddingTop: 8, paddingRight: 16, paddingBottom: 8, paddingLeft: 16
  primaryAxisSizingMode: AUTO
  counterAxisSizingMode: AUTO

IR:
  layout: {
    type: "flex",
    dir: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: { top: 8, right: 16, bottom: 8, left: 16 },
    hSizing: "fit-content",
    vSizing: "fit-content"
  }
```

See `references/05-layout-translation.md` for the complete translation table.

### Step 6: Map variant axes and properties

For each Figma Component Set (has variants), extract variant properties:

```
Figma Component Set: "Button"
  Variant properties:
    Style: [Primary, Ghost, Danger]
    Size: [Small, Medium, Large]
    State: [Default, Hover, Disabled, Loading]

Total variants: 3 × 3 × 4 = 36 variant frames

IR:
  variantAxes: ["Style", "Size", "State"]
  variants: [
    { properties: { Style: "Primary", Size: "Small", State: "Default" }, figmaId: "123:456", width: 96, height: 32 },
    { properties: { Style: "Primary", Size: "Small", State: "Hover" }, figmaId: "123:457", width: 96, height: 32 },
    ... (all 36)
  ]
```

**Variant matrix limit**: if total variant count > 30, flag for user review. Consider splitting into sub-components to avoid VariantContainer explosion.

### Step 7: Record translation gaps

For every Figma element that cannot be directly mapped to Penpot, add an entry:

```json
{
  "figmaId": "987:123",
  "figmaName": "icon-arrow-right",
  "type": "VECTOR",
  "reason": "Complex vector path cannot be recreated programmatically",
  "resolution": "Export as SVG from Figma and import via Penpot import tool",
  "impact": "medium",
  "flagged": false
}
```

Resolution types:
- `"export-reimport"` — export from Figma as SVG/PNG, import into Penpot
- `"approximate"` — use closest Penpot equivalent (note the visual delta)
- `"skip"` — excluded from migration (prototype links, motion specs)
- `"manual"` — user must manually recreate after automated migration

---

## IR Validation Before Phase 2

Before writing the IR to disk and presenting it to the user, verify:

**Token IR checks:**
- [ ] Every alias resolves to a valid raw value (no dangling references)
- [ ] No duplicate token names within the same set
- [ ] All token types are valid Penpot types
- [ ] Every FLOAT variable has a resolved type (not just `number`)

**Component IR checks:**
- [ ] Dependency graph has no cycles
- [ ] Every component has a resolved layout spec (or is flagged as `layoutType: "none"`)
- [ ] Variant count per component is documented
- [ ] Components with > 30 variants are flagged

**Translation gap checks:**
- [ ] Every external library reference is recorded as a gap
- [ ] Every VECTOR/BOOLEAN_OPERATION complex path is recorded
- [ ] Every prototype link is marked as `resolution: "skip"`

---

## IR Summary to Present to User

After building the IR, present a concise summary:

```
IR BUILT — Migration Plan

TOKENS
  Token sets: 4 (primitives, semantic/light, semantic/dark, spacing)
  Primitive tokens: 20 (14 colors, 6 spacing/radius)
  Semantic tokens: 18 per mode
  Themes: 2 (Light, Dark)
  Library colors: 32
  Library typographies: 14

COMPONENTS (build order)
  Layer 0 — no deps: Icon, Divider (2)
  Layer 1 — atoms:   Button (36 variants), Input (4), Checkbox, Toggle, Badge (3), Avatar (3) (6 components)
  Layer 2 — molecules: Card (2), Modal, Alert (4), Dropdown, Tooltip (5 components)
  Layer 3 — organisms: NavBar, Sidebar (2 components)

SCREENS
  Homepage: 5 sections (NavBar, Hero, Features, Pricing, Footer)
  Dashboard: 6 sections (NavBar, Sidebar, Stats, Chart, Table, Footer)

TRANSLATION GAPS (3)
  ⚠️  Icon component: 48 SVG vectors → requires SVG export/reimport per icon
  ℹ️  Prototype links: stripped (static design only)
  ⚠️  External library "Icons Pro": inaccessible → icon shapes will be placeholder boxes

NAMING NORMALIZATIONS APPLIED
  "Color Primitives" → token set "primitives"
  "Semantic Colors / Light" → token set "semantic/light"
  "Button/Primary/Medium/Default" → component "Button" + variant properties

Approve this plan before I create anything in Penpot?
```

---

## IR Anti-Patterns

- ❌ Building the IR without normalizing names (Figma names ≠ Penpot conventions)
- ❌ Skipping alias resolution (results in hardcoded values instead of expressions)
- ❌ Not building the dependency graph (causes component creation order failures)
- ❌ Recording only the components the user mentioned, not their dependencies
- ❌ Omitting translation gaps (surprises during creation = harder to recover)
- ❌ Starting Phase 2 before writing the IR to disk (context truncation = lost state)
