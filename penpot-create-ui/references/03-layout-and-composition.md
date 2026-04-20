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

## Grid Implementation in Penpot

Create the grid as a frame, then build section frames inside it:

```typescript
// Create 12-column grid frame
const page = penpot.currentPage;
const gridFrame = page.createFrame();
gridFrame.name = 'screen-grid';
gridFrame.x = 0;
gridFrame.y = 0;
gridFrame.width = 1440;
gridFrame.height = 900; // will expand

// Add grid guide (Penpot grid API)
// gridFrame.grids = [{ type: 'column', columns: 12, margin: 120, gutter: 24 }];
// Note: verify grid API with penpot_api_info({ type: 'Frame' }) before using

return { frameId: gridFrame.id };
```

---

## Composition Anti-Patterns

- ❌ **Centered layout for dashboards** — dashboards need left-aligned sidebar+content, not centered
- ❌ **Equal padding on all 4 sides for asymmetric layouts** — top ≠ bottom when there's visual hierarchy
- ❌ **3 columns of equal weight for features** — consider 2+1 or 1+2 asymmetry, or 3 with the first card wider
- ❌ **Every section the same background color** — alternate light/neutral/dark to create rhythm
- ❌ **Full-width text without max-width** — comfortable reading line is 60–75 characters (~560px at 15px)
- ❌ **Stacking content blocks with no visual breathing room** — minimum 48px between major content groups
- ❌ **Card grids with different card heights** — all cards in a row must be the same height (use flex stretch)
- ❌ **Navigation items the same weight as headings** — nav should be smaller and lighter
