/**
 * checkColorContrast.js
 *
 * Phase 2a — Local contrast ratio analysis.
 * This script runs in Claude's context (NOT in execute_code).
 * Feed it the textNodes array from collectAccessibilityData.js.
 *
 * Usage:
 *   const results = analyzeContrast(textNodes);
 *   // results.failures → array of failing text nodes with ratios and fix suggestions
 *   // results.passes → array of passing nodes
 *   // results.unknown → nodes where background couldn't be determined
 */

// ─── W3C Relative Luminance ────────────────────────────────────────────────
function hexToLinearRGB(hex) {
  const h = hex.replace('#', '');
  const toLinear = (c8bit) => {
    const c = c8bit / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return {
    r: toLinear(parseInt(h.slice(0, 2), 16)),
    g: toLinear(parseInt(h.slice(2, 4), 16)),
    b: toLinear(parseInt(h.slice(4, 6), 16)),
  };
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToLinearRGB(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function blendWithBackground(fgHex, fgOpacity, bgHex) {
  const fg = hexToLinearRGB(fgHex);
  const bg = hexToLinearRGB(bgHex);
  const blended = {
    r: fgOpacity * fg.r + (1 - fgOpacity) * bg.r,
    g: fgOpacity * fg.g + (1 - fgOpacity) * bg.g,
    b: fgOpacity * fg.b + (1 - fgOpacity) * bg.b,
  };
  const to255 = (c) => Math.round(c * 255);
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(to255(blended.r))}${toHex(to255(blended.g))}${toHex(to255(blended.b))}`;
}

function isLargeText(fontSize, fontWeight) {
  // WCAG: large text = ≥ 18pt (24px) normal OR ≥ 14pt (~18.67px) bold
  return fontSize >= 24 || (fontSize >= 18.67 && fontWeight >= 700);
}

function classifyContrast(ratio, fontSize, fontWeight) {
  const large = isLargeText(fontSize, fontWeight);
  const aaRequired = large ? 3.0 : 4.5;
  const aaaRequired = large ? 4.5 : 7.0;
  return {
    ratio: Math.round(ratio * 100) / 100,
    isLargeText: large,
    aaPass: ratio >= aaRequired,
    aaaPass: ratio >= aaaRequired,
    aaRequired,
    aaaRequired,
    wcagLevel: ratio >= aaaRequired ? 'AAA' : ratio >= aaRequired ? 'AA' : 'FAIL',
  };
}

// ─── Main analysis function ────────────────────────────────────────────────
function analyzeContrast(textNodes) {
  const failures = [];
  const passes = [];
  const unknown = [];

  for (const node of textNodes) {
    if (!node.textColor) {
      unknown.push({ ...node, reason: 'No text fill color found' });
      continue;
    }
    if (!node.bgColor) {
      unknown.push({ ...node, reason: 'No background color found — manual check required' });
      continue;
    }

    // Apply opacity blending if needed
    const effectiveTextColor = node.textOpacity < 1
      ? blendWithBackground(node.textColor, node.textOpacity, node.bgColor)
      : node.textColor;
    const effectiveBgColor = node.bgOpacity < 1
      ? blendWithBackground(node.bgColor, node.bgOpacity, '#FFFFFF') // assume white page bg
      : node.bgColor;

    const ratio = contrastRatio(effectiveTextColor, effectiveBgColor);
    const classification = classifyContrast(ratio, node.fontSize, node.fontWeight);

    const finding = {
      id: node.id,
      name: node.name,
      characters: node.characters,
      fontSize: node.fontSize,
      fontWeight: node.fontWeight,
      textColor: node.textColor,
      bgColor: node.bgColor,
      bgSource: node.bgSource,
      ...classification,
    };

    if (classification.aaPass) {
      passes.push(finding);
    } else {
      failures.push({
        ...finding,
        severity: ratio < 3.0 ? 'Critical' : 'Major',
        criterion: '1.4.3',
        fix: `Current ratio: ${finding.ratio}:1. Need ${classification.aaRequired}:1 for AA. ` +
          `Try darkening the text color or lightening the background.`,
      });
    }
  }

  // Sort failures by severity (Critical first)
  failures.sort((a, b) => (a.ratio - b.ratio));

  return {
    totalChecked: textNodes.length,
    failureCount: failures.length,
    passCount: passes.length,
    unknownCount: unknown.length,
    failures,
    passes,
    unknown,
  };
}

// ─── Example usage ────────────────────────────────────────────────────────
// Replace textNodes with the array from collectAccessibilityData.js output
// const results = analyzeContrast(textNodes);
// console.log(`Failures: ${results.failureCount}, Passes: ${results.passCount}`);
