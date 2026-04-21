# Layout Translation: Figma Auto Layout → Penpot Flex Layout

This is the most critical translation step. Incorrect layout translation produces designs that look right visually but break when content changes or is resized. Read this reference for every component and screen frame you migrate.

---

## Core Concept Mapping

Figma Auto Layout and Penpot Flex Layout share the same conceptual model (CSS flexbox) but use different property names.

### Direction

| Figma `layoutMode` | Penpot `layout.dir` |
|--------------------|---------------------|
| `HORIZONTAL` | `'row'` |
| `VERTICAL` | `'column'` |
| `NONE` (no auto layout) | No flex layout — use absolute positioning |

---

### Alignment

Figma uses `primaryAxis` (main axis) and `counterAxis` (cross axis) properties.

**Primary axis → `justifyContent`:**

| Figma `primaryAxisAlignItems` | Penpot `layout.justifyContent` |
|------------------------------|-------------------------------|
| `MIN` | `'start'` |
| `CENTER` | `'center'` |
| `MAX` | `'end'` |
| `SPACE_BETWEEN` | `'space-between'` |

**Counter axis → `alignItems`:**

| Figma `counterAxisAlignItems` | Penpot `layout.alignItems` |
|------------------------------|---------------------------|
| `MIN` | `'start'` |
| `CENTER` | `'center'` |
| `MAX` | `'end'` |
| `BASELINE` | `'start'` (approximate — Penpot has limited baseline support) |
| `STRETCH` (fill) | `'stretch'` |

---

### Sizing Modes

Figma uses sizing modes per axis. Penpot has equivalent `horizontalSizing` / `verticalSizing` on frames.

| Figma Sizing Mode | Penpot Property | Value |
|------------------|-----------------|-------|
| `FIXED` (explicit px) | Set explicit `width` / `height` | `frame.width = 120` |
| `HUG` (hug contents) | `frame.horizontalSizing = 'fit-content'` | For auto-sizing frames |
| `FILL` (fill container) | `frame.horizontalSizing = 'fill'` | Fills parent flex space |

> **API note**: verify `horizontalSizing` / `verticalSizing` property names with `penpot_api_info` before use — the exact names vary by Penpot version.

---

### Gap and Padding

| Figma Property | Penpot Property |
|---------------|-----------------|
| `itemSpacing` | `layout.gap` (number, px) |
| `counterAxisSpacing` | `layout.gap` when wrapping (Penpot uses single gap) |
| `paddingTop` | `layout.padding.top` |
| `paddingRight` | `layout.padding.right` |
| `paddingBottom` | `layout.padding.bottom` |
| `paddingLeft` | `layout.padding.left` |

When Figma has uniform padding:
```
paddingTop = paddingRight = paddingBottom = paddingLeft = 16
→ layout.padding = { top: 16, right: 16, bottom: 16, left: 16 }
```

---

### Wrapping

| Figma `layoutWrap` | Penpot `layout.flexWrap` |
|--------------------|--------------------------|
| `NO_WRAP` | `'no-wrap'` (default) |
| `WRAP` | `'wrap'` |

---

### Absolute Position (inside Auto Layout)

Figma supports "absolute position" for items inside an Auto Layout frame — the item opts out of flex flow and is positioned independently.

```
Figma: item.layoutPositioning = 'ABSOLUTE'
Penpot: shape.layoutItemAbsolutePosition = true (verify with penpot_api_info)
         then set explicit x/y relative to the parent frame
```

Use absolute positioning only when the Figma design explicitly uses it. Never use it as a shortcut for frames that are too complex to translate.

---

## Full Auto Layout Translation Example

### Input (from Figma `get_design_context`):
```json
{
  "layoutMode": "HORIZONTAL",
  "primaryAxisAlignItems": "CENTER",
  "counterAxisAlignItems": "CENTER",
  "itemSpacing": 8,
  "paddingTop": 12,
  "paddingRight": 20,
  "paddingBottom": 12,
  "paddingLeft": 20,
  "primaryAxisSizingMode": "AUTO",
  "counterAxisSizingMode": "FIXED",
  "absoluteBoundingBox": { "width": 160, "height": 44 },
  "layoutWrap": "NO_WRAP"
}
```

### Translation:
```typescript
const frame = page.createFrame();
frame.name = 'button-base';
// Height is FIXED → explicit height; Width is AUTO (hug) → don't set explicit width
frame.height = 44;

const layout = frame.addFlexLayout();
layout.dir = 'row';                    // HORIZONTAL
layout.alignItems = 'center';          // counterAxis CENTER
layout.justifyContent = 'center';      // primaryAxis CENTER
layout.gap = 8;                        // itemSpacing
layout.padding = { top: 12, right: 20, bottom: 12, left: 20 };

// For hug width on horizontal frame: don't set explicit width, or set sizing mode
// frame.horizontalSizing = 'fit-content'; // verify API availability
```

