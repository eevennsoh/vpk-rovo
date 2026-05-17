---
description: Chat and RovoDev gotchas — session management, AI SDK useChat, message deletion
globs: app/contexts/context-rovo-chat.tsx, backend/lib/rovodev-*.js
alwaysApply: false
paths:
  - app/contexts/context-rovo-chat.tsx
  - backend/lib/rovodev-*.js
---

# Chat / RovoDev Gotchas

- **Hybrid AI Gateway/RovoDev mode**: `pnpm run dev` starts backend + frontend and supports AI Gateway-backed chat when credentials are configured. `pnpm run rovodev` adds RovoDev Serve (single-instance default; use `pnpm run rovodev -- 6` for full pool). Use `portless run` / `portless run --script rovodev` only when you explicitly want Portless URLs. Requests that explicitly select RovoDev return 503 when RovoDev Serve is unavailable.
- If the chat gives unexpected answers or stale context, the RovoDev session may be corrupted — restart `pnpm run rovodev` for a fresh session.
- Always `await stop()` before calling `sendMessage()` in AI SDK `useChat` flows — `stop`, `sendMessage`, `regenerate`, and `resumeStream` share mutable internal state and must not be fire-and-forgotten in sequence.
- Frontend message deletion (`handleDeleteMessage`) does not clear RovoDev Serve's server-side conversation history. After deleting messages, RovoDev-selected turns may still reference prior context. Restart `pnpm run rovodev` for a full RovoDev reset.
