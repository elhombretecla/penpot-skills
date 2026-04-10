# Token Binding in Screens

When building screens, all colors, typography, and other visual properties should be bound to the design system — not hardcoded. This keeps the screen linked to the design system and updatable when tokens change.

---

## Why Token Binding Matters

A screen built with hardcoded values becomes a snapshot disconnected from the design system. A screen built with library color references updates automatically when the design system evolves.

| Hardcoded (bad) | Token-bound (good) |
|----------------|-------------------|
| `fillColor: '#3B82F6'` | `fillColor: c.color, fillColorRefId: c.id` |
| `fillColor: '#FFFFFF'` | Use `color/bg/primary` library color |
| `fontSize: 16` with no typography binding | Apply `Body/MD` library typography |
| `borderRadius: 8` raw | Use `radius.md` token value |

---

## Color Binding via fillColorRefId

The key mechanism for binding a fill to a library color is `fillColorRefId` and `fillColorRefFileId`.

```typescript
const library = penpot.library.local;

// Find the library color
const bgColor = library.colors.find(c => c.name === 'color/bg/primary');
if (!bgColor) {
  // Fallback: use raw hex (document as a gap)
  frame.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 1 }];
  return { warning: `color/bg/primary not found in library — used hardcoded fallback` };
}

// Apply token-bound fill
frame.fills = [{
  fillType: 'solid',
  fillColor: bgColor.color,
  fillOpacity: bgColor.opacity !== undefined ? bgColor.opacity : 1,
  fillColorRefId: bgColor.id,
  fillColorRefFileId: bgColor.fileId,
}];
```

### Helper function (reuse across section calls)

```typescript
function applyColorFill(shape, colorName, fallbackHex = '#CCCCCC') {
  const library = penpot.library.local;
  const c = library.colors.find(c => c.name === colorName);
  if (c) {
    shape.fills = [{
      fillType: 'solid',
      fillColor: c.color,
      fillOpacity: c.opacity !== undefined ? c.opacity : 1,
      fillColorRefId: c.id,
      fillColorRefFileId: c.fileId,
    }];
    return { bound: true, colorId: c.id };
  } else {
    shape.fills = [{ fillType: 'solid', fillColor: fallbackHex, fillOpacity: 1 }];
    return { bound: false, warning: `Color "${colorName}" not found, using fallback ${fallbackHex}` };
  }
}
```

---

## Stroke Binding

```typescript
function applyColorStroke(shape, colorName, width = 1) {
  const library = penpot.library.local;
  const c = library.colors.find(c => c.name === colorName);
  if (!c) return { bound: false, warning: `Stroke color "${colorName}" not found` };

  shape.strokes = [{
    strokeType: 'center',
    strokeWidth: width,
    strokeColor: c.color,
    strokeOpacity: c.opacity !== undefined ? c.opacity : 1,
    strokeColorRefId: c.id,
    strokeColorRefFileId: c.fileId,
  }];

  return { bound: true, colorId: c.id };
}
```

---

## Typography Binding

Apply a library typography to a text node:

```typescript
const library = penpot.library.local;

// Create text node
const text = page.createText('Welcome back');
text.name = 'heading';

// Apply library typography
const typo = library.typographies.find(t => t.name === 'Heading/XL');
if (typo && text.applyTypography) {
  text.applyTypography(typo);
} else {
  // Fallback: set font properties directly
  text.fontSize = 24;
  text.fontFamily = 'Inter';
  text.fontStyle = 'Bold';
}

// Apply text color (still use library color binding)
const textColor = library.colors.find(c => c.name === 'color/text/primary');
if (textColor) {
  text.fills = [{
    fillType: 'solid',
    fillColor: textColor.color,
    fillOpacity: textColor.opacity !== undefined ? textColor.opacity : 1,
    fillColorRefId: textColor.id,
    fillColorRefFileId: textColor.fileId,
  }];
}
```

> `text.applyTypography(typo)` sets fontFamily, fontSize, fontWeight, lineHeight, and letterSpacing in one call. Verify this method exists: `penpot_api_info({ type: 'Text' })`.

---

## Spacing from Token Values

When setting padding or gap, use the value from the token catalog rather than hardcoding:

```typescript
const catalog = penpot.library.local.tokens;
const tokens = catalog ? Object.values(catalog) : [];

function getSpacingValue(tokenName, fallback = 16) {
  const token = tokens.find(t => t.name === tokenName && t.type === 'spacing');
  return token ? Number(token.value) : fallback;
}

const md = getSpacingValue('spacing.md', 16);   // → 16
const lg = getSpacingValue('spacing.lg', 24);   // → 24

layout.padding = { top: md, right: lg, bottom: md, left: lg };
layout.gap = getSpacingValue('spacing.sm', 8);
```

---

## Radius from Token Values

```typescript
function getRadiusValue(tokenName, fallback = 8) {
  const tokens = catalog ? Object.values(catalog) : [];
  const token = tokens.find(t => t.name === tokenName && t.type === 'border-radius');
  return token ? Number(token.value) : fallback;
}

card.borderRadius = getRadiusValue('radius.lg', 12);
```

---

## Overlay / Scrim Patterns

For modal scrims, use an overlay color with opacity binding:

```typescript
const scrim = page.createFrame();
scrim.name = 'modal-scrim';
scrim.width = 1440; scrim.height = 900;

const overlayColor = library.colors.find(c => c.name === 'color/bg/overlay');
if (overlayColor) {
  scrim.fills = [{
    fillType: 'solid',
    fillColor: overlayColor.color,
    fillOpacity: overlayColor.opacity !== undefined ? overlayColor.opacity : 0.5,
    fillColorRefId: overlayColor.id,
    fillColorRefFileId: overlayColor.fileId,
  }];
} else {
  scrim.fills = [{ fillType: 'solid', fillColor: '#000000', fillOpacity: 0.5 }];
}
```

---

## Documenting Binding Gaps

When a required color or typography doesn't exist in the library, document it:

```typescript
const bindingGaps = [];

// When falling back to a hardcoded value:
bindingGaps.push({
  shape: 'hero-background',
  expected: 'color/bg/hero-gradient',
  fallback: '#1E3A8A',
  reason: 'Gradient color token not in library',
});

// Return gaps so the user knows what's not token-bound:
return {
  sectionId: section.id,
  bindingGaps,
};
```

If there are many binding gaps, recommend running `penpot-generate-library` to add the missing tokens/colors before completing the screen.

---

## Token Binding Anti-Patterns

- ❌ Hardcoding `fillColor: '#3B82F6'` without a `fillColorRefId` (breaks design system link)
- ❌ Using `fillOpacity: 0` to "hide" a fill instead of removing it from the array
- ❌ Setting `fontSize: 16` without a `fillColorRefId` on the text fill
- ❌ Applying a fill with `fillColorRefId` pointing to a color from a different file without `fillColorRefFileId`
- ❌ Forgetting to check `color.fileId` for library colors (required for shared library bindings)
- ❌ Using opacity to approximate a darker color instead of using the actual dark token
- ❌ Silently using fallback values without returning the binding gaps to the user
