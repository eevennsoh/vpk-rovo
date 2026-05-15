# Spec: Shared Rovo Chat History

## Objective

Build one canonical chat history for fullscreen `/rovo`, floating chat, and sidebar chat. The hamburger button in compact chat surfaces opens an in-shell history drawer that lists recent `/rovo` threads and lets users open, start, delete, or cancel chats without changing the current route.

Success means a chat started from floating chat, sidebar chat, or fullscreen `/rovo` creates and updates the same persisted `/rovo` thread record, and that record is visible from all three surfaces after refresh-on-action.

## Confirmed Decisions

- Canonical history model: `/rovo` threads are the only shared chat record model.
- Compact history UI: the hamburger opens an in-shell compact left drawer.
- Compact history scope: recent threads only in v1, no search.
- New chat behavior: compact New chat clears to an unsaved draft and creates a `/rovo` thread only on first send.
- Thread selection: selecting a history item loads it into the current compact surface without updating the browser URL.
- Fullscreen handoff: Open fullscreen navigates the same tab to `/rovo/[threadId]`.
- Delete behavior: deleting the active compact thread deletes the record and returns the compact surface to a blank draft.
- Rich thread behavior: compact chat renders transcript-first, summarizes unsupported rich state, and exposes Open fullscreen.
- Cross-surface sync: refresh on drawer open, focus, send, delete, and cancel. No realtime cross-tab sync in v1.
- Runtime routing: AI Gateway is the default for all chat. RovoDev is optional and only delegates rich/tool turns when healthy.
- RovoDev absent: rich/tool turns use AI Gateway best-effort fallback rather than blocking the send.
- AI failure: if an AI-routed turn fails, show the AI error and do not silently fall back to RovoDev.
- Active run model: persisted active run metadata includes the backend owner, for example `backend: "ai-gateway" | "rovodev"`.
- Existing history reset: implementation includes a one-time local reset of existing chat history data, not a shipped startup reset.
- Legacy thread model: remove unreachable legacy `backend/lib/chat.js` and `/api/chat/threads` code/constants where safe.

## Non-goals

- Do not add compact history search/filter in v1.
- Do not make compact chat fully match the fullscreen `/rovo` control plane.
- Do not expose `/rovo` settings, jobs, skills, memories, or full navigation in the compact drawer.
- Do not add realtime broadcast/SSE synchronization between multiple open surfaces in v1.
- Do not restore the original route/context that created an older thread when continuing it from compact chat.
- Do not extract the full `useRovoApp` fullscreen runtime into compact chat.
- Do not ship code that deletes chat history on every startup.
- Do not alter special embedded `ChatPanel` consumers unless they already use the global compact chat provider.

## Current State

- Compact sidebar/floating chat uses `RovoChatProvider` in `app/contexts/context-rovo-chat.tsx` and sends through `/api/chat-sdk`.
- The compact hamburger buttons in `components/projects/sidebar-chat/components/chat-header.tsx` and `components/projects/rovo-floating-chat/components/floating-chat-header.tsx` are currently no-op handlers.
- Fullscreen `/rovo` already has durable thread storage, history list UI, title generation, delete/cancel behavior, run indicators, and `/api/rovo/threads`.
- `/api/rovo/chat` currently hard-gates managed runs on RovoDev availability before streaming, which conflicts with the new AI Gateway default.
- `backend/lib/chat.js` defines an older file-backed `backend/data/chat` thread model, but it is not the target model for shared chat history.

## Public Interfaces

### Thread APIs

Use existing `/api/rovo` APIs as the shared persistence surface:

- `GET /api/rovo/threads`
- `POST /api/rovo/threads`
- `GET /api/rovo/threads/:threadId`
- `PUT /api/rovo/threads/:threadId`
- `DELETE /api/rovo/threads/:threadId`
- `DELETE /api/rovo/threads?all=true`
- `POST /api/rovo/chat`

Do not introduce a new compact-chat thread API. If compatibility routing is needed internally, it must map to `/api/rovo/*` and not create a second persistence model.

### Active Run Type

Extend `RovoAppActiveRun` in `lib/rovo-app-types.ts`:

```ts
export type RovoAppRunBackend = "ai-gateway" | "rovodev";

export interface RovoAppActiveRun {
	id: string;
	backend: RovoAppRunBackend;
	status: RovoAppRunStatus;
	rovoPort: number | null;
	startedAt: string;
	updatedAt: string;
}
```

Rules:

- `backend: "rovodev"` may include `rovoPort`.
- `backend: "ai-gateway"` must use `rovoPort: null`.
- Existing readers must tolerate older persisted records without `backend` by normalizing them to `"rovodev"` only when RovoDev-specific fields are present; otherwise normalize conservatively to `"ai-gateway"` for AI-owned streams created after this change.
- UI labels should stay user-facing and neutral, for example Running, Queued, Background, or Cancel. Backend kind is not primary UI copy.

### Compact Adapter

Add a narrow compact thread adapter around existing `/rovo` APIs. The adapter owns:

