# Penpot Skills

A library of AI agent workflows for [Penpot](https://penpot.app) — build design systems, migrate Figma files, generate screens, audit accessibility, and more, all driven by an AI agent through the [Penpot MCP server](https://github.com/penpot/penpot/tree/develop/mcp).

## What are skills?

Each skill is a self-contained workflow definition: a `SKILL.md` orchestration file, a set of reference guides for each phase, and ready-to-run script templates. Together they give an AI agent the context, rules, and code it needs to complete a complex, multi-step design task without losing structure or quality.

Skills are compatible with any agent or IDE that supports custom instructions or MCP tool use — including **Claude Code**, **Cursor**, **Windsurf**, **OpenCode**, **GitHub Copilot**, and others. Load a `SKILL.md` as a system prompt, a custom mode, or an agent rule, and point the agent at the Penpot MCP server.

```
Agent (any tool) → Penpot MCP (execute_code) → Penpot Plugin API → Penpot file
```

> The only hard requirement is that the agent can call MCP tools. The agent itself is interchangeable.

---

## Skills

### `penpot-generate-library`

Builds a professional-grade design system in Penpot from a codebase. Extracts color, spacing, typography, and radius tokens; creates components with variants bound to those tokens; documents foundations; and reconciles gaps between code and Penpot.

**Workflow phases:**
1. **Discovery** — analyzes codebase, inspects the Penpot file, locks scope before any write
2. **Foundations** — creates primitive and semantic tokens, library colors and typographies
3. **File structure** — sets up pages (Cover, Foundations, Components, Utilities)
4. **Components** — builds each component with variants, bound to tokens, one at a time
5. **QA** — accessibility audit, naming audit, token binding audit, final screenshots

---

### `penpot-generate-design`

Builds or updates full-page screens in Penpot by reusing the published design system — component instances and token-bound fills — instead of drawing primitives with hardcoded values.

**Workflow steps:**
1. Reads source code to understand screen structure and components
2. Discovers design system assets (components, tokens, typographies) from the Penpot library
3. Creates a page wrapper frame
4. Builds each section incrementally, one `execute_code` call at a time
5. Validates visually with `export_shape` after each section

---

### `penpot-import-figma`

Migrates Figma designs to Penpot with high fidelity. Bridges the Figma MCP (for reading) and the Penpot MCP (for writing) through an Intermediate Representation — a structured JSON document that resolves model differences before any Penpot write occurs.

Preserves layout behavior (Auto Layout → Flex), component structure and variants, design tokens (Figma Variables → Penpot tokens), and visual hierarchy. This is a design system migration tool, not a basic importer.

**Workflow phases:**
1. **Figma analysis** — extracts variables, components, text styles, and screenshots via Figma MCP
2. **IR building** — builds and validates the translation contract (token sets, component dependency graph, layout specs, translation gaps)
3. **Token migration** — creates primitive tokens, semantic tokens with `{expression}` aliases, library colors, and typographies in Penpot
4. **Component migration** — translates each Figma component into a Penpot `VariantContainer`, respecting dependency order (atoms before molecules)
5. **Screen migration** — reconstructs screens section by section using migrated component instances
6. **Fidelity QA** — audits hardcoded fills, orphan instances, naming, and count mismatches; compares `export_shape` output against Figma screenshots

**Figma → Penpot mapping (key translations):**

| Figma | Penpot |
|-------|--------|
| Auto Layout (H/V) | Flex Layout `dir: row/column` |
| HUG / FILL / FIXED sizing | `fit-content` / `fill` / explicit px |
| Component Set + Variants | `VariantContainer` + `Property=Value` frames |
| Variable Collection + Modes | Token Sets + Token Themes |
| Alias variables | `{expression}` token references |
| Color / Text Styles | Library Colors + Library Typographies |

---

### `penpot-create-ui`

Designs production-grade UI interfaces from scratch, acting as a senior visual designer. Takes a brief or concept and produces polished Penpot screens with a coherent design language, component system, and self-evaluated quality. Targets the aesthetic bar of Stripe, Linear, Vercel, and Raycast — not generic templates.

**Four style profiles:** PRECISION (B2B SaaS/tools), BOLD (marketing/editorial), DARK (dev tools/pro apps), WARM (consumer/community).

**Workflow phases:**
1. **Design Brief** — decodes brief, selects style profile, writes a Design Direction Card for approval
2. **Design System Setup** — creates curated tokens, library colors, and typographies for the chosen profile
3. **Component Creation** — builds Button, Input, Badge, Tag, and screen-specific components
4. **Screen Assembly** — builds sections top-down using component instances and grid discipline
5. **Design Critique** — self-evaluates against 6 quality criteria; iterates until score ≥ 10/12

---

### `penpot-infer-tokens`

Extracts all hardcoded visual values from an existing Penpot design (colors, spacing, border radii, typography) and creates a W3C-compliant token system with two sets: **global** (primitive raw values) and **semantic** (aliases applied back to shapes).

**Workflow phases:**
1. **Inspection** — traverses all shapes, collects unique fills, radii, spacings, and fonts
2. **Inference** — clusters values, proposes token taxonomy with naming (user must approve)
3. **Creation** — creates global tokens, then semantic tokens with `{expression}` references
4. **Application** — binds semantic tokens to shapes via `fillColorRefId`

---

### `penpot-rename-layers`

Analyzes an existing Penpot design and renames layers using HTML semantic element naming conventions (`header`, `nav`, `main`, `section`, `article`, `button`, `input`, `h1`–`h6`, `p`, `img`, etc.). Infers each layer's role from its visual properties, position, size, and children — then presents a full before/after rename plan for approval before applying.

**Workflow phases:**
1. **Inspection** — collects full layer inventory with position, size, type, and text properties
2. **Inference** — applies semantic rules, flags ambiguous cases for user input
3. **Renaming** — applies approved rename map top-down, validates with screenshots

---

### `penpot-audit-accessibility`

Audits a Penpot design against WCAG 2.1/2.2 standards and produces a structured report with severity-classified findings (Critical / Major / Minor / Pass).

**Checks performed:**
- **WCAG 1.4.3** Color contrast (AA: 4.5:1 normal text, 3:1 large text)
- **WCAG 1.4.11** UI component contrast (3:1)
- **WCAG 2.5.5/2.5.8** Touch target sizing (44×44px / 24×24px)
- **WCAG 1.4.4/1.4.12** Text legibility and spacing
- **WCAG 1.3.1/2.4.6** Heading hierarchy (no skipped levels, single h1)
- **WCAG 2.4.7/2.4.11** Focus state indicators on interactive components
- **WCAG 1.1.1** Alt text on images
- **WCAG 1.4.1** Color-only status indicators

---

## Prerequisites

- Access to the [Penpot MCP server](https://help.penpot.app/mcp/) (local or remote)
- Penpot MCP plugin active in an open Penpot browser tab
- For `penpot-import-figma`: also requires access to the [Figma MCP server](https://github.com/figma/mcp-server-guide)
- For `penpot-generate-design`: a Penpot file with a published design system

---

## How it works

Every skill orchestrates multi-step workflows over the Penpot MCP `execute_code` tool, which runs arbitrary TypeScript/JavaScript inside the Penpot Plugin API environment. Every design mutation is sequential and validated before the next step begins.

Each skill is structured into three layers:

| Layer | Contents | Purpose |
|-------|----------|---------|
| `SKILL.md` | Orchestration rules, API patterns, phase workflow, anti-patterns | The agent's primary instruction set |
| `references/` | Deep-dive guides per phase (discovery, token creation, layout translation, error recovery, etc.) | Read on demand during the relevant phase |
| `scripts/` | Ready-to-paste templates for `execute_code` calls | Replace placeholders and run directly in Penpot |

### Using with Claude Code

Add the skill via the Claude Code skills system. The agent loads `SKILL.md` automatically when triggered.

### Using with Cursor / Windsurf / other IDEs

Load `SKILL.md` as a custom mode, agent rule, or system-level instruction. Attach the relevant `references/` files as context when entering each phase.

### Using with any other agent

Paste `SKILL.md` as the system prompt. Reference `references/` files inline as context blocks. Use `scripts/` templates as the code payload for each MCP tool call.

---

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

penpot-import-figma/
├── SKILL.md
├── references/
│   ├── 01-figma-analysis.md
│   ├── 02-ir-building.md
│   ├── 03-token-migration.md
│   ├── 04-component-migration.md
│   ├── 05-layout-translation.md
│   ├── 06-screen-migration.md
│   ├── 07-validation.md
│   └── 08-error-recovery.md
└── scripts/
    ├── analyzeFigmaStructure.js
    ├── buildIR.js
    ├── migrateTokens.js
    ├── migrateComponent.js
    ├── migrateScreen.js
    └── validateFidelity.js

penpot-create-ui/
├── SKILL.md
├── references/
│   ├── 01-design-brief-analysis.md
│   ├── 02-design-system-values.md
│   ├── 03-layout-and-composition.md
│   ├── 04-component-recipes.md
│   ├── 05-design-critique-framework.md
│   └── 06-error-recovery.md
└── scripts/
    ├── setupDesignSystem.js
    ├── createCoreComponents.js
    ├── buildSection.js
    └── auditDesignQuality.js

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

---

## References

- [Penpot Plugin API](https://doc.plugins.penpot.app/)
- [Penpot MCP server docs](https://help.penpot.app/mcp/)
- [Penpot MCP source](https://github.com/penpot/penpot/tree/develop/mcp)
