# Sizing and Spacing Checks

---

## Touch Target Sizes (WCAG 2.5.5 / 2.5.8)

### Thresholds

| Standard | Minimum size | Level |
|----------|-------------|-------|
| WCAG 2.5.5 | 44×44px | AAA |
| WCAG 2.5.8 (WCAG 2.2) | 24×24px (with spacing) | AA |
| iOS HIG | 44×44pt | Platform |
| Material Design | 48×48dp | Platform |

### Classification

```javascript
function classifyTouchTarget(width, height) {
  const minDim = Math.min(width, height);
  return {
    passes44: width >= 44 && height >= 44,
    passes24: width >= 24 && height >= 24,
    severity: width >= 44 && height >= 44
      ? 'pass'
      : width >= 24 && height >= 24
        ? 'minor'    // passes AA minimum, fails AAA
        : 'major',   // fails both — critical if primary action
    actualSize: `${width}×${height}px`,
    needed44: `+${Math.max(0, 44 - width)}×+${Math.max(0, 44 - height)}px to reach 44×44`,
  };
}
```

### Note on Icon-Only Buttons

An icon button can have a visual size of 20×20px but still pass WCAG 2.5.5 if:
- The invisible tap/click area (padding) extends to 44×44px
- In Penpot this shows as a frame larger than the visible icon

Check the actual frame size (which includes padding), NOT the icon size alone.

---

## Text Legibility (WCAG 1.4.4 / 1.4.12)

### Font Size Minimums

| Context | Minimum | Severity if below |
|---------|---------|-----------------|
| Body / paragraph text | 16px | Major |
| Labels, captions | 12px | Minor |
| Legal / footnote | 10px | Minor |
| Any text | < 10px | Critical |

### Text Spacing (WCAG 1.4.12)

These are the minimum values needed for users who override spacing via user stylesheets:

| Property | Minimum (WCAG 1.4.12) |
|----------|----------------------|
| Line height | ≥ 1.5 × font-size |
| Letter spacing | ≥ 0.12 em (0.12 × font-size in px) |
| Word spacing | ≥ 0.16 em |
| Paragraph spacing | ≥ 2 × font-size |

**Note for design audits**: WCAG 1.4.12 technically requires that content doesn't break when these overrides are applied — not that the design must pre-apply these values. However, designs with line-height < 1.2 should be flagged as likely to break under user overrides.

```javascript
function checkTextSpacing(fontSize, lineHeight, letterSpacing) {
  const lhRatio = lineHeight ? lineHeight : null;
  const lsEm = letterSpacing ? letterSpacing / fontSize : null;
  return {
    lineHeightOk: lhRatio === null ? 'unknown' : lhRatio >= 1.5,
    letterSpacingOk: lsEm === null ? 'unknown' : lsEm >= 0.12,
    lineHeightValue: lhRatio,
    letterSpacingEm: lsEm ? Math.round(lsEm * 1000) / 1000 : null,
  };
}
```

---

## Font Weight at Small Sizes

Thin/light font weights at small sizes are illegible for users with low vision:

| Font weight | Safe minimum size |
|------------|-----------------|
| < 300 (thin) | Not recommended for body text at any size |
| 300 (light) | ≥ 18px |
| 400 (regular) | ≥ 12px |
| 500+ | ≥ 10px |

Flag: weight < 400 at fontSize < 16px as a Minor issue.
