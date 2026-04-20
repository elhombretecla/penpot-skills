---
name: penpot-audit-accessibility
description: "Audit a Penpot design for accessibility issues following WCAG 2.1/2.2 standards and output a structured report. Use when the user wants to check a design for accessibility problems, validate WCAG compliance (AA or AAA), find color contrast issues, check touch target sizes, review heading hierarchy, or get a handoff-ready accessibility checklist. Triggers: 'check accessibility', 'accessibility audit', 'WCAG check', 'contrast audit', 'a11y review', 'check color contrast', 'accessibility report'."
disable-model-invocation: false
---

# Accessibility Audit — Penpot MCP Skill

Traverse a Penpot design and produce a structured WCAG 2.1/2.2 accessibility report. Checks cover contrast ratios, touch target sizing, text legibility, heading hierarchy, focus indicators, spacing, and use-of-color-only patterns. Each issue is classified by severity and WCAG criterion.

**How it works**: All data collection runs through `execute_code`. Analysis (contrast math, ratio calculations) runs locally in Claude's context after collecting the raw values. Use `high_level_overview` for initial scope. Use `export_shape` to attach screenshots to critical findings.

---

## 1. Audit Scope

Confirm scope with the user before starting:

- **Current page** (default)
- **Selected frame** (user specifies a component or screen)
- **All pages** (full-file audit — slow, confirm first)

---

## 2. Mandatory Workflow

```
Phase 0: SETUP (read-only)
  0a. Call high_level_overview to understand file structure
  0b. Agree on audit scope and target WCAG level (AA default, AAA optional)
  0c. Traverse all shapes via execute_code — collect visual properties needed for each check
  ✋ Show scope summary: N shapes, N text nodes, N interactive elements

Phase 1: DATA COLLECTION (read-only execute_code calls)
  1a. Collect all text nodes with font size, weight, fill color, and background context
  1b. Collect all interactive elements (buttons, inputs, links) with their bounding boxes
  1c. Collect heading structure (inferred from font size / layer name)
  1d. Collect images and check for alt-text annotations (plugin data or layer annotations)
  1e. Collect focus state variants (check for hover/focus variants in component instances)

Phase 2: ANALYSIS (runs in Claude context — no execute_code needed)
  2a. Run contrast ratio calculations for each text/background pair
  2b. Check touch target sizes against WCAG 2.5.5 (44×44px minimum)
  2c. Check font sizes against minimum legibility thresholds
  2d. Evaluate heading hierarchy
  2e. Check text spacing (line-height, letter-spacing)
  2f. Flag color-only communication patterns
  2g. Check for missing alt-text / image descriptions
  2h. Check for missing focus state indicators

Phase 3: REPORT GENERATION
  3a. Compile findings into structured report (Critical / Major / Minor / Pass)
  3b. Attach export_shape screenshots for critical contrast failures and sizing issues
  3c. Present full report to user with WCAG references
  ✋ USER CHECKPOINT: present report, offer to fix issues or export as annotation frame
```

---

## 3. Accessibility Checks

### Check 1 — Color Contrast (WCAG 1.4.3 / 1.4.6)

**Criteria**:
- **AA Normal text** (< 18pt / < 24px, not bold; or < 14pt / < 18.67px bold): ratio ≥ **4.5:1**
- **AA Large text** (≥ 18pt / ≥ 24px normal; or ≥ 14pt / ≥ 18.67px bold): ratio ≥ **3:1**
- **AAA Normal text**: ratio ≥ **7:1**
- **AAA Large text**: ratio ≥ **4.5:1**
- **UI components and graphical objects** (WCAG 1.4.11): ratio ≥ **3:1** against adjacent colors

**How to calculate**:

Relative luminance formula (W3C):
```
For each channel (R, G, B as 0–1):
  if channel ≤ 0.04045 → channel / 12.92
  else → ((channel + 0.055) / 1.055) ^ 2.4

L = 0.2126*R + 0.7152*G + 0.0722*B

contrast ratio = (L1 + 0.05) / (L2 + 0.05)   (where L1 is lighter)
```

**Data collection**:
```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();
const textPairs = [];

for (const shape of shapes) {
  if (shape.type !== 'text') continue;

  // Get text fill color
  const textFill = shape.fills && shape.fills[0];
  if (!textFill || textFill.fillType !== 'solid') continue;

  // Find the background: check parent fills
  const parent = shapes.find(s => s.id === shape.parentId);
  const bgFill = parent && parent.fills && parent.fills.find(f => f.fillType === 'solid');

  textPairs.push({
    shapeId: shape.id,
    shapeName: shape.name,
    textColor: textFill.fillColor,
    textOpacity: textFill.fillOpacity ?? 1,
    bgColor: bgFill ? bgFill.fillColor : null,
    bgOpacity: bgFill ? (bgFill.fillOpacity ?? 1) : null,
    fontSize: shape.fontSize,
    fontWeight: shape.fontWeight,
    characters: shape.characters ? shape.characters.substring(0, 60) : '',
  });
}

return { textPairs, total: textPairs.length };
```

