# SPEC: Browser Automation in Rovo App

## 1. Objective

Integrate browser automation into the rovo-app chat experience so that:

- **The AI (RovoDev) can browse web pages** as part of its work — either autonomously when it determines browsing is needed, or when the user explicitly requests it (e.g., "go to google.com").
- **A live browser preview appears in the artifact panel** using the existing split/overlay layout. The preview mirrors the real Chromium session via WebSocket frame streaming (view-only — the user watches the AI navigate, not interact directly).
- **Point-in-time screenshots appear inline in chat messages** when the AI takes a screenshot during its browsing session, rendered as images within the assistant message stream.
- **Browser workspaces persist per-thread** — created lazily on first browse request, alive for the thread's lifetime.

### What already exists

The backend infrastructure is fully built in this repo:

| Layer | File(s) | Status |
|-------|---------|--------|
| Browser runtime | `backend/lib/browser-workspace-runtime.js` | Done |
| Workspace manager | `backend/lib/browser-workspace-manager.js` | Done |
| Preview session | `backend/lib/browser-preview-session.js` | Done |
| WebSocket streaming | `backend/server.js` (upgrade handler) | Done |
| REST API | `/api/browser-workspaces/*` endpoints | Done |
| Next.js proxy routes | `app/api/browser-workspaces/*/route.ts` | Done |
| Client API | `lib/browser-workspace-client.ts` | Done |
| Preview hook | `components/website/demos/utils/hooks/use-browser-preview-session.ts` | Done |
| Preview panel | `components/website/demos/utils/components/browser-preview-panel.tsx` | Done |
| Frame queue | `components/website/demos/utils/lib/browser-preview-frame-queue.ts` | Done |

### What needs to be built

Integration into the rovo-app shell, chat, and artifact panel:

1. **Browser artifact kind** — add `"browser"` to the artifact panel so it renders a live browser preview
2. **Browser artifact viewer component** — a rovo-app-specific wrapper around the existing preview infrastructure
3. **Browser screenshot data part** — a new `data-browser-screenshot` streaming part for inline screenshots in chat
4. **Thread-to-workspace binding** — lazy workspace creation, lifecycle tied to thread
5. **AI context** — prompt injection so RovoDev knows it has browser tools available

---

## 2. Architecture

### Data flow

```
User: "go to google.com" or AI decides to browse
    ↓
RovoDev (AI backend) receives chat message
    ↓
AI emits tool call: browser_navigate({ url: "https://google.com" })
    ↓
Backend executes via BrowserWorkspaceManager
    ├── Creates workspace if none exists for this thread
    ├── Runs agent-browser CLI command
    └── Returns result to AI
    ↓
AI emits data parts:
    ├── data-browser-state { workspaceId, url, title, status: "navigating" }
    │   → Frontend opens artifact panel with browser preview
    └── data-browser-screenshot { workspaceId, imageData (base64 JPEG) }
        → Frontend renders inline screenshot in chat message
    ↓
Meanwhile, WebSocket live stream runs independently:
    Backend screencast → WS frames → useBrowserPreviewSession → canvas
```

### Component hierarchy (artifact panel, browser mode)

```
RovoAppShell
  └─ RovoAppShellPaneLayout (split/overlay)
     ├─ Chat pane (left)
     │  └─ RovoAppMessages
     │     └─ BrowserScreenshotPart (inline image for data-browser-screenshot)
     └─ Artifact pane (right)
        └─ RovoAppBrowserArtifact
           ├─ BrowserArtifactHeader (URL bar, title, loading indicator — read-only)
           └─ BrowserArtifactCanvas (canvas element, WebSocket preview session)
```

### New types

```typescript
// In lib/rovo-ui-messages.ts — add to RovoDataParts
"browser-state": {
  workspaceId: string;
  url: string;
  title: string;
  status: "navigating" | "ready" | "error";
};
"browser-screenshot": {
  workspaceId: string;
  url: string;
  imageData: string; // base64 JPEG
  timestamp: string;
};

// In lib/rovo-app-types.ts — extend artifact kind
export type RovoAppDocumentKind =
  | "text" | "code" | "image" | "sheet" | "react" | "excalidraw"
  | "browser"; // new
```

### Thread-workspace binding

```typescript
// New: lib/rovo-app-browser.ts
// Maps threadId → workspaceId (in-memory, frontend + backend)
// Lazy creation: first browse request for a thread creates the workspace
// Cleanup: workspace destroyed when thread is deleted
```

---

## 3. Deliverables (task breakdown)

### Phase 1: Types and data parts

1. **Add `browser-state` and `browser-screenshot` data parts** to `lib/rovo-ui-messages.ts`
2. **Add `"browser"` artifact kind** to `lib/rovo-app-types.ts`

### Phase 2: Frontend — artifact panel browser viewer

3. **Create `RovoAppBrowserArtifact` component** in `components/projects/rovo-app/components/rovo-app-browser-artifact.tsx`
   - Reuses `useBrowserPreviewSession` hook for WebSocket canvas streaming
   - Read-only URL bar header showing current page URL and title
   - Loading state indicator
   - Canvas element for live frame rendering
   - No user interaction forwarding (view-only)

