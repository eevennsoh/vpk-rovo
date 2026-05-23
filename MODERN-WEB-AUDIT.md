# Modern Web Guidance Audit — VPK-Rovo UI

> Initial audit performed 2026-05-23 against `modern-web-guidance` skill v2026_05_16-c5e7870.
> Scope: 4 high-leverage areas for an AI chat–heavy UI. Not exhaustive — see "Follow-up" at the bottom.

## Scope Audited

| Area | Files inspected | Guides retrieved |
|---|---|---|
| Chat input auto-resize | `components/ui-custom/prompt-input.tsx`, `components/ui/textarea.tsx`, `components/projects/rovo/components/rovo-app-composer.tsx` | `form-fields-automatically-fit-contents` |
| Conversation scrolling | `components/ui-custom/conversation.tsx` | `scrollability-affordance-hints`, `soft-edge-content-fade` |
| Top-layer animations (dialog / popover / hover-card / sheet / accordion / navigation-menu) | `components/ui/dialog.tsx`, `components/ui/popover.tsx`, `components/ui/hover-card.tsx`, `components/ui/sheet.tsx`, `components/ui/accordion.tsx`, `components/ui/navigation-menu.tsx` | `animate-to-from-top-layer` |
| Form validation timing | `components/ui/field.tsx`, `components/ui/input.tsx` | `validate-input-after-interaction`, `accessible-error-announcement` |

---

## Findings (prioritized)

### 🔴 Finding 1 — Forms do not use `:user-invalid` / `:user-valid`

**Severity:** High &nbsp;•&nbsp; **Effort:** Low &nbsp;•&nbsp; **Guide:** `validate-input-after-interaction`

**Current state**

- `components/ui/input.tsx:26` uses `aria-invalid:ring-destructive/20 aria-invalid:border-destructive` — relies on an external "invalid" signal being applied.
- `components/ui/field.tsx:48` uses `data-[invalid=true]:text-destructive` — relies on a manual `data-invalid` attribute.
- `grep` across `components/` returns **zero** matches for `:user-valid` or `:user-invalid`.
- `components/ui/field.tsx:206` uses `role="alert"` on `FieldError`, which announces immediately when rendered — more aggressive than `aria-errormessage`.

**Problem**

Errors are styled instantly for empty required fields on page load (the exact UX bug the guide solves). Screen reader users hear "Invalid entry" when tabbing into an untouched required field.

**Fix sketch**

```css
/* components/ui/input.tsx — augment existing classes */
input:user-invalid {
  @apply ring-destructive/20 border-destructive ring-3;
}
input:user-valid {
  @apply border-border-success; /* optional positive reinforcement */
}
```

Pair with a small JS bridge (per `accessible-error-announcement`) so `aria-invalid` syncs to `:user-invalid` and screen readers stay aligned with visuals:

```js
const sync = (el) => el.setAttribute?.("aria-invalid", el.matches(":user-invalid") ? "true" : "false");
document.addEventListener("blur", (e) => sync(e.target), true);
document.addEventListener("input", (e) => e.target.hasAttribute?.("aria-invalid") && sync(e.target));
```

**Browser support:** `:user-valid` / `:user-invalid` — Baseline **Widely Available** since 2023-11-02 (Chrome 119, Edge 119, Firefox 88, Safari 16.5). No fallback needed.

---

### 🟠 Finding 2 — Inconsistent top-layer animation pattern across primitives

**Severity:** Medium &nbsp;•&nbsp; **Effort:** Medium &nbsp;•&nbsp; **Guide:** `animate-to-from-top-layer`

**Current state**

| File | Pattern | Modern? |
|---|---|---|
| `components/ui/sheet.tsx:37` | `data-starting-style:opacity-0` | ✅ |
| `components/ui/accordion.tsx:64` | `data-starting-style:h-0` | ✅ |
| `components/ui/navigation-menu.tsx:87,116` | `data-starting-style:opacity-0`, `data-ending-style:scale-90` | ✅ |
| `components/ui-custom/task.tsx:86` | `data-starting-style:h-0 data-ending-style:h-0` | ✅ |
| `components/ui-custom/twg-tool.tsx:312` | same | ✅ |
| `components/ui-custom/chain-of-thought.tsx:357,405` | same | ✅ |
| `components/ui/dialog.tsx:46,77` | `data-open:animate-in data-closed:animate-out` (tailwindcss-animate) | ⚠️ |
| `components/ui/popover.tsx:43` | same | ⚠️ |
| `components/ui/hover-card.tsx:54` | same | ⚠️ |

**Problem**

Two animation systems coexist. The modern Base UI `data-starting-style` / `data-ending-style` pattern (the React-flavored analog of native `@starting-style`) is already used by ~half the primitives. The older `data-open:animate-in` pattern (tailwindcss-animate) is still used by the three most popular top-layer primitives.

**Fix sketch**

Migrate `dialog.tsx`, `popover.tsx`, `hover-card.tsx` to the same `data-starting-style` / `data-ending-style` pattern already used by `sheet.tsx` and `navigation-menu.tsx`. Benefits:

- Single mental model across all primitives.
- Native `overlay` property transition handling (no premature clipping during exit).
- Cleaner `prefers-reduced-motion` integration.
- Removes the `tailwindcss-animate` dependency surface area (if no other code depends on it).

**Browser support:** `@starting-style` and `transition-behavior` — Baseline **Newly Available** since 2024-08-06. `overlay` has Limited Availability (Chrome/Edge only) but degrades cleanly.

---

### 🟡 Finding 3 — Conversation scroll: keep JS, augment with CSS scroll-state + masks

**Severity:** Low–Medium &nbsp;•&nbsp; **Effort:** Low &nbsp;•&nbsp; **Guides:** `scrollability-affordance-hints`, `soft-edge-content-fade`

**Current state**

`components/ui-custom/conversation.tsx` (lines 106–221) manages scroll with ~100+ lines of JS:

- `scrollRef`, `scrollToBottom`, `getDefaultTargetTop`, `getScrollTargetTop` (lines 106–168)
- `wheel`, `touchmove`, `pointerdown` listeners for user-scroll-intent detection (lines 212–221)
- `isAtBottom` tracking for `stickToBottom` semantics

**Problem (and non-problem)**

The JS is *mostly legitimate* — "is user near bottom?" / auto-stick-to-bottom genuinely need scroll-position state, which CSS can't replace.

The *visual* "more content below" affordance, however, can be CSS-only:

```css
.conversation-scroll {
  /* Edge fade (Baseline 2023, safe everywhere) */
  mask-image: linear-gradient(to bottom, black 92%, transparent 100%);

  /* Progressive enhancement: opacity-driven shadows that auto-show on overflow */
  container-type: scroll-state;
}

@container scroll-state(scrollable: bottom) {
  .scroll-shadow-bottom { opacity: 1; }
}
@container scroll-state(scrollable: top) {
  .scroll-shadow-top { opacity: 1; }
}
```

**Note:** This is *additive*. Don't remove the JS — augment it.

**Browser support:**

- `mask-image` — Baseline Widely Available since 2023-12-07. Safe.
- Container scroll-state queries — Limited (Chrome 133+, Feb 2025 only). Treat as progressive enhancement; degrade silently.

---

## What VPK Already Does Right

Worth documenting so these aren't accidentally regressed:

| File | What it gets right |
|---|---|
| `components/ui-custom/prompt-input.tsx:1003,1163` | `field-sizing: content` with `CSS.supports()` feature detection, plus `max-h-48 min-h-16` clamps. Textbook implementation. |
| `components/ui/textarea.tsx:23` | Same `field-sizing-content` pattern at the primitive level. |
| `components/projects/rovo/components/rovo-app-composer.tsx:60,704` | Same pattern, applied at the route level. |
| `components/arts/awake/city-popover.tsx:235,624` | `mask-image` fade on scroll container + `scrollbar-gutter: stable both-edges` to prevent layout shift. |
| `components/ui-audio/speech-input.tsx:390` | Horizontal `mask-image` fade on overflow text. |
| `components/arts/awake/glass-slider.tsx:118,233,353` | SVG-elliptical `mask-image` for smooth refraction transitions. |

---

## Suggested Addition to `CLAUDE.md`

Documenting a browser-support policy means future audits skip the `@supports` fallback boilerplate the guides include. Suggested wording (under "Engineering Standards"):

```markdown
### Browser Support

Allow Newly Available CSS features (Baseline 2023+) without `@supports` fallbacks.
For Limited-Availability features (e.g. `container-type: scroll-state`),
treat them as progressive enhancement — degrade silently, no polyfill.
```

