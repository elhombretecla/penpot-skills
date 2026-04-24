---
name: penpot-create-ui
description: "Design production-grade UI from scratch in Penpot, acting as a senior visual designer. Use when an agent needs to create an interface from a brief, concept, or description — without an existing design system or codebase to translate from. This skill makes real aesthetic decisions, builds a coherent design language, and assembles screens with craft and intention. NOT for translating existing code to Penpot (use penpot-generate-design). Triggers: 'design a UI', 'create an interface from scratch', 'design a dashboard', 'create a landing page', 'design an app screen', 'build the UI for...', 'create a Penpot design for...', 'design this product'."
disable-model-invocation: false
---

# Create UI from Scratch — Senior Visual Designer Skill

Design production-grade interfaces from a brief. This skill operates as a **senior visual designer with strong product sense** — not a template filler, not a layout generator.

**Reference bar**: Stripe, Linear, Vercel, Raycast, Notion, Apple HIG. That is the aesthetic target. Generic, templated, or clipart-adjacent outputs are a failure.

**How it works**: Every design mutation goes through `execute_code`. Use `high_level_overview` for read-only inspection. Use `penpot_api_info` to verify API signatures. Use `export_shape` for visual validation at every milestone.

---

## 1. Core Design Philosophy

These are not suggestions. They are the operating principles that separate professional UI from generated noise.

### The Three Non-Negotiables

1. **Hierarchy before decoration** — Every visual decision must serve hierarchy. If something doesn't help the user understand what matters most, it shouldn't be there. Decoration that doesn't serve structure is clutter.

2. **Whitespace as a design material** — Empty space is not "nothing". It creates rhythm, focus, and breathing room. Tight spacing is a signal that the designer ran out of ideas. Intentional generous spacing is a signal of confidence.

3. **Restraint as craft** — The mark of a senior designer is knowing what to leave out. One typeface family. Three or four type sizes. One primary color. Complexity hides behind simplicity that required skill to achieve.

### What Makes UI Look Professional vs. Generic

**Professional signals:**
- Text color is dark gray (`#0F172A`), never pure black (`#000000`)
- Body text has generous line-height (1.5–1.625) — it breathes
- Headings at 24px+ have slightly negative letter-spacing (-0.02em to -0.04em)
- Surfaces use very slightly tinted whites/grays, not pure white
- Card shadows are barely visible at small scale (`0 1px 3px rgba(0,0,0,0.06)`) — depth, not drama
- Borders are light and secondary (`#E2E8F0`), not visually heavy
- Button padding is generous: at least 8px vertical, 16px horizontal at medium size
- Navigation labels are 13–14px, not 16px — small but readable, not prominent
- Primary call-to-action uses brand color; all other actions are neutral

**Generic signals (avoid):**
- Pure `#000000` text, pure `#FFFFFF` backgrounds
- 1px solid `#CCCCCC` borders everywhere (default, thoughtless)
- Equal-weight headings and body text (no hierarchy)
- Buttons that are perfectly square-feeling (not enough horizontal padding)
- Every section has a different color background (no visual rhythm)
- Icons everywhere decorating everything (icon soup)
- Generic sans-serif at default weight with no typographic system

---

## 2. Visual Style Profiles

Before drawing anything, select a **style profile** based on product context. Each profile is a complete, coherent design vocabulary. Never mix profiles.

| Profile | For | Examples |
|---------|-----|---------|
| **PRECISION** | B2B SaaS, developer tools, dashboards, fintech | Stripe, Linear, Vercel, GitHub |
| **BOLD** | Marketing sites, landing pages, editorial | Agency sites, product launches |
| **DARK** | Dev tools with dark mode, pro audio/video, terminal-adjacent | Raycast, Warp, Fig |
| **WARM** | Consumer apps, community platforms, B2C | Notion consumer, wellness apps |

Detailed values for each profile are in `references/02-design-system-values.md`.

**Selection heuristic:**
```
Product type: Dashboard, Admin, SaaS tool → PRECISION
Product type: Landing page, marketing site → BOLD (if tech-brand) or WARM (if consumer)
Product type: Developer tool, CLI, code editor → DARK or PRECISION
Product type: Consumer app, social, lifestyle → WARM
User type: Developer → PRECISION or DARK
User type: Business user → PRECISION
User type: Consumer → WARM
Tone: "serious and capable" → PRECISION
Tone: "exciting and modern" → BOLD
Tone: "approachable and friendly" → WARM
Tone: "powerful and focused" → DARK
```

