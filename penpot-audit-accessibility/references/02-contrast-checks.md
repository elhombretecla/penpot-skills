# Contrast Checks — WCAG 1.4.3 / 1.4.6 / 1.4.11

All contrast calculations run in Claude's context (not in execute_code).

---

## Full Contrast Algorithm

```javascript
// W3C relative luminance — IEC 61966-2-1 (sRGB)
function hexToLinearRGB(hex) {
  const h = hex.replace('#', '');
  const toLinear = (c8bit) => {
    const c = c8bit / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return {
    r: toLinear(parseInt(h.slice(0, 2), 16)),
    g: toLinear(parseInt(h.slice(2, 4), 16)),
    b: toLinear(parseInt(h.slice(4, 6), 16)),
  };
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToLinearRGB(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

---

## Pass/Fail Thresholds

```javascript
function classifyContrast(ratio, fontSize, fontWeight) {
  // Large text = ≥ 18pt (24px) normal weight, or ≥ 14pt (18.67px) bold
  const isLarge = fontSize >= 24 || (fontSize >= 18.67 && fontWeight >= 700);

  return {
    aaPass: isLarge ? ratio >= 3.0 : ratio >= 4.5,
    aaaPass: isLarge ? ratio >= 4.5 : ratio >= 7.0,
    isLargeText: isLarge,
    ratio: Math.round(ratio * 100) / 100,
  };
}
```

---

## Handling Opacity

When a fill has `fillOpacity < 1`, blend it with the background to get the effective color:

```javascript
function blendWithBackground(fgHex, fgOpacity, bgHex) {
  const fg = hexToLinearRGB(fgHex);
  const bg = hexToLinearRGB(bgHex);
  const a = fgOpacity;
  const blended = {
    r: a * fg.r + (1 - a) * bg.r,
    g: a * fg.g + (1 - a) * bg.g,
    b: a * fg.b + (1 - a) * bg.b,
  };
  // Convert back to 0–255
  const to255 = (c) => Math.round(c * 255);
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(to255(blended.r))}${toHex(to255(blended.g))}${toHex(to255(blended.b))}`;
}
```

---

## When Background is Unknown

When a text node's parent has no solid fill (transparent or gradient), you cannot compute exact contrast:

- **Report as**: "⚠️ Background unknown — contrast cannot be verified automatically"
- **Recommendation**: "Ensure text is placed over a solid background or explicitly specify the background color."
- Do NOT mark as pass or fail — mark as **"Needs Manual Check"**.

---

## UI Component Contrast (WCAG 1.4.11)

For non-text elements (borders of inputs, focus rings, icons), the 3:1 ratio applies against adjacent colors:

```javascript
function checkUIContrast(componentHex, adjacentHex) {
  const ratio = contrastRatio(componentHex, adjacentHex);
  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: ratio >= 3.0,
    criterion: '1.4.11',
  };
}
```