---

## Out of Scope — Follow-up Candidates

Not audited this pass but flagged for next iteration. Each should map to a single guide retrieval.

| Component / area | Likely guide | Why |
|---|---|---|
| `components/ui/carousel.tsx` | `scroll-snap-state-sync`, `scroll-snap-realtime-feedback` | Carousels are the canonical scroll-snap use case |
| `components/website/website-header.tsx` | `shrinking-header-on-scroll`, `scroll-position-aware-elements` | Fixed header behavior |
| `app/(routes)/jira/**`, `app/(routes)/confluence/**` | `optimize-image-priority` | LCP `fetchpriority="high"` on hero images |
| Long demo / docs pages | `defer-rendering-heavy-content` | `content-visibility: auto` for offscreen sections |
| `components/ui/dropdown-menu.tsx`, `components/ui/context-menu.tsx`, `components/ui/combobox.tsx` | `resilient-context-menus-and-nested-dropdowns` | Viewport-edge flipping |
| `components/ui/tooltip.tsx`, `components/ui/hover-card.tsx` | `position-aware-tooltips` | Directional arrows on flip |
| `components/ui/select.tsx` | `animated-select-picker`, `branded-select-styling`, `rich-media-picker` | Native `<select>` with custom styling |
| `components/ui-custom/message.tsx` (831 lines) | `animate-element-entry-exit` | Streaming message bubble entry/exit |
| `components/ui-custom/sandbox.tsx`, `web-preview.tsx` | `efficient-background-processing` | Pause offscreen iframes/canvases |
| Form fields with required validation across `app/` | `required-field-feedback` | Pairs with Finding 1 |

---

## Implementation Order Recommendation

If implementing one at a time, ranked by user-visible impact per hour of work:

1. **Finding 1** (`:user-invalid`) — minutes to apply, fixes a real UX bug, zero browser-support risk.
2. **Finding 3** (mask-image fade on conversation) — minutes, purely additive, visible polish.
3. **Browser-support policy in CLAUDE.md** — one-line edit, saves future audit friction.
4. **Finding 2** (top-layer animation consolidation) — half-day of careful migration + visual regression check across all dialog/popover usages.

---

---

# Batch 2 — Carousel, Header, Images, Menus, Content-Visibility

> Performed 2026-05-23, immediately after Batch 1. Covers the 10 "Out of Scope" follow-ups from Batch 1.

## Scope Audited

| Area | Files inspected | Guides retrieved |
|---|---|---|
| Carousel scroll-snap | `components/ui/carousel.tsx` | `scroll-snap-state-sync`, `scroll-snap-realtime-feedback` |
| Sticky / shrinking header | `components/website/website-header.tsx` | `shrinking-header-on-scroll`, `scroll-position-aware-elements` |
| Image LCP priority | `components/website/demos/**`, `components/website/website-sidebar-nav.tsx`, blocks demos | `optimize-image-priority` |
| Menu/tooltip positioning | `components/ui/tooltip.tsx`, `components/ui/dropdown-menu.tsx`, `components/ui/context-menu.tsx`, `components/ui/combobox.tsx` | `resilient-context-menus-and-nested-dropdowns`, `position-aware-tooltips` |
| Select customization | `components/ui/select.tsx` | `animated-select-picker` |
| Streaming message entry/exit | `components/ui-custom/message.tsx` | `animate-element-entry-exit` |
| Iframe / sandbox bg cost | `components/ui-custom/web-preview.tsx`, `components/ui-custom/sandbox.tsx` | `efficient-background-processing`, `defer-rendering-heavy-content` |
| Required-field timing | (cross-cutting) | `required-field-feedback` |

---

## Findings (prioritized)

### 🔴 Finding 4 — Hero / LCP images are missing `priority` (next/image)

**Severity:** High &nbsp;•&nbsp; **Effort:** Very Low &nbsp;•&nbsp; **Guide:** `optimize-image-priority`

**Current state**

`grep -rn "next/image"` across `components/website/`, `components/blocks/`, `app/` finds **10+** call sites of `<Image>` — none of them set the `priority` prop (which Next.js translates to `fetchpriority="high"` + skips lazy-loading). The only `priority` matches found are unrelated business props (`task.priority`, `card.priority`).

Notable LCP candidates with no `priority`:
- `components/website/website-sidebar-nav.tsx:5`
- `components/website/demos/blocks/generative-card-demo.tsx:4`
- `components/website/demos/blocks/prompt-gallery-demo.tsx:25`
- `components/website/demos/blocks/chat-gallery-demo.tsx:25`
- `components/website/demos/ui/{tile,item,aspect-ratio,scroll-area,menu-group,card}-demo.tsx`

**Problem**

For any route where one of these `<Image>` instances is the LCP (most likely the website demo gallery hero, or the sidebar logo at first paint), the browser is using default heuristics — meaning a competing async script or CSS could push the LCP image to "low" priority by accident.

**Fix sketch**

```tsx
// Whatever ends up as the hero / above-the-fold image on each route
<Image
  src={hero.src}
  alt={hero.alt}
  width={hero.w}
  height={hero.h}
  priority   // ← next/image translates this to fetchpriority="high" + loading="eager"
/>

// Conversely, for images technically above-the-fold but initially hidden
// (mega menus, off-screen carousel slides):
<Image src={...} fetchPriority="low" />
```

**Browser support:** `fetchpriority` — Baseline Newly Available 2024-10-29. Silently ignored elsewhere. Safe.

**Action item:** Audit each route's hero/first-paint image and mark exactly one with `priority`. Don't blanket-apply.

---

### 🟠 Finding 5 — Heavy components (iframes, sandbox, web-preview) keep running off-screen

**Severity:** Medium-High &nbsp;•&nbsp; **Effort:** Medium &nbsp;•&nbsp; **Guide:** `efficient-background-processing`

**Current state**

- `components/ui-custom/web-preview.tsx:308` renders an iframe. No `IntersectionObserver` or `contentvisibilityautostatechange` listener on the iframe wrapper — once the preview component is mounted, it runs forever regardless of viewport position.
- `components/ui-custom/sandbox.tsx` likewise carries heavy preview/runtime logic.
- `components/website/website-preview.tsx:87` *already* uses `IntersectionObserver` for "is in view" — proves the pattern is acceptable in the codebase.
- `grep` for `content-visibility` across the repo: **zero matches**.

**Problem**

In a long demos page (e.g. the website route), every demo's iframe/preview keeps running its event loop, animations, and network — even when scrolled fully off-screen. On a battery-powered laptop this is real CPU drain.

**Fix sketch**

```tsx
// Wrap each heavy preview/demo container
<div
  className="cv-auto"     // utility for `content-visibility: auto`
  style={{ containIntrinsicSize: "auto 500px" }}
>
  <WebPreview ... />
</div>
```

```css
/* app/globals.css or tailwind-theme.css */
@utility cv-auto {
  content-visibility: auto;
}
```

```tsx
// Optional: pause the iframe when browser declares it skipped
useEffect(() => {
  const el = ref.current;
  if (!el) return;
  const onState = (e: ContentVisibilityAutoStateChangeEvent) => {
    if (e.skipped) pausePreview();
    else resumePreview();
  };
  el.addEventListener("contentvisibilityautostatechange", onState);
  return () => el.removeEventListener("contentvisibilityautostatechange", onState);
}, []);
```

**Browser support:**
- `content-visibility` — Baseline Newly Available since 2025-09-15. Silently ignored elsewhere; performance just doesn't improve.
- `contentvisibilityautostatechange` event — same support story.

**Caveat:** `content-visibility: auto` excludes off-screen content from sequential keyboard navigation in some AT configurations. **MANDATORY** keyboard-only verification before shipping per the guide.

---

### 🟡 Finding 6 — Streaming message bubbles likely lack `@starting-style` entry

**Severity:** Low &nbsp;•&nbsp; **Effort:** Low &nbsp;•&nbsp; **Guide:** `animate-element-entry-exit`

**Current state**

`components/ui-custom/message.tsx` is 831 lines. First 60 lines show heavy use of Streamdown, code-blocks, tooltips, and standard React imports — no `motion`/`AnimatePresence`/`data-starting-style` in the imports. Messages stream in by being appended to the DOM as the AI SDK yields tokens.

**Problem (uncertain — needs full file inspection)**

