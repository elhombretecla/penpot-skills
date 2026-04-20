/**
 * createCoreComponents.js
 *
 * Phase 2 — Creates the core UI component atoms for the chosen style profile.
 * Run one component per execute_code call by setting COMPONENT.
 *
 * Components (run in this order):
 *   'Button'  → Primary, Secondary, Ghost variants at Medium size
 *   'Badge'   → Success, Warning, Error, Default, Brand variants
 *   'Input'   → Default state with label + placeholder + helper
 *   'Tag'     → Default (neutral) tag with optional × close
 *
 * USAGE: Set COMPONENT and PROFILE, paste into execute_code.
 *
 * ⚠️  Library colors must be created (setupDesignSystem MODE='library') before running.
 * ⚠️  Creates main component shapes at the top level of the current page.
 *     Make sure you are on a dedicated "Components" page before running.
 */

const COMPONENT = 'Button';    // ← 'Button' | 'Badge' | 'Input' | 'Tag'
const PROFILE = 'PRECISION';   // ← 'PRECISION' | 'DARK' | 'BOLD' | 'WARM'
const RUN_ID = 'create-ui-REPLACE-ME';
const START_X = 100;           // ← starting x position for this component's frame
const START_Y = 100;

const page = penpot.currentPage;
const library = penpot.library.local;

// ─── Helper: get library color by name ───────────────────────────────────────
function getColor(name) {
  return library.colors.find(c => c.name === name);
}

function applyColor(shape, colorName, property = 'fill') {
  const color = getColor(colorName);
  if (!color) return false;
  const binding = {
    fillType: 'solid',
    fillColor: color.color,
    fillOpacity: color.opacity ?? 1,
    fillColorRefId: color.id,
    fillColorRefFileId: color.fileId,
  };
  if (property === 'fill') {
    shape.fills = [binding];
  }
  return true;
}

// ─── Button component ─────────────────────────────────────────────────────────
async function createButton() {
  const variants = [
    { style: 'Primary', bgColor: 'color/interactive/primary', textColor: 'color/interactive/primary-text', hasBorder: false },
    { style: 'Secondary', bgColor: null, textColor: 'color/text/primary', hasBorder: true, borderColor: 'color/border/strong' },
    { style: 'Ghost', bgColor: null, textColor: 'color/text/secondary', hasBorder: false },
  ];

  const radius = PROFILE === 'WARM' ? 12 : 6;
  const createdComponents = [];
  let xOffset = START_X;

  for (const variant of variants) {
    const btn = page.createFrame();
    btn.name = `Button/${variant.style}-Medium-Default`;
    btn.width = 120;
    btn.height = 36;
    btn.borderRadius = radius;

    // Fill
    if (variant.bgColor) {
      applyColor(btn, variant.bgColor);
    } else {
      btn.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 0 }];
    }

    // Border for Secondary
    if (variant.hasBorder && variant.borderColor) {
      const borderC = getColor(variant.borderColor);
      if (borderC) {
        btn.strokes = [{
          strokeType: 'inner',
          strokeColor: borderC.color,
          strokeOpacity: 1,
          strokeWidth: 1,
        }];
      }
    }

    // Flex layout
    const layout = btn.addFlexLayout();
    layout.dir = 'row';
    layout.alignItems = 'center';
    layout.justifyContent = 'center';
    layout.padding = { top: 0, bottom: 0, left: 16, right: 16 };
    layout.gap = 6;

    // Label
    const label = page.createText(variant.style);
    label.name = 'label';
    label.fontFamily = 'Inter';
    label.fontSize = 14;
    label.fontWeight = 500;
    label.lineHeight = 1;
    applyColor(label, variant.textColor);
    btn.appendChild(label);

    // Position
    btn.x = xOffset;
    btn.y = START_Y;
    xOffset += 140;

    // Tag with shared plugin data
    btn.setSharedPluginData('create-ui', 'run_id', RUN_ID);
    btn.setSharedPluginData('create-ui', 'component', 'Button');
    btn.setSharedPluginData('create-ui', 'variant', variant.style);

    const component = page.createComponent(btn);
    createdComponents.push({ style: variant.style, componentId: component.id, mainId: btn.id });
  }

  return { component: 'Button', created: createdComponents };
}

