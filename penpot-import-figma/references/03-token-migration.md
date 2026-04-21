# Phase 2: Token Migration

Translate Figma Variables and Styles into Penpot tokens, library colors, and library typographies. **This phase must complete before any component creation.**

---

## Migration Order (Strict)

```
2a. Inspect Penpot file (high_level_overview + execute_code)
2b. Create primitive token set (raw values — no aliases)
2c. Create semantic token sets per mode (aliased values using {expression})
2d. Create other token sets (spacing, radius, border-width, shadow)
2e. Create token themes (Light / Dark)
2f. Create library colors (for fill/stroke binding via fillColorRefId)
2g. Create library typographies
2h. Validate (all tokens exist, aliases resolve, library colors match tokens)
```

Never create semantic tokens before primitives — expressions fail if the referenced token doesn't exist yet.

---

## 2a. Penpot Pre-flight Inspection

Before writing, check what already exists:

```typescript
const library = penpot.library.local;
const catalog = library.tokens;

const existingTokens = catalog ? Object.values(catalog) : [];
const existingColors = library.colors;
const existingTypos = library.typographies;

return {
  tokenCount: existingTokens.length,
  existingTokenNames: existingTokens.map(t => t.name),
  colorCount: existingColors.length,
  existingColorNames: existingColors.map(c => c.name),
  typographyCount: existingTypos.length,
  existingTypoNames: existingTypos.map(t => t.name),
};
```

**If tokens already exist**: compare against IR. For each existing token:
- Name matches → skip (record existing ID in state ledger)
- Name mismatch → flag to user before overwriting
- Value mismatch → flag to user (code/Figma disagreement)

---

## 2b. Create Primitive Token Set

Primitives are raw values with no aliases. They form the foundation everything else references.

```typescript
const catalog = penpot.library.local.tokens;
const RUN_ID = 'REPLACE_WITH_RUN_ID';

// Primitive color tokens
const primitives = [
  { name: 'color.blue.50',  type: 'color', value: '#EFF6FF' },
  { name: 'color.blue.100', type: 'color', value: '#DBEAFE' },
  { name: 'color.blue.500', type: 'color', value: '#3B82F6' },
  { name: 'color.blue.700', type: 'color', value: '#1D4ED8' },
  { name: 'color.blue.900', type: 'color', value: '#1E3A8A' },
  { name: 'color.gray.50',  type: 'color', value: '#F9FAFB' },
  { name: 'color.gray.100', type: 'color', value: '#F3F4F6' },
  { name: 'color.gray.500', type: 'color', value: '#6B7280' },
  { name: 'color.gray.900', type: 'color', value: '#111827' },
  { name: 'color.white',    type: 'color', value: '#FFFFFF' },
  { name: 'color.black',    type: 'color', value: '#000000' },
];

const created = [];
const skipped = [];

for (const token of primitives) {
  const existing = Object.values(catalog || {}).find(t => t.name === token.name);
  if (existing) {
    skipped.push({ name: token.name, id: existing.id });
    continue;
  }
  try {
    const t = await catalog.createToken({ name: token.name, type: token.type, value: token.value });
    created.push({ name: t.name, id: t.id });
  } catch (e) {
    created.push({ name: token.name, error: e.message });
  }
}

return { created, skipped };
```

---

## 2c. Create Semantic Token Sets

Semantic tokens reference primitives via `{expression}` syntax. Create them in a separate token set named by mode.

```typescript
// Semantic tokens for Light mode
// Token set name: "semantic/light" (Penpot groups tokens by name prefix)
const semanticLight = [
  { name: 'color.bg.primary',   type: 'color', value: '{color.white}' },
  { name: 'color.bg.secondary', type: 'color', value: '{color.gray.50}' },
  { name: 'color.text.primary', type: 'color', value: '{color.gray.900}' },
  { name: 'color.text.secondary', type: 'color', value: '{color.gray.500}' },
  { name: 'color.text.inverse', type: 'color', value: '{color.white}' },
  { name: 'color.brand.primary', type: 'color', value: '{color.blue.500}' },
  { name: 'color.border.default', type: 'color', value: '{color.gray.100}' },
];

// Note: In Penpot, token sets are defined by name prefix OR explicit set membership.
// Group tokens by name prefix convention:
//   "primitives" set  → names start with "color." (flat, no further prefix)
//   "semantic/light"  → prefix approach: name as "color.bg.primary" but in a set named "semantic/light"
// The TokenCatalog API determines set grouping — check penpot_api_info for current API.
```

