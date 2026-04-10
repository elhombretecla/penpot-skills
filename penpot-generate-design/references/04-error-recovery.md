# Error Recovery: Screen Building

Screen building is more forgiving than design system building. Because sections are built one at a time, errors are naturally scoped. A failed section call does not affect previously built sections.

---

## Core Protocol

When an `execute_code` call fails while building a screen:

```
1. STOP — do not retry immediately, do not proceed to the next section.

2. READ — read the full error message.

3. IDENTIFY SCOPE — did the error leave partial shapes?
   - Check the current page for orphaned frames via high_level_overview or a findShapes query.
   - A failed section call may have created a frame before erroring on appendChild.

4. CLEAN IF NEEDED — remove any partial shapes from the failed call before retrying.

5. FIX AND RETRY — correct the script based on the error, then retry.

6. DOCUMENT — if you had to make a significant change (e.g., skip a component, use a fallback),
   report it to the user before proceeding.
```

---

## Common Errors and Fixes

| Error | Likely cause | Fix |
|-------|-------------|-----|
| `Cannot read properties of undefined (reading 'id')` | Component not found in library — `.find()` returned `undefined` | Add null check: `if (!btnComponent) return { error: '...' }` |
| `TypeError: X.createInstance is not a function` | Wrong variable or API shape changed | Verify with `penpot_api_info({ type: 'LibraryComponent' })` |
| `TypeError: wrapper.appendChild is not a function` | `wrapper` resolved to undefined (ID lookup failed) | Check that wrapperId is passed correctly from the previous call |
| `Shape not found` | Wrapper was deleted or wrong page | Navigate to the correct page, re-query for the wrapper |
| `TypeError: text.applyTypography is not a function` | `applyTypography` not available in this Penpot version | Fall back to manual font property assignment |
| `ReferenceError: penpot is not defined` | MCP plugin disconnected | User must reconnect via File → MCP Server → Connect |
| Timeout | Section script too large | Split into two smaller calls (e.g., top half and bottom half of section) |
| Layout children out of position | Flex layout not applied to parent, or wrong axis | Check `addFlexLayout()` call and `layout.dir` |

---

## Partial Shape Cleanup

When a section call fails after creating some shapes:

```typescript
// Find shapes created by the failed call (no plugin data yet — look for recent unnamed frames)
const page = penpot.currentPage;
const shapes = page.findShapes();

// Identify orphaned top-level frames (not inside the wrapper)
const wrapper = shapes.find(s => s.id === 'WRAPPER_ID');
const orphans = shapes.filter(s =>
  !s.parentId ||
  (s.parentId !== wrapper?.id && !s.getSharedPluginData('dsb', 'key'))
);

return {
  orphanCount: orphans.length,
  orphans: orphans.map(s => ({ id: s.id, name: s.name, type: s.type })),
};
```

Remove orphaned shapes:

```typescript
for (const shape of orphans) {
  shape.remove();
}
return { removed: orphans.length };
```

---

## Wrapper Lost Between Calls

The most common screen-building error: the wrapper ID from Step 3 is no longer available in a subsequent call.

**Prevention**: always return the wrapper ID and record it before proceeding.

**Recovery**: find the wrapper by its plugin data key:

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

// Find by plugin data key (set during wrapper creation)
const wrapper = shapes.find(s =>
  s.getSharedPluginData('dsb', 'key') === 'screen/homepage'
);

if (!wrapper) {
  return { error: 'Wrapper not found by key. Pages may have changed or wrapper was deleted.' };
}

return { wrapperId: wrapper.id, x: wrapper.x, y: wrapper.y };
```

**If the wrapper is truly gone**: rebuild it (it's just a frame — cheap to recreate). Sections built before the loss will still be on the page; fetch them by their names and re-append.

---

## Component Not Found

When a required component doesn't exist in the library:

```typescript
const library = penpot.library.local;
const component = library.components.find(c => c.name === 'NavigationPill');

if (!component) {
  // Option 1: Try alternate names
  const alternates = library.components.filter(c =>
    ['pill', 'tab', 'nav', 'chip'].some(term =>
      c.name.toLowerCase().includes(term)
    )
  );

  if (alternates.length > 0) {
    return {
      componentNotFound: 'NavigationPill',
      suggestions: alternates.map(c => c.name),
      action: 'Please confirm which component to use, or approve building a custom frame instead.',
    };
  }

  return {
    componentNotFound: 'NavigationPill',
    suggestions: [],
    action: 'Component not found in library. Build a custom frame, or use penpot-generate-library to create the component first.',
  };
}
```

**Always return suggestions or ask the user** — never silently skip a component or substitute a different one without confirming.

---

## Updating an Existing Screen

When updating rather than creating from scratch, specific errors are common:

### "Section not found"

```typescript
const page = penpot.currentPage;
const shapes = page.findShapes();

// Try finding by exact name
let section = shapes.find(s => s.name === 'hero-section');

// Try finding by plugin data
if (!section) {
  section = shapes.find(s => s.getSharedPluginData('dsb', 'key') === 'screen/homepage/hero');
}

if (!section) {
  return { error: 'Hero section not found. It may have been renamed or deleted. Run high_level_overview to inspect the current screen structure.' };
}
```

### Instance swap failed

When swapping a component instance to a different variant:

```typescript
// Find the instance to swap
const oldInstance = section.findShapes().find(s => s.name === 'Button/Secondary');

if (!oldInstance) {
  return { error: 'Old button instance not found in section.' };
}

// Remove old, create new
const newBtn = library.components.find(c => c.name === 'Button/Primary');
if (!newBtn) {
  return { error: 'Button/Primary component not found in library.' };
}

const newInstance = newBtn.createInstance();
newInstance.x = oldInstance.x;
newInstance.y = oldInstance.y;

// Attempt to re-parent (check penpot_api_info for exact reparenting API)
section.appendChild(newInstance);
oldInstance.remove();

return { swapped: true, newInstanceId: newInstance.id };
```

---

## Recovery Anti-Patterns

- ❌ Retrying the exact same failed script without reading the error
- ❌ Building a new wrapper after losing the wrapper ID without first checking if it still exists
- ❌ Silently using hardcoded values when a component/color is missing
- ❌ Removing all shapes from the page to "start fresh" when only one section failed
- ❌ Rebuilding the entire screen when only one section has an error
- ❌ Not reporting binding gaps and fallbacks to the user at the end of each section
