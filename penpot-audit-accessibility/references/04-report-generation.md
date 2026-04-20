# Report Generation — Accessibility Audit

---

## Report Structure

The final report is delivered as Markdown with the following sections:

1. **Header**: file name, page name, date, target WCAG level
2. **Summary table**: count of Critical / Major / Minor / Pass by check category
3. **Findings**: one section per failing check, sorted by severity (Critical first)
4. **Passes**: brief list of what passed
5. **Recommendations**: prioritized action items

---

## Screenshot Strategy

Use `export_shape` to attach visual evidence for:

- **Contrast failures**: export the specific text element and its parent background frame
- **Touch target failures**: export the interactive element
- **Color-only issues**: export the status indicator or form element

Do NOT screenshot every pass — only findings that benefit from visual context.

```typescript
// Export a specific shape for the report
// Use the shape ID from the data collection phase
// Scale at 2× for retina clarity
```

---

## Severity Decision Guide

| Issue | Severity | Rationale |
|-------|----------|-----------|
| Contrast ratio < 2:1 on body text | Critical | Unreadable for most users with low vision |
| Contrast ratio 2:1–3:1 on body text | Major | Fails WCAG AA minimum |
| Contrast ratio 3:1–4.5:1 on normal text | Major | Fails AA; only passes for large text |
| Touch target < 24×24px on primary CTA | Critical | Blocks motor-impaired users |
| Touch target 24–44px on primary CTA | Major | Fails AAA; borderline AA |
| Touch target < 44px on secondary/icon action | Minor | AAA miss; AA compliant if spaced |
| Missing alt on informative image | Critical | Screen readers get no info |
| Missing alt on decorative image | Minor | Should be marked decorative |
| Font size < 10px | Critical | Effectively unreadable |
| Font size 10–12px on body text | Major | Legibility issue |
| Line height < 1.2 | Major | Fails under spacing overrides |
| Missing focus state on interactive component | Major | Keyboard users cannot navigate |
| Color-only status indicator | Major | WCAG 1.4.1 failure |
| Heading skip (h1 → h3) | Minor | Navigation / screen reader confusion |
| No h1 on page | Minor | Screen reader landmark confusion |

---

## Final Report Template

```markdown
# Accessibility Audit Report

**File**: {fileName}
**Page**: {pageName}
**Audit date**: {isoDate}
**Target level**: WCAG 2.1 AA
**Auditor**: Claude Code / penpot-audit-accessibility skill

---

## Summary

| Category | Critical | Major | Minor | Pass |
|----------|---------|-------|-------|------|
| Color Contrast (1.4.3) | N | N | N | N |
| Touch Targets (2.5.5/2.5.8) | N | N | N | N |
| Text Legibility (1.4.4/1.4.12) | N | N | N | N |
| Heading Hierarchy (1.3.1/2.4.6) | N | N | N | N |
| Focus Indicators (2.4.7/2.4.11) | N | N | N | N |
| Images & Alt Text (1.1.1) | N | N | N | N |
| Use of Color (1.4.1) | N | N | N | N |
| **Total** | **N** | **N** | **N** | **N** |

---

## Critical Findings

### [WCAG 1.4.3] Contrast failure — button-cta > label
**Ratio**: 2.8:1 (required: 4.5:1 for normal text, 3:1 for large text)
**Text color**: #FFFFFF | **Background**: #7CB9E8 (light blue)
**Fix**: Darken the button background to ≥ #2563EB for white text, or use dark text #111827

[screenshot]

---

## Major Findings

### [WCAG 2.5.5] Touch target too small — icon-close
**Size**: 20×20px (recommended: 44×44px)
**Fix**: Wrap the icon in a 44×44px transparent hit area frame

---

## Minor Findings

### [WCAG 1.4.12] Low line-height — p-body-copy
**Line height**: 1.2 (recommended: ≥ 1.5)
**Fix**: Set line-height to 1.5 in the design

---

## Passes

✅ **Heading hierarchy**: correct h1 → h2 → h3 sequence found
✅ **Primary button focus state**: focus variant found in component library
✅ **Hero section contrast**: 7.2:1 (AAA pass)
✅ **No text below 12px found**

---

## Priority Recommendations

1. **Fix contrast on `button-cta`** (Critical — blocks users with low vision)
2. **Increase touch target on `icon-close`** (Major — affects motor-impaired users)
3. **Add alt text to hero image** (Major — screen readers receive no information)
4. **Review line-height on body copy** (Minor — may break under user spacing overrides)
```