- Listing recent threads.
- Creating a thread on first compact send.
- Loading a selected thread into compact state.
- Persisting compact transcript updates back to the `/rovo` thread.
- Deleting a selected thread.
- Canceling or detaching an active run.
- Refreshing on drawer open/focus/send/delete/cancel.

The adapter must reuse existing `/rovo` API helpers and thread state utilities where practical, but must not require compact chat to mount the fullscreen `/rovo` shell or full `useRovoApp` hook.

## Backend Design

### AI Gateway Default

Refactor `/api/rovo/chat` so plain chat can stream through AI Gateway without waiting for RovoDev pool readiness.

Routing behavior:

- Plain/default turns route to AI Gateway by default.
- Rich/tool turns are classified using the existing `/rovo` turn-mode/routing utilities where possible.
- If a rich/tool turn is detected and RovoDev is healthy, create a backend-tagged RovoDev active run and use the managed RovoDev flow.
- If a rich/tool turn is detected and RovoDev is absent, route to AI Gateway with best-effort behavior.
- If AI Gateway fails for an AI-routed turn, return the AI error and do not attempt RovoDev as an implicit fallback.

### Active Runs

Track active/background status for both AI Gateway streams and RovoDev managed runs:

- RovoDev runs keep existing queued/streaming/background behavior and port assignment.
- AI Gateway streams get `activeRun.backend = "ai-gateway"` while streaming or detached/backgrounded.
- Cancel must cancel the backend that owns the active run.
- Switching away from a streaming compact thread detaches/backgrounds the run when the backend supports it; otherwise it preserves persisted state and lets the stream finish/fail normally.

### Persistence

Compact chat must write to the same `RovoAppThread` record shape used by fullscreen `/rovo`.

First-send flow:

1. User opens compact chat or clicks New chat.
2. UI enters an unsaved draft with no thread in history.
3. On first send, create a `/rovo` thread with the user message and compact context.
4. Stream the assistant response through `/api/rovo/chat`.
5. Persist assistant messages and updated title using the existing `/rovo` thread update/title flow.

Existing-thread send flow:

1. User selects a `/rovo` thread from compact history.
2. Adapter loads the thread messages into compact transcript state.
3. New compact sends append to the selected `/rovo` thread.
4. New sends use the current route/context bar/prompt context, not the route context that originally created the thread.

### Data Reset

During implementation, perform a one-time local reset of existing chat history:

- Clear `backend/data/rovo-app`.
- Clear `backend/data/chat` if present.
- Do not delete outside those exact storage roots.
- Do not add startup code, migration code, or recurring cleanup that clears these paths later.

If generated artifacts, uploads, votes, browser workspaces, or documents live under the cleared `/rovo` storage root, they are part of the reset by design.

### Legacy Removal

Remove unreachable legacy chat-thread code/constants where safe:

- Remove unused `backend/lib/chat.js` if no imports remain.
- Remove or stop exporting `CHAT_THREADS` / `chatThreads` config entries if no active route uses them.
- Remove unused `/api/chat/threads` proxy route files if they only serve the legacy model.
- After removal, `rg -n "api/chat/threads|CHAT_THREADS|createThreadManager|backend/lib/chat"` should have no active implementation references.

## Frontend Design

### Compact History Drawer

Add a compact history drawer component for floating/sidebar chat:

- Opens from the existing hamburger button.
- Appears as a left drawer inside the compact chat shell.
- Uses current compact visual styling and ADS semantic classes.
- Reuses fullscreen `/rovo` sidebar row behavior where practical: active row state, run indicator, title, relative timestamp, delete action, and cancel affordance.
- Shows recent threads from `/api/rovo/threads`.
- Shows empty state only when loaded and no threads exist.
- Does not show search, settings, jobs, memories, skills, or full `/rovo` nav.

Required drawer actions:

- Open thread in compact surface.
- New chat.
- Delete thread.
- Cancel active run when a thread has cancelable active work.
- Open fullscreen.

### Compact Transcript Rendering

Compact chat remains transcript-first:

- Render text and supported message parts with existing compact chat components.
- For artifact/browser/plan/realtime state that compact chat cannot represent, show a concise unsupported-rich-state affordance and an Open fullscreen action.
- Do not auto-navigate to fullscreen when selecting a rich thread.
- Do not hide rich threads from the drawer.

### Surface Integration

Apply the shared compact history adapter to:

- Global compact chat surfaces owned by AppLayout.
- Floating chat.
- Sidebar chat.
- The `rovo-button` demo.

Leave route-local or special embedded `ChatPanel` consumers unchanged unless they already flow through the global provider being updated.

### URL Behavior

- Selecting history in compact chat must not update the browser URL.
- Open fullscreen must navigate the same tab to `/rovo/[threadId]`.
- Fullscreen `/rovo` retains its existing route sync behavior.

## Edge Cases

