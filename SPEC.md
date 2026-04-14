# SPEC: Clicky — AI Cursor Companion for Rovo App

## 1. Objective

Add an AI-powered cursor companion ("Clicky") to the Rovo App chat interface. When activated, a secondary animated cursor follows the user's real cursor around the page. The user speaks (or types) to Clicky, which captures a screenshot of the current viewport, sends it + the transcript to an LLM with vision capabilities, and responds with spoken audio. If Clicky identifies a specific UI element to reference, it flies to that element with a bezier arc animation and displays a speech bubble.

**Target users:** Rovo App users who want a hands-free, visual AI assistant that can see their screen, understand context, and point at things.

**Inspiration:** [farzaa/clicky](https://github.com/farzaa/clicky) — a macOS menu bar companion. We adapt the core UX (AI cursor + voice + screen vision + pointing) to a React web app running in the browser.

---

## 2. Core Features

### 2.1 Activation Toggle

- New icon button in the Rovo App composer toolbar (cursor/pointer icon)
- Click to activate → Clicky cursor appears and follows the real cursor
- Click again (or press Escape) to deactivate → Clicky cursor fades out
- Visual indicator: button shows active state when Clicky is on

### 2.2 AI Cursor Companion

- A small animated Rovo-branded cursor shape rendered as a fixed-position overlay with `pointer-events: none`
- Uses ADS accent blue (`--color-blue-500` / `--color-blue-600`), with subtle glow/shadow using `token("elevation.shadow.raised")`
- Follows the real cursor with a spring-like delay (offset ~30px to the right and below)
- Three visual states:
  1. **Idle** — triangle shape, gently bobbing
  2. **Listening** — morphs into waveform bars (reacting to mic audio level)
  3. **Processing** — morphs into a spinner
  4. **Speaking** — triangle returns, TTS audio plays

### 2.3 Voice Interaction (Push-to-Talk or Toggle)

- Uses the existing OpenAI Realtime WebSocket relay (`backend/lib/openai-realtime.js`) for voice
- Push-to-talk: hold a key (e.g., Space when Clicky is active) to speak; release to process
- Or toggle mode: click a mic button on the Clicky overlay to start/stop recording
- Transcript displayed near the cursor during dictation

### 2.4 Screen Capture + Vision

- On each user utterance, capture the current viewport using `html2canvas` or the existing `getDisplayMedia` screenshot utility
- Send the screenshot as a base64 image alongside the transcript to the LLM
- The LLM sees what the user sees and can reference specific UI elements

### 2.5 Element Pointing

- The LLM responds with text + an optional `[POINT:x,y:label]` tag
- If coordinates are provided:
  1. Parse the tag, map screenshot pixel coordinates to viewport coordinates
  2. Clicky cursor flies in a **quadratic bezier arc** from its current position to the target
  3. At the target, a speech bubble appears with the response text
  4. After ~3 seconds, Clicky flies back to following the cursor
- The bezier arc uses smoothstep easing with scale pulse at midpoint (per original Clicky)

### 2.6 Text-to-Speech Response

- Use the existing GPT Realtime voice infrastructure for TTS
- The LLM's text response (minus the POINT tag) is spoken aloud
- Audio plays while Clicky is in "speaking" state
- Support barge-in: if the user starts speaking while Clicky is talking, interrupt

### 2.7 Conversation History

- Maintain last 10 exchanges in memory (transcript + response pairs)
- Pass as context to each new LLM call so Clicky remembers recent conversation

---

## 3. Architecture

### 3.1 Frontend Components

```
components/projects/rovo-app/
├── components/
│   ├── clicky/
│   │   ├── clicky-overlay.tsx          # Fixed overlay with pointer-events:none cursor companion
│   │   ├── clicky-cursor.tsx           # The animated triangle/waveform/spinner shape
│   │   ├── clicky-speech-bubble.tsx    # Speech bubble shown at pointed element
│   │   └── clicky-flight-animation.ts  # Bezier arc math + requestAnimationFrame loop
│   └── rovo-app-composer.tsx           # Modified: add Clicky toggle button
├── hooks/
│   └── use-clicky.ts                   # Core state machine + orchestration hook
├── lib/
│   ├── clicky-screen-capture.ts        # Viewport screenshot capture
│   ├── clicky-point-parser.ts          # Parse [POINT:x,y:label] from LLM response
│   └── clicky-coordinate-mapper.ts     # Map screenshot coords to viewport coords
```

### 3.2 Backend

- **No new backend endpoints needed** for the core feature
- Reuse the existing OpenAI Realtime WebSocket relay for voice
- Screen capture + LLM vision calls happen client-side via the existing chat transport or a direct API call through the existing proxy

### 3.3 LLM Integration

- **Model:** Use the existing OpenAI Realtime connection (GPT-4o Realtime) for voice + response
- **Vision:** Send viewport screenshots as image content parts alongside voice/text input
- **System prompt:** Adapted from Clicky's `companionVoiceResponseSystemPrompt`:
  - Persona: friendly, casual AI companion named "Clicky"
  - Responds in 1-2 sentences by default
  - Evaluates whether pointing at a UI element would help
  - Appends `[POINT:x,y:label]` when pointing, `[POINT:none]` otherwise
  - Coordinate space = screenshot pixel dimensions (sent as image metadata)

### 3.4 State Machine

```
ClickyState: "off" | "idle" | "listening" | "processing" | "speaking" | "pointing"

off ──(activate)──→ idle
idle ──(user starts speaking)──→ listening
listening ──(user stops speaking)──→ processing
processing ──(LLM responds)──→ speaking (if no POINT) OR pointing (if POINT)
speaking ──(TTS complete)──→ idle
pointing ──(flight complete + bubble shown + 3s hold)──→ idle
any ──(deactivate)──→ off
```

---

## 4. Tech Stack & Constraints

### 4.1 Use (Already Available)

- **OpenAI Realtime WebSocket relay** — `backend/lib/openai-realtime.js` + `use-realtime-voice.ts`
- **Screen capture** — `getDisplayMedia` already in `components/ui-ai/prompt-input.tsx`
- **AI SDK** — `@ai-sdk/react` for streaming
- **Motion for React** — animation library (already in project)
- **Atlaskit icons** — for the composer button icon

### 4.2 Add

- **`html2canvas`** — for viewport screenshots without user permission prompt. Renders the current page DOM to a canvas element silently.

### 4.3 Constraints

- **Local only** — no deployment, no external services beyond what's already configured
- **Browser-only capture** — we can only capture the browser viewport, not the whole screen (unlike the macOS Clicky app)
- **Same-origin** — screenshot capture is limited to the current page
- **Performance** — cursor following at 60fps must not cause jank; use `requestAnimationFrame` + CSS transforms
- **No new dependencies** unless strictly necessary (prefer built-in browser APIs)

---

## 5. Acceptance Criteria

### P0 (Must Have)

- [ ] Composer toolbar has a new Clicky toggle button (cursor icon)
- [ ] Clicking the button activates an animated cursor companion that follows the mouse
- [ ] Voice input works (push-to-talk or toggle) via existing Realtime infrastructure
- [ ] On each utterance, a viewport screenshot is captured and sent to the LLM
- [ ] LLM response is spoken aloud via TTS
- [ ] LLM can specify `[POINT:x,y:label]` and Clicky flies to that position with a bezier arc
- [ ] Speech bubble appears at the pointed element with the response text
- [ ] Escape or re-clicking the button deactivates Clicky
- [ ] State transitions are visually clear (idle → listening → processing → speaking/pointing)

### P1 (Should Have)

- [ ] Conversation history (last 10 exchanges) persists during the session
- [ ] Barge-in support (interrupt TTS by speaking)
- [ ] Smooth spring-based cursor following with configurable offset
- [ ] Scale pulse animation during bezier flight
- [ ] Keyboard shortcut to toggle Clicky (e.g., Cmd+Shift+K)

### P2 (Nice to Have)

- [ ] Text input mode (type a question in a small input near the cursor instead of voice)
- [ ] Multiple cursor shapes/themes
- [ ] Clicky remembers pointed elements and can reference them in follow-up
- [ ] Minimize Clicky to a small dot when not actively conversing

---

## 6. Boundaries

### Always Do

- Use existing infrastructure (Realtime WebSocket, AI SDK, Motion, token system)
- Follow VPK component architecture (hooks, lib files, compound components)
- Use ADS tokens and semantic classes for any new UI
- Keep the cursor overlay non-interactive (`pointer-events: none`) to avoid interfering with the page
- Handle the "off" state cleanly — no orphaned listeners, streams, or animations

### Ask First

- Adding new npm dependencies (e.g., `html2canvas`)
- Changing the OpenAI Realtime system prompt or session configuration
- Modifying the existing composer component structure (vs. adding to it)
- Any changes to `backend/server.js`

### Never Do

- Modify ACRA/RovoDev Serve code
- Add external API keys or services not already configured
- Break existing voice features (Live Voice, Realtime Voice)
- Make the cursor overlay steal focus or intercept clicks
- Add deployment-related code

---

## 7. Implementation Phases

### Phase 1: Cursor Overlay + Toggle

- Add Clicky button to composer
- Render animated cursor companion overlay
- Cursor follows mouse with spring animation
- Toggle on/off with button + Escape key

### Phase 2: Voice + Screen Capture

- Wire up voice recording (reuse Realtime or simpler mic capture)
- Capture viewport screenshot on utterance complete
- Send screenshot + transcript to LLM (via existing Realtime with image input, or via a separate vision API call)
- Play back TTS response

### Phase 3: Pointing + Speech Bubbles

- Parse `[POINT:x,y:label]` from LLM response
- Implement bezier arc flight animation
- Render speech bubble at target coordinates
- Return-to-cursor after hold period

### Phase 4: Polish

- Conversation history
- Barge-in
- Keyboard shortcut
- Visual state transitions (idle/listening/processing/speaking)
- Performance optimization (throttle mouse events, optimize screenshot capture)

---

## 8. Decisions Made

1. **Screenshot approach:** `html2canvas` — renders current page DOM to canvas silently, no permission prompt. Captures only the current page content (not browser chrome or other tabs). This is sufficient since we're helping users navigate the Rovo App itself.

2. **LLM for vision:** Send screenshots through the **existing Realtime WebSocket session** as image input. Single connection handles both voice and vision. GPT-4o Realtime supports image content parts, so no separate API calls needed.

3. **Cursor shape:** **Rovo-branded cursor** — design a cursor that uses ADS tokens, Rovo blue accent colors, and fits the product aesthetic. Not a direct copy of Clicky's blue triangle.

4. **Coordinate space for pointing:** Since we capture only the viewport, coordinates map 1:1 to viewport pixels. If the user scrolls between screenshot capture and pointing, accept the mismatch — the interaction is fast enough that scroll drift is unlikely.
