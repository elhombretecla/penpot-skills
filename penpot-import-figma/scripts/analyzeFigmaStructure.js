/**
 * analyzeFigmaStructure.js
 *
 * Phase 0 — Analysis helper. NOT an execute_code script.
 * This is a data-processing template Claude uses to parse and summarize
 * Figma MCP tool responses into a structured format ready for IR building.
 *
 * Usage:
 *   1. Call Figma MCP tools: get_metadata, get_variable_defs
 *   2. Feed the responses into these functions to produce a structured analysis
 *   3. Present the summary to the user as the scope lock document
 *
 * This script runs in Claude's reasoning context, NOT in Penpot execute_code.
 */

/**
 * Parse get_metadata response into a structured file summary.
 * @param {object} metadataResponse - Raw response from Figma get_metadata
 */
function parseMetadata(metadataResponse) {
  // Figma metadata typically contains:
  // - name: file name
  // - key: file key
  // - lastModified: ISO timestamp
  // - pages: array of page names
  // - components: published component count (if a library)

  const pages = metadataResponse.pages || metadataResponse.document?.children || [];
  const pageNames = pages.map(p => p.name || p);

  // Classify pages by likely purpose
  const libraryPages = pageNames.filter(n =>
    ['component', 'design system', 'library', 'tokens', 'foundations', 'atoms', 'molecules'].some(k =>
      n.toLowerCase().includes(k)
    )
  );
  const screenPages = pageNames.filter(n =>
    !libraryPages.includes(n) &&
    !['archive', '_scratch', 'scratch', 'spec', 'prototype', 'motion', 'flows', 'wip', 'old'].some(k =>
      n.toLowerCase().includes(k)
    )
  );
  const ignoredPages = pageNames.filter(n =>
    !libraryPages.includes(n) && !screenPages.includes(n)
  );

  return {
    fileName: metadataResponse.name || 'Unknown',
    fileKey: metadataResponse.key || metadataResponse.id || 'Unknown',
    lastModified: metadataResponse.lastModified,
    totalPages: pageNames.length,
    pages: pageNames,
    classification: {
      libraryPages,
      screenPages,
      ignoredPages,
    },
    publishedComponentCount: metadataResponse.components
      ? Object.keys(metadataResponse.components).length
      : 0,
  };
}

/**
 * Parse get_variable_defs response into a structured token inventory.
 * @param {object} variableDefsResponse - Raw response from Figma get_variable_defs
 */
function parseVariableDefs(variableDefsResponse) {
  const collections = variableDefsResponse.meta?.variableCollections ||
                      variableDefsResponse.variableCollections ||
                      {};
  const variables = variableDefsResponse.meta?.variables ||
                    variableDefsResponse.variables ||
                    {};

  const tokenSets = {};
  const translationGaps = [];

  // Process each collection
  for (const [collectionId, collection] of Object.entries(collections)) {
    const collectionName = collection.name;
    const modes = collection.modes || [];

    for (const mode of modes) {
      const setKey = modes.length === 1
        ? normalizeName(collectionName)           // single mode → use collection name
        : `${normalizeName(collectionName)}/${normalizeName(mode.name)}`;

      if (!tokenSets[setKey]) tokenSets[setKey] = [];

      // Find all variables in this collection
      for (const [varId, variable] of Object.entries(variables)) {
        if (variable.variableCollectionId !== collectionId) continue;

        const modeValue = variable.valuesByMode?.[mode.modeId];
        if (modeValue === undefined) continue;

        const tokenName = buildTokenName(collectionName, variable.name);
        const tokenType = inferTokenType(variable.resolvedType, variable.name, collectionName);

        let tokenValue;
        let isAlias = false;

        // Check if value is an alias (variable reference)
        if (modeValue && typeof modeValue === 'object' && modeValue.type === 'VARIABLE_ALIAS') {
          const referencedVar = variables[modeValue.id];
          if (referencedVar) {
            const refName = buildTokenName(
              collections[referencedVar.variableCollectionId]?.name || '',
              referencedVar.name
            );
            tokenValue = `{${refName}}`;
            isAlias = true;
          } else {
            translationGaps.push({
              type: 'unresolved-alias',
              variableId: varId,
              name: variable.name,
              reason: 'Alias references a variable not in the current file',
              resolution: 'manual',
            });
            tokenValue = '#000000'; // fallback
          }
        } else {
          tokenValue = resolveRawValue(modeValue, variable.resolvedType);
        }

        if (tokenType === 'UNSUPPORTED') {
          translationGaps.push({
            type: 'unsupported-variable-type',
            variableId: varId,
            name: variable.name,
            figmaType: variable.resolvedType,
            resolution: 'skip',
          });
          continue;
        }

        tokenSets[setKey].push({
          figmaVariableId: varId,
          figmaCollectionId: collectionId,
          name: tokenName,
          type: tokenType,
          value: tokenValue,
          isAlias,
          penpotStatus: 'pending',
        });
      }
    }
  }

  // Build themes (one per collection that has multiple modes)
  const themes = [];
  for (const [collectionId, collection] of Object.entries(collections)) {
    const modes = collection.modes || [];
    if (modes.length > 1) {
      // This collection has multiple modes → becomes a theme
      for (const mode of modes) {
        const themeName = mode.name; // e.g., "Light", "Dark"
        const existingTheme = themes.find(t => t.name === themeName);
        const setKey = `${normalizeName(collection.name)}/${normalizeName(mode.name)}`;

        if (existingTheme) {
          existingTheme.activeSets.push(setKey);
        } else {
          // Find base sets (collections with single modes) — always active
          const baseSets = Object.entries(collections)
            .filter(([, c]) => (c.modes || []).length === 1)
            .map(([, c]) => normalizeName(c.name));

          themes.push({
            name: themeName,
            activeSets: [...baseSets, setKey],
          });
        }
      }
    }
  }

  return {
    tokenSets,
    themes,
    totalTokens: Object.values(tokenSets).reduce((sum, set) => sum + set.length, 0),
    totalSets: Object.keys(tokenSets).length,
    translationGaps,
  };
}