---

### Check 2 — Touch Target Size (WCAG 2.5.5 / 2.5.8)

**Criteria**:
- **WCAG 2.5.5 (AAA)**: ≥ 44×44px for all interactive targets
- **WCAG 2.5.8 (AA, WCAG 2.2)**: ≥ 24×24px minimum, or adequate spacing between targets
- **Platform guidelines**: iOS HIG 44×44pt, Material Design 48×48dp

**What to check**: buttons, links, checkboxes, radio buttons, toggles, icon-only buttons, pagination controls.

**Data collection**:
```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

// Detect interactive elements by name pattern and shape properties
const interactive = shapes.filter(s => {
  const name = (s.name || '').toLowerCase();
  const isNamed = /button|btn|link|checkbox|radio|toggle|tab|chip|tag|icon-btn/.test(name);
  const isSmall = s.width <= 200 && s.height <= 80;
  const hasFill = s.fills && s.fills.length > 0;
  return (isNamed || (isSmall && hasFill)) && s.type === 'frame';
});

return interactive.map(s => ({
  id: s.id,
  name: s.name,
  width: s.width,
  height: s.height,
  passes44x44: s.width >= 44 && s.height >= 44,
  passes24x24: s.width >= 24 && s.height >= 24,
}));
```

---

### Check 3 — Text Legibility (WCAG 1.4.4 / 1.4.12)

**Criteria**:
- **Minimum font size**: body text ≥ 16px, labels ≥ 12px, no text below 10px
- **Line height** (WCAG 1.4.12): ≥ 1.5× font size for body text
- **Letter spacing** (WCAG 1.4.12): ≥ 0.12em
- **Paragraph spacing** (WCAG 1.4.12): ≥ 2× font size
- **Font weight**: avoid weight < 300 (light/thin) at sizes below 16px

**Data collection**:
```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();
const textNodes = shapes
  .filter(s => s.type === 'text')
  .map(s => ({
    id: s.id,
    name: s.name,
    fontSize: s.fontSize,
    fontWeight: s.fontWeight,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    characters: s.characters ? s.characters.substring(0, 60) : '',
  }));
return { textNodes, count: textNodes.length };
```

---

### Check 4 — Heading Hierarchy (WCAG 1.3.1 / 2.4.6)

**Criteria**:
- There must be exactly one `h1` per page/screen
- Headings must not skip levels (h1 → h2 → h3, never h1 → h3)
- Headings must be visually distinguishable from body text

**How to infer headings** (if layers are not semantically named):
- Infer from font size + weight scale (see `penpot-rename-layers` inference rules)
- If layers ARE semantically named (via `penpot-rename-layers`), read names directly

**Data collection**:
```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

const headings = shapes.filter(s => s.type === 'text' && (
  /^h[1-6]/i.test(s.name) ||
  (s.fontSize >= 24 && s.fontWeight >= 600)
));

// Sort by vertical position to detect visual order
headings.sort((a, b) => (a.y || 0) - (b.y || 0));

return headings.map(s => ({
  id: s.id,
  name: s.name,
  fontSize: s.fontSize,
  fontWeight: s.fontWeight,
  y: s.y,
  characters: s.characters ? s.characters.substring(0, 80) : '',
}));
```

---

### Check 5 — Focus State Indicators (WCAG 2.4.7 / 2.4.11)

**Criteria**:
- **WCAG 2.4.7 (AA)**: All keyboard-operable UI components have a visible focus indicator
- **WCAG 2.4.11 (AA, WCAG 2.2)**: Focus indicator has sufficient area and contrast (3:1 ratio)

**How to check in Penpot**: Look for component instances that have a `:focus` or `focus` variant defined in the master component.

```typescript
const library = penpot.library.local;
const components = library.components;

const interactiveComponents = components.filter(c =>
  /button|input|link|checkbox|radio|select|toggle/i.test(c.name)
);

const hasFocusVariant = interactiveComponents.map(c => ({
  id: c.id,
  name: c.name,
  // Check if a focus variant exists by name pattern
  focusVariantExists: components.some(other =>
    other.name.toLowerCase().includes(c.name.toLowerCase().split('/')[0]) &&
    /focus|focused/.test(other.name.toLowerCase())
  ),
}));

return hasFocusVariant;
```

