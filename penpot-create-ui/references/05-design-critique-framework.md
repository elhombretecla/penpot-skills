# Design Critique Framework — Phase 4

The self-evaluation is not optional. It is the mechanism that prevents generic output from being delivered. Run it after completing Phase 3, before presenting to the user.

---

## How to Run the Critique

1. Export the full screen with `export_shape` at 1× scale
2. Export each major section separately at 1.5× scale (for detail inspection)
3. Evaluate each criterion using the rubric below
4. Record the score in the state ledger
5. If total score < 10/12 → identify the failing criteria, run targeted fixes, re-export, re-score

---

## Criterion 1: 3-Second Hierarchy (max 2 pts)

**The test**: Look at the screen export and identify:
- What is this for? (product purpose)
- What is the most important content?
- What is the primary action?

**Scoring:**
- 2: All three are immediately obvious. No ambiguity.
- 1: Purpose and content are clear, but the primary action requires scanning.
- 0: You have to study the screen to understand what it's for.

**Common failure causes and fixes:**

| Failure | Fix |
|---------|-----|
| Heading and body text same visual weight | Increase heading size or weight. Reduce body text opacity. |
| Primary CTA same size as secondary buttons | Make primary button larger, use strong brand fill |
| Too many competing elements at equal size | Remove or downsize 2–3 elements to create a clear dominant |
| No clear focal point | Add a hero element: large number, big headline, or featured image |

---

## Criterion 2: Product vs. Template (max 2 pts)

**The test**: Would this design work for any generic SaaS product, or does it feel specific to THIS product?

**Scoring:**
- 2: At least 2 decisions that feel tailored. Non-default color choice. At least 1 unexpected layout or typographic moment.
- 1: Professional but generic. Correct but not distinctive.
- 0: Looks like a template. Default blue primary color. Cards in a 3-column grid. Nothing surprising.

**How to add distinctiveness (pick ≥ 2):**

**Typographic moments:**
- Use a display number as a visual anchor: `2.4M` in 48px bold, with its label at 12px below
- Add an eyebrow/overline: `// OPEN SOURCE` or `TRUSTED BY 2,000+ TEAMS` in 11px uppercase tracking-wide
- Use a heading at 40px+ that makes a visual statement: don't be shy with scale

**Color moments:**
- Instead of indigo, use an unexpected but justified color (teal for a "fresh" product, orange for an "energetic" product)
- Add a subtle tint to one section background (indigo-50: `#EEF2FF` for a key feature highlight)
- Use the accent as a border-left on a featured card (2px solid, not a full fill)

**Layout moments:**
- Break the grid intentionally once: an asymmetric split (40/60 instead of 50/50)
- Let one element be notably larger than its context (a metric number at 48px in a dashboard)
- Create a visual divider between sections using background color instead of horizontal rules

**Content moments:**
- Write product-specific copy that could only make sense for this product
- Use real-looking data: not "12,345" but "$48,230 MRR" or "Project: Infrastructure Migration Q3"

---

## Criterion 3: Spacing Consistency (max 2 pts)

**The test**: Are all spacings on the 8px grid? Is the same type of spacing (section-to-section, element-to-element) always the same value?

**Scoring:**
- 2: 100% of spacings are multiples of 8 (or 4 for micro). All section gaps identical. All within-component gaps identical.
- 1: 1–2 exceptions, not visually disruptive.
- 0: Multiple arbitrary spacing values. Visual rhythm broken.

**How to audit in Penpot:**
```typescript
// Check top-level frame y-positions and gaps
const page = penpot.currentPage;
const screenFrame = page.findShapes().find(s => s.id === 'SCREEN_FRAME_ID');
if (!screenFrame) return { error: 'Screen frame not found' };

const children = screenFrame.children || [];
const sorted = children.sort((a, b) => (a.y || 0) - (b.y || 0));
const gaps = [];
for (let i = 1; i < sorted.length; i++) {
  const prev = sorted[i-1];
  const curr = sorted[i];
  const gap = (curr.y || 0) - ((prev.y || 0) + (prev.height || 0));
  const isOnGrid = gap % 8 === 0;
  gaps.push({ between: [prev.name, curr.name], gap, isOnGrid });
}
return { gaps, offGridCount: gaps.filter(g => !g.isOnGrid).length };
```

