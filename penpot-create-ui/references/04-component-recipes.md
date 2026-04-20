# Component Recipes — Quality Construction Patterns

Step-by-step construction guides for each core component, with specific quality notes that prevent generic output.

---

## Button Component

### Dimensions (PRECISION profile)
```
Small:   height 32px, h-padding 12px, font 13px/500
Medium:  height 36px, h-padding 16px, font 14px/500  ← default
Large:   height 40px, h-padding 20px, font 15px/500
```

### Required Variants (Style × Size × State)
```
Style:  Primary | Secondary | Ghost | Destructive
Size:   Small | Medium | Large
State:  Default | Hover | Active | Disabled | Loading
```
At minimum, build: Primary/Medium/Default, Primary/Medium/Disabled, Secondary/Medium/Default.

### Construction: Primary/Medium/Default
```typescript
const page = penpot.currentPage;
const library = penpot.library.local;

// 1. Create base frame
const btn = page.createFrame();
btn.name = 'Button'; // will become component
btn.width = 100; // auto-width via flex
btn.height = 36;
btn.borderRadius = 6; // radius.md

// 2. Apply brand fill
const brandColor = library.colors.find(c => c.name === 'color/interactive/primary');
if (brandColor) {
  btn.fills = [{
    fillType: 'solid',
    fillColor: brandColor.color,
    fillOpacity: 1,
    fillColorRefId: brandColor.id,
    fillColorRefFileId: brandColor.fileId,
  }];
}

// 3. Flex layout
const layout = btn.addFlexLayout();
layout.dir = 'row';
layout.alignItems = 'center';
layout.justifyContent = 'center';
layout.padding = { top: 0, bottom: 0, left: 16, right: 16 };
layout.gap = 6;

// 4. Label text
const label = page.createText('Button');
label.name = 'label';
label.fontFamily = 'Inter';
label.fontSize = 14;
label.fontWeight = 500;
const textColor = library.colors.find(c => c.name === 'color/interactive/primary-text');
if (textColor) {
  label.fills = [{ fillType: 'solid', fillColor: textColor.color, fillOpacity: 1,
    fillColorRefId: textColor.id, fillColorRefFileId: textColor.fileId }];
}
btn.appendChild(label);

// 5. Create component
const component = page.createComponent(btn);
return { componentId: component.id, mainId: btn.id };
```

### Quality Notes
- Font weight MUST be 500 (medium), never 400 (too light) or 700 (too aggressive)
- Label text should be sentence case ("Get started"), never ALL CAPS unless it's an overline
- Vertical padding of 0 with explicit height works better than padding-based height in Penpot
- The hover state darkens the fill by ~one step in the color scale (indigo-500 → indigo-600)
- Disabled state: same shape, fills at 40% opacity, cursor-not-allowed (document in description)

---

## Input Component

### Dimensions
```
Default: height 36px, h-padding 12px, font 14px
With label: label 12px semibold above, 6px margin-bottom
With helper: 12px regular below, 4px margin-top
```

### Construction: Input/Default
```typescript
const page = penpot.currentPage;
const library = penpot.library.local;

// Container (label + field + helper as column flex)
const container = page.createFrame();
container.name = 'Input';
container.width = 320;
const containerLayout = container.addFlexLayout();
containerLayout.dir = 'column';
containerLayout.alignItems = 'start';
containerLayout.gap = 6;

// Label
const labelText = page.createText('Label');
labelText.name = 'label';
labelText.fontFamily = 'Inter';
labelText.fontSize = 13;
labelText.fontWeight = 500;
const labelColor = library.colors.find(c => c.name === 'color/text/primary');
if (labelColor) {
  labelText.fills = [{ fillType: 'solid', fillColor: labelColor.color,
    fillOpacity: 1, fillColorRefId: labelColor.id, fillColorRefFileId: labelColor.fileId }];
}
container.appendChild(labelText);

// Input field frame
const field = page.createFrame();
field.name = 'input-field';
field.width = 320;
field.height = 36;
field.borderRadius = 6; // radius.md
const bgColor = library.colors.find(c => c.name === 'color/bg/primary');
if (bgColor) {
  field.fills = [{ fillType: 'solid', fillColor: bgColor.color, fillOpacity: 1,
    fillColorRefId: bgColor.id, fillColorRefFileId: bgColor.fileId }];
}
const borderColor = library.colors.find(c => c.name === 'color/border/default');
if (borderColor) {
  field.strokes = [{ strokeType: 'inner', strokeColor: borderColor.color,
    strokeOpacity: 1, strokeWidth: 1 }];
}
const fieldLayout = field.addFlexLayout();
fieldLayout.dir = 'row';
fieldLayout.alignItems = 'center';
fieldLayout.padding = { top: 0, bottom: 0, left: 12, right: 12 };

// Placeholder text
const placeholder = page.createText('Enter value...');
placeholder.name = 'placeholder';
placeholder.fontFamily = 'Inter';
placeholder.fontSize = 14;
placeholder.fontWeight = 400;
const placeholderColor = library.colors.find(c => c.name === 'color/text/tertiary');
if (placeholderColor) {
  placeholder.fills = [{ fillType: 'solid', fillColor: placeholderColor.color,
    fillOpacity: 1, fillColorRefId: placeholderColor.id, fillColorRefFileId: placeholderColor.fileId }];
}
field.appendChild(placeholder);
container.appendChild(field);

// Helper text (optional)
const helper = page.createText('Helper text');
helper.name = 'helper';
helper.fontFamily = 'Inter';
helper.fontSize = 12;
helper.fontWeight = 400;
const helperColor = library.colors.find(c => c.name === 'color/text/secondary');
if (helperColor) {
  helper.fills = [{ fillType: 'solid', fillColor: helperColor.color, fillOpacity: 1,
    fillColorRefId: helperColor.id, fillColorRefFileId: helperColor.fileId }];
}
container.appendChild(helper);

const component = page.createComponent(container);
return { componentId: component.id };
```

