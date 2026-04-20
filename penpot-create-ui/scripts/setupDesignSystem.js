/**
 * setupDesignSystem.js
 *
 * Phase 1 — Create complete design system (tokens + library colors + typographies)
 * for the chosen style profile. Idempotent: skips existing entries.
 *
 * USAGE: This script is a TEMPLATE. Before running:
 *   1. Set PROFILE to 'PRECISION', 'DARK', 'BOLD', or 'WARM'
 *   2. Verify accent color matches the Design Direction Card
 *   3. Run in TWO execute_code calls:
 *      Call 1: set MODE = 'tokens'   → creates all TokenCatalog tokens
 *      Call 2: set MODE = 'library'  → creates library colors + typographies
 *
 * ⚠️  Primitives must exist before semantic tokens. Run MODE='tokens' first.
 */

const PROFILE = 'PRECISION';  // ← SET THIS: 'PRECISION' | 'DARK' | 'BOLD' | 'WARM'
const MODE = 'tokens';         // ← 'tokens' (call 1) or 'library' (call 2)
const ACCENT = 'indigo';       // ← 'indigo' | 'violet' | 'teal' | 'orange' | 'rose' | 'cyan'
const RUN_ID = 'create-ui-REPLACE-ME'; // ← replace with actual run ID

// ─── Color palettes by profile ───────────────────────────────────────────────
const PALETTES = {
  PRECISION: {
    base: {
      'color.slate.50': '#F8FAFC', 'color.slate.100': '#F1F5F9',
      'color.slate.200': '#E2E8F0', 'color.slate.300': '#CBD5E1',
      'color.slate.400': '#94A3B8', 'color.slate.500': '#64748B',
      'color.slate.600': '#475569', 'color.slate.700': '#334155',
      'color.slate.800': '#1E293B', 'color.slate.900': '#0F172A',
      'color.white': '#FFFFFF',
    },
    accent: {
      indigo: { '50': '#EEF2FF', '100': '#E0E7FF', '400': '#818CF8', '500': '#6366F1', '600': '#4F46E5', '700': '#4338CA' },
      violet: { '50': '#F5F3FF', '100': '#EDE9FE', '400': '#A78BFA', '500': '#8B5CF6', '600': '#7C3AED', '700': '#6D28D9' },
      teal: { '50': '#F0FDFA', '100': '#CCFBF1', '400': '#2DD4BF', '500': '#14B8A6', '600': '#0D9488', '700': '#0F766E' },
      orange: { '50': '#FFF7ED', '100': '#FFEDD5', '400': '#FB923C', '500': '#F97316', '600': '#EA580C', '700': '#C2410C' },
    },
    feedback: {
      'color.emerald.50': '#ECFDF5', 'color.emerald.400': '#34D399',
      'color.emerald.500': '#10B981', 'color.emerald.600': '#059669',
      'color.amber.50': '#FFFBEB', 'color.amber.400': '#FBBF24',
      'color.amber.500': '#F59E0B', 'color.amber.600': '#D97706',
      'color.red.50': '#FEF2F2', 'color.red.400': '#F87171',
      'color.red.500': '#EF4444', 'color.red.600': '#DC2626',
    },
  },
  DARK: {
    base: {
      'color.neutral.950': '#0A0A0B', 'color.neutral.900': '#111113',
      'color.neutral.850': '#141415', 'color.neutral.800': '#1A1A1E',
      'color.neutral.700': '#252527', 'color.neutral.600': '#3A3A3D',
      'color.zinc.400': '#A1A1AA', 'color.zinc.300': '#D4D4D8',
      'color.zinc.600': '#52525B', 'color.white': '#FFFFFF',
    },
    accent: {
      violet: { '300': '#C4B5FD', '400': '#A78BFA', '500': '#8B5CF6', '600': '#7C3AED' },
      cyan: { '300': '#67E8F9', '400': '#22D3EE', '500': '#06B6D4', '600': '#0891B2' },
    },
  },
};