> **API Note**: Penpot's token set API may differ between versions. Before creating tokens with set assignments, call `penpot_api_info` with query `"TokenCatalog createToken set"` to verify the exact signature.

---

## 2d. Create Spacing, Radius, Shadow Tokens

```typescript
const structuralTokens = [
  // Spacing
  { name: 'spacing.xs',  type: 'spacing',       value: '4'  },
  { name: 'spacing.sm',  type: 'spacing',       value: '8'  },
  { name: 'spacing.md',  type: 'spacing',       value: '16' },
  { name: 'spacing.lg',  type: 'spacing',       value: '24' },
  { name: 'spacing.xl',  type: 'spacing',       value: '32' },
  { name: 'spacing.2xl', type: 'spacing',       value: '48' },

  // Border radius
  { name: 'radius.none', type: 'border-radius', value: '0'    },
  { name: 'radius.sm',   type: 'border-radius', value: '4'    },
  { name: 'radius.md',   type: 'border-radius', value: '8'    },
  { name: 'radius.lg',   type: 'border-radius', value: '12'   },
  { name: 'radius.xl',   type: 'border-radius', value: '16'   },
  { name: 'radius.full', type: 'border-radius', value: '9999' },

  // Shadows (Penpot shadow token format)
  { name: 'shadow.sm', type: 'shadow', value: '0 1px 2px rgba(0,0,0,0.05)' },
  { name: 'shadow.md', type: 'shadow', value: '0 4px 6px rgba(0,0,0,0.10)' },
  { name: 'shadow.lg', type: 'shadow', value: '0 10px 15px rgba(0,0,0,0.15)' },
];
```

---

## 2e. Create Token Themes

Token themes control which sets are active for each mode (Light/Dark). This is the Penpot equivalent of Figma variable modes.

> **API Note**: Token theme creation API may be version-specific. Call `penpot_api_info` with `"TokenTheme"` before coding this step.

```typescript
// Conceptual theme structure (verify exact API with penpot_api_info):
// Theme "Light" → activates sets: primitives + semantic/light + spacing
// Theme "Dark"  → activates sets: primitives + semantic/dark + spacing
```

If the Theme API is unavailable in the current Penpot version, document it as a translation gap and create both Light and Dark tokens in a flat structure with clearly named prefixes (`color.light.bg.primary`, `color.dark.bg.primary`).

---

## 2f. Create Library Colors

Library colors enable `fillColorRefId` binding in shapes — the mechanism that keeps fills linked to the design system. Create one library color per semantic color that will be applied as fills/strokes.

```typescript
const library = penpot.library.local;

const libraryColors = [
  // name uses slash notation for library colors (Penpot convention)
  { name: 'color/bg/primary',     color: '#FFFFFF', opacity: 1 },
  { name: 'color/bg/secondary',   color: '#F9FAFB', opacity: 1 },
  { name: 'color/text/primary',   color: '#111827', opacity: 1 },
  { name: 'color/text/secondary', color: '#6B7280', opacity: 1 },
  { name: 'color/text/inverse',   color: '#FFFFFF', opacity: 1 },
  { name: 'color/brand/primary',  color: '#3B82F6', opacity: 1 },
  { name: 'color/border/default', color: '#F3F4F6', opacity: 1 },
];

const createdColors = [];
for (const colorDef of libraryColors) {
  const existing = library.colors.find(c => c.name === colorDef.name);
  if (existing) {
    createdColors.push({ name: colorDef.name, id: existing.id, status: 'skipped' });
    continue;
  }
  const c = library.createColor();
  c.name = colorDef.name;
  c.color = colorDef.color;
  c.opacity = colorDef.opacity;
  createdColors.push({ name: c.name, id: c.id, status: 'created' });
}

return { createdColors };
```

**Important**: Library color names use slash notation (`color/brand/primary`), while token names use dot notation (`color.brand.primary`). Both exist simultaneously and cross-reference each other conceptually.

---

## 2g. Create Library Typographies

Create one library typography per Figma text style. This is what components will use for their text elements.

