# Penpot Skills

A set of Claude Code skills that use the [Penpot MCP server](https://github.com/penpot/penpot/tree/develop/mcp) to build and update designs directly from code.

## Skills

### `penpot-generate-library`

Builds a professional-grade design system in Penpot from a codebase. It extracts tokens (color, spacing, typography, radius), creates components with variants, documents foundations, and reconciles gaps between code and Penpot.

**Workflow phases:**
1. **Discovery** — analyzes codebase, inspects the Penpot file, locks scope with user approval
2. **Foundations** — creates primitive and semantic tokens, library colors and typographies
3. **File structure** — sets up pages (Cover, Foundations, Components, etc.)
4. **Components** — builds each component with variants, bound to tokens (one at a time, never batched)
5. **QA** — accessibility audit, naming audit, token binding audit, final screenshots

### `penpot-generate-design`

Builds or updates full-page screens in Penpot by reusing the published design system — component instances and token-bound fills — instead of drawing primitives with hardcoded values.

**Workflow steps:**
1. Reads source code to understand screen structure and components
2. Discovers design system assets (components, tokens, typographies) from the Penpot library
3. Creates a page wrapper frame
4. Builds each section incrementally, one `execute_code` call at a time
5. Validates visually with `export_shape` after each section

### `penpot-infer-tokens`

Extracts all hardcoded visual values from an existing Penpot design (colors, spacing, border radii, typography) and creates a W3C-compliant token system with two sets: **global** (primitive raw values) and **semantic** (aliases applied to shapes). Then binds the semantic tokens back to every element.

**Workflow phases:**
1. **Inspection** — traverses all shapes and collects unique fills, radii, spacings, and fonts
2. **Inference** — clusters values, proposes token taxonomy with naming (user must approve)
3. **Creation** — creates global tokens first, then semantic tokens with `{expression}` references
4. **Application** — binds semantic tokens to shapes via `fillColorRefId`

### `penpot-rename-layers`

Analyzes an existing Penpot design and renames layers using HTML semantic element naming conventions (`header`, `nav`, `main`, `section`, `article`, `button`, `input`, `h1`–`h6`, `p`, `img`, etc.). Infers each layer's role from its visual properties, position, size, and children — then presents a full before/after rename plan for approval before applying.

**Workflow phases:**
1. **Inspection** — collects full layer inventory with position, size, type, and text properties
2. **Inference** — applies semantic rules, flags ambiguous cases for user input
3. **Renaming** — applies approved rename map top-down, validates with screenshots

### `penpot-audit-accessibility`

Audits a Penpot design against WCAG 2.1/2.2 standards and produces a structured report with severity-classified findings (Critical / Major / Minor / Pass).

**Checks performed:**
- **WCAG 1.4.3** Color contrast (AA: 4.5:1 normal text, 3:1 large text)
- **WCAG 1.4.11** UI component contrast (3:1)
- **WCAG 2.5.5/2.5.8** Touch target sizing (44×44px / 24×24px)
- **WCAG 1.4.4/1.4.12** Text legibility and spacing (line-height, letter-spacing)
- **WCAG 1.3.1/2.4.6** Heading hierarchy (no skipped levels, single h1)
- **WCAG 2.4.7/2.4.11** Focus state indicators on interactive components
- **WCAG 1.1.1** Alt text on images
- **WCAG 1.4.1** Color-only status indicators

## Prerequisites

- Claude Code with access to the Penpot MCP server
- Penpot MCP plugin active in an open Penpot browser tab
- For `penpot-generate-design`: a Penpot file with a published design system

## How it Works

All skills orchestrate multi-step workflows over the Penpot MCP `execute_code` tool, which runs arbitrary TypeScript/JavaScript inside the Penpot Plugin API environment. Every design mutation is sequential and validated before the next step begins.

```
Claude Code → Penpot MCP (execute_code) → Penpot Plugin API → Penpot file
```

Each skill includes:
- **`SKILL.md`** — main orchestration file with rules, API patterns, and workflow
- **`references/`** — deep-dive guides per phase (discovery, token creation, component creation, error recovery, etc.)
- **`scripts/`** — ready-to-paste templates for `execute_code` calls

## Project Structure

```
penpot-generate-library/
├── SKILL.md
├── references/
│   ├── 01-discovery-phase.md
│   ├── 02-token-creation.md
│   ├── 03-component-creation.md
│   ├── 04-documentation-creation.md
│   ├── 05-naming-conventions.md
│   └── 06-error-recovery.md
└── scripts/
    ├── inspectFileStructure.js
    ├── createTokenSet.js
    ├── createSemanticTokens.js
    ├── createLibraryColors.js
    ├── createComponentWithVariants.js
    ├── createDocumentationPage.js
    ├── validateCreation.js
    ├── rehydrateState.js
    └── cleanupOrphans.js

penpot-generate-design/
├── SKILL.md
├── references/
│   ├── 01-discovery-phase.md
│   ├── 02-component-assembly.md
│   ├── 03-token-binding.md
│   └── 04-error-recovery.md
└── scripts/
    ├── inspectDesignSystem.js
    ├── createScreenWrapper.js
    ├── buildSection.js
    └── validateScreen.js

penpot-infer-tokens/
├── SKILL.md
├── references/
│   ├── 01-inspection-phase.md
│   ├── 02-token-inference.md
│   ├── 03-token-application.md
│   └── 04-error-recovery.md
└── scripts/
    ├── inspectDesignValues.js
    ├── createInferredTokens.js
    └── applyTokensToShapes.js

penpot-rename-layers/
├── SKILL.md
├── references/
│   ├── 01-inspection-phase.md
│   ├── 02-semantic-inference.md
│   └── 03-renaming-strategy.md
└── scripts/
    ├── inspectLayerStructure.js
    └── renameLayer.js

penpot-audit-accessibility/
├── SKILL.md
├── references/
│   ├── 01-inspection-phase.md
│   ├── 02-contrast-checks.md
│   ├── 03-sizing-checks.md
│   └── 04-report-generation.md
└── scripts/
    ├── collectAccessibilityData.js
    ├── checkColorContrast.js
    ├── checkTouchTargets.js
    └── generateReport.js
```

## References

- [Penpot Plugin API](https://doc.plugins.penpot.app/)
- [Penpot MCP server docs](https://help.penpot.app/mcp/)
- [Penpot MCP source](https://github.com/penpot/penpot/tree/develop/mcp)