/**
 * Parse get_design_context response for a component node into a component spec.
 * @param {object} contextResponse - Raw response from Figma get_design_context
 * @param {string} figmaNodeId - The Figma node ID queried
 */
function parseComponentSpec(contextResponse, figmaNodeId) {
  // get_design_context returns structured node info
  // Exact shape depends on Figma MCP version — adapt as needed
  const node = contextResponse.nodes?.[figmaNodeId] || contextResponse;

  const isVariantSet = node.type === 'COMPONENT_SET';
  const variants = [];

  if (isVariantSet && node.children) {
    for (const child of node.children) {
      if (child.type !== 'COMPONENT') continue;
      const properties = parseVariantProperties(child.name); // e.g., "Style=Primary, Size=Medium"
      variants.push({
        figmaId: child.id,
        properties,
        width: child.absoluteBoundingBox?.width || 120,
        height: child.absoluteBoundingBox?.height || 40,
        fills: parseFills(child.fills, child.boundVariables),
        strokes: parseStrokes(child.strokes, child.boundVariables),
      });
    }
  }

  const layout = parseLayout(node);

  return {
    figmaId: figmaNodeId,
    name: node.name.split('/')[0].split(',')[0].trim(), // clean name
    path: extractPath(node.name),
    isVariantSet,
    variantAxes: isVariantSet ? extractVariantAxes(variants) : [],
    variants,
    layout,
    children: (node.children || [])
      .filter(c => !isVariantSet || c.type === 'COMPONENT')
      .map(c => parseChildSpec(c)),
    translationGaps: [],
    penpotStatus: 'pending',
    penpotComponentId: null,
  };
}

// ── Helper functions ──────────────────────────────────────────────────────────

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-/]/g, '')
    .replace(/-+/g, '-')
    .trim();
}

function buildTokenName(collectionName, variableName) {
  // Normalize collection prefix
  const collectionPrefix = normalizeName(collectionName)
    .replace('color-primitives', 'color')
    .replace('color-variables', 'color')
    .replace('semantic-colors', 'color')
    .replace('design-tokens', '');

  const varName = variableName
    .replace(/\//g, '.')
    .replace(/\s+/g, '.')
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '');

  // Avoid double prefix (e.g., "color.color.blue.500")
  if (varName.startsWith(collectionPrefix)) return varName;
  if (!collectionPrefix) return varName;
  return `${collectionPrefix}.${varName}`;
}

function inferTokenType(figmaType, variableName, collectionName) {
  if (figmaType === 'COLOR') return 'color';
  if (figmaType === 'BOOLEAN') return 'UNSUPPORTED';
  if (figmaType === 'STRING') return 'string';

  // FLOAT — infer from name
  const name = (variableName + ' ' + collectionName).toLowerCase();
  if (name.match(/\bspacing\b|\bgap\b|\bpadding\b|\bmargin\b/)) return 'spacing';
  if (name.match(/\bradius\b|\bcorner\b/)) return 'border-radius';
  if (name.match(/\bopacity\b|\balpha\b/)) return 'opacity';
  if (name.match(/\bsize\b|\bwidth\b|\bheight\b/)) return 'sizing';
  if (name.match(/\bborder-width\b|\bstroke-width\b/)) return 'border-width';
  if (name.match(/\bfont-size\b|\btypography.*size\b/)) return 'font-size';
  if (name.match(/\bfont-weight\b/)) return 'font-weight';
  if (name.match(/\bline-height\b/)) return 'line-height';
  if (name.match(/\bletter-spacing\b/)) return 'letter-spacing';
  return 'number';
}

