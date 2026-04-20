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

## Prerequisites

- Claude Code with access to the Penpot MCP server
- Penpot MCP plugin active in an open Penpot browser tab
- For `penpot-generate-design`: a Penpot file with a published design system

## How it Works

Both skills orchestrate multi-step workflows over the Penpot MCP `execute_code` tool, which runs arbitrary TypeScript/JavaScript inside the Penpot Plugin API environment. Every design mutation is sequential and validated before the next step begins.

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
```

## References

- [Penpot Plugin API](https://doc.plugins.penpot.app/)
- [Penpot MCP server docs](https://help.penpot.app/mcp/)
- [Penpot MCP source](https://github.com/penpot/penpot/tree/develop/mcp)
