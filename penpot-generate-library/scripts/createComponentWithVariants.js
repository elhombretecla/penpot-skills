/**
 * createComponentWithVariants.js
 *
 * Builds a Penpot component with a variant container (VariantContainer).
 * Each variant is a separate frame inside the container, positioned on a grid.
 *
 * Supports:
 * - N-dimensional variant axes via Cartesian product
 * - Automatic grid layout (columns = State, rows = Size × Style)
 * - Token-bound fills via fillColorRefId
 * - Plugin data tagging for state tracking
 *
 * Usage: call createComponentWithVariants(config, runId) in an execute_code call.
 *
 * ⚠️  Verify VariantContainer API:
 *     penpot_api_info({ type: 'VariantContainer' })
 *     penpot_api_info({ type: 'Variants' })
 */

const page = penpot.currentPage;
const library = penpot.library.local;

/**
 * Computes the Cartesian product of multiple arrays.
 * cartesianProduct([[1,2],[a,b]]) → [[1,a],[1,b],[2,a],[2,b]]
 *
 * @param {Array<Array>} arrays
 * @returns {Array<Array>}
 */
function cartesianProduct(arrays) {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  const restProduct = cartesianProduct(rest);
  return first.flatMap(item => restProduct.map(combo => [item, ...combo]));
}

/**
 * Finds a library color by name and returns fill paint object.
 * @param {string} colorName
 * @returns {Object|null}
 */
function makeColorFill(colorName) {
  const c = library.colors.find(c => c.name === colorName);
  if (!c) return null;
  return {
    fillType: 'solid',
    fillColor: c.color,
    fillOpacity: c.opacity !== undefined ? c.opacity : 1,
    fillColorRefId: c.id,
    fillColorRefFileId: c.fileId,
  };
}

/**
 * Builds one variant frame inside the container.
 *
 * @param {Object} config
 * @param {string} config.name          — variant frame name (e.g. "Size=Small, Style=Primary")
 * @param {number} config.x
 * @param {number} config.y
 * @param {number} config.width
 * @param {number} config.height
 * @param {string} [config.fillColorName] — library color name for fill
 * @param {string} [config.strokeColorName] — library color name for stroke
 * @param {number} [config.borderRadius]   — border radius in px
 * @param {Object} [config.padding]        — { top, right, bottom, left }
 * @param {string} [config.labelText]      — text to show inside the variant
 * @param {string} [config.labelTypoName]  — library typography name for the label
 * @param {string} [config.labelColorName] — library color name for label text
 * @param {number} [config.opacity]        — frame opacity (0–1)
 * @param {string} runId
 * @param {string} variantKey — unique key for plugin data tagging
 * @returns {{ frame: Object, id: string }}
 */
function buildVariantFrame(config, runId, variantKey) {
  const frame = page.createFrame();
  frame.name = config.name;
  frame.x = config.x;
  frame.y = config.y;
  frame.width = config.width;
  frame.height = config.height;

  if (config.borderRadius !== undefined) {
    frame.borderRadius = config.borderRadius;
  }

  if (config.opacity !== undefined) {
    frame.opacity = config.opacity;
  }

  // Fill
  const fill = config.fillColorName ? makeColorFill(config.fillColorName) : null;
  if (fill) {
    frame.fills = [fill];
  } else {
    frame.fills = [{ fillType: 'solid', fillColor: '#E5E7EB', fillOpacity: 1 }];
  }

  // Stroke
  if (config.strokeColorName) {
    const sc = library.colors.find(c => c.name === config.strokeColorName);
    if (sc) {
      frame.strokes = [{
        strokeType: 'center',
        strokeWidth: 1,
        strokeColor: sc.color,
        strokeOpacity: sc.opacity !== undefined ? sc.opacity : 1,
        strokeColorRefId: sc.id,
        strokeColorRefFileId: sc.fileId,
      }];
    }
  }

  // Flex layout
  const layout = frame.addFlexLayout();
  layout.dir = 'row';
  layout.alignItems = 'center';
  layout.justifyContent = 'center';
  if (config.padding) {
    layout.padding = config.padding;
  }

  // Label text
  if (config.labelText) {
    const text = page.createText(config.labelText);
    text.name = 'label';
    text.fontSize = 14;
    text.fontFamily = 'Inter';

    if (config.labelTypoName) {
      const typo = library.typographies.find(t => t.name === config.labelTypoName);
      if (typo && text.applyTypography) {
        text.applyTypography(typo);
      }
    }

    if (config.labelColorName) {
      const lc = makeColorFill(config.labelColorName);
      if (lc) text.fills = [lc];
    }

    frame.appendChild(text);
  }

  // Plugin data tagging
  frame.setSharedPluginData('dsb', 'run_id', runId);
  frame.setSharedPluginData('dsb', 'phase', 'phase3');
  frame.setSharedPluginData('dsb', 'key', variantKey);

  return { frame, id: frame.id };
}

/**
 * Creates a full component with variant container and all variant combinations.
 *
 * @param {Object} config
 * @param {string} config.name              — component name (PascalCase)
 * @param {Object} config.variantAxes       — map of { PropertyName: ['Value1', 'Value2', ...] }
 * @param {Object} config.baseStyle         — base visual style (fill, stroke, radius, padding, dimensions)
 * @param {Object} [config.styleOverrides]  — variant-specific overrides keyed by "Property=Value"
 * @param {string} [config.labelText]       — default label inside variants
 * @param {number} [config.containerX]      — x position of the container
 * @param {number} [config.containerY]      — y position of the container
 * @param {string} runId
 * @returns {{ containerId: string, variantIds: string[], variantCount: number }}
 */
