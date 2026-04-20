# Error Recovery — penpot-create-ui

---

## Phase-Specific Recovery

### Phase 0: Design Direction Card Rejected

**Situation**: The user rejects the proposed style profile or design intent.

**Fix**:
1. Ask specifically what was wrong: "Is it the style profile, the color choice, the typography, or the overall direction?"
2. Revise the Design Direction Card with the feedback.
3. Do NOT start creating tokens/components until the revised card is approved.
4. Common reasons for rejection and fixes:
   - "Too corporate" → shift from PRECISION to WARM, or choose a warmer accent color
   - "Not exciting enough" → shift to BOLD, increase display type sizes, stronger accent
   - "Wrong industry feel" → revisit the adjectives and check competitive references

### Phase 1: Token Creation Fails

**Situation**: TokenCatalog API not available or returns errors.

**Fix**:
1. Call `penpot_api_info({ type: 'LibraryLocal' })` to verify the exact API path.
2. If TokenCatalog is unavailable, proceed with only library colors and typographies (skip token binding, use raw hex values in fills with library color references only).
3. Document this limitation in the state ledger: `"tokenCatalogAvailable": false`.

### Phase 2: Component Creation Fails Mid-Build

**Situation**: The component was partially built when an error occurred.

**Fix**:
1. Do NOT retry the entire component from scratch.
2. Inspect current state: `high_level_overview` to see what shapes exist.
3. Find the partially-built frame by name (use `findShapes()` with name matching).
4. If the base frame exists: add the missing children and wrap as component.
5. If the base frame doesn't exist: rebuild only the missing parts.

### Phase 3: Section Build Fails

**Situation**: A section build throws an error partway through.

**Fix**:
1. Read the error message carefully.
2. Call `export_shape` on the screen wrapper to see what was actually created.
3. Identify which elements succeeded (visible in export) and which didn't.
4. Continue from where the failure occurred — don't rebuild the whole section.
5. If the section wrapper frame was created but children failed: fetch the wrapper by ID and append the missing children.

---

## Common Errors

### "Cannot read property of undefined" on fills

**Cause**: Library color not found by name.
**Fix**: Verify the exact color name with `library.colors.map(c => c.name)` before applying.

### Component not appearing in library panel

**Cause**: `createComponent()` may require the component to be on the current page's main frame.
**Fix**: Ensure the source frame is a direct child of the page (not nested inside another frame) before calling `createComponent()`.

### Shape positioned at (0, 0) instead of expected position

**Cause**: When appending a shape to a frame with flex layout, position is managed by flex. Do NOT set x/y on children of flex-layout frames.
**Fix**: Remove explicit `x`/`y` assignments from children of flex-layout frames.

### Font not rendering (fallback to system font)

**Cause**: Inter may not be loaded in all Penpot environments.
**Fix**: Call `penpot_api_info({ type: 'Font' })` to verify available fonts. If Inter is not available, use the system sans-serif or ask the user to install the font.

---

## Resume Protocol

If the session is interrupted or context is truncated:

1. Read `/tmp/create-ui-state-{RUN_ID}.json` (the state ledger).
2. Call `high_level_overview` to see current file state.
3. Reconcile state ledger with actual file (some creates may have occurred without being recorded).
4. Resume from `phase` in the state ledger.
5. If `completedPhases` doesn't match what `high_level_overview` shows: trust `high_level_overview` as ground truth.
