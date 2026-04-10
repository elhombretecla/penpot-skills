# Error Recovery

Design system builds span 20–100+ `execute_code` calls. Errors are inevitable. This reference defines how to stop, diagnose, and resume safely without corrupting the file or losing completed work.

---

## Core Principle

Every `execute_code` call is a separate atomic operation. If a script errors partway through, any shapes it already created before the error **may persist** in the file (Penpot does not guarantee rollback). This means:

1. **Always tag shapes immediately after creation** — so they can be identified and cleaned up if needed.
2. **Always check for existence before creating** — so retrying a failed step doesn't create duplicates.
3. **Never assume clean state after an error** — inspect the file before retrying.

---

## Recovery Protocol

When an `execute_code` call fails:

```
1. STOP — do not retry immediately, do not proceed to the next step.

2. READ — read the full error message from the tool response.
   Common patterns:
     "Cannot read properties of undefined" → API shape is wrong, check penpot_api_info
     "TypeError: X is not a function"     → method doesn't exist on this type
     "ReferenceError: penpot is not defined" → MCP plugin not connected
     "Timeout"                            → call took too long, split into smaller scripts
     "null is not an object"              → ID lookup failed, shape was not created

3. INSPECT — run high_level_overview or a targeted execute_code to check current file state.
   Specifically: did any shapes get created before the error?

4. DECIDE — three options:
   a. FIX AND RETRY — the error is clear, fix the script, retry
   b. CLEAN AND RETRY — partial shapes were created, clean them first, then retry
   c. SKIP — the step is non-critical (e.g., a documentation label), document the skip

5. UPDATE STATE LEDGER — record the outcome (retried, cleaned, skipped) in the on-disk state file.
```

---

## Idempotency Patterns

Every create operation must check for an existing entity first.

### Token idempotency

```typescript
async function createTokenIdempotent(catalog, tokenDef) {
  const tokens = catalog ? Object.values(catalog) : [];
  const existing = tokens.find(t => t.name === tokenDef.name);
  if (existing) {
    return { skipped: true, id: existing.id, name: existing.name };
  }
  const token = await catalog.createToken(tokenDef);
  return { created: true, id: token.id, name: token.name };
}
```

### Page idempotency

```typescript
function getOrCreatePage(name) {
  const existing = penpot.pages.find(p => p.name === name);
  if (existing) {
    return { skipped: true, page: existing, id: existing.id };
  }
  const page = penpot.createPage();
  page.name = name;
  return { created: true, page, id: page.id };
}
```

### Shape idempotency (via plugin data)

```typescript
function findShapeByKey(page, key) {
  const shapes = page.findShapes();
  return shapes.find(s => s.getSharedPluginData('dsb', 'key') === key) || null;
}

// Before creating a frame:
const existingFrame = findShapeByKey(page, 'component/button/base');
if (existingFrame) {
  return { skipped: true, id: existingFrame.id };
}
```

### Library color idempotency

```typescript
function getOrCreateColor(library, name, colorHex, opacity = 1) {
  const existing = library.colors.find(c => c.name === name);
  if (existing) return { skipped: true, id: existing.id };
  const color = library.createColor();
  color.name = name;
  color.color = colorHex;
  color.opacity = opacity;
  return { created: true, id: color.id };
}
```

---

## Plugin Data Tagging (Required)

Tag every created shape immediately after creation. This is the foundation of cleanup and rehydration.

```typescript
const RUN_ID = 'penpot-dsb-acme-ui-20250115';  // from state ledger

// Tag a frame
frame.setSharedPluginData('dsb', 'run_id', RUN_ID);
frame.setSharedPluginData('dsb', 'phase', 'phase3');
frame.setSharedPluginData('dsb', 'key', 'component/button');

// Tag a variant frame
variantFrame.setSharedPluginData('dsb', 'run_id', RUN_ID);
variantFrame.setSharedPluginData('dsb', 'phase', 'phase3');
variantFrame.setSharedPluginData('dsb', 'key', 'component/button/sm-primary-default');

// Tag a documentation frame
docFrame.setSharedPluginData('dsb', 'run_id', RUN_ID);
docFrame.setSharedPluginData('dsb', 'phase', 'phase2');
docFrame.setSharedPluginData('dsb', 'key', 'doc/foundations/colors');
```

**Tag keys** (use consistently):

| Key | Value | Purpose |
|-----|-------|---------|
| `run_id` | `penpot-dsb-{slug}-{date}` | Identifies the build run for cleanup |
| `phase` | `phase0`–`phase4` | Tracks which phase created this shape |
| `key` | `{category}/{name}/{variant}` | Logical identity for idempotency checks |
| `component` | `Button`, `Input`, etc. | Component name for quick filtering |
| `version` | `1` | Increment on rebuild for conflict detection |

---

## State Ledger

Write a JSON state file to disk at every phase boundary. This survives conversation context truncation and allows resumption.

**Location**: `/tmp/dsb-penpot-state-{RUN_ID}.json`

**Schema**:

