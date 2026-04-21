# Phase 5: Fidelity Validation

Validate the migrated design against the Figma source. Run after each component, after each screen section, and as a mandatory final pass.

---

## Validation Dimensions

Every validation should check four dimensions:

| Dimension | What to check | Tools |
|-----------|--------------|-------|
| **Visual fidelity** | Does it look like the Figma design? | `export_shape` + Figma `get_screenshot` |
| **Structural integrity** | Are components reusable? Are tokens bound? | `execute_code` audit queries |
| **System coherence** | Are fills/strokes using library colors? Are texts using typographies? | `execute_code` audit |
| **Naming consistency** | No unnamed nodes, consistent casing | `execute_code` name scan |

---

## Per-Component Visual Validation

After migrating each component:

1. Call `export_shape` on the Penpot component main frame
2. Call `get_screenshot` on the equivalent Figma component node
3. Compare:
   - Overall shape and proportions
   - Fill colors (correct hue, not placeholder gray)
   - Typography (correct size, weight)
   - Spacing (gaps, padding visually consistent)
   - Border radius
   - Icon/child components present

**Common visual drift issues:**

| Issue | Likely cause | Fix |
|-------|-------------|-----|
| Wrong fill color | Library color not found, fell back to hardcoded | Find or create the library color, rebind |
| Missing text | Text node not created or empty `characters` | Check text creation script |
| Wrong typography size | Wrong typography bound or font not available | Verify `applyTypography` call, check font availability |
| Clipped text | Frame too small (hug sizing not applied) | Set correct sizing mode or increase height |
| Elements overlapping | Flex layout not applied | Check `addFlexLayout()` call |
| Variant frame stacked at 0,0 | Position not set after VariantContainer creation | Set explicit `x`, `y` on each variant frame |

---

## Per-Screen Section Validation

After migrating each screen section:

```typescript
// export_shape on section ID, then check:
const page = penpot.currentPage;
const shapes = page.findShapes();

const sectionId = 'REPLACE_WITH_SECTION_ID';
const section = shapes.find(s => s.id === sectionId);
if (!section) return { error: 'Section not found' };

// Check for placeholder text
const allText = section.findShapes().filter(s => s.type === 'text');
const placeholders = allText.filter(s =>
  ['Title', 'Heading', 'Button', 'Label', 'Description', 'Lorem ipsum'].some(p =>
    s.characters && s.characters.toLowerCase().includes(p.toLowerCase())
  )
);

// Check for hardcoded fills (no colorRefId)
const allShapes = section.findShapes();
const hardcodedFills = allShapes.filter(s => {
  if (!s.fills || s.fills.length === 0) return false;
  return s.fills.some(f => f.fillType === 'solid' && !f.fillColorRefId);
}).map(s => ({ id: s.id, name: s.name, fills: s.fills }));

return {
  sectionName: section.name,
  textNodeCount: allText.length,
  placeholderTexts: placeholders.map(s => ({ id: s.id, name: s.name, text: s.characters })),
  hardcodedFillCount: hardcodedFills.length,
  hardcodedFills: hardcodedFills.slice(0, 10), // cap at 10 for readability
};
```

---

## Final Fidelity Audit Script

Run once after all screens are migrated. This is the comprehensive QA pass.

