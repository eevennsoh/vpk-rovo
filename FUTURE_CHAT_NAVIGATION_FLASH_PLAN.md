# Eliminate Future Chat Same-Surface Navigation Flash

## Summary

- Treat thread changes inside Future Chat as URL/state sync, not full App Router navigations.
- Fix both reported symptoms together:
  - home composer flash when entering a thread
  - brief empty-thread-list flash in the sidebar
- Public APIs/interfaces/types: add `isLoadingThread: boolean` to `FutureChatHookResult` in `components/projects/future-chat/hooks/use-future-chat.ts`. No backend changes.

## Key Changes

- In `components/projects/future-chat/components/future-chat-shell.tsx`, replace sidebar thread selection `router.push(...)` with native `window.history.pushState(...)` after `chat.loadThread(threadId)` completes.
  - Preserve current history semantics for explicit user navigation between threads.
  - Keep the existing in-memory thread data and sidebar list mounted instead of remounting the page.

- In `components/projects/future-chat/hooks/use-future-chat.ts`, replace same-surface automatic thread URL promotions from `router.replace(...)` to `window.history.replaceState(...)`.
  - Apply this to the first-turn persistence-success path.
  - Apply it to the persistence-recovery path.
  - Apply it to the deferred voice-mode route-sync effect.
  - Keep `router.replace("/future-chat")` only for true invalid-thread fallback, where a real route correction is intended.

- In `components/projects/future-chat/components/future-chat-shell.tsx`, gate the welcome/home layout behind a dedicated `showHomeState` condition:
  - no visible chat messages
  - no artifact pane open
  - `chat.isLoadingThread === false`
  This prevents the welcome composer from appearing during route hydration even if a thread load is momentarily in flight.

## Test Plan

- Static checks:
  - `pnpm run lint`
  - `pnpm tsc --noEmit`

- Manual browser validation with `agent-browser` on `http://localhost:3000/future-chat`:
  - Click an existing thread from the sidebar and confirm there is no flash of the home composer and no brief empty sidebar state.
  - Start a brand-new chat, wait for the first response, and confirm the URL updates to `/future-chat/[threadId]` without flashing the home screen.
  - Click `New chat`, then reopen the same thread, and confirm the thread list stays populated throughout.
  - Hard-refresh a `/future-chat/[threadId]` URL and confirm the shell does not show the welcome state while the thread is loading.

- Unit coverage:
  - Keep the existing `future-chat-thread-route-sync` tests.
  - Add a small pure helper test only if a reusable home-state predicate or thread-path helper is extracted during implementation.

## Assumptions

- The desired behavior is to keep updating the browser URL for thread selection and first-turn thread creation.
- Explicit sidebar thread selection should remain a history-stack navigation (`pushState`), while automatic post-generation thread promotion should remain replacement semantics (`replaceState`).
- The flashes are caused by client-side remount/reset on `router.push` and `router.replace`, not by backend data loss.