```json
{
  "runId": "penpot-dsb-acme-ui-20250115",
  "phase": "phase3",
  "step": "component-button",
  "startedAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T11:30:00Z",
  "entities": {
    "pages": {
      "Cover": "page-id-aaa",
      "Foundations": "page-id-bbb",
      "Button": "page-id-ccc"
    },
    "tokens": {
      "color.blue.500": "token-id-111",
      "color.bg.primary": "token-id-222",
      "spacing.md": "token-id-333"
    },
    "libraryColors": {
      "color/bg/primary": "color-id-444",
      "color/text/primary": "color-id-555"
    },
    "libraryTypographies": {
      "Body/MD": "typo-id-666",
      "Heading/LG": "typo-id-777"
    },
    "components": {
      "Button": "component-id-888",
      "Avatar": "component-id-999"
    },
    "variantContainers": {
      "Button": "container-id-aaa"
    }
  },
  "completedSteps": [
    "phase0",
    "phase1/tokens",
    "phase1/library-colors",
    "phase1/library-typographies",
    "phase2/pages",
    "phase2/cover",
    "phase2/foundations",
    "phase3/avatar",
    "phase3/badge"
  ],
  "pendingValidations": [
    "phase3/button:screenshot"
  ],
  "skippedSteps": [],
  "errors": []
}
```

**Read the state file at the start of every turn** (when resuming):

```bash
cat /tmp/dsb-penpot-state-penpot-dsb-acme-ui-20250115.json
```

**Update the state file** after every phase boundary and every completed component.

---

## State Rehydration (After Context Truncation)

When the conversation context is truncated or you resume in a new chat:

1. Read the on-disk state file (if it exists)
2. Call `high_level_overview` to get current file state
3. Run `inspectFileStructure.js` to get detailed IDs
4. Cross-reference the state file with the current file to detect:
   - Entities that exist in the file but aren't in the state ledger (may be from a partial run)
   - Entities in the state ledger that no longer exist in the file (may have been deleted)
5. Rebuild the `{key → id}` map from the file scan + state ledger
6. Resume from the last completed step

**Resume prompt to give the user** when starting a new conversation:

```
I'm continuing a Penpot design system build.
Run ID: penpot-dsb-acme-ui-20250115
State file: /tmp/dsb-penpot-state-penpot-dsb-acme-ui-20250115.json

Please load the penpot-generate-library skill and resume from the last completed step.
```

---

## Cleanup: Removing Partial Work

When a phase produces incomplete or incorrect results, clean up before retrying.

**Never use name-prefix matching for cleanup** — it risks deleting user-owned shapes with similar names. Always clean up by `run_id` tag.

```typescript
// Cleanup by run_id — see cleanupOrphans.js
// This removes ALL shapes tagged with the given run_id from the current page
```

**Selective cleanup** (by key, not run_id) — when you only want to remove one component:

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();
const toRemove = shapes.filter(s =>
  s.getSharedPluginData('dsb', 'key')?.startsWith('component/button')
);
for (const shape of toRemove) {
  shape.remove();
}
return { removedCount: toRemove.length };
```

---

## Failure Taxonomy

| Error type | Cause | Recovery |
|-----------|-------|----------|
| **API shape error** | Wrong method name or argument structure | Call `penpot_api_info` to get exact signature, fix script |
| **Missing dependency** | Component built before its dependency token/component | Build dependency first, then retry |
| **Broken expression** | Semantic token references a token that doesn't exist | Check token name spelling, create primitive first |
| **Duplicate name** | Creating a token/color that already exists | Add idempotency check, skip if exists |
| **ID not found** | Hardcoded or hallucinated ID passed to a lookup | Read ID from state ledger, never reconstruct from memory |
| **Context truncation** | Conversation too long, prior IDs forgotten | Read state file from disk, rehydrate from file scan |
| **Partial write** | Script errored after creating some shapes | Inspect for partial shapes, clean by key or run_id, retry |
| **Plugin disconnected** | MCP plugin not connected in Penpot tab | User must reconnect: File → MCP Server → Connect |
| **Timeout** | Script took too long | Split into smaller operations |
| **Page context wrong** | `execute_code` ran on wrong page | Set page context explicitly at the start of every script |

---

## Per-Phase Recovery

### Phase 1 (Tokens)

- If some tokens were created and some weren't: run the idempotent create again — skip existing, create missing.
- If a semantic token has a broken expression: delete it and recreate it after confirming the primitive exists.
- If library colors are duplicated: query all colors, identify duplicates by name, remove extras.

### Phase 2 (Documentation)

- If a page was created but the documentation frame wasn't: navigate to the page, create just the doc frame.
- If the foundations page content is incomplete: add the missing section without recreating the whole page.

### Phase 3 (Components)

- If a VariantContainer was created but variant frames weren't: find the container by key, add frames inside it.
- If variant frames have wrong positions: query them by key, update `x`/`y` without recreating.
- If token bindings are missing: query the shape by key, update `fills` / `strokes` with the correct binding.
- If the component was created but not added to the VariantContainer: query both by key, reparent.

### Phase 4 (QA)

- Naming failures: rename shapes directly — no need to recreate anything.
- Binding failures: update fills/strokes on the specific shape — targeted fix, not full rebuild.
- Accessibility failures: adjust color values in library colors — bound shapes update automatically.

---

## Recovery Anti-Patterns

- ❌ Retrying the exact same failed script without reading the error
- ❌ Deleting pages or components by name pattern instead of by run_id tag
- ❌ Hardcoding node IDs from memory in recovery scripts (IDs change if nodes are recreated)
- ❌ Proceeding to the next phase after a partial failure in the current phase
- ❌ Skipping the state file update after a recovery (next session starts from a stale state)
- ❌ Using "works locally" assumptions — always verify with `high_level_overview` after recovery
