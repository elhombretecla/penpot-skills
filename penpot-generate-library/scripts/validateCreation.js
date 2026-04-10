/**
 * validateCreation.js
 *
 * Validates that expected entities were correctly created in Penpot.
 * Checks shapes by plugin data key, tokens by name, library colors by name,
 * and typographies by name. Returns a structured pass/fail report.
 *
 * Usage: run at the end of each phase, after a component build, or on demand.
 * This script is read-only — it makes no mutations.
 */

const page = penpot.currentPage;
const library = penpot.library.local;

// ── Validation Checks ────────────────────────────────────────────────────────

/**
 * Check that a shape with the given plugin data key exists on the current page.
 *
 * @param {string} key — dsb key (e.g. "component/button/container")
 * @param {Object} [expectations]
 * @param {string} [expectations.type]        — expected shape type ("frame", "text", etc.)
 * @param {string} [expectations.name]        — expected shape name
 * @param {number} [expectations.minChildren] — minimum child count
 * @returns {{ passed: boolean, id?: string, reason?: string }}
 */
function checkShape(key, expectations = {}) {
  const shapes = page.findShapes();
  const shape = shapes.find(s => s.getSharedPluginData('dsb', 'key') === key);

  if (!shape) {
    return { passed: false, key, reason: `Shape with key "${key}" not found on current page` };
  }

  const reasons = [];

  if (expectations.type && shape.type !== expectations.type) {
    reasons.push(`type: expected "${expectations.type}", got "${shape.type}"`);
  }

  if (expectations.name && shape.name !== expectations.name) {
    reasons.push(`name: expected "${expectations.name}", got "${shape.name}"`);
  }

  if (expectations.minChildren !== undefined) {
    const childCount = shape.findShapes ? shape.findShapes().filter(s => s.parentId === shape.id).length : 0;
    if (childCount < expectations.minChildren) {
      reasons.push(`children: expected >= ${expectations.minChildren}, got ${childCount}`);
    }
  }

  if (reasons.length > 0) {
    return { passed: false, key, id: shape.id, reason: reasons.join('; ') };
  }

  return { passed: true, key, id: shape.id, name: shape.name };
}

/**
 * Check that a token with the given name exists in the catalog.
 *
 * @param {string} tokenName
 * @param {Object} [expectations]
 * @param {string} [expectations.type]  — expected token type
 * @param {string} [expectations.value] — expected token value (exact match)
 * @returns {{ passed: boolean, id?: string, reason?: string }}
 */
function checkToken(tokenName, expectations = {}) {
  const catalog = library.tokens;
  if (!catalog) {
    return { passed: false, tokenName, reason: 'TokenCatalog not available' };
  }

  const tokens = typeof catalog === 'object' ? Object.values(catalog) : [];
  const token = tokens.find(t => t.name === tokenName);

  if (!token) {
    return { passed: false, tokenName, reason: `Token "${tokenName}" not found` };
  }

  const reasons = [];

  if (expectations.type && token.type !== expectations.type) {
    reasons.push(`type: expected "${expectations.type}", got "${token.type}"`);
  }

  if (expectations.value && token.value !== expectations.value) {
    reasons.push(`value: expected "${expectations.value}", got "${token.value}"`);
  }

  if (reasons.length > 0) {
    return { passed: false, tokenName, id: token.id, reason: reasons.join('; ') };
  }

  return { passed: true, tokenName, id: token.id, type: token.type, value: token.value };
}

/**
 * Check that a library color exists.
 *
 * @param {string} colorName
 * @param {string} [expectedHex]
 * @returns {{ passed: boolean, id?: string, reason?: string }}
 */
function checkLibraryColor(colorName, expectedHex) {
  const color = library.colors.find(c => c.name === colorName);
  if (!color) {
    return { passed: false, colorName, reason: `Library color "${colorName}" not found` };
  }

  if (expectedHex && color.color.toLowerCase() !== expectedHex.toLowerCase()) {
    return {
      passed: false,
      colorName,
      id: color.id,
      reason: `color value: expected "${expectedHex}", got "${color.color}"`
    };
  }

  return { passed: true, colorName, id: color.id, color: color.color };
}

