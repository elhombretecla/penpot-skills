# Discovery Phase: Screen Building

Before writing any shape, discover what the design system has available. Building screens from discovered assets produces higher-quality results than drawing primitives manually.

---

## What to Discover

For every screen build, you need three things:

| Asset type | What it provides | Where to find it |
|-----------|-----------------|-----------------|
| **Components** | Reusable UI instances (Button, Card, Input, etc.) | `penpot.library.local.components` or shared libraries |
| **Library Colors** | Token-bound color fills (color/bg/primary, etc.) | `penpot.library.local.colors` |
| **Library Typographies** | Font styles (Body/MD, Heading/LG, etc.) | `penpot.library.local.typographies` |
| **Tokens** | Color, spacing, radius raw values | `penpot.library.local.tokens` |

---

## Step 1: Run high_level_overview First

Always call `high_level_overview` before any `execute_code` call. It returns:
- File name and ID
- All pages with their names
- Layer tree summary for the current page
- Available components, colors, typographies, and tokens (names only)

Use this to understand the file structure before querying IDs.

---

## Step 2: Inspect Existing Screens (Preferred)

If the file already contains screens built from this design system, inspect an existing screen's instances to get an authoritative component map:

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

// Find all component instances
const instances = shapes.filter(s => s.componentId !== undefined);
const uniqueComponents = new Map();

for (const inst of instances) {
  if (!uniqueComponents.has(inst.componentId)) {
    uniqueComponents.set(inst.componentId, {
      componentId: inst.componentId,
      name: inst.name,
    });
  }
}

return {
  screenName: page.name,
  instanceCount: instances.length,
  uniqueComponents: [...uniqueComponents.values()],
};
```

This is the most reliable source because it shows exactly which components are actually used.

---

## Step 3: Inspect the Local Library

When no existing screens are available, query the library directly:

```typescript
const library = penpot.library.local;

return {
  components: library.components.map(c => ({
    id: c.id,
    name: c.name,
    path: c.path || null,
  })),
  colors: library.colors.map(c => ({
    id: c.id,
    name: c.name,
    color: c.color,
    opacity: c.opacity,
  })),
  typographies: library.typographies.map(t => ({
    id: t.id,
    name: t.name,
    fontFamily: t.fontFamily,
    fontSize: t.fontSize,
    fontWeight: t.fontWeight,
  })),
};
```

---

## Step 4: Check Shared Libraries

If the design system is published from a separate Penpot file:

```typescript
const allLibraries = penpot.library.all;
return allLibraries.map(lib => ({
  fileId: lib.fileId,
  name: lib.name,
  componentCount: lib.components.length,
  colorCount: lib.colors.length,
  typographyCount: lib.typographies.length,
  // Sample component names to understand what's available:
  sampleComponents: lib.components.slice(0, 10).map(c => c.name),
}));
```

---

## Step 5: Inspect Tokens

```typescript
const catalog = penpot.library.local.tokens;
const tokens = catalog ? Object.values(catalog) : [];

return {
  colorTokens:   tokens.filter(t => t.type === 'color').map(t => ({ name: t.name, value: t.value })),
  spacingTokens: tokens.filter(t => t.type === 'spacing').map(t => ({ name: t.name, value: t.value })),
  radiusTokens:  tokens.filter(t => t.type === 'border-radius').map(t => ({ name: t.name, value: t.value })),
};
```

---

## Component Search Strategy

Component names vary across design systems. Search broadly:

| You need | Try these names |
|----------|----------------|
| Primary button | `Button`, `Button/Primary`, `btn`, `Btn/Primary`, `ButtonPrimary` |
| Navigation bar | `NavBar`, `Nav`, `NavigationBar`, `Header`, `TopBar`, `AppBar` |
| Card | `Card`, `ContentCard`, `ProductCard`, `ListCard` |
| Input field | `Input`, `TextField`, `InputField`, `TextInput`, `FormField` |
| Badge | `Badge`, `Chip`, `Tag`, `Label`, `StatusBadge` |
| Avatar | `Avatar`, `UserAvatar`, `ProfileImage`, `AvatarCircle` |
| Modal | `Modal`, `Dialog`, `Overlay`, `Sheet`, `Drawer` |
| Tab | `Tab`, `TabItem`, `Tabs`, `NavigationPill`, `Pill`, `Segment` |
| Icon | `Icon`, `IconBase`, `SvgIcon`, `IconButton` |

```typescript
// Fuzzy search helper
function findComponents(library, ...terms) {
  return library.components.filter(c =>
    terms.some(term =>
      c.name.toLowerCase().includes(term.toLowerCase())
    )
  ).map(c => ({ id: c.id, name: c.name }));
}

const library = penpot.library.local;
return {
  buttons: findComponents(library, 'button', 'btn'),
  inputs:  findComponents(library, 'input', 'field', 'text'),
  cards:   findComponents(library, 'card'),
  nav:     findComponents(library, 'nav', 'header', 'topbar'),
};
```

---

## Mapping Code Components to Design System Components

For each code component in the screen, find its Penpot counterpart:

| Code component | Code props | Penpot component | Variant to use |
|---------------|-----------|-----------------|----------------|
| `<Button variant="primary" size="md">` | variant=primary, size=md | `Button` | Style=Primary, Size=Medium |
| `<Badge color="success">` | color=success | `Badge` | Style=Success |
| `<Avatar src="..." size="sm">` | size=sm | `Avatar` | Size=Small |
| `<Input placeholder="Search..." icon="search">` | icon=search | `Input` | Icon=Left |
| `<Card>` | (default) | `Card` | (default variant) |

**Read the source code default props carefully.** A `<Button>` with no `variant` prop may have `variant = "primary"` as the default in the component definition. Selecting the wrong variant produces a visually wrong result.

---

## Build the Screen Inventory

Before touching Penpot, document the complete build plan:

```
Screen: Homepage

WRAPPER: "Homepage" (1440 × auto)

SECTIONS (top to bottom):
  1. NavBar (y=0, h=64)
     - Component: NavBar
     - Left: Logo text + nav links
     - Right: Button/Ghost "Sign In" + Button/Primary "Get Started"

  2. Hero (y=64, h=560)
     - Custom frame, full-width, brand background
     - Heading text (Display/Large, white)
     - Subheading text (Body/LG, white 80%)
     - CTA: Button/Primary "Start free trial" + Button/Ghost "Watch demo"

  3. Features Grid (y=624, h=480)
     - 3 × FeatureCard instances side by side
     - Section title above (Heading/XL, centered)

  4. Pricing (y=1104, h=640)
     - 3 × PricingCard instances
     - Badge on "Pro" card: Badge/Popular

  5. Footer (y=1744, h=240)
     - Link groups, social icons, copyright
```

Present this inventory to the user before building. Confirm which components will be used as instances vs. built manually.

---

## Discovery Anti-Patterns

- ❌ Starting to build sections before inspecting the library for available components
- ❌ Assuming a component exists because it was in the last session (always query live)
- ❌ Building Button manually with hardcoded fills when a Button component exists in the library
- ❌ Using hardcoded hex colors when library colors with `fillColorRefId` are available
- ❌ Guessing component IDs from memory (always look up from live library query)
- ❌ Not checking shared libraries when the local library is empty
