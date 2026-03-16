# Embedded Browser Sessions Plan

## Summary

This repo should not try to port cmux literally.

cmux solves native AppKit and `WKWebView` problems:

- window-level webview portaling
- first-responder routing
- split-pane ownership
- DevTools docking survival during reparenting

Those concerns do not map to a React app.

The correct plan for VPK is to extend the existing Chromium preview stack into a session-based embedded browser feature with an `agent-browser`-compatible control surface.

Effort assessment:

- single embedded browser session: easy to moderate
- multi-session browser tabs/panels: moderate
- exact cmux parity: not worth pursuing in a web app

## Why This Is Viable Here

The repo already has most of the hard primitives:

- direct `agent-browser` wrapper in `utils/agent-browser/browser.ts`
- backend-owned preview browser in `backend/lib/chromium-preview.js`
- Next proxy routes in `app/api/chromium-preview/*`
- React browser shell in `components/ui-ai/web-preview.tsx`
- React Chromium preview client in `components/ui-ai/web-preview-chromium.tsx`

Today, the main limitation is that the preview backend is effectively singleton-based. cmux works because each browser surface has its own state. VPK needs the same idea, but in web-app terms: sessions, not native panes.

## Current State

### Existing backend browser surface

- `backend/lib/chromium-preview.js`
  - wraps `agent-browser`
  - owns current URL, viewport, history, screenshot cache
  - exposes `navigate`, `goBack`, `goForward`, `reload`, `clickRef`, `fillRef`, `typeRef`, `selectRef`, `wheel`, `press`, `snapshot`, `screenshot`
- `backend/server.js`
  - exposes `/api/chromium-preview`
  - exposes `/api/chromium-preview/back|forward|reload|viewport|click|click-ref|hover-ref|fill-ref|type-ref|select-ref|scroll|wheel|press|type`
  - exposes `/api/chromium-preview/snapshot`
  - exposes `/api/chromium-preview/screenshot`
  - exposes `/api/chromium-preview/stream`

### Existing frontend browser shell

- `components/ui-ai/web-preview.tsx`
  - chooses `iframe` vs `chromium` engine
  - already behaves like a browser container with address bar and nav controls
- `components/ui-ai/web-preview-chromium.tsx`
  - calls backend preview APIs
  - renders screenshot/live preview
  - forwards navigation and input actions

### Existing direct CLI utility

- `utils/agent-browser/browser.ts`
  - useful for local scripts and experiments
  - not sufficient as the app-facing architecture

## Product Goal

Add a reusable embedded browser capability to VPK that supports:

- opening multiple browser sessions
- showing each session inside React UI
- controlling sessions through `agent-browser`-style actions
- getting accessibility snapshots and refs
- preserving per-session URL, history, viewport, and auth state
- supporting both local preview routes and external websites

## Non-Goals

- reproducing cmux native pane/window architecture
- embedding arbitrary external websites directly with only an iframe
- exposing full CDP/Playwright parity on day one
- multi-window native browser behavior
- DevTools docking inside the app UI

## Recommended Architecture

### Core idea

Replace the singleton preview manager with a `BrowserSessionManager`.

Each browser tab/card/panel in the React app maps to one backend browser session.

Each session owns:

- `sessionId`
- current URL
- title
- viewport
- screenshot/live-stream state
- history
- latest snapshot
- auth/cookie state
- element refs that are scoped to that session

### Rendering modes

Keep the current split:

- `iframe` mode for local, same-origin, or simple relative routes
- `chromium` mode for external URLs and agent-controlled browsing

Do not collapse these into one renderer. The dual-engine setup is already correct for a web app.

### Control model

Keep the browser control API backend-owned.

The frontend should never try to automate page DOM directly for external sites. It should call the backend browser session API.

### Ref model

Keep element refs ephemeral and session-scoped.

This mirrors the useful part of cmux:

- refs belong to one session
- refs are invalidated after navigation or DOM churn
- the agent workflow should be `snapshot -> act -> wait -> resnapshot`

## Proposed Phases

## Phase 0: Stabilize the Existing Single-Session Contract

Goal:
- turn the current preview shape into a clean contract before introducing sessions

Changes:

- define a single TypeScript contract for preview state and snapshot payload
- document which actions are already supported
- ensure snapshot responses consistently include:
  - session-independent browser state
  - snapshot text
  - optional refs map

Files:

- `backend/lib/chromium-preview.js`
- `backend/lib/chromium-preview.test.js`
- `lib/api-config.ts`
- `components/ui-ai/web-preview-chromium.tsx`

Exit criteria:

- no hidden assumptions that only one preview exists
- snapshot payload is stable enough to reuse for session mode

## Phase 1: Sessionize the Backend

Goal:
- move from one global preview browser to many named sessions

Create:

- `backend/lib/browser-session-manager.js`

Refactor:

- split `ChromiumPreviewManager` into:
  - `BrowserSession`
  - `BrowserSessionManager`

