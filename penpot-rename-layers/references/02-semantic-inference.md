# Phase 1: Semantic Inference — Deep Dive

Detailed rules for inferring HTML semantic element names from Penpot shape properties.

---

## Decision Tree

```
Is it a text node?
  └─ Yes → classify by fontSize + fontWeight (see Typography Rules)
  └─ No → is it a frame/group?
      └─ Yes → check position, size, children, fills (see Container Rules)
      └─ No → is it a rect/ellipse?
          └─ Yes → check size, fills, strokes (see Primitive Shape Rules)
          └─ No → is it a path/vector?
              └─ Yes → likely icon or decoration (see Icon Rules)
```

---

## Typography Rules (Text Nodes)

First establish the **body baseline**: find the most common fontSize across all text nodes. This is the base (16px by default).

| fontSize relative to baseline | fontWeight | Inferred role |
|-------------------------------|-----------|---------------|
| ≥ 2.5× base (e.g. ≥ 40px) | any | `h1` |
| 1.75–2.5× base (28–39px) | ≥ 600 | `h1` |
| 1.5–2.5× base (24–39px) | ≥ 600 | `h2` |
| 1.25–1.75× base (20–27px) | ≥ 500 | `h3` |
| 1.0–1.25× base (16–19px) | ≥ 600 | `h4` or `h5` |
| baseline (±1px) | 400 | `p` (body text) |
| < baseline, short text (< 30 chars) | any | `label` or `span` |
| < baseline, short, UPPERCASE | any | `span` (overline) |
| very small (≤ 11px) | any | `small` or `caption` |

**Disambiguating label vs. span**:
- If the text is directly above or to the left of an input-like shape → `label`
- If the text is inside a button → keep as text, rename the parent frame to `button`
- If the text is a count/badge number → `span`

**Disambiguating h4/h5/h6**:
- Use DOM depth in the layer hierarchy: shallower = higher heading level
- If two headings have the same size/weight but different depths, the shallower one gets the higher number

---

## Container Rules (Frames / Groups)

### Position-Based (top-level frames only)

```
Top 0–120px of page, full-width (≥ 80% page width) → header
Top 0–120px, narrow (< 80% page width) → nav or header-inner
Bottom of page (y > 80% page height), full-width → footer
Middle of page, full-width, large height → section or main
Middle of page, card-sized (width 240–800px, height 200–600px) → article
Overlay-like (positioned absolutely over other content, centered) → dialog
```

### Children-Based (any frame)

```
Contains text nodes that look like nav links (short, same size, horizontal layout) → nav
Contains input-like shapes + labels + a button → form
Contains an img + heading + paragraph text → article or figure
Contains icon + label text (short) → button or a (link)
Contains only icon → button[aria-label] or a (icon link)
Contains repeated same-type children (> 2 identical structures) → ul (the container) / li (the children)
```

### Size + Fill Heuristics (interactive elements)

```
Width ≤ 200px AND height ≤ 56px AND solid fill AND text child → button
Width ≤ 200px AND height ≤ 56px AND stroke-only AND text child → input[type=text]
Width ≤ 24px AND height ≤ 24px AND solid fill → input[type=checkbox] or badge
Circle (borderRadius ≥ 999) AND width ≤ 24px AND solid fill → input[type=radio] or status dot
Width ≥ 200px AND height ≤ 44px AND stroke AND no solid fill → input[type=text]
Width 40–60px AND height 20–30px AND borderRadius ≥ 14px → toggle switch
```

---

## Primitive Shape Rules (Rects, Ellipses)

| Properties | Inferred name |
|-----------|--------------|
| rect, large, image fill | `img` |
| rect, full-width, height 1–2px, solid fill | `hr` (horizontal rule) |
| ellipse, small (≤ 16px), solid fill | `span` (status dot) or `i` (icon indicator) |
| rect, borderRadius ≥ 999, small | tag/pill → use `span` or keep as `badge` |

---

## Icon Rules (Paths / Vectors)

```
Small path/vector (≤ 32×32px) → svg or icon-{name}
  If inside a button → icon (keep parent as button)
  If standalone → svg[aria-hidden=true] or icon-{name}
```

---

## Contextual Name Enrichment

When multiple same-element instances exist on the same parent level, add a descriptor:
- If the element has a text child → use the text as descriptor: `button-get-started`, `h2-features`, `li-pricing`
- If no text → use index: `article-1`, `article-2`
- If role is clear from context → use semantic descriptor: `nav-primary`, `nav-footer`, `section-hero`, `section-features`

---

## Edge Cases

### Tabs / Pill navigation
- Container frame with 3+ children that look identical and have a selected/active state → `[role=tablist]`
- Individual tab items → `[role=tab]`

### Breadcrumbs
- Horizontal list of text links with separators → `nav[aria-label=breadcrumb]` > `ol` > `li`

### Accordion
- Repeating structure of header + content frame (collapsed/expanded) → `details` > `summary`

### Modal
- Frame positioned in the center of the viewport with a semi-transparent overlay behind it → `dialog`
- Overlay itself → `div-overlay` or `div-backdrop`

### Tooltip
- Small frame with text, no fill border, positioned near another element → `[role=tooltip]`