```typescript
const page = penpot.currentPage;
const library = penpot.library.local;

const allPageShapes = page.findShapes();
const issues = [];

// ── 1. Unnamed nodes ──────────────────────────────────────────────────────────
const unnamed = allPageShapes.filter(s =>
  !s.name || s.name.trim() === '' || s.name === 'Rectangle' || s.name === 'Frame' || s.name === 'Group'
);
if (unnamed.length > 0) {
  issues.push({ type: 'naming', count: unnamed.length, message: `${unnamed.length} unnamed or generic-named nodes` });
}

// ── 2. Hardcoded color fills ──────────────────────────────────────────────────
const shapesWithHardcodedFills = allPageShapes.filter(s => {
  if (!s.fills || s.fills.length === 0) return false;
  return s.fills.some(f =>
    f.fillType === 'solid' &&
    !f.fillColorRefId &&
    f.fillColor !== '#FFFFFF' &&
    f.fillColor !== undefined
  );
});
if (shapesWithHardcodedFills.length > 0) {
  issues.push({ type: 'token-binding', count: shapesWithHardcodedFills.length, message: `${shapesWithHardcodedFills.length} shapes with hardcoded (unbound) fills` });
}

// ── 3. Text nodes without typography binding ──────────────────────────────────
const allTextNodes = allPageShapes.filter(s => s.type === 'text');
const unboundText = allTextNodes.filter(s => !s.typographyRefId);
if (unboundText.length > 10) {
  // Some unbound text is expected (manual labels), flag only if excessive
  issues.push({ type: 'token-binding', count: unboundText.length, message: `${unboundText.length} text nodes without typography binding (expected: < 10)` });
}

// ── 4. Component instances not linked to library ──────────────────────────────
const instances = allPageShapes.filter(s => s.componentId);
const orphanInstances = instances.filter(s => {
  // An orphan instance has a componentId but the component is not in the local library
  return !library.components.find(c => c.id === s.componentId);
});
if (orphanInstances.length > 0) {
  issues.push({ type: 'structure', count: orphanInstances.length, message: `${orphanInstances.length} component instances not linked to a local library component` });
}

// ── 5. Empty frames (no children, no fills) ───────────────────────────────────
const emptyFrames = allPageShapes.filter(s => {
  if (s.type !== 'frame') return false;
  const hasChildren = s.children && s.children.length > 0;
  const hasFill = s.fills && s.fills.length > 0;
  return !hasChildren && !hasFill;
});
if (emptyFrames.length > 0) {
  issues.push({ type: 'structure', count: emptyFrames.length, message: `${emptyFrames.length} empty frames (no children, no fills)` });
}

// ── Summary ───────────────────────────────────────────────────────────────────
const tokenCount = library.tokens ? Object.values(library.tokens).length : 0;
const colorCount = library.colors.length;
const typoCount = library.typographies.length;
const componentCount = library.components.length;

return {
  auditPassed: issues.length === 0,
  issueCount: issues.length,
  issues,
  designSystemStats: {
    tokens: tokenCount,
    libraryColors: colorCount,
    typographies: typoCount,
    components: componentCount,
  },
  screenStats: {
    totalShapes: allPageShapes.length,
    textNodes: allTextNodes.length,
    componentInstances: instances.length,
  },
};
```

---

## Fidelity Correction Workflow

When validation finds issues, fix them with targeted scripts — never rebuild from scratch.

**Fix hardcoded fills:**
```typescript
// Rebind a specific shape's fill to a library color
const page = penpot.currentPage;
const library = penpot.library.local;

const SHAPE_ID = 'REPLACE_WITH_SHAPE_ID';
const COLOR_NAME = 'color/bg/secondary';

const shape = page.findShapes().find(s => s.id === SHAPE_ID);
const color = library.colors.find(c => c.name === COLOR_NAME);

if (!shape) return { error: 'Shape not found' };
if (!color) return { error: `Color '${COLOR_NAME}' not found in library` };

shape.fills = [{
  fillType: 'solid',
  fillColor: color.color,
  fillOpacity: color.opacity ?? 1,
  fillColorRefId: color.id,
  fillColorRefFileId: color.fileId,
}];

return { fixed: true, shapeId: shape.id, colorBound: color.name };
```

**Fix an unnamed node:**
```typescript
const shape = page.findShapes().find(s => s.id === 'SHAPE_ID');
if (shape) {
  shape.name = 'NEW_SEMANTIC_NAME';
  return { fixed: true };
}
return { error: 'Shape not found' };
```

---

## QA Report Template

Present after Phase 5:

```
MIGRATION QA REPORT

DESIGN SYSTEM
  Tokens: 47 created (0 errors)
  Library colors: 32 created (0 errors)
  Typographies: 14 created (0 errors)
  Components: 15 migrated (0 errors, 3 with partial variant sets)

SCREENS
  Homepage: ✅ 5 sections, 2 binding gaps (low impact)
  Dashboard: ✅ 6 sections, 1 binding gap (medium impact)

FIDELITY ISSUES FOUND: 3
  ⚠️  8 shapes with hardcoded fills → recommend rebinding
  ℹ️  12 text nodes without typography binding → acceptable for one-off labels
  ⚠️  Icon shapes: 48 placeholders → requires manual SVG import

TRANSLATION GAPS (from IR)
  ⚠️  Complex vector icons: 48 shapes → exported as placeholder frames
  ℹ️  Prototype links: stripped (3 interactive flows not applicable)

OVERALL ASSESSMENT
  Core design system: ✅ Complete and token-bound
  Component library: ✅ 15/15 components migrated with variants
  Screens: ✅ 2/2 screens migrated, visually accurate

Sign off or address specific issues?
```

---

## Validation Anti-Patterns

- ❌ Doing only the final audit, skipping per-component and per-section validation
- ❌ Treating visual similarity as sufficient — check token binding, not just appearance
- ❌ Rebuilding an entire section because of one minor issue — use targeted fixes
- ❌ Dismissing orphan instances without investigating why the component link broke
- ❌ Marking the migration complete without confirming the user has reviewed screenshots