```typescript
const library = penpot.library.local;

const typographyDefs = [
  { name: 'Display/LG',  fontFamily: 'Inter', fontStyle: 'Bold',    fontSize: '48', lineHeight: '1.1',  letterSpacing: '-0.02' },
  { name: 'Heading/2XL', fontFamily: 'Inter', fontStyle: 'Bold',    fontSize: '36', lineHeight: '1.2',  letterSpacing: '-0.01' },
  { name: 'Heading/XL',  fontFamily: 'Inter', fontStyle: 'Bold',    fontSize: '30', lineHeight: '1.25', letterSpacing: '0'     },
  { name: 'Heading/LG',  fontFamily: 'Inter', fontStyle: 'Bold',    fontSize: '24', lineHeight: '1.25', letterSpacing: '0'     },
  { name: 'Heading/MD',  fontFamily: 'Inter', fontStyle: 'SemiBold',fontSize: '20', lineHeight: '1.3',  letterSpacing: '0'     },
  { name: 'Heading/SM',  fontFamily: 'Inter', fontStyle: 'SemiBold',fontSize: '18', lineHeight: '1.4',  letterSpacing: '0'     },
  { name: 'Body/LG',     fontFamily: 'Inter', fontStyle: 'Regular', fontSize: '18', lineHeight: '1.6',  letterSpacing: '0'     },
  { name: 'Body/MD',     fontFamily: 'Inter', fontStyle: 'Regular', fontSize: '16', lineHeight: '1.5',  letterSpacing: '0'     },
  { name: 'Body/SM',     fontFamily: 'Inter', fontStyle: 'Regular', fontSize: '14', lineHeight: '1.5',  letterSpacing: '0'     },
  { name: 'Label/LG',    fontFamily: 'Inter', fontStyle: 'Medium',  fontSize: '16', lineHeight: '1.2',  letterSpacing: '0'     },
  { name: 'Label/MD',    fontFamily: 'Inter', fontStyle: 'Medium',  fontSize: '14', lineHeight: '1.2',  letterSpacing: '0'     },
  { name: 'Label/SM',    fontFamily: 'Inter', fontStyle: 'Medium',  fontSize: '12', lineHeight: '1.2',  letterSpacing: '0.02'  },
  { name: 'Caption/MD',  fontFamily: 'Inter', fontStyle: 'Regular', fontSize: '12', lineHeight: '1.4',  letterSpacing: '0'     },
  { name: 'Code/MD',     fontFamily: 'JetBrains Mono', fontStyle: 'Regular', fontSize: '14', lineHeight: '1.6', letterSpacing: '0' },
];

const createdTypos = [];
for (const td of typographyDefs) {
  const existing = library.typographies.find(t => t.name === td.name);
  if (existing) {
    createdTypos.push({ name: td.name, id: existing.id, status: 'skipped' });
    continue;
  }
  const typo = library.createTypography();
  typo.name = td.name;
  typo.fontFamily = td.fontFamily;
  typo.fontStyle = td.fontStyle;
  typo.fontSize = td.fontSize;
  typo.lineHeight = td.lineHeight;
  typo.letterSpacing = td.letterSpacing;
  createdTypos.push({ name: typo.name, id: typo.id, status: 'created' });
}

return { createdTypos };
```

---

## 2h. Token Validation

After creating all tokens, validate:

```typescript
const library = penpot.library.local;
const catalog = library.tokens;

const allTokens = catalog ? Object.values(catalog) : [];
const allColors = library.colors;
const allTypos = library.typographies;

// Check for expected tokens from the IR
const expectedTokenNames = [
  'color.blue.500', 'color.white', 'color.gray.900',
  'color.bg.primary', 'color.text.primary', 'color.brand.primary',
  'spacing.xs', 'spacing.sm', 'spacing.md', 'spacing.lg', 'spacing.xl',
  'radius.none', 'radius.sm', 'radius.md', 'radius.lg',
];

const missing = expectedTokenNames.filter(name =>
  !allTokens.find(t => t.name === name)
);

// Check expression tokens resolve (no dangling aliases)
const expressionTokens = allTokens.filter(t => t.value && t.value.startsWith('{'));
const unresolvable = expressionTokens.filter(t => {
  const ref = t.value.slice(1, -1); // strip { }
  return !allTokens.find(pt => pt.name === ref);
});

return {
  tokenCount: allTokens.length,
  colorCount: allColors.length,
  typographyCount: allTypos.length,
  missingExpected: missing,
  unresolvableAliases: unresolvable.map(t => ({ name: t.name, value: t.value })),
  valid: missing.length === 0 && unresolvable.length === 0,
};
```

Present the validation result to the user before Phase 3.

---

## Token Migration Anti-Patterns

- ❌ Creating semantic tokens before primitives (alias expressions will fail)
- ❌ Using raw hex values in semantic tokens instead of `{expression}` aliases
- ❌ Skipping library colors (components won't be able to use `fillColorRefId`)
- ❌ Using wrong token types (e.g., `number` for spacing instead of `spacing`)
- ❌ Not checking for existing tokens before creating (causes duplicates)
- ❌ Creating all tokens in one massive execute_code call (hard to debug on error)
- ❌ Forgetting to record created token IDs in the state ledger