If messages currently appear with no entry animation, adding a 100–150ms fade-up `@starting-style` would noticeably improve perceived smoothness without any JS cost. The pattern is exactly the one the guide describes — element added to DOM, transition from `@starting-style` to base.

**Fix sketch**

```css
@utility message-enter {
  opacity: 1;
  translate: 0;
  transition: opacity 0.15s ease-out, translate 0.15s ease-out;

  @starting-style {
    opacity: 0;
    translate: 0 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  @utility message-enter {
    translate: none;
    transition-duration: 0.05s;
    @starting-style { translate: none; }
  }
}
```

**Browser support:** `@starting-style` + `transition-behavior` — Baseline Newly Available since 2024-08-06. Safe.

**Action item:** Read full `message.tsx` to confirm there's no existing animation before adding one (don't double-up with `motion/react` if it's already used elsewhere in the file).

---

### 🟢 Finding 7 — Website header could shrink on scroll (decorative polish)

**Severity:** Low &nbsp;•&nbsp; **Effort:** Low &nbsp;•&nbsp; **Guide:** `shrinking-header-on-scroll`

**Current state**

`components/website/website-header.tsx:55` — `sticky top-0 z-20 flex h-14 items-center border-b border-border bg-surface`. Fixed `h-14` (56px), no scroll-driven shrink.

**Problem (cosmetic)**

Modern Atlassian web properties (atlassian.design, atlassian.com) typically shrink the header height + add stronger shadow on scroll. VPK's website route doesn't. This is purely decorative — no UX bug.

**Fix sketch (purely additive, progressive enhancement)**

```css
@supports ((animation-timeline: scroll()) and (animation-range: 0% 100%)) {
  @keyframes shrink-header {
    to { height: 44px; box-shadow: var(--ds-elevation-shadow-raised); }
  }

  [data-website-header] {
    animation: shrink-header auto linear both;
    animation-timeline: scroll(block root);
    animation-range: 0px 80px;
  }
}
```

**Browser support:** Scroll-driven animations — Chrome 115+, Safari 26+, no Firefox. Progressive enhancement only.

**Skip if:** Not worth Finding 5's CPU savings or Finding 4's LCP win. Cosmetic only.

---

### ⚪ Finding 8 — Carousel is fine as-is (embla, not native scroll-snap)

**Severity:** None &nbsp;•&nbsp; **Effort:** N/A &nbsp;•&nbsp; **Guides reviewed:** `scroll-snap-state-sync`, `scroll-snap-realtime-feedback`

**Current state**

`components/ui/carousel.tsx:4` — `import useEmblaCarousel from "embla-carousel-react"`. Carousel is built on Embla (a JS-driven carousel library), not native CSS scroll-snap.

**Verdict**

The `scrollsnapchange` / `scrollsnapchanging` events only fire on native scroll-snap containers. They don't apply to Embla, which has its own `select` / `slidesInView` API. Migrating from Embla → native scroll-snap would be a multi-day swap for marginal UX gain (Embla handles momentum, RTL, pointer drag well already). **Not recommended.**

---

### ⚪ Finding 9 — Menus/tooltips/selects: Base UI is the right answer today

**Severity:** None &nbsp;•&nbsp; **Effort:** N/A &nbsp;•&nbsp; **Guides reviewed:** `resilient-context-menus-and-nested-dropdowns`, `position-aware-tooltips`, `animated-select-picker`

**Current state**

- `components/ui/tooltip.tsx` uses Base UI's `Tooltip` (which uses floating-ui under the hood for positioning + flip).
- `components/ui/dropdown-menu.tsx` (461 lines), `context-menu.tsx` (273 lines), `combobox.tsx` (294 lines), `select.tsx` (257 lines) — all Base UI primitives.
- `grep` for `anchor-name`, `position-anchor`, `position-area`, `position-try` across the repo: **zero matches**.

**Verdict**

The guides describe CSS Anchor Positioning (`position-area`, `position-try-fallbacks`) and Anchored Container Queries — both have **Limited Availability** (Chrome 133–143+ only, no Safari/Firefox as of audit date 2026-05-23). VPK is rightly using Base UI's JS-driven positioning, which already handles viewport flipping, RTL, and arrow positioning correctly across all browsers.

The `animated-select-picker` guide uses `appearance: base-select` — Chrome 135+ only, no Firefox/Safari. Not viable for VPK.

**Re-audit in:** ~12 months (when anchor positioning + anchored container queries land in Safari/Firefox). For now Base UI wins.

**Tangential observation:** `components/ui/tooltip.tsx:66` uses the older `data-open:animate-in` pattern — same inconsistency flagged in **Finding 2** (top-layer animation). Add tooltip.tsx to the Finding 2 migration list.

---

### ⚪ Finding 10 — `required-field-feedback` is subsumed by Finding 1

**Severity:** N/A &nbsp;•&nbsp; **Guide reviewed:** `required-field-feedback`

`required-field-feedback` is essentially the same fix as Finding 1 (`validate-input-after-interaction`) but specialized to `required`-only fields. Adopting `:user-invalid` on `input.tsx` automatically gives you correct required-field timing as a side effect. No separate work item.

**Tip from this guide that's *not* in Finding 1:** Keep the submit button enabled. Browsers auto-trigger `:user-invalid` on empty required fields when the form submission attempt fails, and focus the first invalid one. Disabling the submit button until "valid" is an anti-pattern.

---

## Updated Implementation Order

Combining batch 1 + batch 2, ranked by user-visible impact ÷ effort:

| # | Finding | Impact | Effort | Notes |
|---|---|---|---|---|
| 1 | **Finding 4** — `priority` on LCP images | High (LCP) | Very Low | One-line prop, biggest perf win |
| 2 | **Finding 1** — `:user-invalid` on form inputs | High (a11y/UX) | Low | Baseline Widely, no fallback |
| 3 | **Finding 3** — `mask-image` fade on conversation | Medium (polish) | Low | Additive to existing JS |
| 4 | Browser-support policy line in CLAUDE.md | Low (process) | Trivial | Reduces future audit friction |
| 5 | **Finding 5** — `content-visibility: auto` on heavy previews | Medium (CPU/battery) | Medium | Requires a11y kbd test |
| 6 | **Finding 6** — `@starting-style` entry on message bubbles | Low (polish) | Low | Confirm no existing animation first |
| 7 | **Finding 2** — top-layer animation consolidation (incl. tooltip.tsx) | Medium (consistency) | Medium-High | Touches 4 files: dialog, popover, hover-card, tooltip |
| 8 | **Finding 7** — shrinking header | Low (cosmetic) | Low | Skip unless polish pass scheduled |

---

## What I Confirmed Is Already Fine

These were checked and don't need work:

| Component / Pattern | Why it's fine |
|---|---|
| Carousel (Embla) | Embla handles everything native scroll-snap would, plus momentum/RTL/drag |
| Base UI menus / dropdowns / combobox / select | floating-ui-based positioning beats current CSS Anchor Positioning support |
| `select.tsx` | `appearance: base-select` is Chrome-only — not viable yet |
| Tooltips with directional arrows | Anchored Container Queries are Chrome 143+ only |
| `IntersectionObserver` usage in `website-preview.tsx`, `shimmering-text.tsx` | Correct pattern for visibility-aware logic |

---

## Still Not Audited (deeper sub-routes)

If you want a Batch 3, candidates:
- **`app/jira/`, `app/confluence/`, `app/rovo/` route-level files** — actual hero images and LCP candidates for `priority` placement
- **`components/projects/control-plane/`** — Hermes UI patterns
- **`components/blocks/dashboard/`, `components/blocks/board/`, `components/blocks/data-table/`** — guide `interactions-in-complex-layouts` (INP optimization for grid-style UIs)
- **`components/ui/chart.tsx`, `components/projects/agents/`** — guide `defer-work-until-scroll-ends`
- **Animation timing across `motion/react` usage** — there's an existing motion-audit skill that could pair with this
- **`scroll-target-on-load`** for conversation initial render (jump to bottom-most message without scroll-jank)

---

## Reference