// ─── Badge component ──────────────────────────────────────────────────────────
async function createBadge() {
  const badgeTypes = [
    { name: 'Success', bg: '#ECFDF5', text: '#059669' },
    { name: 'Warning', bg: '#FFFBEB', text: '#D97706' },
    { name: 'Error',   bg: '#FEF2F2', text: '#DC2626' },
    { name: 'Default', bg: '#F1F5F9', text: '#475569' },
    { name: 'Brand',   bg: '#EEF2FF', text: '#4F46E5' },
  ];

  const radius = 9999; // pill
  const createdBadges = [];
  let xOffset = START_X;

  for (const type of badgeTypes) {
    const badge = page.createFrame();
    badge.name = `Badge/${type.name}`;
    badge.height = 22;
    badge.borderRadius = radius;
    badge.fills = [{ fillType: 'solid', fillColor: type.bg, fillOpacity: 1 }];

    const layout = badge.addFlexLayout();
    layout.dir = 'row';
    layout.alignItems = 'center';
    layout.justifyContent = 'center';
    layout.padding = { top: 0, bottom: 0, left: 8, right: 8 };

    const label = page.createText(type.name);
    label.name = 'label';
    label.fontFamily = 'Inter';
    label.fontSize = 11;
    label.fontWeight = 500;
    label.fills = [{ fillType: 'solid', fillColor: type.text, fillOpacity: 1 }];
    badge.appendChild(label);

    badge.x = xOffset;
    badge.y = START_Y;
    xOffset += 90;

    const component = page.createComponent(badge);
    createdBadges.push({ name: type.name, componentId: component.id });
  }

  return { component: 'Badge', created: createdBadges };
}

// ─── Input component ──────────────────────────────────────────────────────────
async function createInput() {
  const container = page.createFrame();
  container.name = 'Input/Default';
  container.width = 280;
  container.fills = [{ fillType: 'solid', fillColor: '#FFFFFF', fillOpacity: 0 }]; // transparent
  container.x = START_X;
  container.y = START_Y;

  const containerLayout = container.addFlexLayout();
  containerLayout.dir = 'column';
  containerLayout.alignItems = 'start';
  containerLayout.gap = 6;

  // Label
  const labelText = page.createText('Label');
  labelText.name = 'label-text';
  labelText.fontFamily = 'Inter';
  labelText.fontSize = 13;
  labelText.fontWeight = 500;
  applyColor(labelText, 'color/text/primary');
  container.appendChild(labelText);

  // Field
  const field = page.createFrame();
  field.name = 'field';
  field.width = 280;
  field.height = 36;
  field.borderRadius = PROFILE === 'WARM' ? 12 : 6;
  applyColor(field, 'color/bg/primary');
  const borderC = getColor('color/border/default');
  if (borderC) {
    field.strokes = [{ strokeType: 'inner', strokeColor: borderC.color, strokeOpacity: 1, strokeWidth: 1 }];
  }

  const fieldLayout = field.addFlexLayout();
  fieldLayout.dir = 'row';
  fieldLayout.alignItems = 'center';
  fieldLayout.padding = { top: 0, bottom: 0, left: 12, right: 12 };

  const placeholder = page.createText('Placeholder text...');
  placeholder.name = 'placeholder';
  placeholder.fontFamily = 'Inter';
  placeholder.fontSize = 14;
  placeholder.fontWeight = 400;
  applyColor(placeholder, 'color/text/tertiary');
  field.appendChild(placeholder);
  container.appendChild(field);

  // Helper
  const helper = page.createText('Helper text or error message');
  helper.name = 'helper';
  helper.fontFamily = 'Inter';
  helper.fontSize = 12;
  helper.fontWeight = 400;
  applyColor(helper, 'color/text/secondary');
  container.appendChild(helper);

  container.setSharedPluginData('create-ui', 'run_id', RUN_ID);
  container.setSharedPluginData('create-ui', 'component', 'Input');

  const component = page.createComponent(container);
  return { component: 'Input', componentId: component.id, mainId: container.id };
}

// ─── Tag component ────────────────────────────────────────────────────────────
async function createTag() {
  const tag = page.createFrame();
  tag.name = 'Tag/Default';
  tag.height = 26;
  tag.borderRadius = PROFILE === 'WARM' ? 8 : 6;
  tag.fills = [{ fillType: 'solid', fillColor: '#F1F5F9', fillOpacity: 1 }];
  tag.x = START_X;
  tag.y = START_Y;

  const layout = tag.addFlexLayout();
  layout.dir = 'row';
  layout.alignItems = 'center';
  layout.justifyContent = 'center';
  layout.padding = { top: 0, bottom: 0, left: 10, right: 10 };
  layout.gap = 4;

  const label = page.createText('Tag label');
  label.name = 'label';
  label.fontFamily = 'Inter';
  label.fontSize = 12;
  label.fontWeight = 500;
  label.fills = [{ fillType: 'solid', fillColor: '#475569', fillOpacity: 1 }];
  tag.appendChild(label);

  tag.setSharedPluginData('create-ui', 'run_id', RUN_ID);
  tag.setSharedPluginData('create-ui', 'component', 'Tag');

  const component = page.createComponent(tag);
  return { component: 'Tag', componentId: component.id };
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────
const dispatch = { Button: createButton, Badge: createBadge, Input: createInput, Tag: createTag };
const fn = dispatch[COMPONENT];
if (!fn) return { error: `Unknown component: ${COMPONENT}. Valid: Button, Badge, Input, Tag` };

return await fn();