Session responsibilities:

- create browser on first use
- persist session URL/history/viewport
- keep per-session screenshot cache
- keep per-session stream config
- keep per-session ref namespace

Suggested API shape:

- `POST /api/browser-sessions`
  - create session
- `GET /api/browser-sessions`
  - list sessions
- `GET /api/browser-sessions/:sessionId`
  - get state
- `DELETE /api/browser-sessions/:sessionId`
  - close session
- `POST /api/browser-sessions/:sessionId/navigate`
- `POST /api/browser-sessions/:sessionId/back`
- `POST /api/browser-sessions/:sessionId/forward`
- `POST /api/browser-sessions/:sessionId/reload`
- `POST /api/browser-sessions/:sessionId/viewport`
- `POST /api/browser-sessions/:sessionId/click`
- `POST /api/browser-sessions/:sessionId/click-ref`
- `POST /api/browser-sessions/:sessionId/hover-ref`
- `POST /api/browser-sessions/:sessionId/fill-ref`
- `POST /api/browser-sessions/:sessionId/type-ref`
- `POST /api/browser-sessions/:sessionId/select-ref`
- `POST /api/browser-sessions/:sessionId/press`
- `POST /api/browser-sessions/:sessionId/wheel`
- `GET /api/browser-sessions/:sessionId/snapshot`
- `GET /api/browser-sessions/:sessionId/screenshot`
- `GET /api/browser-sessions/:sessionId/stream`

Compatibility path:

- keep current `/api/chromium-preview/*` routes temporarily
- make them call a default session internally
- migrate the UI after the new routes exist

Files:

- `backend/lib/chromium-preview.js`
- `backend/server.js`
- `app/api/chromium-preview/*`
- new `app/api/browser-sessions/*`

Exit criteria:

- multiple sessions can coexist without overwriting each other
- one session’s navigation does not affect another session’s screenshot/history

## Phase 2: Make the Frontend Session-Aware

Goal:
- make `WebPreview` target a session instead of the singleton preview

Create:

- `components/ui-ai/use-browser-session.ts`
- `components/ui-ai/browser-session-types.ts`

Refactor:

- `components/ui-ai/web-preview.tsx`
- `components/ui-ai/web-preview-chromium.tsx`

New frontend responsibilities:

- create a session on mount if needed
- subscribe to one session’s state
- route nav/input actions to that session
- expose session ID upward

Suggested props:

```ts
type WebPreviewProps = {
  sessionId?: string | null;
  defaultUrl?: string;
  engine?: "auto" | "iframe" | "chromium";
  onSessionChange?: (sessionId: string | null) => void;
  onUrlChange?: (url: string) => void;
};
```

Important decision:

- `iframe` mode does not need sessionization
- `chromium` mode does

Exit criteria:

- one React view can bind to any browser session
- switching sessions does not require remounting the whole browser shell

## Phase 3: Add a Browser Workspace UI

Goal:
- turn the browser from a utility preview into a first-class app feature

Create:

- `components/ui-ai/browser-workspace.tsx`
- `components/ui-ai/browser-tabs.tsx`
- `components/ui-ai/browser-session-store.ts`

Features:

- open new browser tab
- close tab
- switch between tabs
- rename tab from page title
- persist current tab in client state

Suggested state model:

```ts
type BrowserWorkspaceTab = {
  id: string;
  sessionId: string;
  title: string;
  url: string;
  engine: "iframe" | "chromium";
};
```

Use cases:

- AI chat side panel with browser tab
- dedicated browser page
- embedded artifact/browser split layout

Exit criteria:

- users can manage multiple browser sessions from the UI
- browser tabs survive normal React rerenders

## Phase 4: Add Agent-Facing Actions and Snapshot Loop

Goal:
- make the feature actually useful for agent workflows

Create:

- `backend/lib/browser-tool-adapter.js`
- `lib/browser-session-client.ts`

Add agent-facing app-level helpers:

- `openBrowserSession(url)`
- `snapshotBrowserSession(sessionId, { interactive })`
- `clickBrowserRef(sessionId, ref)`
- `fillBrowserRef(sessionId, ref, text)`
- `waitForBrowserSession(sessionId, condition)`

Recommended action set for MVP:

- navigate
- back
- forward
- reload
- snapshot
- screenshot
- click-ref
- hover-ref
- fill-ref
- type-ref
- select-ref
- press
- get title
- get url

Recommended wait support:

- wait for selector
- wait for text
- wait for URL contains
- wait for load state

You do not need cmux’s full RPC method naming. You need stable app-facing functions and stable backend routes.

Exit criteria:

- an agent can run the loop:
  - open
  - wait
  - snapshot
  - act on ref
  - resnapshot

## Phase 5: Persistence and Auth State

Goal:
- make sessions useful across longer-lived workflows

Add:

- save/load cookies or browser state per session
- optional named session restore
- optional project-scoped session persistence

