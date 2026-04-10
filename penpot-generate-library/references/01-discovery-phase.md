# Phase 0: Discovery

Discovery is mandatory before any `execute_code` write. This phase is read-only. Its output is a scope-locked plan that the user approves before you touch the Penpot file.

---

## 0a. Codebase Analysis

Extract the raw token material from the codebase before opening Penpot.

### Token Sources to Scan

| Source | What to extract |
|--------|----------------|
| `tokens.json`, `tokens/*.json` (W3C DTCG format) | Token names, values, types, groups |
| `variables.css`, `_variables.scss` | CSS custom properties and their values |
| `tailwind.config.{js,ts}` | `theme.colors`, `theme.spacing`, `theme.borderRadius`, `theme.fontFamily`, `theme.fontSize`, `theme.fontWeight`, `theme.lineHeight` |
| `theme.ts`, `theme.js` (CSS-in-JS) | Token objects from Chakra, MUI, Stitches, vanilla-extract |
| `design-tokens.{json,yaml}` | Studio/Token Studio exports |
| `*.tokens.ts` | Typed token maps |

### Output of Codebase Analysis

Produce a raw token inventory in this format:

```
COLORS
  primitives:
    blue.50  = #EFF6FF
    blue.100 = #DBEAFE
    blue.500 = #3B82F6
    blue.900 = #1E3A8A
    gray.50  = #F9FAFB
    gray.900 = #111827
    white    = #FFFFFF
    black    = #000000
  semantic (light):
    bg.primary   = blue.50
    bg.secondary = gray.50
    text.primary = gray.900
    text.inverse = white
    border.default = gray.200
  semantic (dark):
    bg.primary   = gray.900
    text.primary = white

SPACING
  xs = 4    sm = 8    md = 16    lg = 24    xl = 32    2xl = 48    3xl = 64

TYPOGRAPHY
  family.sans = Inter, sans-serif
  family.mono = JetBrains Mono, monospace
  size.xs = 12   size.sm = 14   size.base = 16   size.lg = 18   size.xl = 20
  size.2xl = 24  size.3xl = 30  size.4xl = 36    size.5xl = 48
  weight.normal = 400   weight.medium = 500   weight.semibold = 600   weight.bold = 700
  lineHeight.tight = 1.25   lineHeight.normal = 1.5   lineHeight.relaxed = 1.75

BORDER RADIUS
  none = 0   sm = 4   md = 8   lg = 12   xl = 16   2xl = 24   full = 9999

SHADOWS
  sm  = 0 1px 2px rgba(0,0,0,0.05)
  md  = 0 4px 6px rgba(0,0,0,0.10)
  lg  = 0 10px 15px rgba(0,0,0,0.15)
  xl  = 0 20px 25px rgba(0,0,0,0.20)

COMPONENTS (to build)
  atoms:   Button, Input, Checkbox, Toggle, Badge, Avatar, Tag, Divider
  molecules: Card, Modal, Tooltip, Dropdown, Alert, Breadcrumb, Tabs
  organisms: NavBar, Sidebar, DataTable, Form, PageHeader
```

### Component Inventory

For each component, document:
- **Props that affect appearance**: variant, size, state, color, disabled, loading
- **Variant axes** (maps directly to Penpot variant properties): `Size`, `Style`, `State`
- **Children**: icons, text labels, badges, avatars (these become inner shapes)
- **Dependencies**: if `Button` uses `Spinner`, build `Spinner` first

---

## 0b. Penpot File Inspection

Run `high_level_overview` before any write. Never assume the file is empty or in a known state.

```typescript
// Execute via high_level_overview tool (not execute_code)
// Returns: pages list, layer tree summary, component names, token names, color names, typography names
```

Then run a targeted `execute_code` to get granular detail:

```typescript
const file = penpot.currentFile;
const page = penpot.currentPage;
const library = penpot.library.local;

return {
  fileId: file.id,
  fileName: file.name,
  currentPageId: page.id,
  currentPageName: page.name,
  allPages: penpot.pages.map(p => ({ id: p.id, name: p.name })),
  componentCount: library.components.length,
  componentNames: library.components.map(c => c.name),
  colorCount: library.colors.length,
  colorNames: library.colors.map(c => c.name),
  typographyCount: library.typographies.length,
  typographyNames: library.typographies.map(t => t.name),
};
```

### Inspect Existing Tokens

```typescript
const catalog = penpot.library.local.tokens;
const tokenList = catalog ? Object.values(catalog) : [];
return tokenList.map(t => ({
  name: t.name,
  type: t.type,
  value: t.value,
  description: t.description
}));
```

### Inspect Shared Libraries

If the design system lives in a separate Penpot file:

```typescript
const allLibraries = penpot.library.all;
return allLibraries.map(lib => ({
  fileId: lib.fileId,
  name: lib.name,
  componentCount: lib.components.length,
  colorCount: lib.colors.length,
  typographyCount: lib.typographies.length
}));
```

---

## 0c. State Classification

After inspecting the file, classify each planned entity:

| Status | Definition | Action |
|--------|-----------|--------|
| **MISSING** | Does not exist in Penpot | Create in the appropriate phase |
| **EXISTS — compatible** | Exists, structure and naming match the plan | Skip creation, record ID in state ledger |
| **EXISTS — incompatible** | Exists but wrong structure, naming, or token binding | Ask user: rebuild or adapt? |
| **EXISTS — remote library** | Exists in a shared library, not editable | Wrap or import, don't modify |

---

## 0d. Mapping Table

Create a mapping table before locking scope:

| Code token | Penpot token name | Type | Value | Status |
|-----------|-------------------|------|-------|--------|
| `--color-primary` | `color.blue.500` | color | `#3B82F6` | MISSING |
| `--spacing-md` | `spacing.md` | spacing | `16` | MISSING |
| `colors.gray[900]` | `color.gray.900` | color | `#111827` | MISSING |
| `theme.bg.primary` | `color.bg.primary` | color | `{color.blue.50}` | MISSING |
| (no code equivalent) | `color.white` | color | `#FFFFFF` | MISSING |
| `borderRadius.lg` | `radius.lg` | border-radius | `12` | MISSING |

**Typography mapping** (library typographies, not just tokens):

| Code style | Penpot typography name | Family | Size | Weight | Line-height |
|-----------|----------------------|--------|------|--------|-------------|
| `text-sm font-medium` | `Body/Small Medium` | Inter | 14 | 500 | 1.5 |
| `text-base` | `Body/Base` | Inter | 16 | 400 | 1.5 |
| `text-2xl font-bold` | `Heading/2XL` | Inter | 24 | 700 | 1.25 |

---

## 0e. Conflict Resolution

When code and Penpot disagree on a value:

| Conflict type | Default resolution | When to ask user |
|--------------|-------------------|-----------------|
| Value mismatch (code: `#3B82F6`, Penpot: `#2563EB`) | Code wins — use code value | Always ask before overwriting an existing library color |
| Name mismatch (code: `primary`, Penpot: `brand`) | Show both, ask user which convention to follow | Always |
| Architecture mismatch (code: flat tokens, Penpot: nested) | Match code architecture | Ask if Penpot architecture was intentional |
| Missing in code, exists in Penpot | Keep Penpot version, record in ledger | If it's used by existing components |
| Missing in Penpot, exists in code | Create it | No need to ask |

**Never silently resolve conflicts.** If code and Penpot disagree on naming or structure, surface it in the scope lock checkpoint.

---

## 0f. Scope Lock

Before Phase 1 begins, present the following to the user:

```
SCOPE LOCK — v1 Design System

TOKENS TO CREATE:
  Color primitives (N): color.blue.50 … color.gray.900, color.white, color.black
  Color semantic light (N): color.bg.primary, color.text.primary, …
  Color semantic dark (N): color.bg.primary, color.text.primary, …
  Spacing (N): spacing.xs … spacing.3xl
  Typography sizes (N): typography.size.xs … typography.size.5xl
  Typography weights (N): typography.weight.normal … typography.weight.bold
  Border radius (N): radius.none … radius.full
  Shadows (N): shadow.sm … shadow.xl

LIBRARY TYPOGRAPHIES TO CREATE:
  Body/Small, Body/Base, Body/Large, Heading/SM, Heading/Base, Heading/2XL, …

COMPONENTS TO BUILD (in order):
  Phase 3a (atoms):    Button, Input, Checkbox, Toggle, Badge, Avatar
  Phase 3b (molecules): Card, Modal, Alert, Tabs
  Phase 3c (organisms): NavBar, DataTable

CONFLICTS FOUND:
  [list any conflicts and proposed resolutions]

WHAT WILL NOT BE BUILT IN v1:
  [out-of-scope items, dark mode variants, etc.]

Approve this plan before I create anything?
```

Wait for explicit approval. "Looks good" is not sufficient — ask for "yes, proceed" or equivalent.

---

## Discovery Anti-Patterns

- ❌ Skipping `high_level_overview` and assuming the file is empty
- ❌ Starting to create tokens before scope is locked
- ❌ Building a mapping table without inspecting the Penpot library for existing tokens
- ❌ Ignoring existing naming conventions in the Penpot file
- ❌ Listing components without documenting their variant axes first
- ❌ Resolving code/Penpot conflicts without asking the user