- Skill: `modern-web-guidance` ([npm](https://www.npmjs.com/package/modern-web-guidance))
- CLI: `npx -y modern-web-guidance@latest {search,retrieve,list}`
- Guides used in Batch 1:
  - `validate-input-after-interaction`
  - `accessible-error-announcement`
  - `animate-to-from-top-layer`
  - `scrollability-affordance-hints`
  - `soft-edge-content-fade`
  - `form-fields-automatically-fit-contents`
- Guides used in Batch 2:
  - `scroll-snap-state-sync`, `scroll-snap-realtime-feedback`
  - `shrinking-header-on-scroll`, `scroll-position-aware-elements`
  - `optimize-image-priority`
  - `defer-rendering-heavy-content`, `efficient-background-processing`
  - `resilient-context-menus-and-nested-dropdowns`, `position-aware-tooltips`
  - `animated-select-picker`
  - `animate-element-entry-exit`
  - `required-field-feedback`

---

# Batch 3 — Team scan across the rest of the codebase

> Performed 2026-05-23 by 5 parallel general-purpose audit agents.
> Slices covered: `app/` + `components/projects/`, `components/blocks/`, remaining `components/ui/`, `components/ui-custom/`, `components/website/` + `components/arts/`.
> ~600+ files surveyed; findings synthesized cross-slice to eliminate duplicates.

## Cross-cutting themes (3 of 5 slices agreed)

These findings emerged independently from multiple agents. They aren't "one component issues" — they're project-wide patterns.

### 🔴 Theme A — `:user-invalid` gap extends to 9 form-control primitives

**Found by:** Batch 1 (input, field), Slice 3 (7 more files)

`aria-invalid:*` destructive styling fires on first paint for required-but-empty fields across all form controls. Originally flagged in `input.tsx`/`field.tsx` (Finding 1). Slice 3 extended the list to:

| File | Line | Pattern |
|---|---|---|
| `components/ui/checkbox.tsx` | 24 | `aria-invalid:border-destructive` |
| `components/ui/radio-group.tsx` | 27 | same |
| `components/ui/switch.tsx` | 42 | same |
| `components/ui/toggle.tsx` | 9 | same |
| `components/ui/input-otp.tsx` | 37, 58 | same |
| `components/ui/native-select.tsx` | 27 | same |
| `components/ui/input-group.tsx` | 26 | same |

**Action:** Apply the `:user-invalid` migration as a single PR touching all 9 form-control primitives + the JS aria-sync bridge from `accessible-error-announcement`. One mechanical change, broad impact.

---

### 🔴 Theme B — `content-visibility: auto` is missing project-wide (zero matches)

**Found by:** Slice 1, Slice 2, Slice 4, Slice 5 (independently)

Repo-wide `grep` finds **zero** matches for `content-visibility`. Every slice surfaced concrete files where it would have measurable CPU/battery/LCP impact. Consolidated targets, ranked by surface area:

| File / pattern | Why it matters | Suggested `containIntrinsicSize` |
|---|---|---|
| `components/ui-custom/web-preview.tsx:308` (iframe) | Live iframe keeps scripts running off-screen | `auto 480px` |
| `components/ui-custom/web-preview-chromium.tsx:344` (2.5s polling) | `setInterval(fetchState, 2500)` runs forever | combine with `contentvisibilityautostatechange` to pause |
| `components/ui-custom/terminal.tsx:62` | Streaming terminal re-parses ANSI on each tick | `auto 384px` |
| `components/ui-custom/sandbox.tsx`, `link-safety-dialog.tsx:61` | More iframes | `auto 480px` |
| `components/ui-custom/reasoning.tsx` (829 lines), `schema-display.tsx` (477 lines) | Large nested expandable trees | `auto 600px` |
| `components/website/website-card.tsx:55` (138+ demo cards) | Whole grid paints regardless of viewport | `0 480px` per `<li>` |
| `components/blocks/prompt-gallery/components/discover-more-examples.tsx:91` | Long card grid | `146px 320px` (matches existing `auto-rows-[146px]`) |
| `components/blocks/chat-gallery/components/discover-more-examples.tsx` | same | same |
| `components/blocks/dashboard/components/section-cards.tsx` | KPI cards row | `auto 200px` |
| `components/projects/jira/page.tsx`, `confluence/page.tsx` (kanban / long threads) | Off-screen kanban columns + activity logs | per-row tuning |
| `components/projects/agents/components/work-item-modal/{child-items,activity}-section.tsx` | Long activity scroll | `auto 80px` per row |
| `components/projects/admin/components/audit-log-view.tsx` | Table rows | `auto 48px` per `<tr>` |

**Action:** Introduce a `@utility cv-auto` Tailwind utility in `app/globals.css` (`content-visibility: auto`), plus a per-component `containIntrinsicSize` style. Roll it out as a single batched PR with **MANDATORY** keyboard-only verification (the guide warns off-screen content can be skipped from sequential keyboard nav in some AT configs).

---

### 🔴 Theme C — Decorative animation loops don't pause when off-screen or hidden

**Found by:** Slice 4, Slice 5

9 WebGL shader files + the morphing-rovo loop + chromium poll + animated SVGs run `requestAnimationFrame` (or `setInterval`) unconditionally — even when tab is hidden or canvas is scrolled off-screen.

Affected files:
- `components/website/demos/visual/shaders/particles.tsx:276`
- `liquid-gradient.tsx:397`, `rings.tsx`, `mesh2.tsx:227`, `chromatic-aberration.tsx:221`, `pixels.tsx:247`
- `logo-crystal.tsx:693`, `logo-spectrum.tsx:619`, `fluted-glass.tsx:273`
- `components/ui-custom/morphing-rovo.tsx:110-145` (path interpolation infinite loop)
- `components/ui-custom/animated-dots.tsx:43` (CSS keyframes)
- `components/ui-custom/animated-rovo.tsx` (motion/react)

**Action:** Standard guard at the top of each RAF/setInterval body:

```ts
const shouldRun = isIntersecting && document.visibilityState === "visible" && !prefersReducedMotion;
if (!shouldRun) { rafRef.current = 0; return; }
```

Or wrap each shader's container in the `cv-auto` utility from Theme B — `contentvisibilityautostatechange` will fire `event.skipped: true` when off-screen, and the shader subscribes to pause.

`personal-graph-neural-canvas.tsx:548,569-596` is best-in-class (uses `useReducedMotion()` + `shouldLoop`/`staticFrame` toggle) — use as the reference pattern.

---

### 🟠 Theme D — Top-layer animation inconsistency: 4 more primitives use legacy pattern

**Found by:** Batch 1 (dialog, popover, hover-card), Batch 2 (tooltip), Slice 3 (drawer, alert-dialog, menubar)

Finding 2's migration target now expands to **7 primitives** total using the legacy `data-open:animate-in data-closed:animate-out` (tailwindcss-animate) instead of the modern `data-starting-style` / `data-ending-style` Base UI pattern:

| File | Lines |
|---|---|
| `components/ui/dialog.tsx` | 46, 77 |
| `components/ui/popover.tsx` | 43 |
| `components/ui/hover-card.tsx` | 54 |
| `components/ui/tooltip.tsx` | 66 |
| `components/ui/drawer.tsx` | 76 |
| `components/ui/alert-dialog.tsx` | 41, 63 |
| `components/ui/menubar.tsx` | 80, 225 (also missing `data-closed:animate-out` on submenu trigger at 80) |

Already-modern reference files: `sheet.tsx:37`, `accordion.tsx:64`, `navigation-menu.tsx:87`.

**Action:** One migration PR replacing all 7 primitives. Touches the most-used overlay APIs in VPK — schedule visual regression test across every dialog/popover/tooltip site.

---

## New per-slice findings (no overlap)

These were unique to single slices.

### 🔴 Finding 11 — Kanban-board hot path: 4 INP/animation issues in one file

**Slice 2 • File: `components/blocks/kanban-board/index.tsx`**

The kanban-board is a single component with 4 distinct issues from 3 different guides:

| Line | Issue | Guide | Fix |
|---|---|---|---|
| 512 | `scroll` listener fires per-frame, triggers React re-render via `setCanScrollRight` | `defer-work-until-scroll-ends` | Switch to `scrollend` listener (Baseline 2025) |
| 660–676 | Cards inserted with no entry animation | `animate-element-entry-exit` | Wrap in `<AnimatePresence>` or `@starting-style` |
| 378, 398 | `onMouseEnter`+`setState` per card → N renders on hover (50+ cards) | `interactions-in-complex-layouts` | Replace with CSS `:hover` |
| 541–566 | Drag-image DOM node built synchronously on every `dragstart`; leak on Esc | `break-up-long-tasks` | Cache node on mount; cleanup on `keydown:Escape` + window `dragend` |

**Action:** One "kanban-board cleanup pass" PR. ~1 day of work.

---

### 🟠 Finding 12 — `<Tabs.Panel>` and `<Collapsible.Panel>` break Find-in-page

**Slice 3 • Files: `components/ui/tabs.tsx:89`, `components/ui/collapsible.tsx:24`**

Both primitives unmount/hide content when inactive. Users hitting Cmd-F can't search across tabs or inside collapsed disclosures. The `search-hidden-content` guide describes `hidden="until-found"` — content stays in the DOM but is hidden until the browser's find-in-page feature reveals it.

**Fix:**

```tsx
// tabs.tsx
<TabsPrimitive.Panel
  keepMounted
  hidden={!active ? "until-found" : undefined}
  ...
/>

// collapsible.tsx
<CollapsiblePrimitive.Panel
  hidden={collapsed ? "until-found" : undefined}
  style={{ interpolateSize: "allow-keywords" }}
  ...
/>
```

Browser support: `hidden="until-found"` — Baseline Newly Available 2024-08-06. Safe.

---

### 🟠 Finding 13 — Custom Google Fonts loaded outside `next/font`

**Slice 5 • File: `app/layout.tsx:244` (loads raw `<link>`); consumed across `components/arts/awake/index.tsx:574,1045,1073,...`, `glass-slider.tsx:1299`, `city-popover.tsx:668`**

`'BBH Bartle'`, `'DotGothic16'`, `'JetBrains Mono'`, `'Ark-ES'` are loaded via raw `<link>` in `app/layout.tsx`, bypassing `next/font/google`'s automatic `size-adjust` / `ascent-override` / `descent-override` injection. The awake page's massive time digits visibly reflow on font swap.

Mixed-font surfaces also lack `font-size-adjust: ex-height`:
- `components/arts/awake/index.tsx:1014-1052` — Ark-ES digits stacked above DotGothic16 seconds → x-height mismatch

**Action:** Migrate to `next/font/google` in `app/layout.tsx`. Add `fontSizeAdjust: "ex-height 0.5"` on the awake time-card wrapper.

Browser support: `font-size-adjust: ex-height` — Baseline Newly Available 2024-08-06. `next/font` overrides — Next.js feature, always safe.

---

### 🟡 Finding 14 — Banner/Alert always renders `role="alert"`

**Slice 3 • Files: `components/ui/banner.tsx:44`, `components/ui/alert.tsx:45`**

Both render `role="alert"` unconditionally — screen readers announce *every* banner/alert immediately, including purely informational ones. The role is meant for dynamic, time-sensitive messages.

**Fix:** Gate `role="alert"` behind a `severity` prop (`error`/`warning` get it; `info`/`success` don't, or use `role="status"` with `aria-live="polite"`).

---

### 🟡 Finding 15 — View Transitions scaffolding exists but isn't wired

**Slice 1 • Files: `components/projects/rovo/components/rovo-app-shell.tsx:2109,2300`, `app/globals.css:335-415`**

`<ViewTransition>` from React is wired for chat-pane and composer slides only. Route transitions between `/projects → /jira → /agents → /confluence` (all within `AppLayout`) don't use `startViewTransition` or `addTransitionType`. The persistent-header CSS at `app/globals.css:335-415` is 80% there but the trigger is missing.

**Fix:** In `AppLayout` link clicks, wrap `router.push()` in `document.startViewTransition(() => router.push(href))` and tag persistent elements with `view-transition-name` (logo, sidebar nav).

---

### 🟡 Finding 16 — Chat scroll-to-bottom on mount runs after paint

**Slice 1 • Files: `components/projects/rovo/components/rovo-app-messages.tsx:274-287`, `components/projects/sidebar-chat/hooks/use-scroll-anchor.ts:88-111`**

`scrollToBottom()` runs in `useEffect`, meaning long threads show the top briefly before jumping. Should run in `useLayoutEffect` for first-mount to set `scrollTop = scrollHeight` synchronously before paint.

**Action:** Verify whether `useConversationContext().scrollToBottom` already does this. If not, switch first-mount path to `useLayoutEffect`.

---

### 🟡 Finding 17 — Streaming items (TaskItem, tool.tsx, plan.tsx) snap in with no animation

**Slice 4 • Files: `components/ui-custom/task.tsx:18-32`, `tool.tsx`, `plan.tsx`**

New streaming items pop into the conversation instantly. Adjacent files (`chain-of-thought.tsx:357,405`, `task.tsx:86`, `twg-tool.tsx:312`) already use the modern `data-starting-style` pattern correctly — proves the pattern is established and these files just missed it.

**Fix:** Apply `transition-[opacity,transform] duration-normal ease-out data-starting-style:opacity-0 data-starting-style:-translate-y-1` to each item root.

---

### 🟡 Finding 18 — `chain-of-thought.tsx:332` uses legacy tailwindcss-animate

**Slice 4 • File: `components/ui-custom/chain-of-thought.tsx:332`**

Uses `animate-in fade-in-0 slide-in-from-top-2` (legacy) on one element while the same file uses modern `data-starting-style` on others (lines 357, 405). Self-contained inconsistency.

**Fix:** Replace line 332 with `transition-all duration-medium ease-out data-starting-style:opacity-0 data-starting-style:-translate-y-2`.

---

### 🟢 Finding 19 — LCP-candidate hero images miss `priority` (concrete file:line list)

**Slices 1 + 5 confirmed Batch 2 Finding 4 with specifics:**

| File | Line | Image |
|---|---|---|
| `components/projects/sidebar-chat/components/chat-greeting.tsx` | 265, 280 | Greeting illustration (74×67, 320×240) — LCP on `/sidebar-chat` |
| `components/projects/rovo/components/rovo-app-messages.tsx` | 969–970 | Empty-state illustration — LCP on `/rovo` |
| `components/website/demos/blocks/prompt-gallery-demo.tsx` | 60 | Hero — LCP on prompt-gallery demo |
| `components/website/demos/blocks/chat-gallery-demo.tsx` | 60 | Hero — LCP on chat-gallery demo |
| `components/website/demos/blocks/generative-card-demo.tsx` | 483, 829, 895, 971 | Hero candidates |
| `components/website/website-sidebar-nav.tsx` | 257, 258 | VPK logo above-the-fold |

**Action:** One mechanical PR adding `priority` to each. Don't blanket-apply — pick at most 1 per route based on actual first-paint hierarchy.

---

## Updated final implementation order (all batches)

Ranked by user-visible impact ÷ effort:

| # | Finding | Impact | Effort | Where |
|---|---|---|---|---|
| 1 | **Theme A** — `:user-invalid` migration across 9 form primitives | High (a11y/UX) | Medium (mechanical) | Batch 1 F1 + Slice 3 |
| 2 | **Finding 19** — `priority` on LCP heroes | High (LCP) | Very Low | Batch 2 F4 + Slices 1, 5 |
| 3 | **Theme C** — Pause off-screen RAFs (9 shaders + 3 ui-custom loops) | High (CPU/battery) | Medium | Slices 4, 5 |
| 4 | **Theme B** — `content-visibility: auto` rollout (~15 files) | Medium-High | Medium | Slices 1, 2, 4, 5 |
| 5 | **Finding 11** — Kanban-board cleanup (4 issues in one file) | Medium | Medium-High | Slice 2 |
| 6 | **Finding 14** — Banner/Alert SR spam | Medium (a11y) | Low | Slice 3 |
| 7 | **Finding 12** — Find-in-page across tabs/collapsibles | Medium | Low | Slice 3 |
| 8 | **Theme D** — Top-layer animation consolidation (7 primitives) | Medium (consistency) | Medium-High | Multi-batch |
| 9 | **Finding 13** — `next/font` migration + `font-size-adjust` | Medium (CLS) | Medium | Slice 5 |
| 10 | Batch 1 F3 — `mask-image` fade on conversation | Low-Medium | Low | Batch 1 |
| 11 | **Finding 16** — `useLayoutEffect` for chat scroll-to-bottom | Low-Medium | Low | Slice 1 |
| 12 | **Finding 17/18** — Streaming item entry animations | Low (polish) | Low | Slice 4 |
| 13 | **Finding 15** — Wire route-level View Transitions | Low (polish) | Medium | Slice 1 |
| 14 | Browser-support policy line in CLAUDE.md | Low (process) | Trivial | Batch 1 |
| 15 | Batch 2 F7 — Shrinking website header | Low (cosmetic) | Low | Batch 2 |

---

## What Batch 3 also confirmed is fine

Anti-findings worth preserving so they don't get accidentally regressed:

| Component / pattern | Why it's fine |
|---|---|
| `components/website/website-preview.tsx:62-127` | Already uses `IntersectionObserver` + `Suspense` + `startTransition` to defer demo bundle loads — the load-layer complement to `content-visibility` |
| `components/arts/personal-graph/personal-graph-neural-canvas.tsx:548,569-596` | Best-in-class: respects `useReducedMotion()` + switches between RAF loop and on-demand static frame |
| `components/arts/awake/use-wake-lock.ts:242` | Correct use of `visibilitychange` for Wake Lock reacquisition |
| `components/arts/awake/*` Motion usage | `willChange` on every animated element, hardware-accelerated props only, independent transforms via MotionValues |
| `components/ui-custom/shimmer.tsx:76`, `rovo-generation.tsx:70` | Honor `useReducedMotion()` |
| `components/ui-custom/code-block.tsx:359-360` | Already sets `contentVisibility: auto` + `containIntrinsicSize` (the **only** file in the repo currently doing this) |
| `components/ui-custom/plan.tsx:165-167` | `mask-image` linear gradient on collapsed summary — exemplary implementation |
| `components/blocks/dashboard/components/*` | 12 files use `@container/card` correctly for size-aware layouts |
| `components/blocks/sprint-board/board.tsx` | `@dnd-kit` with `PointerSensor` `distance: 8` — good gesture threshold |
| `components/blocks/chat-timeline-navigator.tsx:4` | Uses `useReducedMotion` from `motion/react` |
| `app/not-found.tsx`, `app/layout.test.js:116` | Hydration-safe; regression test for `<script>` tags exists |
| `components/projects/*` Next/Image usage | All 15 image sites use `next/image` with explicit width/height — no `<img>` tags |

---

## What's still NOT audited

The team scan covered ~600 .tsx files but a few zones remain:

- **`backend/`** — Express server. Most modern-web guides don't apply (they're browser-side). Skip unless auditing for `optimize-script-priority` on the static-export HTML output.
- **`lib/`, `rovo/`** — utility / AI config. No UI surface.
- **`hermes/`, `scripts/`, `tests/`** — out of scope.
- **`reasoning.tsx` (829 lines) and `schema-display.tsx` (477 lines)** in ui-custom — Slice 4 flagged these as likely `content-visibility: auto` candidates but didn't deep-read. Confirm before the Theme B rollout.
- **`dashboard/components/chart-*.tsx`** — recharts owns rendering; findings would target the library, not VPK code.
- **All 80 sidebar/login/signup demos** in `components/website/demos/` — Slice 5 grep-sampled; no shader RAFs or significant `next/image` usage.

---

## Guides used in Batch 3

| Slice | Guides applied |
|---|---|
| Slice 1 | `optimize-image-priority`, `defer-rendering-heavy-content`, `scroll-target-on-load`, `improve-next-page-load-performance`, `faster-spa-view-transitions`, `same-document-transitions`, `optimize-script-priority` |
| Slice 2 | `interactions-in-complex-layouts`, `defer-rendering-heavy-content`, `defer-work-until-scroll-ends`, `animate-element-entry-exit`, `swipe-to-remove`, `break-up-long-tasks`, `size-aware-styling` |
| Slice 3 | `validate-input-after-interaction`, `accessible-error-announcement`, `animate-to-from-top-layer`, `animate-to-intrinsic-sizes`, `scrollability-affordance-hints`, `soft-edge-content-fade`, `search-hidden-content`, `prevent-text-wrapping`, `accessibility` |
| Slice 4 | `animate-element-entry-exit`, `efficient-background-processing`, `defer-rendering-heavy-content`, `break-up-long-tasks`, `prevent-text-wrapping`, `scroll-target-on-load`, `soft-edge-content-fade`, `physics-based-easing` |
| Slice 5 | `optimize-image-priority`, `defer-rendering-heavy-content`, `parallax-scroll-effects`, `scroll-entry-exit-effects`, `scrollytelling`, `visually-stable-font-fallbacks`, `visually-stable-mixed-fonts`, `same-document-transitions`, `efficient-background-processing`, `prevent-text-wrapping` |

---

# Batch 4 — Surrounding layers (animations, audio, app wiring, global CSS, backend)

> Performed 2026-05-23 by 4 parallel general-purpose audit agents.
> Slices covered: `components/animate-ui` + `components/charts` + `components/preview` + `components/hooks`; `components/ui-audio` + `components/utils`; `app/` wiring layer (layout, page, contexts, home sections, error boundaries); global CSS (`globals.css`, `tailwind-theme.css`, `shadcn-theme.css`) + `backend/server.js` + `lib/`.
> ~140 additional files surveyed. Surfaced **2 new cross-cutting themes** + critical security findings.

## NEW cross-cutting themes

### 🔴 Theme E — Unmemoized context value objects re-render every consumer on every keystroke

**Found by:** Slice 8 (`app/contexts/`)

The single highest-leverage finding in the entire audit. Three context providers inline a value object (often with 50+ fields) without `useMemo`, so every state update — including every token streamed during chat — creates a new reference, re-rendering every consumer.

| File | Lines | Notes |
|---|---|---|
| `app/contexts/context-rovo-chat.tsx` | 2392-2452 | ~50-field inline value object; sits at root, so re-renders sidebar/header/every route during chat streaming |
| `app/contexts/context-work-item-modal.tsx` | 214-235 | `state`, `actions`, `meta` literals on lines 214/220/229 unmemoized |
| `app/contexts/context-creation-mode.tsx` | 32-37 | `value={{ mode }}` allocated every render |

**Exemplar (already correct):** `app/contexts/context-sidebar.tsx:43-57` memoizes `state`, `actions`, and the combined `value`. Use as reference pattern.

**Fix:**

```tsx
// Either: wrap each context value in useMemo
const value = useMemo(() => ({ /* all fields */ }), [/* all deps */]);

// Or better: split into State / Actions contexts so consumers only subscribe to what they use
const RovoChatStateContext = createContext(...);
const RovoChatActionsContext = createContext(...);
```

**Action:** One PR per context. Start with `context-rovo-chat.tsx` (biggest blast radius). Verify React DevTools profiler before/after — should see N→1 renders per keystroke.

---

### 🟠 Theme F — `prefers-reduced-motion` gap across all animation libraries

**Found by:** Slice 4 (ui-custom decorative animations), Slice 5 (arts), Slice 6 (animate-ui), Slice 7 (ui-audio)

Decorative infinite animations across 4 component dirs ignore the user's reduced-motion preference. Some files don't even check it once.

| Dir | Affected files |
|---|---|
| `components/ui-custom/` | `morphing-rovo.tsx:110-145`, `animated-dots.tsx:43`, `animated-rovo.tsx` |
| `components/animate-ui/icons/` | `cloud-rain.tsx`, `cloud-drizzle.tsx`, `cloud-snow.tsx`, `cloud-lightning.tsx`, `cloud-moon.tsx`, `cctv.tsx`, plus orchestrator `icon.tsx:325-355` — entire library has zero `useReducedMotion` calls |
| `components/ui-audio/` | `orb.tsx:164` (WebGL shader!), `shimmering-text.tsx:91` (infinite linear), `waveform.tsx:1035`, `bar-visualizer.tsx:299` |
| `components/website/demos/visual/shaders/` | 9 shader files (already in Theme C) |

**Exemplar:** `components/arts/personal-graph/personal-graph-neural-canvas.tsx:548,569-596` — best-in-class, respects `useReducedMotion` AND switches between RAF loop and static frame.

**Fix pattern (one per file):**

```tsx
const reduced = useReducedMotion();
if (reduced) return; // or: render staticVersion / freeze animation
```

**Note:** Slice 9 confirmed `globals.css:253-260` has a global `prefers-reduced-motion` rule that zeroes `animation-duration` and `transition-duration` — so CSS-driven loops *are* covered. The gap is **JS-driven RAFs and motion/react `repeat: Infinity` loops**, which CSS can't kill.

---

## Extensions to existing themes

### Theme B — `content-visibility: auto` (now affecting ~40+ files)

Batch 4 extended the target list significantly:

| New target | Source slice | Notes |
|---|---|---|
| **All 69 chart files** in `components/charts/` | Slice 6 | Every `<ChartContainer>` wrapper — uniform pattern |
| `app/home-catalog-section.tsx:134`, `app/home-content.tsx:114,144` | Slice 8 | Long card lists with lazy iframes |
| Audio visualizer canvases | Slice 7 | Combined with Theme C RAF guard |
| `components/animate-ui/` icon containers | Slice 6 | If used in scrolling lists |

Slice 9 also recommended **defining the utility globally**:

```css
/* app/globals.css */
@utility cv-auto {
	content-visibility: auto;
	contain-intrinsic-size: auto 400px;
}
```

### Theme C — Offscreen RAF pause (now ~30+ files)

Batch 4 adds the entire animate-ui icon library (`repeat: Infinity` motion variants) and 6 audio visualizers to the list of unconditional-RAF/loop offenders:

- `components/animate-ui/icons/icon.tsx:325-355` (orchestrator) + ~9 motion icons
- `components/ui-audio/bar-visualizer.tsx:104,236,299,430`
- `components/ui-audio/live-waveform.tsx:305,591,727`
- `components/ui-audio/waveform.tsx:345,576,669,1035,1169,1565`
- `components/ui-audio/matrix.tsx:104`
- `components/ui-audio/orb.tsx:164` (WebGL `useFrame`)

**Combined Theme B+C+F action:** One project-wide pattern PR establishing:
1. `cv-auto` utility (Theme B)
2. Reusable `useOffscreenPause(ref)` hook that fires `e.skipped` checks via `contentvisibilityautostatechange` (Theme C)
3. Reusable `useShouldAnimate()` hook combining `useReducedMotion()` + `useInView()` + `document.visibilityState` (Themes C+F)

Then sweep all the listed files using the three primitives.

---

## NEW per-slice high-impact findings (no overlap with existing themes)

### 🔴 Finding 20 — No security headers (CSP / nosniff / HSTS / Referrer-Policy)

**Slice 9 • File: `backend/server.js:15314, 15318-15353`**

`app.use(express.static(publicPath))` and the `/{*splat}` HTML fallback serve every page with **zero** security headers. The inline fallback HTML has no CSP. Compounding this, `app.use(cors())` at `backend/server.js:1323` echoes `Access-Control-Allow-Origin: *` on every endpoint (chat-sdk, file upload, web-proxy, screenshots, transcription) — combined with `express.json({ limit: "50mb" })` this is an abuse vector.

**Fix:**

```js
app.use(helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'", "'unsafe-inline'"], // Next inline scripts
			connectSrc: ["'self'", "https://ai-gateway.us-east-1.staging.atl-paas.net"],
			imgSrc: ["'self'", "data:", "https:"],
			styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
			fontSrc: ["'self'", "https://fonts.gstatic.com", "https://*.atlassian.com"],
		},
	},
}));
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
```

**Also note:** `backend/server.js:12847-12862` (`/api/web-proxy`) echoes upstream `Content-Type` verbatim and ships rewritten HTML — XSS-by-proxy vector without `X-Content-Type-Options: nosniff`.

---

### 🔴 Finding 21 — Font preload pattern is fragile + missing `fetchPriority="high"`

**Slice 8 • File: `app/layout.tsx:239-240`**

```tsx
<link rel="preload stylesheet" href="..." />   // ← combined relation is fragile
<link rel="stylesheet" href="..." />            // ← no fetchPriority="high"
```

Safari and older Chromiums treat `rel="preload stylesheet"` as preload-only. The Google Fonts stylesheet on the next line is a separate render-blocking request without `fetchpriority`. Net effect: two parallel CSS waterfalls competing for LCP.

**Fix:**

```tsx
<link rel="preload" as="font" href="..." fetchPriority="high" crossOrigin="" />
<link rel="preload" as="style" href="..." fetchPriority="high" />
<link rel="stylesheet" href="..." fetchPriority="high" />
```

---

### 🟠 Finding 22 — No skip link, no `<main>` landmark in root layout

**Slice 8 • Files: `app/layout.tsx:246-250`, `app/error.tsx:24`, `app/not-found.tsx:7`**

`<body>` hosts `<Providers>{children}</Providers>` with no skip link and no `<main>` landmark. Error boundaries also lack landmarks. Keyboard users can't skip the sidebar; screen readers get no main-content cue.

**Fix:**

```tsx
// app/layout.tsx (inside <body>)
<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>
<Providers>
	<main id="main-content">{children}</main>
</Providers>
```

Document that error/not-found pages must wrap their content in `<main id="main-content">` too.

---

### 🟠 Finding 23 — Error boundaries don't move focus to error message

**Slice 8 • Files: `app/error.tsx:18-39`, `app/global-error.tsx:19-46`**

When React swaps in the error UI, focus stays on whatever element triggered the error (often unmounted). SR users get no announcement; keyboard focus is lost.

**Fix:**

```tsx
const headingRef = useRef<HTMLHeadingElement>(null);
useEffect(() => { headingRef.current?.focus(); }, []);
return <h1 ref={headingRef} tabIndex={-1}>...</h1>;
```

Or wrap container with `role="alert"`.

---

### 🟠 Finding 24 — No `@font-face` metric overrides for Atlassian Sans/Mono

**Slice 9 • File: `app/globals.css:33-109`**

`--font-sans: var(--ds-font-family-body)` resolves to `"Atlassian Sans", ui-sans-serif, -apple-system, ...` with no `@font-face { font-family: "Atlassian Sans fallback"; size-adjust: ...; ascent-override: ...; descent-override: ...; }` block. CLS on first paint for every surface using `--ds-font-body` is unmitigated.

**Fix:** Add a `@font-face` block with measured metric overrides for the system fallback family, then list it before `ui-sans-serif`. Also add `font-size-adjust: ex-height` on `body` and `code, kbd` for mixed-font stability.

---

### 🟠 Finding 25 — ScrubBarTrack has `role="slider"` with no keyboard support

**Slice 7 • File: `components/ui-audio/scrub-bar.tsx:146`**

Custom slider with `role="slider"`, `aria-valuenow`, but **only** `onPointerDown` — no `onKeyDown` for ArrowLeft/Right/Home/End, no `tabIndex={0}`. Keyboard users cannot scrub audio. (Real keyboard a11y bug, not polish.)

**Fix:** Add `tabIndex={0}` + `onKeyDown` handling ±1s per arrow + Home/End. Or replace with Base UI `SliderPrimitive.Root` — `audio-player.tsx:300-350` already uses it correctly as a reference.

---

### 🟡 Finding 26 — Global home redirect blocks first paint

**Slice 8 • File: `app/page.tsx:1-5`**

`redirect("/projects")` from the root path is a 307 server hop that blocks first paint. External links to `/` pay full round-trip cost.

**Fix:** Render `HomeContent` directly with `category="projects"`, or add `export const dynamic = "force-static"` so the redirect is cached.

---

### 🟡 Finding 27 — `voice-button.tsx` uses `React.forwardRef` (project rule violation)

**Slice 7 • File: `components/ui-audio/voice-button.tsx:96`**

CLAUDE.md says: "ref as regular prop (no forwardRef)" — React 19 idiom. This file uses `forwardRef` directly.

**Fix:**

```tsx
function VoiceButton({ ref, ...props }: VoiceButtonProps & { ref?: Ref<HTMLButtonElement> }) {
	return <button ref={ref} {...props} />;
}
```

Also `voice-button.tsx:166` uses a generic `aria-label="Voice Button"` that doesn't reflect state — should be dynamic (`"Stop recording"` / `"Processing voice"` / `"Start recording"`).

---

### 🟡 Finding 28 — Missing `Link: rel=preload` headers on static-export HTML

**Slice 9 • File: `backend/server.js:15314, 15331`**

Static-export `index.html` is served straight from disk — backend never adds `Link: </_next/static/...>; rel=preload; as=font; crossorigin` for critical resources. Every page pays full LCP discovery cost.

**Fix:** At server startup, scan `public/_next/static/css/*.css` + the largest entry chunk and emit a `Link:` header in the HTML fallback handler.

---

### 🟡 Finding 29 — `mousedown` listener instability in `useClickOutside`

**Slice 6 • File: `components/hooks/use-click-outside.ts:16-32`**

New `mousedown` listener attaches on every prop change because the `refs` array identity is unstable (callers usually inline `[ref1, ref2]`). The effect re-fires per render, churning event listeners.

**Fix:** Take refs by stable identity, or memo internally; use `pointerdown` (matches Base UI conventions) + `{ passive: true }`.

---

### 🟡 Finding 30 — `filteredData` recomputed every render in interactive charts

**Slice 6 • File: `components/charts/area/chart-area-interactive.tsx:33-45`**

`INTERACTIVE_CHART_DATA.filter(...)` (97-row scan + `new Date()` allocation per row) runs on every render — including pointer hover that re-renders parents.

**Fix:** `useMemo(() => filtered, [timeRange])`. Same pattern likely in other `*-interactive.tsx` chart files.

---

### 🟡 Finding 31 — Reduced-motion rule misses `scroll-behavior` and `view-transition`

**Slice 9 • File: `app/globals.css:253-260`**

The global `prefers-reduced-motion` rule zeroes `animation-duration` and `transition-duration` on `*`, but doesn't override `scroll-behavior: smooth` or pause `::view-transition-*`.

**Fix:** Inside the media query, add `html { scroll-behavior: auto !important; }`. Already handles `::view-transition` partially per the report — verify.

---

### 🟡 Finding 32 — No global `:focus-visible` fallback

**Slice 9 • File: `app/globals.css:78-81`**

Only `a:focus-visible` has a 2px outline. No global `:focus-visible` ring for `button`, `[role="button"]`, `input`, `select`, `textarea`. Sonner toast at `L183` explicitly removes its box-shadow.

**Fix:**

```css
:where(button, [role="button"], input, select, textarea):focus-visible {
	outline: 2px solid var(--color-ring);
	outline-offset: 2px;
}
```

---

## Final consolidated implementation order (all batches)

Ranked by impact-per-PR. New entries from Batch 4 inserted in priority order.

| # | Finding | Impact | Effort | Notes |
|---|---|---|---|---|
| 1 | **Theme E** — Memoize 3 context values | **Very High** (renders during streaming) | Low–Medium | `context-rovo-chat.tsx` is biggest blast radius |
| 2 | **Finding 20** — Add security headers + tighten CORS | **High** (security) | Low | One middleware block in `backend/server.js` |
| 3 | **Theme A** — `:user-invalid` across 9 form primitives | High (a11y/UX) | Medium | Mechanical |
| 4 | **Finding 19** — `priority` on LCP heroes | High (LCP) | Very Low | 6 concrete files |
| 5 | **Finding 21** — Fix font preload pattern | High (LCP) | Very Low | 2-line change |
| 6 | **Finding 25** — Keyboard support for ScrubBarTrack | High (a11y bug) | Low | Real bug, not polish |
| 7 | **Theme C+B+F combined sweep** — Reusable `useShouldAnimate` + `cv-auto` + offscreen-pause hooks | High (CPU/battery/a11y) | Medium-High | ~30 files but one pattern |
| 8 | **Finding 22** — Skip link + `<main>` landmark | Medium (a11y) | Low | Layout + 3 error boundaries |
| 9 | **Finding 23** — Focus error heading on render | Medium (a11y) | Low | 2 files |
| 10 | **Finding 24** — `@font-face` metric overrides | Medium (CLS) | Medium | Requires font measurement |
| 11 | **Finding 11** — Kanban-board cleanup pass | Medium | Medium-High | 4 issues, one file |
| 12 | **Finding 14** — Banner/Alert SR spam | Medium (a11y) | Low | Gate `role="alert"` |
| 13 | **Finding 12** — Find-in-page across tabs/collapsibles | Medium | Low | `hidden="until-found"` |
| 14 | **Theme D** — Top-layer animation consolidation (7 primitives) | Medium (consistency) | Medium-High | Visual regression test required |
| 15 | **Finding 13** — `next/font` migration + `font-size-adjust` | Medium (CLS) | Medium | Touches `layout.tsx` |
| 16 | **Finding 27** — `voice-button` forwardRef + dynamic aria-label | Medium | Low | Per project rules |
| 17 | **Finding 28** — `Link:` preload headers | Medium (LCP) | Medium | Backend startup scan |
| 18 | **Finding 32** — Global `:focus-visible` fallback | Medium (a11y) | Very Low | One CSS rule |
| 19 | **Finding 31** — Reduced-motion covers `scroll-behavior` | Low-Medium | Very Low | One CSS rule |
| 20 | Batch 1 F3 — `mask-image` fade on conversation | Low-Medium | Low | Polish |
| 21 | **Finding 16** — `useLayoutEffect` for chat scroll-to-bottom | Low-Medium | Low | Verify first |
| 22 | **Finding 17/18** — Streaming item entry animations | Low (polish) | Low | One pattern |
| 23 | **Finding 15** — Wire route-level View Transitions | Low (polish) | Medium | CSS already wired |
| 24 | **Finding 26** — Replace `/` redirect with direct render | Low | Very Low | One file |
| 25 | **Finding 29** — `useClickOutside` listener stability | Low | Low | One hook |
| 26 | **Finding 30** — Memoize `filteredData` in interactive charts | Low | Low | Per chart |
| 27 | Browser-support policy in CLAUDE.md | Low (process) | Trivial | Doc only |
| 28 | Batch 2 F7 — Shrinking website header | Low (cosmetic) | Low | Skip unless polish pass |

---

## Additional anti-findings from Batch 4

| Pattern | Why it's fine |
|---|---|
| `app/contexts/context-sidebar.tsx:43-57` | Memoizes `state`, `actions`, and combined `value` — **the exemplar** for Theme E |
| `app/providers.tsx:31` | `MotionConfig reducedMotion="user"` honors `prefers-reduced-motion` globally for motion/react |
| `app/layout.tsx:165-190` | Pre-hydration script sets `data-color-mode` before paint, preventing FOUC |
| `app/layout.tsx:15-33` | Uses `next/font` with `display: "swap"` for Geist + 3 local fonts |
| `components/utils/pre-hydration-script.tsx:11-16` | Uses `useServerInsertedHTML` — script injected before hydration (correct `optimize-script-priority`) |
| `components/utils/dev-*.tsx` | All guard on `process.env.NODE_ENV !== "development"` — tree-shake in prod |
| `components/ui-audio/audio-player.tsx:300-350` | Uses Base UI `SliderPrimitive.Root` correctly — full keyboard/ARIA from primitive |
| `components/ui-audio/conversation.tsx:17-24` | Uses `use-stick-to-bottom` with `role="log"` and `initial="smooth"` — chat scroll-on-load handled |
| `components/hooks/use-is-mounted.ts` | Uses `useSyncExternalStore` — SSR-safe and minimal |
| `app/globals.css:14` | Cascade layer order pinned: `@layer theme, base, components, utilities;` |
| `tailwind-theme.css:354-379` | Motion tokens fully defined with Tailwind-friendly + ADS-name aliases |

---

## Now truly NOT audited

After Batch 4, the remaining unscanned surface is tiny:

- `app/api/` route handlers — server-side AI gateway logic, not browser-side modern-web concerns
- `app/[category]/`, `app/components/[category]/[slug]/` — dynamic route slugs (handled implicitly via Slice 1 coverage of route patterns)
- `hooks/` root-level dir (separate from `components/hooks/`) — if it exists, similar to `components/hooks/`
- `media/`, `public/` — static assets only
- `rovo/config.js` — AI config (no UI surface)
- `backend/lib/*.js` — server helpers (spot-checked, none shape HTML headers)
- `scripts/`, `docs/`, `tests/` — out of scope by definition

**Conclusion:** The codebase has been comprehensively audited for modern-web-guidance applicability. Any further passes would yield diminishing returns; the remaining surface either doesn't render UI or has been spot-checked and cleared.

---

## Guides used in Batch 4

| Slice | Guides applied |
|---|---|
| Slice 6 | `animate-element-entry-exit`, `animate-to-from-top-layer`, `animate-to-intrinsic-sizes`, `physics-based-easing`, `efficient-background-processing`, `interactions-in-complex-layouts`, `defer-rendering-heavy-content`, `defer-work-until-scroll-ends`, `same-document-transitions`, `scroll-target-on-load` |
| Slice 7 | `efficient-background-processing`, `animate-element-entry-exit`, `physics-based-easing`, `prevent-text-wrapping`, `scroll-target-on-load`, `soft-edge-content-fade`, `accessibility`, `validate-input-after-interaction`, `interactions-in-complex-layouts`, `visually-stable-font-fallbacks`, `optimize-script-priority` |
| Slice 8 | `optimize-image-priority`, `optimize-preload-priority`, `optimize-script-priority`, `improve-next-page-load-performance`, `faster-spa-view-transitions`, `same-document-transitions`, `defer-rendering-heavy-content`, `accessibility`, `visually-stable-font-fallbacks`, `efficient-background-processing`, `interactions-in-complex-layouts`, `stabilize-reactive-state` |
| Slice 9 | `css`, `visually-stable-font-fallbacks`, `visually-stable-mixed-fonts`, `accessibility`, `defer-rendering-heavy-content`, `optimize-script-priority`, `optimize-preload-priority`, `security`, `privacy`, `improve-next-page-load-performance` |
