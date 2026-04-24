# Layout and Composition

The difference between a layout that looks designed and one that looks generated is almost always explainable by a small set of composition decisions. This reference covers those decisions.

---

## Section Anatomy

Every screen section has three zones:

```
┌─────────────────────────────────────────────────────────┐
│                    SECTION PADDING (top)                 │
│  ┌───────────────────────────────────────────────────┐   │
│  │ EYEBROW (optional, 11px uppercase, accent color)  │   │
│  │ HEADING (24–48px depending on context)            │   │
│  │ SUBHEADING (optional, 15-17px secondary text)     │   │
│  └───────────────────────────────────────────────────┘   │
│                      32-48px gap                         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                    CONTENT ZONE                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                      32-48px gap (optional)               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              FOOTER / CTA (optional)                │  │
│  └─────────────────────────────────────────────────────┘  │
│                    SECTION PADDING (bottom)               │
└─────────────────────────────────────────────────────────┘
```

The heading area and content zone are always separated by the same spacing value within a design. Pick 32px or 40px and use it consistently throughout the file.

---

## Layout Patterns by Screen Type

### SaaS Dashboard

```
Structure:
  ┌──── Topbar (56–64px) ────────────────────────────────┐
  │ Logo   Nav items   Search   Notifications   Avatar    │
  └──────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────┐
  │ Sidebar (220–240px) │     Main Content Area          │
  │                     │                               │
  │  Section nav items  │  ┌─ Page Header (h1 + actions) ─┐│
  │  with icons         │  │ Title               [CTA] │ │
  │                     │  └────────────────────────────┘│
  │                     │  ┌─ Stats row (4 cards) ──────┐ │
  │                     │  │ Metric  Metric  Metric  M. │ │
  │                     │  └────────────────────────────┘ │
  │                     │  ┌─ Main content ─────────────┐ │
  │                     │  │ Table / Chart / Feed       │ │
  │                     │  └────────────────────────────┘ │
  └─────────────────────┴───────────────────────────────┘

Sidebar: 240px wide, left
Main content: fills remaining width, min 800px
Content padding (main area): 24–32px
Sidebar padding: 16px horizontal
```

**Stats row composition**: 4 metric cards in a horizontal row, equal width.
Each card: metric label (12px), value (24–28px bold), change indicator (12–13px ± with color).

### Landing Page

```
Sections (in order):
1. Navbar — 64px, logo left, nav center/right, CTA right
2. Hero — 160–200px padding, display headline, subtext, dual CTA buttons
3. Logos/Social proof strip — 60–80px, grayscale client logos, 80px gap
4. Features — 120px padding, title + 3/6 feature cards
5. How it works — 100px padding, numbered steps or visual
6. Testimonials/Quotes — 80px padding, dark or tinted background
7. Pricing — 100px padding, 3-column cards
8. Final CTA — 100px padding, dark background, big headline + single button
9. Footer — 60–80px, 4-column, logo + links + legal

Desktop column: 12-col grid, 120px page margin
Content max-width: 1200px (centered)
```

**Hero composition rules:**
- Headline: 64–80px, weight 700, tracking -0.04em, 3-4 lines max
- Subheading: 18–20px, weight 400, 50–60 character line length
- Two buttons: primary (filled) + secondary (ghost or outline), 8px gap between them
- Below buttons: social proof snippet ("10,000+ teams use X") in 13px secondary text
- Optional: product screenshot or illustration on the right (60% of width) for split layout

### Settings / Admin Page

```
Structure:
  ┌─────────────────────────────────────────────────────┐
  │ Page header: "Settings"  or  breadcrumb             │
  └─────────────────────────────────────────────────────┘
  ┌────────────────────┬────────────────────────────────┐
  │  Settings nav      │  Setting group title            │
  │  (sidebar 200px)   │  Short description              │
  │                    │  ─────────────────────────────  │
  │  • Profile         │  Form fields                   │
  │  • Security        │                                 │
  │  • Billing         │  ─────────────────────────────  │
  │  • Notifications   │  [Cancel]  [Save Changes]       │
  └────────────────────┴────────────────────────────────┘

Setting sections: separated by horizontal rule, 32px above/below
Max form width: 560px (don't let inputs stretch full width)
```

### Mobile App Screen