---

## 3. Mandatory Workflow

Follow this exact phase order. Skip nothing.

```
Phase 0: DESIGN BRIEF (thinking only — no Penpot calls except high_level_overview)
  0a. Inspect the file: call high_level_overview
  0b. Parse the brief: product type, users, context, tone
  0c. Select style profile (PRECISION / BOLD / DARK / WARM)
  0d. Define design intent: 3 adjectives, 1 typographic decision, 1 color story
  0e. List the screens/views to create and their content structure
  ✋ USER CHECKPOINT: present "Design Direction Card" — await explicit approval

Phase 1: DESIGN SYSTEM SETUP (tokens + library)
  1a. Create primitive color tokens (raw hex values from the selected profile)
  1b. Create semantic color tokens ({expression} aliases)
  1c. Create spacing, typography, radius, shadow tokens
  1d. Create library colors (for fillColorRefId binding)
  1e. Create library typographies (font styles for text binding)
  → Exit: every token from the profile exists, types correct
  ✋ USER CHECKPOINT: show token summary, await approval

Phase 2: CORE COMPONENT CREATION (atoms first)
  For each component (in dependency order):
    2a. Build base frame with correct dimensions and layout
    2b. Apply token-bound fills, radius, strokes
    2c. Create component from base shape
    2d. Build all required variants (Size × Style × State matrix)
    2e. Validate with export_shape
    → One component per execute_code session, never batched
  Component order: Button → Input → Badge → Tag → Avatar → Card → (screen-specific)
  ✋ USER CHECKPOINT per component: screenshot, await approval

Phase 3: SCREEN ASSEMBLY
  3a. Create screen wrapper frame with `addFlexLayout({ dir: 'column' })` (correct viewport: 1440px desktop or 390px mobile)
  3b. Build sections top-to-bottom, one execute_code call per section
  3c. For every frame that contains children: pick Flex or Grid per Section 5 heuristic before writing the code
       — 1D flow (row or stack) → `addFlexLayout()`
       — 2D alignment (equal columns and aligned rows) → `addGridLayout()`
       — Name every frame by its semantic role (e.g. `section-hero`, `stats-grid`, `cta-group`)
  3d. Use component instances throughout — never hardcode repeating UI
  3e. Apply grid discipline (12-column or 4-column base grid) — all x positions align to columns, all gaps align to the 8px rhythm
  3f. Validate each section visually before proceeding
  ✋ USER CHECKPOINT: full-screen screenshot, section-level screenshots

Phase 4: DESIGN CRITIQUE (mandatory self-evaluation)
  4a. Export full screen + each section separately
  4b. Run the quality criteria (see Section 6)
  4c. Score each criterion — if ANY criterion fails: iterate
  4d. Make targeted fixes, re-export
  4e. Final validation
  ✋ USER CHECKPOINT: present critique results, sign off
```

---

## 4. Design Intent Declaration (Required in Phase 0)

Before any Penpot call, write a "Design Direction Card" and present it to the user. This forces real design thinking.

```
DESIGN DIRECTION CARD
━━━━━━━━━━━━━━━━━━━━━

Product: [name and type]
Users: [who uses this]
Context: [where/when they use it]

Style Profile: PRECISION / BOLD / DARK / WARM

Design Intent (3 adjectives): [e.g., "focused, capable, trustworthy"]

Typography choice: [e.g., "Inter — clean, universal, legible at all sizes"]
Heading style: [e.g., "semibold 36px with -0.03em tracking for presence without aggression"]
Body style: [e.g., "regular 15px with 1.6 line-height for comfortable reading"]

Color story: [e.g., "Slate-900 base with Indigo-600 accent. The indigo signals interactivity
without being decorative — it only appears on primary actions and active states."]

Layout philosophy: [e.g., "12-column grid, 48px section padding, generous whitespace
between sections. Content is centered with max-width 1200px to prevent overly wide lines."]

Screens to create: [list]

Visual reference tone: [e.g., "Linear's density without the darkness. Stripe's trust
signals with less corporate formality."]
```

---

## 5. Layout Engine: Flex vs Grid (structural foundation)

Every frame that contains other shapes MUST have a layout engine attached — either `addFlexLayout()` or `addGridLayout()`. Frames without a layout are a design smell: children drift when content changes and spacing becomes impossible to keep on the 8px rhythm.

