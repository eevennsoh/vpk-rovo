# Rovo App prompt navigator PRD

This PRD defines a minimal in-thread navigation feature for `rovo-app`.
The feature adds a compact desktop-only control that lets users preview and
jump to earlier prompts they sent in the current thread. The intended visual
direction is similar to Notion's page navigator: a subtle stacked-lines handle
that reveals a compact floating overlay instead of a persistent sidebar.

## 1. Executive summary

This section summarizes the user problem, the proposed solution, and the
metrics that determine whether the feature succeeds.

- **Problem statement**: In long `/rovo-app` threads, users must manually
  scroll to find earlier prompts they wrote. That slows review and reuse of
  prior context.
- **Proposed solution**: Add a minimal in-thread navigation control to the
  `rovo-app` message pane. Hovering the control opens a compact overlay,
  visually similar to Notion's navigator, that shows snippets of earlier user
  messages. Clicking a snippet scrolls directly to that message in the current
  thread.
- **Success criteria**:
  - Reduce median time to relocate a previously sent user prompt in a thread
    with 50 or more messages by at least 50 percent versus manual scrolling.
  - Ensure at least 90 percent of test participants can reach a target prior
    prompt in two interactions or fewer: hover, then click.
  - Scroll the selected prompt into the visible chat viewport within 300ms on
    desktop for threads with up to 200 rendered messages.
  - Add no new backend endpoints, persistence changes, or network requests in
    MVP.

## 2. User experience and functionality

This section describes the intended audience, the user stories, the done
criteria for MVP, and the boundaries that keep the feature small.

- **User personas**:
  - Power users working in long `rovo-app` threads on desktop.
  - Users who frequently revisit earlier prompts to refine, repeat, or
    reference prior instructions.
- **User stories**:
  - As a `rovo-app` user, I want a compact in-thread navigation control so
    that I can jump to earlier prompts without visually cluttering the chat.
  - As a `rovo-app` user, I want to preview short snippets of my earlier
    prompts so that I can identify the right message before navigating.
  - As a `rovo-app` user, I want clicking a snippet to scroll me to that
    exact message so that I can resume work faster.
- **Acceptance criteria**:
  - The feature appears only in `/rovo-app`.
  - The control is desktop-only and uses a minimal three-line handle aligned
    with the Notion-style reference in the mock.
  - The handle sits near the right edge of the chat content area and remains
    visually unobtrusive when inactive.
  - Hovering the handle opens an anchored floating overlay without shifting
    the chat layout.
  - The overlay lists only messages authored by the user in the active thread.
  - Each menu item shows a single-line snippet derived from the message text
    and truncates overflow with an ellipsis.
  - Menu items are ordered reverse-chronologically so recent prompts are
    easiest to reach.
  - Clicking an item scrolls the corresponding user message into view inside
    the existing chat pane and closes the overlay.
  - The overlay uses a compact dark-surface presentation with rounded corners,
    subtle border contrast, and enough spacing to distinguish each snippet.
  - The feature works entirely within the active thread and does not change
    thread selection, message content, or message order.
  - If there are no earlier user messages, the control is hidden.
- **Non-goals**:
  - Mobile or tablet interactions.
  - Assistant-message navigation.
  - Full-text search, filtering, grouping, pinning, or bookmarking.
  - Cross-thread navigation.
  - Backend-powered indexing or persistence of navigation state.
  - A full document-outline or section-heading navigator like Notion pages use.
  - Special handling for attachment-only prompts in MVP.

## 3. AI system requirements

This feature does not introduce AI-specific behavior, but this section records
the implementation boundary and the expected validation approach.

- **Tool requirements**:
  - None for MVP. The feature is a deterministic frontend interaction that
    uses already-rendered chat data.
- **Evaluation strategy**:
  - Unit test snippet extraction from user messages, including multiline text
    and edited prompts.
  - Manually validate desktop behavior across short, medium, and long threads
    to confirm overlay behavior, visual polish, and scroll accuracy.
  - Compare baseline manual-scroll task time against navigator-assisted task
    time in a small usability study.

## 4. Technical specifications

This section maps the feature onto the existing `rovo-app` implementation
so the work can stay frontend-only and local to the active thread surface.

- **Architecture overview**:
  - Source message data comes from
    `components/projects/rovo-app/hooks/use-rovo-app.ts` and already
    flows into the `rovo-app` shell and message surface.
  - MVP adds a small local navigator component inside the existing
    `Conversation` message surface in
    `components/projects/rovo-app/components/rovo-app-messages.tsx`.
  - The navigator derives its item list from visible `messages`, filtered to
    `role === "user"`, and uses existing message IDs as stable navigation
    targets.
  - User message nodes expose a stable DOM hook such as
    `data-rovo-app-message-id="{message.id}"` so the navigator can scroll
    directly to the correct element.
  - Snippets come from existing message text helpers in
    `lib/rovo-ui-messages.ts`, with no duplicate parsing logic.
  - Scroll behavior uses the existing conversation scroll container rather
    than page-level scrolling.
  - The floating overlay should render above the conversation content and
    should not interfere with existing scroll-follow or scroll-to-bottom
    controls.
- **Integration points**:
  - `components/projects/rovo-app/components/rovo-app-messages.tsx`
  - `components/projects/rovo-app/hooks/use-rovo-app.ts`
  - `components/ui-ai/conversation.tsx`
  - `lib/rovo-ui-messages.ts`
- **Security and privacy**:
  - All snippets are derived client-side from messages already visible to the
    current user.
  - The feature does not transmit, store, index, or share new data.
  - The feature must not expose hidden or non-renderable message content.

## 5. Risks and roadmap

This section captures the staged rollout and the main risks that could affect
usability or implementation quality.

- **Phased rollout**:
  - **MVP**: Desktop-only hover navigator with reverse-chronological user
    prompt snippets, a Notion-style floating overlay, and click-to-scroll
    behavior.
  - **v1.1**: Add stronger active-target feedback after jump, improved
    empty-state messaging, and usability polish for long lists.
  - **v2.0**: Consider search or filtering, assistant-message landmarks, and a
    mobile or tap interaction model.
- **Technical risks**:
  - Hover-to-overlay interaction can feel fragile if the hit area is too
    small.
  - Variable message heights can reduce scroll accuracy if target selection
    relies on unstable DOM hooks.
  - Very long threads can make the overlay unwieldy unless the menu itself is
    scrollable.
  - Discoverability can be low if the handle is too subtle.