---

### Check 6 — Images and Alt Text (WCAG 1.1.1)

**Criteria**:
- All informative images must have a text alternative
- Decorative images should be marked as decorative

**How to check in Penpot**: Look for plugin data annotations (`alt`, `aria-label`) or annotation layer near the image.

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

const images = shapes.filter(s =>
  (s.fills && s.fills.some(f => f.fillType === 'image')) ||
  s.type === 'image' ||
  /^img/i.test(s.name)
);

return images.map(s => ({
  id: s.id,
  name: s.name,
  hasAltPluginData: !!s.getPluginData?.('alt'),
  hasAriaLabel: !!s.getPluginData?.('aria-label'),
  isMarkedDecorative: s.getPluginData?.('decorative') === 'true',
  // If none of the above, flag as missing alt
}));
```

---

### Check 7 — Use of Color Only (WCAG 1.4.1)

**Criteria**: Information must not be conveyed by color alone. There must be a secondary indicator (icon, text, pattern, shape).

**Look for**:
- Form error states that only change fill color (no error icon or text)
- Status indicators (badges, dots) that rely purely on fill color
- Chart elements with no labels or patterns
- Required field markers that only use a red asterisk with no text alternative

**Data collection**:
```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

// Find shapes that look like status indicators (small circles/dots with solid fills)
const statusIndicators = shapes.filter(s =>
  s.width <= 16 && s.height <= 16 &&
  s.fills && s.fills.some(f => f.fillType === 'solid') &&
  (s.type === 'ellipse' || s.type === 'rect')
);

// Find shapes with "error", "success", "warning" in name
const feedbackShapes = shapes.filter(s =>
  /error|success|warning|danger|alert|status/i.test(s.name || '')
);

return {
  potentialColorOnlyIndicators: statusIndicators.map(s => ({
    id: s.id,
    name: s.name,
    fill: s.fills?.[0]?.fillColor,
    size: { w: s.width, h: s.height },
  })),
  feedbackShapes: feedbackShapes.map(s => ({
    id: s.id,
    name: s.name,
    type: s.type,
    hasIcon: (s.children || []).some(c => /icon|svg|vector/i.test(c.name || c.type)),
    hasText: (s.children || []).some(c => c.type === 'text'),
  })),
};
```

---

### Check 8 — Interactive Element Spacing (WCAG 2.5.8)

**Criteria**: When touch targets are smaller than 24×24px, they must have sufficient spacing between them so the total activation area meets the 24×24 minimum.

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

const small = shapes.filter(s =>
  s.type === 'frame' &&
  (s.width < 44 || s.height < 44) &&
  /button|btn|icon|link/i.test(s.name || '')
);

// Sort by position to check spacing between adjacent targets
const sorted = small.sort((a, b) => (a.x || 0) - (b.x || 0));
const spacingIssues = [];

for (let i = 0; i < sorted.length - 1; i++) {
  const a = sorted[i];
  const b = sorted[i + 1];
  const gap = (b.x || 0) - ((a.x || 0) + (a.width || 0));
  if (gap < 8) { // less than 8px gap between small targets
    spacingIssues.push({ a: a.name, b: b.name, gap });
  }
}

return { smallTargets: small.length, spacingIssues };
```

---

## 4. Report Format

Structure the final report as follows:

```markdown
# Accessibility Audit Report
**File**: [file name]
**Page**: [page name]
**Date**: [ISO date]
**Target Level**: WCAG 2.1 AA

---

## Summary
| Severity | Count |
|----------|-------|
| ❌ Critical | N |
| ⚠️ Major   | N |
| 💡 Minor   | N |
| ✅ Pass    | N |

---

## Findings

### ❌ Critical — [WCAG 1.4.3] Color Contrast
**Element**: button-primary > label
**Contrast ratio**: 2.8:1 (required: 4.5:1)
**Text color**: #FFFFFF  **Background**: #7CB9E8
**Fix**: Darken background to ≥ #2563EB or change text to #000000

[screenshot attached via export_shape]

---

### ⚠️ Major — [WCAG 2.5.5] Touch Target Size
**Element**: icon-close
**Size**: 20×20px (minimum: 44×44px)
**Fix**: Increase tap area to 44×44px (can use invisible padding/hit area)

---

### 💡 Minor — [WCAG 1.4.12] Text Spacing
**Element**: p-body-copy
**Line height**: 1.2 (minimum recommended: 1.5)
**Fix**: Set line-height to 1.5 or higher

---

## Passes
- ✅ Heading hierarchy: correct (h1 → h2 → h3 sequence)
- ✅ No text below 12px found
- ✅ Primary buttons have focus state variant
```