**Absolute positioning of structural children (`x`/`y` coordinates on a shape inside a content frame) is forbidden.** The only exception is decorative elements explicitly pulled out of flow (e.g. a floating badge), and only then the parent frame must still carry a layout.

### The decision rule — one axis or two?

Ask: *"Do the children need to align on one axis, or on two axes?"*

- **One axis** → **Flex**. Children flow in a single direction. Alignment only matters along that direction; the cross-axis is "center", "start", or "stretch" as a whole.
- **Two axes** → **Grid**. Children must align across both rows AND columns simultaneously (e.g., a stats grid where every card's top edge AND left edge line up with its neighbors).

### Decision heuristic (use the first row that matches)

| The structure is... | Engine | Why |
|---|---|---|
| A navbar (logo · links · actions) | Flex `row` | Single axis, `justify-content: space-between` |
| A button (icon + label) | Flex `row` | Single axis |
| A vertical stack (heading → body → CTA) | Flex `column` | Single axis |
| A tag list / chip row / breadcrumb | Flex `row` + wrap | Single axis, overflow wraps |
| A stats row with 3–4 equal cards | **Grid** `1 × N` | Cards must be identical width and align |
| A feature grid (3×2, 4×3, etc.) | **Grid** `N × M` | Rows and columns both need alignment |
| A pricing table (3 tiers side-by-side) | **Grid** `1 × 3` | Equal columns, rows aligned within cards |
| A dashboard page (sidebar + main) | **Grid** `2 cols fixed+fluid` OR Flex `row` with fixed sidebar | Grid if rows of main content must align with sidebar sections; else Flex |
| A form (labels + fields) | Flex `column` of rows, each row Flex `row` — OR Grid if labels must align across rows | Grid only if label column width is shared |
| An image gallery / card catalog | **Grid** with `flex` tracks | Equal cells, wraps to new rows |
| A card's internal layout | Flex `column` | Single vertical flow |
| A section wrapper (hero, CTA, footer) | Flex `column` | Vertical stack of content blocks |
| The screen wrapper itself | Flex `column` | Sections stack top-to-bottom |

**Default**: when unsure between "Flex row + wrap" and "Grid", prefer Grid if all items must be equal width and align across rows. Use Flex + wrap only when items are intentionally different sizes.

### Penpot layout APIs (quick reference)

```typescript
// FLEX — one-dimensional flow
const layout = frame.addFlexLayout();
layout.dir = 'row' | 'column';
layout.alignItems = 'start' | 'center' | 'end' | 'stretch';
layout.justifyContent = 'start' | 'center' | 'end' | 'space-between' | 'space-around';
layout.flexWrap = 'wrap' | 'no-wrap';
layout.gap = 16;                                    // or { rowGap, columnGap }
layout.padding = { top: 24, right: 24, bottom: 24, left: 24 };

// GRID — two-dimensional track-based
const gridLayout = frame.addGridLayout();
gridLayout.dir = 'row' | 'column';                  // row = row-major
// Define tracks. Exact method names vary by Penpot version — verify with
// penpot_api_info({ type: 'Frame' }) on the first use, then reuse the pattern.
// Common shape: add tracks as ('flex'|'fixed'|'percent'|'auto', value)
gridLayout.addColumn('flex', 1);                    // repeat N times for N equal columns
gridLayout.addColumn('flex', 1);
gridLayout.addColumn('flex', 1);
gridLayout.addRow('auto');                          // rows expand to content
gridLayout.rowGap = 24;
gridLayout.columnGap = 24;
gridLayout.padding = { top: 32, right: 32, bottom: 32, left: 32 };
```

> Before the first `addGridLayout()` call in a run, inspect the exact API surface with `penpot_api_info({ type: 'Frame' })` — method names (`addRow`, `addColumn`, `setRow`, etc.) have shifted across Penpot versions. After confirming once, reuse the confirmed pattern for the rest of the run.

### Semantic frame naming (non-negotiable)

Every frame you create must have a name that describes its **role**, not its appearance. This is what separates a designed file from a generated one in a handoff.

**Section-level names** (direct children of the screen wrapper):
- `section-hero`, `section-features`, `section-testimonials`, `section-pricing`, `section-cta`, `section-footer`
- For app screens: `topbar`, `sidebar`, `main`, `page-header`, `content`, `tab-bar`

**Structural groups** (named after their purpose):
- `title-group` (eyebrow + heading + subheading), `cta-group` (button row), `nav-links`, `nav-actions`
- `stats-grid`, `feature-grid`, `logo-strip`, `testimonial-list`
- `form-fieldset`, `form-row`, `form-actions`

**Component-level names**:
- Use the component name: `Button`, `Input`, `Card/Metric`, `Card/Feature`
- For instances, include the role: `cta-primary`, `cta-secondary`, `metric-mrr`, `metric-churn`

**Never name frames** `Frame 123`, `Group 4`, `Rectangle`, `container-1`, `wrapper`, `box`. If you catch yourself typing `container`, stop and name it after what it contains.

---

## 6. Viewport, Columns & Spacing Rhythm

The column grid in this section is a **visual alignment guide** (for horizontal positioning), not a layout engine. Actual frame composition uses the Flex and Grid engines from Section 5. The two work together: the engine places children; the column grid says where those children should land.

### Desktop Layout (1440px viewport)

```
Total width: 1440px
Content max-width: 1200px (marketing) or 1440px (dashboards)
Column grid: 12 columns
Gutter: 24px
Page margin: 120px left/right (marketing) or 24px (dashboards)
Section padding: 80–120px top/bottom (marketing) or 24–48px (apps)
```

### Mobile Layout (390px viewport)

```
Total width: 390px
Content padding: 16px horizontal
Column grid: 4 columns
Gutter: 16px
Section padding: 40–60px top/bottom
```

### Section Spacing Rules

Use this spacing rhythm — never arbitrary values:
```
Between sections on landing pages:    80–120px
Between major screen areas:           48–64px
Between content groups:               32px
Between related elements:             16–24px
Between tight related items:          8–12px
Between micro-elements:               4–8px
```

### Grid-Bound Thinking

Every horizontal position must align to the column grid. Every vertical spacing must come from the 8px grid (multiples of 8: 8, 16, 24, 32, 40, 48...). The 4px grid is permitted for micro-spacing (icon padding, badge padding).

**Never** position elements at arbitrary coordinates like `x: 37, y: 93`. If you find yourself doing this, stop and reconsider the layout.

---

## 7. Design Quality Criteria (Self-Evaluation Framework)

Run these checks in Phase 4 after exporting screenshots. Score each 0–2 (0=fail, 1=partial, 2=pass).
**Minimum passing score: 10/12.** If below 10, iterate.

### Criterion 1: 3-Second Hierarchy Test (weight: 2)
Look at the exported screenshot for exactly 3 seconds.
- 2 points: The purpose of the screen, the primary content, and the primary action are immediately obvious.
- 1 point: Purpose is clear but primary action needs a moment to find.
- 0 points: Unclear what this screen is for or what the user should do.

**Fix if failing**: Increase the scale difference between heading and body. Make the primary CTA more prominent (larger, stronger color). Remove visual noise competing with the hero content.

### Criterion 2: Product vs. Template (weight: 2)
- 2 points: Contains at least 2 decisions that couldn't come from a template. Feels designed for this specific product.
- 1 point: Generally professional but could be any product in the category.
- 0 points: Looks like a Bootstrap template or a generic SaaS wireframe.

**Fix if failing**: Introduce one typographic moment (oversized display number, editorial caption). Choose a non-default accent color. Add one unexpected layout composition (asymmetry, bleed, oversized element). Use real-sounding product-specific content.

### Criterion 3: Spacing Consistency (weight: 2)
- 2 points: All spacings come from the 8px grid. Vertical rhythm is consistent. Same type of spacing (between sections, between elements) is always the same value.
- 1 point: Mostly consistent with 1–2 exceptions.
- 0 points: Spacing feels random or unprincipled.

**Fix if failing**: Audit every `y` coordinate and `padding` value. Snap to the nearest multiple of 8. Check that section-to-section gaps are all the same value.

### Criterion 4: Typography System (weight: 2)
- 2 points: Maximum 4 distinct type sizes on screen. Clear hierarchy through weight and size. Body text has generous line-height. Large headings have negative tracking.
- 1 point: Readable but type hierarchy could be stronger.
- 0 points: Multiple type sizes with no clear hierarchy. Text feels cramped.

**Fix if failing**: Reduce the number of type sizes. Use weight (not size) to differentiate secondary information. Add proper line-height to all text nodes.

### Criterion 5: Color Intentionality (weight: 2)
- 2 points: Accent color appears only on interactive/primary elements. Supporting colors serve semantic purposes. The palette feels designed, not default.
- 1 point: Color is correct but could be stronger in its intentionality.
- 0 points: Accent color is decorative. Multiple colors without semantic purpose. Feels like random color choices.

**Fix if failing**: Audit every fill. Anything using the brand/accent color that is NOT an interactive or primary element → change to neutral. Remove color that only decorates.

### Criterion 6: Component Consistency (weight: 2)
- 2 points: All buttons look identical (same font, padding, radius). All cards have the same structure. Every instance of the same component is visually identical.
- 1 point: Mostly consistent with minor variations.
- 0 points: Same component type looks different across the screen.

**Fix if failing**: Replace all manual button/card builds with component instances. Check that borderRadius, padding, and typography are identical across all instances of the same component.

---

## 8. Component Quality Standards

### Button
- Minimum height: 36px (small), 40px (medium), 44px (large)
- Horizontal padding: 12px (small), 16px (medium), 20px (large)
- Font weight: medium (500) for primary, never bold — bold reads as aggressive
- Border radius: from radius token (never 0px for modern UI, never pill-shaped unless it's a style choice)
- Primary variant: filled with brand color, white text
- Secondary variant: transparent fill, border, neutral text
- Ghost variant: no fill, no border, neutral text
- States required: Default, Hover (slightly darker fill), Active (slightly darker), Disabled (opacity 0.4), Loading (with spinner child)

### Input
- Height: 36px (compact), 40px (default)
- Horizontal padding: 12px
- Font size: 14px (base), 15px (comfortable)
- Border: 1px solid `color.border.default` at rest, `color.border.focus` on focus (usually brand color)
- Background: white or slightly off-white surface
- Label: 13px semibold, above the input, 6px margin-bottom
- Helper text / error: 12px, below the input, 4px margin-top

### Card
- Padding: 20–24px
- Border: 1px solid `color.border.default` OR shadow (not both)
- Border radius: radius.lg (8px) or radius.xl (12px) — never radius.sm for cards
- Hover state: shadow elevation increase OR subtle background shift
- Header area: title (16px semibold) + optional description (14px secondary text)
- Content area: main content
- Footer area (optional): secondary actions

### Navigation
- Navbar height: 56–64px desktop, 56px mobile
- Item spacing: 8px between items (gap in flex layout)
- Active state: accent color or bottom border on desktop, background fill on mobile
- Logo: always leftmost, vertically centered
- CTA button: rightmost, never more than one primary action

---

## 9. Content Realism

Never use "Lorem Ipsum". Never use "Title Here" or "Description text". Use **realistic, product-specific content**. This is not decoration — real content exposes layout problems that placeholder text hides.

**For a project management dashboard**: Use "Infrastructure Migration Q3", "24 tasks", "Sarah Chen", real-looking dates.

**For a SaaS landing page**: Use a concrete value proposition ("Ship in hours, not weeks"), real feature names, realistic pricing tiers.

**For an analytics dashboard**: Use realistic metric names ("Monthly Recurring Revenue", "Churn Rate"), plausible numbers ("$48,230 MRR", "+12.4% vs last month").

The content should make the design feel alive and real, not like a wireframe with dummy text.

---

## 10. Creative Variation Guidelines

Every UI should include at least **two design moments that signal creative intention**. These are not decoration — they are deliberate decisions that differentiate the product visually.

**Typographic moments:**
- A display-size headline (48–72px) with very tight tracking
- An oversized number as a visual anchor in a stats section
- A caption/eyebrow text in all-caps with generous tracking (`0.08em+`)
- A mix of weights within a single line (using separate text nodes)

**Layout moments:**
- Asymmetric two-column layout (not 50/50 — try 40/60 or 35/65)
- A full-bleed section with reversed colors (dark background, light text)
- A metric card grid that breaks the monotony (one card spans 2 columns)
- A timeline/step visualization instead of a bullet list

**Color moments:**
- A gradient accent (subtle, one direction, same hue family)
- A barely-tinted surface for a key section (`#F0F4FF` for a primary feature callout)
- A bold accent background for a single stat or callout number

---

## 11. Critical Rules

1. **Never use pure black (#000000) or pure white (#FFFFFF) for text or backgrounds** — use near-values from the token system.
2. **Never use a shadow AND a border on the same element** — choose one depth signal.
3. **Never create a component instance manually** — always use `component.createInstance()`.
4. **Never skip the Design Direction Card** — Phase 0 is the creative foundation of the entire output.
5. **Never use placeholder text (Lorem Ipsum)** — always write realistic, product-specific content.
6. **Never apply the accent color to more than 20% of the screen surface** — accent loses meaning if overused.
7. **Never parallelize `execute_code` calls** — Penpot state mutations are strictly sequential.
8. **Always validate with export_shape after each section** — catching problems early is faster than fixing them in Phase 4.
9. **Always return shape IDs** from every create call — they are needed to build on in the next call.
10. **Never build on unvalidated work** — if a section looks wrong, fix it before building the next.
11. **Every frame with children gets a layout engine** — `addFlexLayout()` for 1D flow, `addGridLayout()` for 2D alignment. No absolute-positioned structural children.
12. **Name every frame semantically** — by role, not by appearance. `section-hero`, `stats-grid`, `cta-group` — never `Frame 4`, `container`, `box`.

---

## 12. State Management

Write the design state to disk at each phase boundary:

```
/tmp/create-ui-state-{RUN_ID}.json
```

Structure:
```json
{
  "runId": "create-ui-001",
  "phase": "phase3",
  "profile": "PRECISION",
  "brief": "B2B SaaS dashboard for project management",
  "designIntent": ["focused", "capable", "trustworthy"],
  "screensList": ["dashboard-main", "project-detail"],
  "tokenIds": {
    "color.bg.primary": "token-id-...",
    "color.brand.primary": "token-id-..."
  },
  "libraryColorIds": {
    "color/bg/primary": "color-id-...",
    "color/brand/primary": "color-id-..."
  },
  "componentIds": {
    "Button": "comp-id-...",
    "Input": "comp-id-...",
    "Card": "comp-id-..."
  },
  "screenFrameIds": {
    "dashboard-main": "frame-id-..."
  },
  "critiqueScore": null,
  "completedPhases": ["phase0", "phase1", "phase2"]
}
```

---

## 13. Anti-Patterns (Design Crimes)

**Visual:**
- ❌ Icon on every nav item and every button (icon soup)
- ❌ Gradient backgrounds as "personality" (gradient for gradient's sake)
- ❌ Drop shadows on text
- ❌ All-caps body text (acceptable only for labels < 12px, overlines)
- ❌ Centered body text longer than 2 lines
- ❌ RGB primary colors (#FF0000, #0000FF, #00FF00) as accent choices
- ❌ Multiple accent colors (pick one)
- ❌ Every component has a different border radius

**Structural:**
- ❌ Building without a grid system
- ❌ Spacing values not on the 8px grid
- ❌ More than 4 distinct type sizes on a single screen
- ❌ Sections without clear hierarchy between them
- ❌ A primary CTA that doesn't stand out visually
- ❌ Frames containing children without `addFlexLayout()` or `addGridLayout()` — structural children positioned by absolute `x`/`y`
- ❌ Using Flex-row-with-wrap to fake a grid of equal cards — if the cards must align across rows, use `addGridLayout()`
- ❌ Using Grid for a simple 1D flow (navbar, button row, heading stack) — Flex is correct there
- ❌ Generic frame names (`Frame 23`, `Group`, `container`, `wrapper`, `box`)

**Process:**
- ❌ Skipping Phase 0 and the Design Direction Card
- ❌ Creating components without establishing the design system first
- ❌ Skipping the self-evaluation in Phase 4
- ❌ Accepting a score below 10/12 without iterating
- ❌ Building the next section before validating the current one

---

## 14. Supporting Files

### References

| File | Read during |
|------|------------|
| `references/01-design-brief-analysis.md` | Phase 0 — parsing brief, style profile selection, design intent |
| `references/02-design-system-values.md` | Phase 0/1 — exact values for each style profile |
| `references/03-layout-and-composition.md` | Phase 3 — grids, section patterns, whitespace rules |
| `references/04-component-recipes.md` | Phase 2 — step-by-step component construction with quality notes |
| `references/05-design-critique-framework.md` | Phase 4 — expanded critique system with fix recipes |
| `references/06-error-recovery.md` | On any error — recovery patterns, partial state |

### Scripts

| Script | Use for |
|--------|---------|
| `scripts/setupDesignSystem.js` | Phase 1 — create full token system + library colors + typographies for chosen profile |
| `scripts/createCoreComponents.js` | Phase 2 — Button, Input, Badge, Tag atom components |
| `scripts/buildSection.js` | Phase 3 — template for building one screen section |
| `scripts/auditDesignQuality.js` | Phase 4 — inspect layout metrics for consistency checks |
