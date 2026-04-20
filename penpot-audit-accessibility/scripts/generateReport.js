/**
 * generateReport.js
 *
 * Phase 3 — Compile all accessibility findings into a structured Markdown report.
 * Runs in Claude's context (NOT in execute_code).
 *
 * Input: results from all Phase 2 analysis functions
 * Output: Markdown string ready to present to the user
 *
 * Usage:
 *   const report = generateReport({ contrastResults, targetResults, textResults, headingResults, imageResults, colorOnlyResults, focusResults, meta });
 */

function severityIcon(severity) {
  const icons = { critical: '❌', major: '⚠️', minor: '💡', pass: '✅', unknown: '❔' };
  return icons[severity?.toLowerCase()] || '•';
}

function generateReport({
  meta,           // { fileName, pageName, date, targetLevel }
  contrastResults,
  targetResults,
  textResults,    // { fontSizeFailures, spacingFailures }
  headingResults, // { issues, hierarchy }
  imageResults,   // { missing, decorativeMarked }
  colorOnlyResults,
  focusResults,
}) {
  const lines = [];

  // ── Header ───────────────────────────────────────────────────────────────
  lines.push(`# Accessibility Audit Report`);
  lines.push(``);
  lines.push(`**File**: ${meta.fileName}`);
  lines.push(`**Page**: ${meta.pageName}`);
  lines.push(`**Date**: ${meta.date}`);
  lines.push(`**Target level**: ${meta.targetLevel || 'WCAG 2.1 AA'}`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);

  // ── Summary table ─────────────────────────────────────────────────────────
  lines.push(`## Summary`);
  lines.push(``);
  lines.push(`| Category | ❌ Critical | ⚠️ Major | 💡 Minor | ✅ Pass |`);
  lines.push(`|----------|------------|---------|---------|---------|`);

  const contrastCritical = contrastResults.failures.filter(f => f.severity === 'Critical').length;
  const contrastMajor = contrastResults.failures.filter(f => f.severity === 'Major').length;
  lines.push(`| Color Contrast (1.4.3) | ${contrastCritical} | ${contrastMajor} | 0 | ${contrastResults.passCount} |`);

  const targetCritical = targetResults.failures.filter(f => f.severity === 'critical').length;
  const targetMajor = targetResults.failures.filter(f => f.severity === 'major').length;
  const targetMinor = targetResults.failures.filter(f => f.severity === 'minor').length;
  lines.push(`| Touch Targets (2.5.5/2.5.8) | ${targetCritical} | ${targetMajor} | ${targetMinor} | ${targetResults.passCount} |`);

  const fontIssues = textResults?.fontSizeFailures?.length || 0;
  const spacingIssues = textResults?.spacingFailures?.length || 0;
  lines.push(`| Text Legibility (1.4.4/1.4.12) | 0 | ${fontIssues} | ${spacingIssues} | - |`);

  const headingIssues = headingResults?.issues?.length || 0;
  lines.push(`| Heading Hierarchy (1.3.1/2.4.6) | 0 | ${headingIssues} | 0 | ${headingIssues === 0 ? 1 : 0} |`);

  const missingFocus = focusResults?.filter(f => !f.hasFocusVariant).length || 0;
  lines.push(`| Focus Indicators (2.4.7/2.4.11) | 0 | ${missingFocus} | 0 | ${focusResults?.filter(f => f.hasFocusVariant).length || 0} |`);

  const missingAlt = imageResults?.missing?.length || 0;
  lines.push(`| Images & Alt Text (1.1.1) | ${missingAlt} | 0 | 0 | ${imageResults?.decorativeMarked || 0} |`);

  const colorOnly = colorOnlyResults?.length || 0;
  lines.push(`| Use of Color (1.4.1) | 0 | ${colorOnly} | 0 | - |`);

  lines.push(``);
  lines.push(`---`);
  lines.push(``);

  // ── Findings ───────────────────────────────────────────────────────────────
  const allFindings = [
    ...(contrastResults.failures.map(f => ({ ...f, category: 'Color Contrast' }))),
    ...(targetResults.failures.map(f => ({ ...f, category: 'Touch Targets' }))),
    ...((textResults?.fontSizeFailures || []).map(f => ({ ...f, category: 'Text Legibility' }))),
    ...((headingResults?.issues || []).map(f => ({ ...f, category: 'Heading Hierarchy' }))),
    ...((focusResults?.filter(f => !f.hasFocusVariant) || []).map(f => ({
      ...f,
      severity: 'major',
      criterion: '2.4.7',
      category: 'Focus Indicators',
      message: `${f.name} has no focus state variant in the component library`,
      fix: `Add a :focus or focused variant to the ${f.name} component`,
    }))),
    ...((imageResults?.missing || []).map(f => ({
      ...f,
      severity: 'critical',
      criterion: '1.1.1',
      category: 'Images & Alt Text',
      message: `${f.name} has no alt text annotation`,
      fix: `Add alt text via plugin data: shape.setPluginData('alt', 'Description here'). Mark decorative images with setPluginData('decorative', 'true').`,
    }))),
    ...((colorOnlyResults || []).map(f => ({
      ...f,
      severity: 'major',
      criterion: '1.4.1',
      category: 'Use of Color',
      message: `${f.name} (${f.fillColor}) appears to convey information via color only`,
      fix: `Add an icon, text label, or pattern alongside the color to convey the same information`,
    }))),
  ];

  // Sort by severity
  const severityOrder = { critical: 0, major: 1, minor: 2 };
  allFindings.sort((a, b) =>
    (severityOrder[a.severity?.toLowerCase()] ?? 3) -
    (severityOrder[b.severity?.toLowerCase()] ?? 3)
  );

  if (allFindings.length > 0) {
    lines.push(`## Findings`);
    lines.push(``);

    for (const finding of allFindings) {
      const icon = severityIcon(finding.severity);
      const sev = (finding.severity || 'unknown').charAt(0).toUpperCase() + (finding.severity || '').slice(1);
      lines.push(`### ${icon} ${sev} — [WCAG ${finding.criterion}] ${finding.category}`);
      lines.push(`**Element**: \`${finding.name}\``);
      if (finding.ratio) lines.push(`**Contrast ratio**: ${finding.ratio}:1 (required: ${finding.aaRequired}:1)`);
      if (finding.textColor) lines.push(`**Text color**: ${finding.textColor} | **Background**: ${finding.bgColor || 'unknown'}`);
      if (finding.message) lines.push(`**Issue**: ${finding.message}`);
      if (finding.fix) lines.push(`**Fix**: ${finding.fix}`);
      lines.push(``);
    }

    lines.push(`---`);
    lines.push(``);
  }

  // ── Passes ─────────────────────────────────────────────────────────────────
  lines.push(`## Passes`);
  lines.push(``);
  if (contrastResults.passCount > 0) lines.push(`✅ **Color contrast**: ${contrastResults.passCount} text nodes pass WCAG AA`);
  if (targetResults.passCount > 0) lines.push(`✅ **Touch targets**: ${targetResults.passCount} interactive elements meet 44×44px`);
  if (headingResults?.issues?.length === 0) lines.push(`✅ **Heading hierarchy**: correct heading sequence found`);
  if (missingFocus === 0 && focusResults?.length > 0) lines.push(`✅ **Focus indicators**: all interactive components have focus variants`);
  if (missingAlt === 0 && imageResults?.missing?.length === 0) lines.push(`✅ **Alt text**: all images have annotations or are marked decorative`);
  lines.push(``);

  // ── Priority recommendations ───────────────────────────────────────────────
  if (allFindings.length > 0) {
    lines.push(`---`);
    lines.push(``);
    lines.push(`## Priority Recommendations`);
    lines.push(``);
    allFindings.slice(0, 5).forEach((f, i) => {
      lines.push(`${i + 1}. **${f.category}** — \`${f.name}\` (${f.severity})`);
    });
    lines.push(``);
  }

  return lines.join('\n');
}

// ─── Example usage ────────────────────────────────────────────────────────
// const report = generateReport({ meta, contrastResults, targetResults, textResults, headingResults, imageResults, colorOnlyResults, focusResults });
// Present report to user
