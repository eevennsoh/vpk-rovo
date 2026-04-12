# Split Hermes Memory UI: MEMORY.md vs USER.md

## Context

The homescreen shows "Hermes memory 5 entries" (summing both MEMORY.md + USER.md), but the Memories page defaults to showing only MEMORY.md (3 entries) — creating a confusing count mismatch. Additionally, USER.md ("User profile" — name, role, preferences) serves a fundamentally different purpose from MEMORY.md ("Core memory" — project facts, environment notes) but they share identical UI as tabs in the same page.

**Goal:** Fix the count mismatch, give USER.md its own dedicated UI in Settings where identity/preferences belong, and simplify the Memories page to manage only MEMORY.md.

## Changes

### 1. Fix homescreen count — `rovo-app-shell.tsx`

**File:** `components/projects/rovo-app/components/rovo-app-shell.tsx`
**Lines 162-172:** `buildHermesMemoryLabel()` currently sums `memoryCount + userCount`.

- Remove `userCount` variable
- Return `Hermes memory ${memoryCount} entries` using only MEMORY.md count

### 2. Simplify Memories page to MEMORY.md only — `memories-surface.tsx`

**File:** `components/projects/control-plane/memories-surface.tsx`

- **Line 36:** Replace `useState<HermesMemoryTarget>("memory")` with a constant `const activeTarget: HermesMemoryTarget = "memory"`
- **Lines 95-97:** Delete `handleSelectTarget` function
- **Lines 225-244:** Remove the Target toggle card (MEMORY.md/USER.md buttons). Keep only the Usage card, remove the `sm:grid-cols-2` wrapper grid
- **Line 204:** Update description to `"Read and edit Hermes core memory (MEMORY.md) with live entry counts and character usage."`
- **Line 86:** Change useEffect dependency from `[activeTarget]` to `[]`
- **Lines 88-93:** Remove `activeTarget` from the second useEffect dependency array

### 3. Create UserProfileCard component (new file)

**File:** `components/projects/control-plane/user-profile-card.tsx` (~140 lines)

A compact, self-contained card for managing USER.md entries.

**Reuses existing code:**
- `fetchMemoryDocument("user")`, `addMemoryEntry("user", ...)`, `deleteMemoryEntry("user", ...)` from `control-plane-api.ts`
- `calculateUsage()`, `splitMemoryEntries()` from `control-plane-utils.ts`
- `CONTROL_PLANE_MEMORY_LIMITS.user` (4000) from `control-plane-data.ts`
- `HermesMemoryDocument` type from `lib/rovo-runtime-types.ts`

**Layout:**
```
+----------------------------------------------------+
| User Profile                     [N entries badge]  |
| Hermes user memory — preferences and identity.      |
|----------------------------------------------------|
| Usage  ==============================----  65%      |
| 2,600 / 4,000 chars                                |
|----------------------------------------------------|
| "Prefers concise notes..."                [Delete]  |
|   240 chars                                         |
| "The workspace is shared..."              [Delete]  |
|   180 chars                                         |
|----------------------------------------------------|
| [+ Add entry]                                       |
| (expands: Textarea + Cancel/Save buttons)           |
+----------------------------------------------------+
```

**State:** `document`, `draftText`, `isLoading`, `isMutating`, `errorMessage`, `isAddingEntry`

**Behavior:**
- Loads USER.md on mount via `fetchMemoryDocument("user")`
- Entry list with hover-reveal delete buttons
- Collapsible add-entry form with Textarea
- Usage bar via `Progress` + `calculateUsage()`

### 4. Add UserProfileCard to Settings page — `settings-surface.tsx`

**File:** `components/projects/control-plane/settings-surface.tsx`

- Add import: `import { UserProfileCard } from "./user-profile-card"`
- Insert `<UserProfileCard />` at top of right column (before Runtime Options card, ~line 192)

## Files Summary

| File | Action | Lines changed |
|------|--------|--------------|
| `components/projects/rovo-app/components/rovo-app-shell.tsx` | Modify | ~3 lines |
| `components/projects/control-plane/memories-surface.tsx` | Modify | ~30 lines removed |
| `components/projects/control-plane/user-profile-card.tsx` | Create | ~140 lines |
| `components/projects/control-plane/settings-surface.tsx` | Modify | ~3 lines |

No changes needed to: `control-plane-api.ts`, `control-plane-utils.ts`, `control-plane-data.ts`, `rovo-runtime-types.ts` — all utilities and types already exist.

## Verification

1. `pnpm run lint` + `pnpm tsc --noEmit` — no errors
2. Navigate to homescreen — "Hermes memory N entries" should match MEMORY.md count only
3. Navigate to Memories page — no MEMORY.md/USER.md toggle, only MEMORY.md entries shown, badge count matches homescreen
4. Navigate to Settings page — User Profile card visible with USER.md entries, usage bar, add/delete working
5. Add/delete entries in User Profile card — verify API calls succeed and UI updates