```
Standard mobile layout: 390px × 844px (iPhone 15 Pro)

Structure:
  ┌───────── Status bar (50px) ─────────────────────┐
  │ ◀  Title  (centered or left)          [Action]  │
  ├─────────────────────────────────────────────────┤
  │                                                 │
  │              SCROLLABLE CONTENT                 │
  │                16px horizontal padding          │
  │                                                 │
  ├─────────────────────────────────────────────────┤
  │ [Home] [Search] [Notifications] [Profile]       │
  └────────── Tab bar (80–90px) ────────────────────┘

Content list items: 72–80px height, 16px padding
Cards: full-width or 2-column (with 12px gap)
Section headers: 13px uppercase, 0.06em tracking, 32px top / 8px bottom margin
```

---

## Whitespace Rules

Generous whitespace is a mark of confidence. Tight spacing is a sign of insecurity ("I need to fill this space").

### Macro whitespace (between sections): 80–120px
When in doubt, use MORE space between sections, not less. The reader's eye needs a moment to exhale.

### Micro whitespace (within components): 8px grid
Never add spacing outside the 8px grid. 5px is never right. 10px is maybe right (but prefer 8 or 12).

### The Orphan Check
After layout, check for visual orphans: a single line of text or button that sits alone with too much space above it, or too little below it. These stick out and kill rhythm. Fix them.

### Empty sections
If a section feels empty with its content, the answer is almost never "add more content". Usually it's "use larger type" or "add more vertical padding" or "let one element be bigger and let the others breathe around it".

---

## Flex vs Grid — the decision framework

Penpot exposes two layout engines on any frame: `addFlexLayout()` (1D, like CSS flexbox) and `addGridLayout()` (2D, like CSS grid). The choice is not cosmetic — it determines whether the design stays coherent when content grows, shrinks, or reflows.

### The one question that decides it

> **Do the children have to align on one axis, or on two axes?**

- **One axis** → Flex. E.g. a navbar (`row`, align horizontally), a section wrapper (`column`, stack sections), a card's internals (`column`, stack content).
- **Two axes** → Grid. E.g. a stats grid where each card's top edge *and* left edge must line up with its neighbors; a pricing table where the three tiers must share a common row baseline.

### Concrete mapping

| Structure | Engine | Shape |
|-----------|--------|-------|
| Screen wrapper (sections stack) | Flex | `column`, gap=0 or section-padding handled per section |
| Section wrapper (eyebrow → heading → content → CTA) | Flex | `column`, `alignItems: 'center'` or `'start'` |
| Navbar (logo · links · actions) | Flex | `row`, `justifyContent: 'space-between'` |
| Tab bar, breadcrumb, tag list | Flex | `row`, optional `flexWrap: 'wrap'` |
| Button internals (icon + label) | Flex | `row`, `alignItems: 'center'`, `justifyContent: 'center'` |
| Card internals (title + body + footer) | Flex | `column`, consistent `gap` |
| Sidebar + main content | Flex | `row`, fixed-width sidebar, fluid main — OR Grid if main rows must align to sidebar sections |
| **Stats row** (3–4 equal metric cards) | **Grid** | 1 row × N equal `flex` columns |
| **Feature grid** (e.g. 3×2 cards) | **Grid** | N equal columns × auto rows |
| **Pricing tiers** (3 cards side-by-side) | **Grid** | 1 row × 3 equal columns |
| **Image gallery / card catalog** | **Grid** | equal columns, auto rows — or `repeat(auto-fill, …)` pattern |
| **Dashboard KPI board** | **Grid** | 2D — rows of metrics, cross-row alignment required |
| Form (single column) | Flex column of rows | Each row Flex `row` (label + field) |
| Form (label column aligned) | **Grid** | 2 cols: `auto` label + `flex 1` field, across all rows |

### Rule of thumb

> If you find yourself writing `flexWrap: 'wrap'` and every child has the same width, you are re-implementing Grid with Flex. Switch to `addGridLayout()`.

---

## Grid Implementation in Penpot

Penpot's Grid Layout is track-based, like CSS Grid. The exact method names for adding tracks have shifted across Penpot versions — before the first `addGridLayout()` call in a run, verify the API with `penpot_api_info({ type: 'Frame' })` and match the shape below.

### Pattern: equal-column grid (stats row, feature grid)

```typescript
// Create the grid container
const grid = page.createFrame();
grid.name = 'stats-grid';
grid.width = 1152;              // e.g. content width inside page padding

const gridLayout = grid.addGridLayout();
gridLayout.dir = 'row';         // row-major (children fill left-to-right, then wrap)

// Four equal-width columns
gridLayout.addColumn('flex', 1);
gridLayout.addColumn('flex', 1);
gridLayout.addColumn('flex', 1);
gridLayout.addColumn('flex', 1);

// One auto-sized row that grows with content; Penpot will add more rows as needed
gridLayout.addRow('auto');

gridLayout.rowGap = 24;
gridLayout.columnGap = 24;
gridLayout.padding = { top: 0, right: 0, bottom: 0, left: 0 };

// Then append children; they flow into the cells in order
for (const metric of metrics) {
  const card = buildMetricCard(metric);
  grid.appendChild(card);
}
```

