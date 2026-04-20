/**
 * checkTouchTargets.js
 *
 * Phase 2b — Analyze interactive elements for WCAG 2.5.5 / 2.5.8 compliance.
 * Runs in Claude's context (NOT in execute_code).
 * Feed it the interactiveElements array from collectAccessibilityData.js.
 *
 * Also checks for adequate spacing between small targets (WCAG 2.5.8).
 */

function classifyTarget(element) {
  const { width, height } = element;
  if (width >= 44 && height >= 44) {
    return { severity: 'pass', criterion: '2.5.5', message: `${width}×${height}px — passes 44×44px (AAA)` };
  }
  if (width >= 24 && height >= 24) {
    return {
      severity: 'minor',
      criterion: '2.5.8',
      message: `${width}×${height}px — passes 24×24px minimum (AA) but misses 44×44px (AAA)`,
      fix: `Increase to 44×44px or ensure ≥ 8px spacing between adjacent targets`,
    };
  }
  return {
    severity: width < 20 && height < 20 ? 'critical' : 'major',
    criterion: '2.5.5',
    message: `${width}×${height}px — below 24×24px minimum`,
    fix: `Increase to at least 44×44px. For icon-only buttons, add transparent padding to reach 44×44px hit area.`,
  };
}

function checkSpacingBetweenTargets(elements) {
  const issues = [];
  // Group by approximate Y row (within 8px)
  const sorted = [...elements].sort((a, b) => a.x - b.x);

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (Math.abs(a.y - b.y) > 20) continue; // different rows

    const gap = b.x - (a.x + a.width);
    if (gap < 8 && (a.width < 44 || a.height < 44 || b.width < 44 || b.height < 44)) {
      issues.push({
        elements: [a.name, b.name],
        gap: Math.max(0, gap),
        severity: gap < 0 ? 'critical' : 'major',
        criterion: '2.5.8',
        message: `${a.name} and ${b.name} are ${gap}px apart — small targets need ≥ 8px spacing`,
        fix: 'Increase spacing between these interactive elements to at least 8px',
      });
    }
  }

  return issues;
}

function analyzeTouchTargets(interactiveElements) {
  const failures = [];
  const passes = [];
  const spacingIssues = checkSpacingBetweenTargets(interactiveElements);

  for (const element of interactiveElements) {
    const result = classifyTarget(element);
    const finding = { id: element.id, name: element.name, ...element, ...result };
    if (result.severity === 'pass') {
      passes.push(finding);
    } else {
      failures.push(finding);
    }
  }

  failures.sort((a, b) => {
    const order = { critical: 0, major: 1, minor: 2 };
    return (order[a.severity] || 3) - (order[b.severity] || 3);
  });

  return {
    totalChecked: interactiveElements.length,
    failureCount: failures.length,
    passCount: passes.length,
    spacingIssueCount: spacingIssues.length,
    failures,
    passes,
    spacingIssues,
  };
}

// ─── Example usage ────────────────────────────────────────────────────────
// const results = analyzeTouchTargets(interactiveElements);
// console.log(`Target failures: ${results.failureCount}, Spacing issues: ${results.spacingIssueCount}`);