4. **Wire browser artifact into the artifact panel** in `rovo-app-shell.tsx`
   - When `activeDocument.kind === "browser"`, render `RovoAppBrowserArtifact` instead of the standard artifact viewer
   - Opens the artifact panel automatically when `data-browser-state` is received

### Phase 3: Frontend — inline screenshots in chat

5. **Create `BrowserScreenshotPart` component** in `components/projects/rovo-app/components/rovo-app-browser-screenshot.tsx`
   - Renders base64 JPEG screenshot as an inline image in the message
   - Includes URL caption and timestamp
   - Click opens/focuses the artifact panel

6. **Register the screenshot renderer** in `rovo-app-messages.tsx`
   - Handle `data-browser-screenshot` parts in the message rendering loop

### Phase 4: Thread-workspace lifecycle

7. **Create thread-workspace binding** in `components/projects/rovo-app/lib/rovo-app-browser.ts`
   - `getOrCreateWorkspace(threadId)` — calls `POST /api/browser-workspaces` if none exists
   - `getWorkspaceForThread(threadId)` — returns existing workspaceId or null
   - `destroyWorkspaceForThread(threadId)` — called on thread delete

8. **Wire lifecycle into `use-rovo-app.ts`**
   - On thread delete, destroy associated workspace
   - Expose `browserWorkspaceId` state derived from data parts
   - When `data-browser-state` arrives, store mapping and open artifact panel

### Phase 5: Backend — browser tool bridge

9. **Add browser tool handlers** in `backend/server.js` (or new `backend/lib/rovo-app-browser-tools.js`)
   - When RovoDev emits a browser tool call (navigate, screenshot, snapshot, click, etc.), execute via `BrowserWorkspaceManager`
   - Emit `data-browser-state` and `data-browser-screenshot` data parts back into the chat stream
   - Create workspace lazily on first browser tool call for a thread

10. **Add browser context to RovoDev prompts**
    - When thread has/gets a browser workspace, inject system context telling the AI it can use browser tools
    - Define tool schemas: `browser_navigate`, `browser_screenshot`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_scroll`

---

## 4. Code Style

- Follow existing rovo-app patterns (hooks in `hooks/`, lib in `lib/`, components in `components/`)
- Use tabs for indentation, `@/` import alias
- React 19 patterns (`use(Context)`, ref as prop)
- Semantic token classes, not raw CSS variables
- Reuse existing `useBrowserPreviewSession` hook — do not duplicate
- New component goes in `components/projects/rovo-app/components/`
- View-only: no click/scroll/keyboard forwarding to the browser from the artifact panel

---

## 5. Testing Strategy

- **Backend**: `node --test` for new browser tool bridge logic
- **Frontend**: Lint (`pnpm run lint`) + typecheck (`pnpm run typecheck`)
- **Visual**: Run dev server, navigate to `/rovo-app`, trigger a browse action, verify:
  - Artifact panel opens with live browser preview
  - Canvas renders frames from WebSocket
  - Screenshot appears inline in chat message
  - URL bar updates as AI navigates
  - Browser workspace persists across messages in same thread
  - Thread delete cleans up workspace

---

## 6. Boundaries

### Always do
- Reuse existing backend infrastructure (workspace manager, runtime, preview session)
- Keep the browser preview view-only in rovo-app
- Tie workspace lifecycle to thread lifecycle
- Show both live preview (artifact panel) and point-in-time screenshots (chat)
- Use the existing `useBrowserPreviewSession` hook for WebSocket streaming

### Ask first
- Adding new agent-browser CLI commands or modifying the runtime
- Changing the WebSocket protocol or frame format
- Modifying existing demo components (`components/website/demos/utils/`)
- Adding user interaction to the browser preview (click, type, scroll forwarding)
- Changing how RovoDev prompt context works in the backend

### Never do
- Modify the agent-browser npm package or CLI binary
- Break existing demo/preview functionality
- Add browser automation outside the rovo-app route
- Store workspace state in the database (keep in-memory for now)
- Allow direct user interaction with the browser (view-only per spec)

---

## 7. Key files to modify

| File | Change |
|------|--------|
| `lib/rovo-ui-messages.ts` | Add `browser-state` and `browser-screenshot` data parts |
| `lib/rovo-app-types.ts` | Add `"browser"` to `RovoAppDocumentKind` |
| `components/projects/rovo-app/components/rovo-app-browser-artifact.tsx` | **New** — browser viewer for artifact panel |
| `components/projects/rovo-app/components/rovo-app-browser-screenshot.tsx` | **New** — inline screenshot renderer for chat |
| `components/projects/rovo-app/components/rovo-app-shell.tsx` | Wire browser artifact kind into panel rendering |
| `components/projects/rovo-app/components/rovo-app-messages.tsx` | Handle `data-browser-screenshot` in message rendering |
| `components/projects/rovo-app/hooks/use-rovo-app.ts` | Thread-workspace binding, browser state management |
| `components/projects/rovo-app/lib/rovo-app-browser.ts` | **New** — thread-workspace lifecycle helpers |
| `backend/server.js` or `backend/lib/rovo-app-browser-tools.js` | Browser tool bridge for RovoDev chat |