### Pattern: sidebar + main (fixed + fluid)

```typescript
const page = penpot.currentPage;
const appShell = page.createFrame();
appShell.name = 'app-shell';
appShell.width = 1440;
appShell.height = 900;

const shellLayout = appShell.addGridLayout();
shellLayout.dir = 'row';
shellLayout.addColumn('fixed', 240);   // sidebar
shellLayout.addColumn('flex', 1);      // main content fills the rest
shellLayout.addRow('flex', 1);         // fills vertical space
shellLayout.rowGap = 0;
shellLayout.columnGap = 0;
```

### Pattern: form with aligned label column

```typescript
const form = page.createFrame();
form.name = 'form-fieldset';
form.width = 560;

const formGrid = form.addGridLayout();
formGrid.dir = 'row';
formGrid.addColumn('auto');            // label column hugs its longest label
formGrid.addColumn('flex', 1);         // field column fills
formGrid.addRow('auto');
formGrid.addRow('auto');
formGrid.addRow('auto');
formGrid.columnGap = 16;
formGrid.rowGap = 20;
```

### Page-level column guide (still useful)

The 12-column guide is still a visual overlay, separate from the layout engine. Add it to the screen wrapper for design reference:

```typescript
// Note: verify the exact guide/grid property with penpot_api_info({ type: 'Frame' })
// Typical shape:
// screen.grids = [{ type: 'column', columns: 12, margin: 120, gutter: 24 }];
```

Use this as a visual grid — the real layout still comes from `addFlexLayout` / `addGridLayout` on each frame.

---

## Semantic Frame Naming

Every frame gets a name that describes its **role**. A designer opening the file should understand the structure from the layers panel alone.

### Conventions

- **Sections** (direct children of the screen wrapper): `section-hero`, `section-features`, `section-pricing`, `section-testimonials`, `section-cta`, `section-footer`
- **App chrome**: `topbar`, `sidebar`, `page-header`, `main`, `content`, `tab-bar`, `toolbar`
- **Grouped content**: `title-group` (eyebrow + heading + subheading), `cta-group`, `nav-links`, `nav-actions`, `logo-strip`, `social-proof`
- **Layout containers by engine role**: `stats-grid`, `feature-grid`, `pricing-grid`, `testimonial-list`, `metric-card`, `feature-card`
- **Forms**: `form-fieldset`, `form-row`, `form-actions`
- **Instances**: append a role suffix — `cta-primary`, `cta-secondary`, `metric-mrr`, `metric-churn`

### Forbidden names

`Frame 4`, `Group 12`, `Rectangle`, `container`, `wrapper`, `box`, `div`, `inner`, `outer`. If you reach for one of these, the frame probably doesn't need to exist — or you haven't thought about what it represents.

### A quick heuristic

If the frame name doesn't map cleanly to an HTML element or ARIA landmark (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `form`, `fieldset`), consider whether the frame is structurally meaningful. If it isn't, flatten it.

---

## Composition Anti-Patterns

- ❌ **Flex-row-with-wrap faking a grid** — if all children are the same width, use `addGridLayout()` with equal `flex` columns instead
- ❌ **Grid used for a 1D flow** — a navbar, a button row, a vertical stack is Flex, not Grid
- ❌ **Frames without a layout engine** — if a frame has children, it needs `addFlexLayout()` or `addGridLayout()`. Absolute positioning of structural children breaks as soon as content changes
- ❌ **Generic frame names** (`Frame 1`, `container`, `wrapper`) — name by role, or flatten the frame
- ❌ **Centered layout for dashboards** — dashboards need left-aligned sidebar+content, not centered
- ❌ **Equal padding on all 4 sides for asymmetric layouts** — top ≠ bottom when there's visual hierarchy
- ❌ **3 columns of equal weight for features** — consider 2+1 or 1+2 asymmetry, or 3 with the first card wider
- ❌ **Every section the same background color** — alternate light/neutral/dark to create rhythm
- ❌ **Full-width text without max-width** — comfortable reading line is 60–75 characters (~560px at 15px)
- ❌ **Stacking content blocks with no visual breathing room** — minimum 48px between major content groups
- ❌ **Card grids with different card heights** — all cards in a row must be the same height (use flex stretch)
- ❌ **Navigation items the same weight as headings** — nav should be smaller and lighter