- Empty history: drawer shows a loaded empty state and New chat remains available.
- Unsaved draft plus drawer selection: selecting a thread discards the unsaved draft unless the implementation already has an unsent-composer warning pattern nearby. Do not invent a modal for v1.
- Active compact stream plus thread switch: detach/background current run, then load selected thread.
- Active compact stream plus delete current thread: cancel if cancelable, delete, then show blank draft.
- Deleted thread selected in another surface: show blank draft or not-found state, then refresh history.
- Backend unavailable: compact history shows the same backend-unavailable user message pattern used by `/rovo` helpers.
- AI Gateway unavailable: show the AI Gateway error for AI-routed turns.
- RovoDev unavailable: rich/tool turns use AI Gateway best-effort fallback.
- Old persisted active runs without backend: normalize safely and avoid crashing the drawer or fullscreen sidebar.
- Multiple open surfaces: each surface refreshes on open/focus/actions; immediate live sync is not required.

## Implementation Tasks

1. Save this spec at `SPEC.rovo-chat-history.md`.
2. Inventory legacy chat-thread references and remove unreachable legacy code/constants.
3. Perform the one-time local reset of `backend/data/rovo-app` and `backend/data/chat`.
4. Extend `RovoAppActiveRun` with backend identity and normalize old records.
5. Refactor `/api/rovo/chat` routing so AI Gateway is the default and RovoDev is optional rich/tool delegation.
6. Add backend tests for AI Gateway default, RovoDev delegation, AI fallback, AI error behavior, and backend-tagged active runs.
7. Add the compact thread adapter around `/rovo` APIs.
8. Wire compact provider state to create threads on first send, load selected threads, persist messages, delete/cancel threads, and refresh on action/focus.
9. Add the compact history drawer and connect hamburger buttons in sidebar/floating chat headers.
10. Add rich-state transcript affordance and Open fullscreen action.
11. Update or add frontend tests for drawer behavior, thread selection, draft creation, active deletion, and fullscreen handoff.
12. Run validation and browser smoke checks.

## Testing Strategy

### Backend Tests

Add targeted `node --test` coverage for:

- `/api/rovo/chat` streams AI Gateway when RovoDev is absent.
- Rich/tool turns delegate to RovoDev when RovoDev is healthy.
- Rich/tool turns fall back to AI Gateway when RovoDev is absent.
- AI-routed errors surface as AI errors and do not silently retry through RovoDev.
- `activeRun.backend` is persisted and normalized.
- Cancel dispatches to the active run backend.

### Persistence Tests

Add tests for:

- First compact send creates a `/rovo` thread.
- Compact selected thread loads messages from `/api/rovo/threads/:threadId`.
- Compact follow-up persists to the selected `/rovo` thread.
- Deleting active compact thread clears the selected state and returns blank draft.
- Legacy `backend/lib/chat.js` / `/api/chat/threads` references are removed or unreachable.

### Frontend Tests

Add or update tests for:

- Hamburger opens the history drawer.
- Recent threads render in the drawer.
- New chat clears to unsaved draft and does not create an empty thread.
- Selecting history loads the compact transcript without route navigation.
- Open fullscreen navigates to `/rovo/[threadId]` in the same tab.
- Delete active thread returns to blank draft.
- Rich threads render transcript plus Open fullscreen affordance.

### Manual Browser Checks

Check:

- `/rovo`
- AppLayout compact chat surface
- Floating chat
- `rovo-button` demo

Manual acceptance:

- A thread started in any checked surface appears in the other surfaces after refresh-on-action.
- Compact hamburger opens/closes the drawer cleanly.
- Compact selection does not change URL.
- Fullscreen handoff navigates to the expected `/rovo/[threadId]`.
- Plain chat works without RovoDev.
- Rich/tool prompt uses RovoDev when available and AI Gateway best-effort when absent.

## Validation Commands

Run:

```bash
pnpm run lint
pnpm run typecheck
```

Run targeted tests for changed backend/frontend files. There is no single `pnpm test` script, so use explicit `node --test` commands, for example:

```bash
node --test backend/lib/<changed-test>.test.js
node --test components/projects/rovo/lib/<changed-test>.test.js
```

For browser validation, use the repo-approved browser workflow and keep ad-hoc artifacts under ignored output directories.

## Boundaries

Always:

- Preserve unrelated local edits.
- Keep compact chat visuals consistent with the existing compact shell.
- Use `pnpm` for repo commands.
- Use tabs in TS/JS files.
- Use `@/` imports where the alias applies.
- Use React 19 patterns already required by the repo.
- Prefer ADS semantic token classes over raw `var(--ds-...)` usage.

Ask first:

- Adding a new persistent storage model.
- Adding new dependencies.
- Adding search, grouping, or full `/rovo` sidebar parity to the compact drawer.
- Shipping automated data deletion beyond the one-time local reset.
- Changing public route behavior beyond same-tab Open fullscreen.

Never:

- Create a second compact-only history model.
- Route AI Gateway failures silently into RovoDev.
- Delete outside the exact approved chat storage roots.
- Revert unrelated user changes.
- Change special embedded `ChatPanel` consumers that are outside the global compact chat surface.

## Open Questions

None blocking. The product, UX, routing, persistence, reset, and validation decisions above are the implementation contract for v1.