// ─── Build token definitions from profile ────────────────────────────────────
function buildGlobalTokens(profile, accentName) {
  const palette = PALETTES[profile] || PALETTES.PRECISION;
  const tokens = [];

  // Base colors
  Object.entries(palette.base).forEach(([name, value]) => {
    tokens.push({ name, type: 'color', value, description: `${name.split('.').pop()} base color` });
  });

  // Accent colors
  const accentPalette = palette.accent?.[accentName] || palette.accent?.indigo || palette.accent?.violet;
  if (accentPalette) {
    Object.entries(accentPalette).forEach(([scale, value]) => {
      tokens.push({ name: `color.${accentName}.${scale}`, type: 'color', value, description: `${accentName} ${scale}` });
    });
  }

  // Feedback colors
  if (palette.feedback) {
    Object.entries(palette.feedback).forEach(([name, value]) => {
      tokens.push({ name, type: 'color', value, description: name.split('.').slice(-2).join(' ') });
    });
  }

  // Spacing tokens
  const spacings = [
    [1, 4], [2, 8], [3, 12], [4, 16], [5, 20], [6, 24],
    [8, 32], [10, 40], [12, 48], [16, 64], [20, 80], [24, 96],
  ];
  spacings.forEach(([scale, px]) => {
    tokens.push({ name: `spacing.${scale}`, type: 'spacing', value: String(px), description: `${px}px` });
  });

  // Border radius
  const radii = profile === 'WARM'
    ? [['sm', 8], ['md', 12], ['lg', 16], ['xl', 20], ['2xl', 24], ['full', 9999]]
    : [['sm', 4], ['md', 6], ['lg', 8], ['xl', 12], ['2xl', 16], ['full', 9999]];
  radii.forEach(([name, val]) => {
    tokens.push({ name: `radius.${name}`, type: 'border-radius', value: String(val), description: `${val}px radius` });
  });

  // Typography scale
  const fontSizes = [
    ['xs', 11], ['sm', 12], ['base', 13], ['md', 15], ['lg', 17],
    ['xl', 20], ['2xl', 24], ['3xl', 30], ['4xl', 36], ['5xl', 48], ['6xl', 60],
  ];
  fontSizes.forEach(([scale, px]) => {
    tokens.push({ name: `font.size.${scale}`, type: 'font-size', value: String(px), description: `${px}px` });
  });

  const weights = [['regular', 400], ['medium', 500], ['semibold', 600], ['bold', 700]];
  weights.forEach(([name, val]) => {
    tokens.push({ name: `font.weight.${name}`, type: 'font-weight', value: String(val), description: name });
  });

  return tokens;
}