---

## Criterion 4: Typography System (max 2 pts)

**The test**: Count the distinct type sizes on screen. Is the hierarchy clear? Is line-height generous?

**Scoring:**
- 2: ≤ 4 distinct type sizes. Clear hierarchy (each step is visibly different). Headings have tight tracking. Body has relaxed line-height.
- 1: 5 type sizes, or hierarchy requires effort to perceive.
- 0: > 5 type sizes, OR all text is similar weight/size with no clear hierarchy.

**Typography audit via Penpot:**
```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();
const textNodes = shapes.filter(s => s.type === 'text' && s.fontSize);
const sizeCounts = {};
textNodes.forEach(s => {
  sizeCounts[s.fontSize] = (sizeCounts[s.fontSize] || 0) + 1;
});
return {
  distinctSizes: Object.keys(sizeCounts).length,
  distribution: sizeCounts,
  tooManyLevels: Object.keys(sizeCounts).length > 4,
};
```

**If too many type sizes**: Merge sizes that are within 2px of each other. Remove intermediate sizes.

---

## Criterion 5: Color Intentionality (max 2 pts)

**The test**: Is the accent color used ONLY on interactive or primary brand elements?

**Scoring:**
- 2: Accent appears only on: primary buttons, active nav states, focus rings, links, selected states, one hero element. All non-interactive elements use neutral colors.
- 1: Accent used in 1–2 decorative instances (not catastrophic but note for next iteration).
- 0: Accent used decoratively (section backgrounds, decorative shapes, secondary labels). Color feels arbitrary.

**Color audit:**
```typescript
// Find all fills using the brand color
const page = penpot.currentPage;
const shapes = page.findShapes();
const brandColorHex = '#6366F1'; // Replace with actual brand color

const brandUses = shapes
  .filter(s => s.fills && s.fills.some(f => f.fillColor?.toLowerCase() === brandColorHex.toLowerCase()))
  .map(s => ({ id: s.id, name: s.name, type: s.type }));

return { brandColorUses: brandUses.length, uses: brandUses };
```

Review the list: every entry should be clearly interactive or a primary branded element.

---

## Criterion 6: Component Consistency (max 2 pts)

**The test**: Are all instances of the same component type visually identical?

**Scoring:**
- 2: All buttons are component instances. All cards are component instances. No manual "button-like" shapes.
- 1: Mostly instances, with 1–2 manual builds.
- 0: Multiple manual builds of the same component type, with visual differences between them.

**Consistency audit:**
```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

// Find frames that look like buttons but aren't component instances
const buttonLike = shapes.filter(s =>
  s.type === 'frame' &&
  (s.height >= 30 && s.height <= 50) &&
  (s.width >= 60 && s.width <= 200) &&
  s.fills && s.fills.some(f => f.fillType === 'solid') &&
  !s.componentId
);

return {
  nonComponentButtonCount: buttonLike.length,
  details: buttonLike.map(s => ({ id: s.id, name: s.name, w: s.width, h: s.height })),
};
```

---

## Post-Critique Fix Protocol

After scoring, if total < 10/12:

1. **Identify the lowest-scoring criteria** (start with Criterion 1 and 2 — they have the most visual impact)
2. **Plan targeted fixes** — be specific: "increase h1 from 32px to 36px, change section gap from 29px to 32px"
3. **Execute fixes** via `execute_code`, one fix per call
4. **Re-export** the affected sections
5. **Re-score** the fixed criteria only
6. **Repeat** until score ≥ 10/12

**Never rebuild from scratch** unless the overall structure is fundamentally wrong. Targeted fixes are always faster.

---

## Red Lines (Automatic Fail)

If any of these are present, the output FAILS regardless of score:
- Lorem Ipsum placeholder text
- Pure `#000000` or `#FFFFFF` fills on any element
- A primary CTA that is visually identical to a secondary action
- More than 6 different type sizes on a single screen
- Hardcoded fill colors where library color bindings were available
- An accent color that appears more than 25% of total screen area
