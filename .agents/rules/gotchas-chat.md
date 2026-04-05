---
description: Chat and RovoDev gotchas — session management, AI SDK useChat, message deletion
globs: app/contexts/context-rovo-chat.tsx, backend/lib/rovodev-*.js
alwaysApply: false
paths:
  - app/contexts/context-rovo-chat.tsx
  - backend/lib/rovodev-*.js
---

# Chat / RovoDev Gotchas

- **RovoDev-first mode**: `pnpm run rovodev` starts RovoDev Serve (single-instance default) alongside backend and frontend. Use `pnpm run rovodev -- 6` for full pool. `pnpm run dev` starts only backend + frontend (requires RovoDev Serve already running). The main chat endpoint returns 503 when RovoDev Serve is unavailable. AI Gateway is reserved for explicit helper/media flows such as image, sound, suggestions, title/metadata generation, and Realtime voice.
- If the chat gives unexpected answers or stale context, the RovoDev session may be corrupted — restart `pnpm run rovodev` for a fresh session.
- Always `await stop()` before calling `sendMessage()` in AI SDK `useChat` flows — `stop`, `sendMessage`, `regenerate`, and `resumeStream` share mutable internal state and must not be fire-and-forgotten in sequence.
- Frontend message deletion (`handleDeleteMessage`) does not clear RovoDev Serve's server-side conversation history. After deleting messages, the AI may still reference prior context. Restart `pnpm run dev` for a full reset.