function buildSemanticTokens(profile, accentName) {
  const a = accentName;
  if (profile === 'PRECISION') {
    return [
      { name: 'color.bg.primary',     type: 'color', value: '{color.white}',        description: 'Main background' },
      { name: 'color.bg.secondary',   type: 'color', value: '{color.slate.50}',     description: 'Panel/sidebar bg' },
      { name: 'color.bg.tertiary',    type: 'color', value: '{color.slate.100}',    description: 'Hover / subtle surface' },
      { name: 'color.bg.inverse',     type: 'color', value: '{color.slate.900}',    description: 'Dark section bg' },
      { name: 'color.bg.brand',       type: 'color', value: `{color.${a}.500}`,     description: 'Brand primary fill' },
      { name: 'color.text.primary',   type: 'color', value: '{color.slate.900}',    description: 'Main text' },
      { name: 'color.text.secondary', type: 'color', value: '{color.slate.600}',    description: 'Supporting text' },
      { name: 'color.text.tertiary',  type: 'color', value: '{color.slate.400}',    description: 'Placeholder / disabled labels' },
      { name: 'color.text.inverse',   type: 'color', value: '{color.white}',        description: 'Text on dark bg' },
      { name: 'color.text.link',      type: 'color', value: `{color.${a}.600}`,     description: 'Links' },
      { name: 'color.text.brand',     type: 'color', value: `{color.${a}.600}`,     description: 'Brand text' },
      { name: 'color.text.success',   type: 'color', value: '{color.emerald.600}',  description: 'Success text' },
      { name: 'color.text.warning',   type: 'color', value: '{color.amber.600}',    description: 'Warning text' },
      { name: 'color.text.error',     type: 'color', value: '{color.red.600}',      description: 'Error text' },
      { name: 'color.border.default', type: 'color', value: '{color.slate.200}',    description: 'Default border' },
      { name: 'color.border.strong',  type: 'color', value: '{color.slate.300}',    description: 'Strong border' },
      { name: 'color.border.focus',   type: 'color', value: `{color.${a}.500}`,     description: 'Focus ring' },
      { name: 'color.border.error',   type: 'color', value: '{color.red.500}',      description: 'Error border' },
      { name: 'color.interactive.primary',       type: 'color', value: `{color.${a}.500}`,  description: 'Primary btn fill' },
      { name: 'color.interactive.primary-hover', type: 'color', value: `{color.${a}.600}`,  description: 'Primary btn hover' },
      { name: 'color.interactive.primary-text',  type: 'color', value: '{color.white}',      description: 'Primary btn text' },
    ];
  }
  if (profile === 'DARK') {
    return [
      { name: 'color.bg.primary',     type: 'color', value: '{color.neutral.950}',   description: '#0A0A0B' },
      { name: 'color.bg.secondary',   type: 'color', value: '{color.neutral.900}',   description: '#111113' },
      { name: 'color.bg.surface',     type: 'color', value: '{color.neutral.850}',   description: '#141415' },
      { name: 'color.bg.elevated',    type: 'color', value: '{color.neutral.800}',   description: '#1A1A1E' },
      { name: 'color.text.primary',   type: 'color', value: '#FAFAF9',               description: 'Near-white text' },
      { name: 'color.text.secondary', type: 'color', value: '{color.zinc.400}',      description: 'Secondary text' },
      { name: 'color.text.tertiary',  type: 'color', value: '{color.zinc.600}',      description: 'Tertiary text' },
      { name: 'color.border.default', type: 'color', value: '{color.neutral.700}',   description: '#252527' },
      { name: 'color.border.strong',  type: 'color', value: '{color.neutral.600}',   description: '#3A3A3D' },
      { name: 'color.border.focus',   type: 'color', value: `{color.${a}.500}`,      description: 'Focus border' },
      { name: 'color.interactive.primary',       type: 'color', value: `{color.${a}.500}`, description: 'Primary btn' },
      { name: 'color.interactive.primary-hover', type: 'color', value: `{color.${a}.600}`, description: 'Primary btn hover' },
      { name: 'color.interactive.primary-text',  type: 'color', value: '{color.white}',     description: 'Primary btn text' },
    ];
  }
  return [];
}