---

## Card Component

### Quality Notes
- Use border OR shadow, never both. PRECISION profile uses border. WARM and BOLD profiles use shadow.
- Card padding: 20px for compact, 24px for default, 32px for feature cards
- Card border radius: always ≥ radius.lg (8px) — never 4px (too sharp for containers)
- Card header separator: use 1px border or 24px gap (pick one, be consistent)
- Empty cards need a placeholder area (dashed border, 120px height) for image areas

### Card Variants to Build
```
Card/Default          — basic container, no image
Card/WithImage        — image area at top (40% of card height, clipped)
Card/Horizontal       — image on left (100px wide), content on right
Card/Featured         — larger, accent border-left (3px), highlighted background
Card/Metric           — just a number + label + change indicator
```

---

## Navigation Bar

### Topbar (Desktop)
```
Height: 56px (compact) or 64px (spacious)
Background: white (PRECISION) / near-black (DARK) / stone-50 (WARM)
Border-bottom: 1px color.border.default
Horizontal padding: 24px (dashboard) / 120px (marketing)
Content: logo left / nav items center or left / actions right

Logo: 24–32px height, auto width, vertically centered
Nav items: 14px/medium, 8px gap, color.text.secondary at rest, color.text.primary active
Actions: avatar (32px circle) + notification icon + CTA button
```

### Sidebar (Dashboard)
```
Width: 240px (standard) / 220px (compact) / 280px (spacious)
Background: color.bg.secondary (slightly off-white for PRECISION)
Border-right: 1px color.border.default
Padding: 16px horizontal, 24px top

Section labels: 11px / uppercase / tracking 0.08em / color.text.tertiary
Nav items: 14px / medium / 36–40px height / 8px border-radius
  • Default: transparent fill, color.text.secondary
  • Hover: color.bg.tertiary fill, color.text.primary
  • Active: color.bg.brand light tint fill, color.text.brand
  • Icon: 16px, same color as label, 8px right margin
```

---

## Stat / Metric Card

This component appears in dashboards in groups of 3–4. Quality notes:

```
Structure:
  ┌──────────────────────────────┐
  │ icon (optional, 20px)        │
  │ Label (12px, secondary text) │
  │ Value (28–32px, bold)        │
  │ ↑ 12.4%  vs last month       │  ← change indicator: small, colored
  └──────────────────────────────┘

Width: flex, equal columns in a row
Height: 100–120px
Padding: 20–24px
Border: 1px color.border.default (PRECISION)

The value (MRR, users, etc.) should be the largest text on the card.
Change indicator: 12px, emerald for positive, red for negative, amber for warning.
```

---

## Table Row (Data Table)

```
Row height: 48px (compact: 40px, comfortable: 56px)
Cell padding: 12px horizontal
Header row: 13px/semibold, color.text.secondary, border-bottom 1px
Data row: 14px/regular, color.text.primary
Alternating rows: white + slate.50 (or no stripes, just hover state)
Hover state: slate.50 background
Selected state: indigo.50 background, indigo.500 left border 2px

Columns: left-align text, right-align numbers, center for status badges
Sort indicator: small chevron 12px, right of column header label
```

---

## Badge / Tag

```
Badge (status):
  Height: 20–22px
  H-padding: 6–8px
  Font: 11–12px, weight 500
  Border-radius: radius.full (pill)
  Variants: Success (green-50 bg + green-700 text) / Warning / Error / Default / Brand

Tag (label/filter):
  Height: 24–28px
  H-padding: 8–10px
  Font: 12–13px, weight 500
  Border-radius: radius.md (6–8px) — not pill, slightly rounded
  Has: optional × close icon on the right
  Default: slate.100 bg + slate.700 text (neutral, understated)
```