---

## Constraints Translation (for frames WITHOUT Auto Layout)

When a Figma frame does not use Auto Layout, children are positioned with constraints. Translate these to Penpot relative positioning:

| Figma Horizontal Constraint | Penpot Equivalent |
|---------------------------|-------------------|
| `LEFT` | Fixed `x` from left edge |
| `RIGHT` | Fixed distance from right: `frame.width - shape.width - margin` |
| `LEFT_RIGHT` | Horizontal fill: set width to fill parent |
| `CENTER` | Center: `x = (parent.width - shape.width) / 2` |
| `SCALE` | Proportional: maintain width/x as % of parent — use explicit values |

| Figma Vertical Constraint | Penpot Equivalent |
|--------------------------|-------------------|
| `TOP` | Fixed `y` from top edge |
| `BOTTOM` | Fixed distance from bottom |
| `TOP_BOTTOM` | Vertical fill: set height to fill parent |
| `CENTER` | Center: `y = (parent.height - shape.height) / 2` |
| `SCALE` | Proportional: maintain height/y as % of parent |

> Penpot constraint-based positioning (without flex) uses explicit `x`, `y`, `width`, `height` values. For most cases, translate constraints by computing the absolute pixel position rather than trying to recreate the constraint behavior programmatically.

---

## Common Layout Patterns

### Horizontal Bar (e.g., NavBar)
```typescript
// Figma: HORIZONTAL, MIN (left), CENTER (counter), 64px height, full-width fill
const nav = page.createFrame();
nav.name = 'nav-bar';
nav.width = 1440;
nav.height = 64;

const layout = nav.addFlexLayout();
layout.dir = 'row';
layout.alignItems = 'center';
layout.justifyContent = 'space-between';  // primaryAxisAlignItems: SPACE_BETWEEN
layout.padding = { top: 0, right: 32, bottom: 0, left: 32 };
```

### Centered Card
```typescript
// Figma: VERTICAL, CENTER (primary), CENTER (counter), hug height, fixed width
const card = page.createFrame();
card.name = 'card';
card.width = 360;
// height: HUG → don't set fixed height

const layout = card.addFlexLayout();
layout.dir = 'column';
layout.alignItems = 'center';      // counterAxis CENTER
layout.justifyContent = 'center';  // primaryAxis CENTER
layout.padding = { top: 24, right: 24, bottom: 24, left: 24 };
layout.gap = 16;
```

### Horizontal Pill/Tag (tight hug)
```typescript
// Figma: HORIZONTAL, CENTER (both axes), hug both dimensions, uniform padding 4/12
const badge = page.createFrame();
badge.name = 'badge';
// Both HUG → don't set explicit width/height
badge.borderRadius = 9999;

const layout = badge.addFlexLayout();
layout.dir = 'row';
layout.alignItems = 'center';
layout.justifyContent = 'center';
layout.padding = { top: 4, right: 12, bottom: 4, left: 12 };
layout.gap = 6;
```

### Grid Layout (manual — Penpot grid is not the same as Figma's)
```typescript
// Figma: "Grid" as a display concept is often just a flex row with wrapping
// Penpot equivalent: flex row with wrap
const grid = page.createFrame();
grid.name = 'feature-grid';
grid.width = 1440;

const layout = grid.addFlexLayout();
layout.dir = 'row';
layout.alignItems = 'start';
layout.justifyContent = 'start';
layout.flexWrap = 'wrap';
layout.gap = 24;
layout.padding = { top: 48, right: 80, bottom: 48, left: 80 };
```

---

## Layout Anti-Patterns

- ❌ Using `layout.dir = 'row'` for a vertical stack (always check `layoutMode`)
- ❌ Setting explicit `width` on a frame that should hug (`primaryAxisSizingMode: AUTO`)
- ❌ Translating all constraints as absolute positioning — breaks responsiveness
- ❌ Using `justifyContent: 'space-between'` when Figma uses `itemSpacing` with MIN primary axis — those are very different behaviors
- ❌ Forgetting to call `frame.addFlexLayout()` — a frame without this call has no flex behavior
- ❌ Positioning variant frames at (0,0) after creating them — they stack invisibly
- ❌ Applying `alignItems: 'baseline'` — verify Penpot support before using
- ❌ Translating `SCALE` constraints as fill — scale means proportional to parent size, not fill