Decisions:

- start with opt-in persistence
- do not auto-restore every session by default

Exit criteria:

- login-heavy workflows do not require re-auth every time

## Recommended File Plan

### New files

- `PLAN-embedded-browser-sessions.md`
- `backend/lib/browser-session-manager.js`
- `backend/lib/browser-session-manager.test.js`
- `app/api/browser-sessions/route.ts`
- `app/api/browser-sessions/[sessionId]/route.ts`
- `app/api/browser-sessions/[sessionId]/[action]/route.ts`
- `components/ui-ai/browser-session-types.ts`
- `components/ui-ai/use-browser-session.ts`
- `components/ui-ai/browser-workspace.tsx`
- `components/ui-ai/browser-tabs.tsx`
- `lib/browser-session-client.ts`

### Existing files to refactor

- `backend/lib/chromium-preview.js`
- `backend/server.js`
- `app/api/chromium-preview/route.ts`
- `app/api/chromium-preview/[action]/route.ts`
- `app/api/chromium-preview/snapshot/route.ts`
- `app/api/chromium-preview/screenshot/route.ts`
- `app/api/chromium-preview/stream/route.ts`
- `components/ui-ai/web-preview.tsx`
- `components/ui-ai/web-preview-chromium.tsx`
- `lib/api-config.ts`

## Data Contracts

### Browser session state

```ts
type BrowserSessionState = {
  sessionId: string;
  ready: boolean;
  title: string;
  url: string;
  viewportWidth: number;
  viewportHeight: number;
  canGoBack: boolean;
  canGoForward: boolean;
  engine: "chromium";
  updatedAt: number;
};
```

### Browser snapshot

```ts
type BrowserSnapshotPayload = {
  sessionId: string;
  url: string;
  title: string;
  snapshot: string;
  refs?: Record<string, { role?: string; name?: string }>;
};
```

## Testing Plan

Add regression coverage at the manager level first.

Backend tests:

- creating two sessions yields isolated state
- navigating session A does not change session B
- screenshot cache is session-scoped
- snapshot refs are session-scoped
- deleting a session cleans up its browser process/session resources

Frontend validation:

- open two browser tabs and navigate each independently
- switch between tabs without state loss
- verify URL bar updates from redirects
- verify screenshot/live preview remains aligned after session switch

Validation commands:

- `pnpm run lint`
- `pnpm tsc --noEmit`
- `node --test backend/lib/*.test.js`

## Risks

### 1. Process and memory cost

Multiple browser sessions can become expensive quickly.

Mitigation:

- lazy-create sessions
- hard-cap active sessions
- add idle cleanup

### 2. Stream/screenshot contention

Your current preview stream config appears tied to one shared session shape.

Mitigation:

- make stream ports/session channels unique per browser session
- treat screenshot fallback as session-scoped

### 3. Ref invalidation

Refs from snapshots are inherently fragile after navigation or DOM mutation.

Mitigation:

- document `snapshot -> act -> resnapshot`
- return explicit ref-not-found errors

### 4. Auth persistence

Per-session auth state can be lost or bleed across sessions if implemented carelessly.

Mitigation:

- make cookie jars/session profiles explicit
- decide early whether sessions share auth or isolate it

## Recommended MVP

The best MVP is:

1. sessionized backend
2. session-aware `WebPreview`
3. multi-tab browser workspace UI
4. snapshot + click-ref + fill-ref + type-ref + wait

Do not start with:

- persistent auth
- advanced network interception
- full CDP parity
- cmux-like pane management

## Implementation Order

1. Refactor `backend/lib/chromium-preview.js` into a reusable session object.
2. Add `BrowserSessionManager` and tests.
3. Add new `/api/browser-sessions/*` backend routes.
4. Add new Next proxy routes for browser sessions.
5. Update `lib/api-config.ts` with session-aware endpoints.
6. Refactor `web-preview-chromium.tsx` to target a session ID.
7. Build a simple `BrowserWorkspace` with tabs.
8. Migrate one app surface to use it.
9. Add agent-facing helpers for snapshot/action loops.
10. Add persistence only after multi-session behavior is stable.

## Acceptance Criteria

This plan is complete when VPK can:

- open at least two independent Chromium-backed browser sessions
- show each session in React UI
- navigate each session independently
- take a snapshot for a specific session
- click/fill/type/select using refs for a specific session
- keep frontend state aligned with backend session state
- pass lint, typecheck, and backend tests

## Final Recommendation

Treat this as a sessionized embedded-browser product feature built on top of your existing preview stack.

Do not port cmux’s native implementation details.

Reuse what you already have:

- `agent-browser` as the automation engine
- the backend preview manager as the execution layer
- `WebPreview` as the shell

The right abstraction for VPK is:

- browser session manager
- session-aware UI shell
- agent-compatible action API

That gets you the same practical outcome without importing native complexity that the web platform cannot support.