function resolveRawValue(value, figmaType) {
  if (figmaType === 'COLOR') {
    if (typeof value === 'object' && 'r' in value) {
      const r = Math.round(value.r * 255).toString(16).padStart(2, '0');
      const g = Math.round(value.g * 255).toString(16).padStart(2, '0');
      const b = Math.round(value.b * 255).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    return '#000000';
  }
  return String(value);
}

function parseVariantProperties(frameName) {
  // Parses "Style=Primary, Size=Medium, State=Default" format
  const props = {};
  const pairs = frameName.split(',').map(s => s.trim());
  for (const pair of pairs) {
    const [key, val] = pair.split('=').map(s => s.trim());
    if (key && val) props[key] = val;
  }
  return props;
}

function extractVariantAxes(variants) {
  const axes = new Set();
  for (const v of variants) {
    Object.keys(v.properties).forEach(k => axes.add(k));
  }
  return [...axes];
}

function extractPath(componentName) {
  const parts = componentName.split('/');
  return parts.length > 1 ? parts.slice(0, -1).join('/') : '';
}

function parseLayout(node) {
  if (!node.layoutMode || node.layoutMode === 'NONE') {
    return { type: 'none' };
  }

  const dirMap = { HORIZONTAL: 'row', VERTICAL: 'column' };
  const alignMap = { MIN: 'start', CENTER: 'center', MAX: 'end', SPACE_BETWEEN: 'space-between', STRETCH: 'stretch', BASELINE: 'start' };
  const sizingMap = { FIXED: 'fixed', AUTO: 'fit-content', FILL: 'fill' };

  return {
    type: 'flex',
    dir: dirMap[node.layoutMode] || 'row',
    alignItems: alignMap[node.counterAxisAlignItems] || 'start',
    justifyContent: alignMap[node.primaryAxisAlignItems] || 'start',
    gap: node.itemSpacing || 0,
    padding: {
      top: node.paddingTop || 0,
      right: node.paddingRight || 0,
      bottom: node.paddingBottom || 0,
      left: node.paddingLeft || 0,
    },
    hSizing: sizingMap[node.primaryAxisSizingMode] || 'fixed',
    vSizing: sizingMap[node.counterAxisSizingMode] || 'fixed',
    wrap: node.layoutWrap === 'WRAP' ? 'wrap' : 'no-wrap',
  };
}

function parseFills(fills, boundVariables) {
  if (!fills) return [];
  return fills.map(f => ({
    type: 'solid',
    hex: resolveRawValue(f.color, 'COLOR'),
    opacity: f.opacity ?? 1,
    boundVariable: boundVariables?.fills?.[0]?.id || null,
  }));
}

function parseStrokes(strokes, boundVariables) {
  if (!strokes) return [];
  return strokes.map(s => ({
    type: s.strokeAlign || 'center',
    width: s.strokeWeight || 1,
    hex: resolveRawValue(s.color, 'COLOR'),
    opacity: s.opacity ?? 1,
    boundVariable: null,
  }));
}

function parseChildSpec(node) {
  return {
    figmaId: node.id,
    name: node.name,
    type: node.type, // FRAME, TEXT, INSTANCE, VECTOR, RECTANGLE, etc.
    componentRef: node.type === 'INSTANCE' ? node.componentId : null,
    layout: parseLayout(node),
    fills: parseFills(node.fills, node.boundVariables),
    strokes: parseStrokes(node.strokes, node.boundVariables),
    text: node.type === 'TEXT' ? {
      content: node.characters,
      fontFamily: node.style?.fontFamily,
      fontSize: node.style?.fontSize,
      fontWeight: node.style?.fontWeight,
      lineHeight: node.style?.lineHeightPx,
      textStyleId: node.styles?.text,
    } : null,
    children: (node.children || []).map(c => parseChildSpec(c)),
  };
}

// ── Export functions for use in Claude context ────────────────────────────────

module.exports = { parseMetadata, parseVariableDefs, parseComponentSpec };

// ── Quick scope summary builder ───────────────────────────────────────────────

function buildScopeSummary(metadata, variableDefs, components) {
  const meta = parseMetadata(metadata);
  const tokens = parseVariableDefs(variableDefs);

  return `
FIGMA FILE ANALYSIS COMPLETE

File: "${meta.fileName}" (key: ${meta.fileKey})
Pages: ${meta.totalPages} total
  → Library pages: ${meta.classification.libraryPages.join(', ') || 'none detected'}
  → Screen pages: ${meta.classification.screenPages.join(', ') || 'none detected'}
  → Skipping: ${meta.classification.ignoredPages.join(', ') || 'none'}

TOKENS FOUND:
  Token sets: ${tokens.totalSets}
  Total variables: ${tokens.totalTokens}
  Themes: ${tokens.themes.length > 0 ? tokens.themes.map(t => t.name).join(', ') : 'none (single mode)'}

COMPONENTS: ${meta.publishedComponentCount} published
  (List will be populated from get_design_context calls)

TRANSLATION GAPS: ${tokens.translationGaps.length}
  ${tokens.translationGaps.map(g => `  ⚠️  ${g.name}: ${g.reason}`).join('\n')}

Approve scope before migrating?
`.trim();
}