function createComponentWithVariants(config, runId) {
  const {
    name,
    variantAxes,
    baseStyle,
    styleOverrides = {},
    labelText = name,
    containerX = 100,
    containerY = 200,
  } = config;

  // Check for existing container (idempotency)
  const allShapes = page.findShapes();
  const existingContainer = allShapes.find(
    s => s.getSharedPluginData('dsb', 'key') === `component/${name.toLowerCase()}/container`
  );
  if (existingContainer) {
    return { skipped: true, containerId: existingContainer.id, reason: 'Container already exists' };
  }

  // Build variant combinations via Cartesian product
  const axisNames = Object.keys(variantAxes);
  const axisValues = axisNames.map(k => variantAxes[k]);
  const combinations = cartesianProduct(axisValues);

  if (combinations.length > 30) {
    return {
      error: `Variant matrix too large: ${combinations.length} combinations. Max is 30. ` +
             `Reduce axes or split into sub-components. Current axes: ${axisNames.join(', ')}.`
    };
  }

  // Layout constants
  const FRAME_W = baseStyle.width || 120;
  const FRAME_H = baseStyle.height || 40;
  const COL_GAP = 24;
  const ROW_GAP = 16;

  // Determine grid: last axis = columns, preceding axes = rows
  const colAxis = axisNames[axisNames.length - 1];
  const colValues = variantAxes[colAxis];
  const rowCombinations = combinations.filter((_, i) =>
    i % colValues.length === 0
  );

  // Create VariantContainer
  const container = page.createVariantContainer();
  container.name = name;
  container.x = containerX;
  container.y = containerY;

  container.setSharedPluginData('dsb', 'run_id', runId);
  container.setSharedPluginData('dsb', 'phase', 'phase3');
  container.setSharedPluginData('dsb', 'key', `component/${name.toLowerCase()}/container`);

  const variantIds = [];

  combinations.forEach((combo, index) => {
    // Build variant property string: "Size=Small, Style=Primary, State=Default"
    const propStr = axisNames.map((axis, i) => `${axis}=${combo[i]}`).join(', ');

    // Calculate grid position
    const col = index % colValues.length;
    const row = Math.floor(index / colValues.length);
    const x = col * (FRAME_W + COL_GAP);
    const y = row * (FRAME_H + ROW_GAP);

    // Determine style: apply overrides for specific variant property combinations
    const overrideKey = combo.join('/').toLowerCase();
    const overrides = styleOverrides[propStr] || styleOverrides[overrideKey] || {};

    const variantConfig = {
      name: propStr,
      x,
      y,
      width: FRAME_W,
      height: FRAME_H,
      fillColorName: overrides.fillColorName || baseStyle.fillColorName,
      strokeColorName: overrides.strokeColorName || baseStyle.strokeColorName,
      borderRadius: overrides.borderRadius !== undefined ? overrides.borderRadius : baseStyle.borderRadius,
      padding: overrides.padding || baseStyle.padding,
      labelText,
      labelTypoName: baseStyle.labelTypoName,
      labelColorName: overrides.labelColorName || baseStyle.labelColorName,
      opacity: overrides.opacity !== undefined ? overrides.opacity : 1,
    };

    const variantKey = `component/${name.toLowerCase()}/variant/${combo.join('-').toLowerCase()}`;
    const { id } = buildVariantFrame(variantConfig, runId, variantKey);
    container.appendChild
      ? container.appendChild(page.findShapes().find(s => s.id === id))
      : null;

    variantIds.push(id);
  });

  // Update container size to fit content
  const totalCols = colValues.length;
  const totalRows = Math.ceil(combinations.length / totalCols);
  container.width = totalCols * (FRAME_W + COL_GAP) - COL_GAP + 32;
  container.height = totalRows * (FRAME_H + ROW_GAP) - ROW_GAP + 32;

  return {
    containerId: container.id,
    variantIds,
    variantCount: combinations.length,
    grid: { cols: totalCols, rows: totalRows },
  };
}

// ── Example: Button component ─────────────────────────────────────────────────

const RUN_ID = 'penpot-dsb-REPLACE-ME';

const result = createComponentWithVariants(
  {
    name: 'Button',
    variantAxes: {
      Size:  ['Small', 'Medium', 'Large'],
      Style: ['Primary', 'Secondary', 'Ghost'],
      State: ['Default', 'Hover', 'Disabled'],
    },
    baseStyle: {
      width: 120,
      height: 40,
      fillColorName: 'color/brand/primary',
      labelColorName: 'color/text/inverse',
      labelTypoName: 'Label/MD',
      borderRadius: 8,
      padding: { top: 8, right: 16, bottom: 8, left: 16 },
    },
    styleOverrides: {
      'Size=Small, Style=Primary, State=Disabled': {
        fillColorName: 'color/bg/disabled',
        labelColorName: 'color/text/disabled',
        opacity: 0.6,
      },
      'Size=Medium, Style=Secondary, State=Default': {
        fillColorName: 'color/bg/primary',
        strokeColorName: 'color/border/default',
        labelColorName: 'color/text/primary',
      },
      'Size=Medium, Style=Ghost, State=Default': {
        fillColorName: 'color/bg/primary',
        labelColorName: 'color/text/brand',
      },
    },
    containerX: 100,
    containerY: 200,
  },
  RUN_ID
);

return result;