// ─── Library typographies by profile ─────────────────────────────────────────
const TYPOGRAPHIES_PRECISION = [
  { name: 'Display/Large',  fontFamily: 'Inter', fontSize: 60, fontWeight: 700, lineHeight: 1.1,   letterSpacing: -0.03 },
  { name: 'Display/Medium', fontFamily: 'Inter', fontSize: 48, fontWeight: 700, lineHeight: 1.15,  letterSpacing: -0.03 },
  { name: 'Heading/H1',     fontFamily: 'Inter', fontSize: 36, fontWeight: 700, lineHeight: 1.2,   letterSpacing: -0.025 },
  { name: 'Heading/H2',     fontFamily: 'Inter', fontSize: 30, fontWeight: 600, lineHeight: 1.25,  letterSpacing: -0.02 },
  { name: 'Heading/H3',     fontFamily: 'Inter', fontSize: 24, fontWeight: 600, lineHeight: 1.3,   letterSpacing: -0.01 },
  { name: 'Heading/H4',     fontFamily: 'Inter', fontSize: 20, fontWeight: 600, lineHeight: 1.35,  letterSpacing: 0 },
  { name: 'Heading/H5',     fontFamily: 'Inter', fontSize: 17, fontWeight: 600, lineHeight: 1.4,   letterSpacing: 0 },
  { name: 'Body/Large',     fontFamily: 'Inter', fontSize: 17, fontWeight: 400, lineHeight: 1.625, letterSpacing: 0 },
  { name: 'Body/Base',      fontFamily: 'Inter', fontSize: 15, fontWeight: 400, lineHeight: 1.6,   letterSpacing: 0 },
  { name: 'Body/Small',     fontFamily: 'Inter', fontSize: 13, fontWeight: 400, lineHeight: 1.5,   letterSpacing: 0 },
  { name: 'Label/Large',    fontFamily: 'Inter', fontSize: 14, fontWeight: 500, lineHeight: 1.25,  letterSpacing: 0 },
  { name: 'Label/Base',     fontFamily: 'Inter', fontSize: 13, fontWeight: 500, lineHeight: 1.25,  letterSpacing: 0 },
  { name: 'Label/Small',    fontFamily: 'Inter', fontSize: 12, fontWeight: 500, lineHeight: 1.25,  letterSpacing: 0 },
  { name: 'Caption',        fontFamily: 'Inter', fontSize: 12, fontWeight: 400, lineHeight: 1.4,   letterSpacing: 0 },
  { name: 'Overline',       fontFamily: 'Inter', fontSize: 11, fontWeight: 600, lineHeight: 1.25,  letterSpacing: 0.08 },
];