/**
 * Check that a library typography exists.
 *
 * @param {string} typoName
 * @returns {{ passed: boolean, id?: string, reason?: string }}
 */
function checkLibraryTypography(typoName) {
  const typo = library.typographies.find(t => t.name === typoName);
  if (!typo) {
    return { passed: false, typoName, reason: `Typography "${typoName}" not found` };
  }
  return { passed: true, typoName, id: typo.id, fontFamily: typo.fontFamily, fontSize: typo.fontSize };
}

/**
 * Check that a page exists.
 * @param {string} pageName
 * @returns {{ passed: boolean, id?: string, reason?: string }}
 */
function checkPage(pageName) {
  const p = penpot.pages.find(p => p.name === pageName);
  if (!p) {
    return { passed: false, pageName, reason: `Page "${pageName}" not found` };
  }
  return { passed: true, pageName, id: p.id };
}

// ── Run Validation Suite ──────────────────────────────────────────────────────

/**
 * Runs a full validation suite.
 * @param {Object} checks
 * @param {Array<{key: string, expectations?: Object}>} [checks.shapes]
 * @param {Array<{name: string, expectations?: Object}>} [checks.tokens]
 * @param {Array<{name: string, hex?: string}>} [checks.colors]
 * @param {Array<string>} [checks.typographies]
 * @param {Array<string>} [checks.pages]
 * @returns {{ passed: Object[], failed: Object[], summary: Object }}
 */
function validateCreation(checks) {
  const passed = [];
  const failed = [];

  function record(result) {
    if (result.passed) {
      passed.push(result);
    } else {
      failed.push(result);
    }
  }

  for (const c of (checks.shapes || [])) {
    record(checkShape(c.key, c.expectations || {}));
  }

  for (const c of (checks.tokens || [])) {
    record(checkToken(c.name, c.expectations || {}));
  }

  for (const c of (checks.colors || [])) {
    record(checkLibraryColor(c.name, c.hex));
  }

  for (const typoName of (checks.typographies || [])) {
    record(checkLibraryTypography(typoName));
  }

  for (const pageName of (checks.pages || [])) {
    record(checkPage(pageName));
  }

  return {
    passed,
    failed,
    summary: {
      totalChecks: passed.length + failed.length,
      passCount: passed.length,
      failCount: failed.length,
      allPassed: failed.length === 0,
    },
  };
}

// ── Example: Phase 1 validation ───────────────────────────────────────────────

const PHASE1_CHECKS = {
  tokens: [
    { name: 'color.blue.500', expectations: { type: 'color', value: '#3B82F6' } },
    { name: 'color.gray.900', expectations: { type: 'color' } },
    { name: 'color.white',    expectations: { type: 'color', value: '#FFFFFF' } },
    { name: 'color.bg.primary', expectations: { type: 'color' } },   // semantic — value is expression
    { name: 'spacing.md',    expectations: { type: 'spacing', value: '16' } },
    { name: 'spacing.lg',    expectations: { type: 'spacing', value: '24' } },
    { name: 'radius.md',     expectations: { type: 'border-radius', value: '8' } },
  ],
  colors: [
    { name: 'color/brand/primary',   hex: '#3B82F6' },
    { name: 'color/bg/primary',      hex: '#FFFFFF' },
    { name: 'color/text/primary',    hex: '#111827' },
    { name: 'color/border/default',  hex: '#E5E7EB' },
  ],
  typographies: [
    'Body/MD',
    'Body/SM',
    'Heading/LG',
    'Label/MD',
    'Caption/MD',
  ],
  pages: [
    'Cover',
    'Getting Started',
    'Foundations',
    'Components',
  ],
};

// Uncomment to run phase 1 checks:
// return validateCreation(PHASE1_CHECKS);

// ── Example: Button component validation ─────────────────────────────────────

const BUTTON_CHECKS = {
  shapes: [
    { key: 'component/button/container', expectations: { type: 'frame' } },
    { key: 'component/button/variant/small-primary-default' },
    { key: 'component/button/variant/medium-primary-default' },
    { key: 'component/button/variant/large-primary-default' },
    { key: 'doc/component/button' },
  ],
};

return validateCreation(BUTTON_CHECKS);
