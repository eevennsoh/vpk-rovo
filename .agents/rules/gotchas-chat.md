---
description: Chat and Rovo gotchas — session management, AI SDK useChat, message deletion
globs: app/contexts/context-rovo-chat.tsx, backend/lib/rovo-*.js
alwaysApply: false
paths:
  - app/contexts/context-rovo-chat.tsx
  - backend/lib/rovo-*.js
---

# Chat / Rovo Gotchas

- **Hybrid AI Gateway/Rovo mode**: `pnpm run dev` starts backend + frontend and supports AI Gateway-backed chat when credentials are configured. `pnpm run rovo` adds Rovo Serve (single-instance default; use `pnpm run rovo -- 6` for full pool). Use `portless run` / `portless run --script rovo` only when you explicitly want Portless URLs. Requests that explicitly select Rovo return 503 when Rovo Serve is unavailable.
- If the chat gives unexpected answers or stale context, the Rovo session may be corrupted — restart `pnpm run rovo` for a fresh session.
- Always `await stop()` before calling `sendMessage()` in AI SDK `useChat` flows — `stop`, `sendMessage`, `regenerate`, and `resumeStream` share mutable internal state and must not be fire-and-forgotten in sequence.
- Frontend message deletion (`handleDeleteMessage`) does not clear Rovo Serve's server-side conversation history. After deleting messages, Rovo-selected turns may still reference prior context. Restart `pnpm run rovo` for a full Rovo reset.