// ─── Main execution ───────────────────────────────────────────────────────────
async function run() {
  if (MODE === 'tokens') {
    const catalog = penpot.library.local.tokens;
    if (!catalog) return { error: 'TokenCatalog not available. Proceed with library-only mode.' };

    let existing = [];
    try { existing = Object.values(catalog); } catch (_) {}
    const existingByName = new Map(existing.map(t => [t.name, t]));

    const globalTokens = buildGlobalTokens(PROFILE, ACCENT);
    const semanticTokens = buildSemanticTokens(PROFILE, ACCENT);
    const allTokens = [...globalTokens, ...semanticTokens];

    const created = [], skipped = [], errors = [];
    for (const def of allTokens) {
      if (existingByName.has(def.name)) { skipped.push(def.name); continue; }
      try {
        const t = await catalog.createToken({ name: def.name, type: def.type, value: String(def.value), description: def.description || '' });
        created.push({ name: t.name, id: t.id });
        existingByName.set(def.name, t);
      } catch (e) { errors.push({ name: def.name, error: e.message }); }
    }
    return { runId: RUN_ID, mode: 'tokens', created: created.length, skipped: skipped.length, errors };
  }

  if (MODE === 'library') {
    const library = penpot.library.local;
    const existingColors = new Map(library.colors.map(c => [c.name, c]));
    const existingTypos = new Map(library.typographies.map(t => [t.name, t]));

    // ── Library colors: build semantic map ──────────────────────────────────
    const PRECISION_LIGHT_COLORS = {
      'color/bg/primary':   { hex: '#FFFFFF', opacity: 1 },
      'color/bg/secondary': { hex: '#F8FAFC', opacity: 1 },
      'color/bg/tertiary':  { hex: '#F1F5F9', opacity: 1 },
      'color/bg/inverse':   { hex: '#0F172A', opacity: 1 },
      [`color/bg/brand`]:   { hex: ACCENT === 'indigo' ? '#6366F1' : ACCENT === 'violet' ? '#8B5CF6' : ACCENT === 'teal' ? '#14B8A6' : '#F97316', opacity: 1 },
      'color/text/primary':   { hex: '#0F172A', opacity: 1 },
      'color/text/secondary': { hex: '#475569', opacity: 1 },
      'color/text/tertiary':  { hex: '#94A3B8', opacity: 1 },
      'color/text/inverse':   { hex: '#FFFFFF', opacity: 1 },
      'color/border/default': { hex: '#E2E8F0', opacity: 1 },
      'color/border/strong':  { hex: '#CBD5E1', opacity: 1 },
      'color/border/focus':   { hex: ACCENT === 'indigo' ? '#6366F1' : '#8B5CF6', opacity: 1 },
      'color/interactive/primary':      { hex: ACCENT === 'indigo' ? '#6366F1' : '#8B5CF6', opacity: 1 },
      'color/interactive/primary-hover':{ hex: ACCENT === 'indigo' ? '#4F46E5' : '#7C3AED', opacity: 1 },
      'color/interactive/primary-text': { hex: '#FFFFFF', opacity: 1 },
      'color/feedback/success':  { hex: '#10B981', opacity: 1 },
      'color/feedback/warning':  { hex: '#F59E0B', opacity: 1 },
      'color/feedback/error':    { hex: '#EF4444', opacity: 1 },
      'color/feedback/success-bg':{ hex: '#ECFDF5', opacity: 1 },
      'color/feedback/warning-bg':{ hex: '#FFFBEB', opacity: 1 },
      'color/feedback/error-bg':  { hex: '#FEF2F2', opacity: 1 },
    };
    const DARK_COLORS = {
      'color/bg/primary':    { hex: '#0A0A0B', opacity: 1 },
      'color/bg/secondary':  { hex: '#111113', opacity: 1 },
      'color/bg/surface':    { hex: '#141415', opacity: 1 },
      'color/bg/elevated':   { hex: '#1A1A1E', opacity: 1 },
      'color/text/primary':  { hex: '#FAFAF9', opacity: 1 },
      'color/text/secondary':{ hex: '#A1A1AA', opacity: 1 },
      'color/text/tertiary': { hex: '#52525B', opacity: 1 },
      'color/border/default':{ hex: '#252527', opacity: 1 },
      'color/border/strong': { hex: '#3A3A3D', opacity: 1 },
      'color/border/focus':  { hex: '#8B5CF6', opacity: 1 },
      'color/interactive/primary':      { hex: '#8B5CF6', opacity: 1 },
      'color/interactive/primary-hover':{ hex: '#7C3AED', opacity: 1 },
      'color/interactive/primary-text': { hex: '#FFFFFF', opacity: 1 },
    };

    const colorMap = PROFILE === 'DARK' ? DARK_COLORS : PRECISION_LIGHT_COLORS;
    const createdColors = [], skippedColors = [], errorColors = [];

    for (const [name, { hex, opacity }] of Object.entries(colorMap)) {
      if (existingColors.has(name)) { skippedColors.push(name); continue; }
      try {
        const c = library.createColor();
        c.name = name;
        c.color = hex;
        c.opacity = opacity;
        createdColors.push({ name: c.name, id: c.id });
      } catch (e) { errorColors.push({ name, error: e.message }); }
    }

    // ── Library typographies ─────────────────────────────────────────────────
    const typoList = PROFILE === 'DARK'
      ? TYPOGRAPHIES_PRECISION.map(t => ({ ...t, fontFamily: 'Inter' }))
      : TYPOGRAPHIES_PRECISION;
    const createdTypos = [], skippedTypos = [];

    for (const def of typoList) {
      if (existingTypos.has(def.name)) { skippedTypos.push(def.name); continue; }
      try {
        const t = library.createTypography({
          name: def.name,
          fontFamily: def.fontFamily,
          fontSize: def.fontSize,
          fontWeight: def.fontWeight,
          lineHeight: def.lineHeight,
          letterSpacing: def.letterSpacing || 0,
        });
        createdTypos.push({ name: t.name, id: t.id });
      } catch (e) { /* skip silently */ }
    }

    return {
      runId: RUN_ID,
      mode: 'library',
      colors: { created: createdColors.length, skipped: skippedColors.length, errors: errorColors },
      typographies: { created: createdTypos.length, skipped: skippedTypos.length },
    };
  }
}

return await run();