---

## 5. Severity Classification

| Severity | Definition |
|----------|-----------|
| **Critical** | Blocks or severely impairs access for users with disabilities. WCAG Level A or AA failures with direct functional impact. Must fix before launch. |
| **Major** | Significant barrier for users with disabilities. WCAG AA failures that affect usability. Fix before launch. |
| **Minor** | Reduces quality of experience. WCAG AA borderline, AAA failures, or best-practice issues. Fix before handoff. |
| **Pass** | Meets or exceeds WCAG AA. Document as passing. |

---

## 6. Contrast Ratio Calculation (Local)

Run this in Claude's context (not in Penpot) after collecting hex values:

```javascript
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255,
  };
}

function relativeLuminance({ r, g, b }) {
  const toLinear = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Example:
// contrastRatio('#FFFFFF', '#3B82F6') → ~3.0:1 (fails AA normal text)
// contrastRatio('#FFFFFF', '#1D4ED8') → ~5.0:1 (passes AA normal text)
```

---

## 7. WCAG Criteria Reference

| WCAG | Level | Check | Threshold |
|------|-------|-------|-----------|
| 1.1.1 | A | Non-text content / alt text | All informative images need text alternative |
| 1.3.1 | A | Info and relationships / heading structure | Logical heading order, no skipped levels |
| 1.4.1 | A | Use of color | Color not the sole means of conveying information |
| 1.4.3 | AA | Contrast (minimum) | 4.5:1 normal text, 3:1 large text |
| 1.4.4 | AA | Resize text | Text can be resized to 200%, not below effective 10px |
| 1.4.6 | AAA | Contrast (enhanced) | 7:1 normal text, 4.5:1 large text |
| 1.4.11 | AA | Non-text contrast | UI components ≥ 3:1 against adjacent colors |
| 1.4.12 | AA | Text spacing | Line-height ≥ 1.5×, letter-spacing ≥ 0.12em |
| 2.4.6 | AA | Headings and labels | Headings describe topic or purpose |
| 2.4.7 | AA | Focus visible | Any keyboard-operable UI has visible focus |
| 2.4.11 | AA | Focus appearance (WCAG 2.2) | Focus indicator area and contrast sufficient |
| 2.5.5 | AAA | Target size | ≥ 44×44px for interactive targets |
| 2.5.8 | AA | Target size minimum (WCAG 2.2) | ≥ 24×24px or adequate spacing |

---

## 8. Critical Rules

1. **Never mutate the design during an audit** — this skill is read-only. If the user wants fixes, offer to apply them separately (or suggest using `penpot-infer-tokens` / `penpot-rename-layers`).
2. **Always screenshot critical findings** via `export_shape` — contrast issues are hard to understand without visuals.
3. **Compute contrast ratios locally** (in Claude context) — do not send hex math to `execute_code`.
4. **Scope before traversing** — full-file audits on large files can return thousands of shapes. Confirm scope first.
5. **Infer interactive elements conservatively** — only flag touch target issues on shapes that are clearly interactive (buttons, inputs, links). Do not flag decorative shapes.
6. **Never parallelize `execute_code` calls** — always sequential.

---

## 9. Anti-Patterns

- ❌ Flagging decorative shapes for missing alt text
- ❌ Reporting pass/fail without quoting the specific WCAG criterion
- ❌ Computing contrast ratios inside `execute_code` (do it locally)
- ❌ Traversing pages not in scope
- ❌ Mutating shapes during audit
- ❌ Reporting every minor issue as Critical (classify severity correctly)
- ❌ Not attaching screenshots for contrast issues (without visuals, findings are hard to act on)

---

## 10. Supporting Files

### References

| File | Read during |
|------|------------|
| `references/01-inspection-phase.md` | Phase 0/1 — data collection scripts, interactive element detection |
| `references/02-contrast-checks.md` | Phase 2a — full contrast algorithm, alpha compositing, gradient backgrounds |
| `references/03-sizing-checks.md` | Phase 2b — touch targets, spacing rules, platform guidelines |
| `references/04-report-generation.md` | Phase 3 — report format, screenshot strategy, annotation frames |

### Scripts

| Script | Use for |
|--------|---------|
| `scripts/collectAccessibilityData.js` | Phase 1 — traverse all shapes and collect all data needed for all checks in one call |
| `scripts/checkColorContrast.js` | Phase 2a — local JS contrast ratio calculator (no execute_code) |
| `scripts/checkTouchTargets.js` | Phase 2b — analyze interactive elements and spacing |
| `scripts/generateReport.js` | Phase 3 — compile findings into structured Markdown report |
