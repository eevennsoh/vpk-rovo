# Lessons

Running log of corrections and patterns learned during sessions.
Distill recurring patterns into permanent rules in CLAUDE.md or .claude/rules/.
Mark promoted entries with `[Promoted]` prefix — see vpk-lesson skill for details.

---

### 2026-05-02 - Do not add a top fade over the Personal Graph grid

- **What happened:** The `/personal-graph` backdrop had an absolute top
  `bg-gradient-to-b` overlay that faded the dashed editor grid behind the
  title and controls.
- **Why:** A prior visual polish pass masked the grid to soften the header
  area after the route had already moved toward transparent page chrome.
- **Rule:** On `/personal-graph`, keep the top header/backdrop area unmasked.
  Do not reintroduce a top surface gradient over the dashed grid unless the
  user explicitly asks for that fade.

### 2026-05-02 - Never stack a `dark:` variant on Tailwind `neutral-*` (or other ADS-mapped) classes

- **What happened:** Tried to subdue the Personal Graph grid texture by
  swapping `text-neutral-400` for `text-neutral-200 dark:text-neutral-800`.
  The change had almost no visible effect in light mode, and the dark
  variant pulled dark mode to a completely different luminance rung than
  intended.
- **Why:** In `app/tailwind-theme.css`, Tailwind's `neutral-50` … `neutral-950`
  scale is remapped to ADS gray tokens (`--ds-background-accent-gray-*`),
  which already auto-flip with the `light`/`dark` class on `<html>`. So
  `text-neutral-100` in light mode resolves to a near-white gray, and the
  same `text-neutral-100` in dark mode auto-flips to a near-surface dark
  gray — same semantic rung, theme-correct value. Adding `dark:text-neutral-X`
  double-handles the flip and breaks the design intent.
- **Rule:** Use a single ADS-mapped neutral class for both modes — e.g.
  `text-neutral-100`, never `text-neutral-200 dark:text-neutral-800`. Lower
  rung numbers = closer to the surface (subtler) in *both* modes; higher rung
  numbers = farther from the surface in both modes. This is the inverse of
  vanilla Tailwind, where rung numbers track absolute luminance. The same
  rule applies to any other utility class whose CSS variable is already a
  themed ADS token (check `app/tailwind-theme.css` and `app/shadcn-theme.css`
  before reaching for `dark:`).

### 2026-05-02 - Prefer Tailwind semantic classes over raw token strings in component styling

- **What happened:** A Personal Graph backdrop adjustment passed raw
  `var(--ds-...)` token strings into the grid pattern props even though a
  Tailwind semantic utility could provide the same themed color.
- **Why:** The patch treated CSS variables as the design-system API for a
  React component surface instead of first checking whether the value could be
  expressed with existing Tailwind token classes.
- **Rule:** For component styling, prefer Tailwind semantic utilities such as
  `text-blanket`, `bg-surface`, and `border-border-bold`. Use raw `--ds-*`
  strings only when a lower-level canvas/shader API genuinely requires a color
  value and there is no class-based path.

### 2026-03-24 - Use the Serve-native deferred flow for plan-mode tools

- **What happened:** Rovo App repeatedly broke the planning chain by
  treating both `ask_user_questions` and `exit_plan_mode` like custom paused
  approval flows, mixing `resume_tool_calls`, synthetic approval payloads,
  manual agent-mode toggles, and a local make-grid build path. This caused
  stuck or invalid plan reviews, duplicate question cards, malformed tool
  history, and plan cards that drifted from the real `exit_plan_mode` payload.
- **Why:** Both tools are real deferred tools in RovoDev Serve and must be
  answered through the deferred-result contract instead of local approval
  plumbing. `exit_plan_mode` in particular depends on exact result strings like
  `"Accept."`, and plan rejection must cancel the pending deferred tool instead
  of reusing the next prompt as synthetic feedback.
- **Rule:** For `ask_user_questions` and `exit_plan_mode`, render UI from the
  actual deferred-tool request event and return results through the
  Serve-native deferred response path only. In Rovo App, map Build to
  `"Accept."`, a normal reply to plan feedback, and Plan-off plus the next
  prompt to cancel the pending deferred tool and send the new prompt in
  default mode; do not route plan acceptance through custom approval or
  make-grid logic.

- **What happened:** Rovo App app generation recreated host-level shell
  chrome, including top navigation and the floating Rovo launcher, which caused
  duplicate UI like a top nav inside a top nav.
- **Why:** The shared make-run prompt constrained file placement but did not
  tell the generator that Rovo App previews are embedded feature surfaces
  inside an existing shell.
- **Rule:** For Rovo App app generation, treat the output as a mini feature
  or widget by default. Do not add `AppLayout`, top navigation, product
  sidebar, floating Rovo button, global Rovo chat panel, or equivalent
  host-shell chrome unless the user explicitly asks to prototype the shell
  itself.

### 2026-03-30 - Rovo App plan card → Build → execution full flow reference

- **What happened:** Multiple AI sessions spent significant time rediscovering
  how the plan card works and what happens after clicking Build, leading to
  repeated back-and-forth before the flow worked correctly.
- **Why:** The flow spans ~8 files across frontend and backend with a non-obvious
  deferred-tool-call resume pattern. Without a documented trace, each session
  re-derives it from scratch and often gets the handoff wrong.
- **Rule:** The full plan card → Build → execution chain is:
  1. **Plan card renders** from `data-widget-data` parts with `deferredToolCallId`
     (`plan-widget.ts` → `plan-widget-inline-card.tsx`).
  2. **Build click** calls `acceptPlanReview()` in `use-rovo-app.ts`, which
     creates a `PlanApprovalSubmission` with `decision: "auto-accept"` and the
     `deferredToolCallId` from the plan widget.
  3. **Frontend sends** `POST /v3/stream_chat` with
     `deferredToolResponse: { tool_call_id, result: "Accept." }` and
     `isPlanMode: false`, plus message metadata `source: "plan-approval-submit"`.
  4. **Backend** (`server.js`) extracts the deferred tool response, clears the
     active deferred tool call, transitions the plan session to `phase: "execution"`,
     builds resume decisions via `buildResumeDecisionsFromApprovalSubmission()`,
     and calls `rovoDevResumeToolCalls(port, { decisions })` → RovoDev Serve's
     `POST /v3/resume_tool_calls`.
  5. **RovoDev agent resumes** the paused `exit_plan_mode` tool with result
     `"Accept."` and begins executing the plan tasks.
  6. **Agent calls `update_todo`** during execution; the backend streams these
     tool-call results back.
  7. **Frontend** parses `update_todo` output via
     `getLatestRovoAppTodoProgress()` in `rovo-app-update-todo-progress.ts`,
     then `resolveRovoAppPlanExecutionTracker()` merges todo snapshots with
     plan tasks to build a `PlanExecutionTrackerViewModel`.
  8. **TaskProgress UI** (`rovo-app-plan-execution-tracker.tsx`) renders live
     status groups (done / in-progress / todo) with run timing and agent count.
     Key files: `plan-widget.ts`, `plan-approval.ts`, `use-rovo-app.ts`,
     `server.js`, `rovodev-client.js`, `rovo-app-update-todo-progress.ts`,
     `rovo-app-plan-execution-tracker.ts/.tsx`.

### 2026-04-01 - Match the user’s UI composition before embellishing

- **What happened:** A rough UI mock for the Rovo App artifact context was
  translated into a centered decorative callout instead of the full-width top
  strip the user had shown.
- **Why:** The design pass added extra hierarchy and ornamental framing before
  matching the core layout and composition from the provided screenshot.
- **Rule:** When a user supplies a UI mock, match the primary composition
  literally first (placement, width, alignment, and chrome) before adding any
  styling interpretation or extra visual detail.

### 2026-04-02 - Keep Rovo App title generation on the direct gateway path

- **What happened:** Rovo App thread titles stopped updating even though the
  direct AI Gateway title request still succeeded.
- **Why:** The title flow was changed from the old immediate gateway call to a
  post-stream path gated on the RovoDev Serve streaming lifecycle plus an extra
  delay, which broke the previously working handoff.
- **Rule:** For Rovo App thread titles, call the direct `/api/chat-title`
  AI Gateway path immediately after thread creation. Do not couple title
  generation to RovoDev Serve stream start, stream completion, or added
  timeouts unless a verified gateway contention issue requires it.

### 2026-04-05 - Use VPK Atlaskit-based icons, not lucide-react

- **What happened:** A performance recommendation proposed optimizing
  `lucide-react` imports even though VPK no longer wants new Lucide usage.
- **Why:** The repo standard is to use VPK icon primitives and Atlaskit icons,
  not add more `lucide-react` usage or invest in keeping it as a first-class
  path.
- **Rule:** Do not add new `lucide-react` imports. Use VPK icon components and
  Atlaskit icon packages instead. When touching a Lucide-based surface, prefer
  migrating that surface rather than optimizing Lucide usage further.

### 2026-04-05 - Question cards in primary chat come from RovoDev deferred tools

- **What happened:** The backend review treated question cards as an
  AI Gateway-assisted helper flow and missed that the canonical clarification
  experience is the `ask_user_questions` / `request_user_input` deferred-tool
  path from RovoDev Serve.
- **Why:** The codebase still contained a secondary backend-generated
  clarification question-card path, which blurred the distinction between
  question-card UI as a deferred-tool renderer and question-card UI as
  independently generated metadata.
- **Rule:** For primary chat clarification, question cards should originate
  from RovoDev Serve deferred tools. Do not preserve or add parallel
  AI Gateway-generated clarification question-card flows for the same user path
  unless the user explicitly asks for a separate non-Rovo mechanism.

### 2026-04-06 - Menu section labels should match dropdown sentence case

- **What happened:** A `menu-group` styling change kept section headings in all
  caps even though the matching `dropdown-menu` labels in this repo use sentence
  case.
- **Why:** The primitive was styled like a legacy uppercase heading instead of
  matching the existing dropdown label treatment the user asked to mirror.
- **Rule:** When aligning `menu-group` with `dropdown-menu`, use the same
  sentence-case label styling and spacing. Do not add uppercase or
  `tracking-wider` menu section headings unless the design explicitly requires
  that treatment.

### 2026-04-10 - Verify RovoDev Serve behavior against the ACRA repo

- **What happened:** A review treated RovoDev Serve idle/session behavior as
  unsupported because the evidence was not in the VPK repo.
- **Why:** The relevant implementation and docs live in the sibling ACRA repo
  at `/Users/esoh/Documents/Labs/acra`, which is the actual source of truth for
  Serve behavior.
- **Rule:** When reviewing VPK plans or code that depend on RovoDev Serve
  semantics, check the local ACRA repo before calling a Serve-behavior claim
  unsupported.

### 2026-04-14 - Respect explicit stack choices for major implementation details

- **What happened:** The memory explorer was implemented with
  `@xyflow/react` even after the user explicitly asked for the `wiki-os`
  style graph stack based on `graphology` and `sigma`.
- **Why:** The implementation optimized for already-installed repo primitives
  instead of honoring the user’s direct technical choice for the graph layer.
- **Rule:** When the user explicitly names a required library or stack for a
  major subsystem, use that stack. Do not substitute a familiar or already
  installed alternative unless the user approves the change in direction.

### 2026-04-18 - Do not auto-reenable the legacy alternate browser path

- **What happened:** The browser runtime started reopening the old alternate
  preview path when a matching local browser install or executable-path hint
  was present, even though the product had already moved back to the isolated
  browser workspace by default.
- **Why:** Runtime defaulting logic inferred deprecated alternate browser
  behavior from local machine state instead of requiring an explicit opt-in,
  which let environment hints silently override the intended default browser
  behavior.
- **Rule:** Keep the browser runtime in isolated mode unless the product
  explicitly enables an alternate browser path. Do not infer alternate browser
  behavior from detected local installs or executable-path hints.

### 2026-04-18 - Keep the Rovo inline browser preview view-only

- **What happened:** The Rovo inline browser preview kept interactive click and
  wheel forwarding even after the product requirement narrowed to a passive
  live mirror with screenshots while `agent-browser` remains the only browser
  controller.
- **Why:** The Rovo artifact reused parts of the richer demo preview surface,
  so interaction plumbing stayed attached even though the inline browser was
  no longer meant to be a control surface.
- **Rule:** In Rovo App, treat the inline browser as a passive preview. Let
  `agent-browser` control the authoritative browser session, and keep the IAB
  limited to mirroring live frames plus screenshot display.

### 2026-04-18 - Prefer an existing local Chrome over install-time browser downloads

- **What happened:** Thread-bound browser workspace creation failed during
  request handling because `agent-browser install` tried to fetch Chrome for
  Testing metadata from the network before navigation could begin.
- **Why:** The runtime treated browser installation as part of normal workspace
  bootstrap even on machines that already had a usable local Chrome binary,
  turning a recoverable setup detail into a hard navigation failure.
- **Rule:** When bootstrapping `agent-browser` workspaces, prefer an existing
  local Chrome executable and skip install-time browser downloads in the
  request path. If bootstrap still fails, surface the underlying error details
  instead of collapsing everything into a generic workspace error.

### 2026-04-18 - Keep Rovo browsing on direct agent-browser sessions

- **What happened:** Rovo browser navigation and inline preview drifted onto a
  separate custom workspace/runtime stack instead of following the native
  `agent-browser` session model that powers the dashboard experience.
- **Why:** The project added a thread-bound browser workspace layer with its
  own bootstrap, transport, and state assumptions, which created extra latency
  and failure modes that the direct `agent-browser` path does not have.
- **Rule:** For Rovo browser flows, prefer direct `agent-browser` sessions and
  native session streaming over custom browser workspace runtimes. Keep the
  Rovo-specific logic at the message and preview-shell layer, not in browser
  process management.

### 2026-04-19 - Re-try git cleanup after state changes before assuming approval is required

- **What happened:** I said deleting `automation/performance-audit` was blocked
  on approval, but once the stale linked worktree was gone the branch cleanup
  completed directly and the remote ref had already been removed.
- **Why:** I assumed git ref updates and remote branch cleanup still needed
  escalation instead of re-checking the current branch/worktree state and
  retrying the concrete commands first.
- **Rule:** For git branch cleanup, re-check worktree and ref state after each
  failure and retry the exact delete command before telling the user approval
  is required. Only escalate when the retried command still proves it needs
  broader permissions.

### 2026-04-20 - Preserve existing shader presentation and controls during tokenization

- **What happened:** A weather theming refactor removed the page’s hover theme
  control, added a contrast tint that made the shader cards look washed out,
  and changed shader-card overlay content away from the intended inverse color
  treatment.
- **Why:** I treated shader wrappers like normal surface chrome and optimized
  for token purity before preserving the feature’s existing visual behavior and
  user-facing controls.
- **Rule:** When tokenizing an existing themed surface, preserve any existing
  controls and keep shader presentation visually unchanged unless the user asks
  for a redesign. Do not add tint or overlay layers that alter perceived shader
  color, and keep overlay UI on shader art aligned with the intended inverse
  foreground treatment.

### 2026-04-20 - Search every rendered branch before closing a style fix

- **What happened:** A weather card label fix updated one `温度` span to
  `DotGothic16`, but the rendered temperature card still showed the old font.
- **Why:** I patched the first matching node instead of checking the file for
  duplicate or later-rendered branches that used the same text.
- **Rule:** When fixing text or styling in a component file, search every
  rendered branch for the same literal text or style before marking the change
  complete. Do not assume the first match is the one on screen.

### 2026-04-20 - Match optical spacing, not just symmetric math

- **What happened:** The weather slider used the same numeric inset for the
  top and bottom edge ticks, but the bottom tick still looked closer to the
  rounded edge in the rendered UI.
- **Why:** I treated equal geometry as sufficient and did not account for the
  optical imbalance introduced by the bottom cap and surrounding label layout.
- **Rule:** For rounded UI surfaces, verify edge spacing visually. If equal
  numeric insets read unevenly, tune the optical spacing instead of insisting
  on mathematical symmetry.

### 2026-04-20 - Distinguish row alignment from mark alignment

- **What happened:** I adjusted the bottom weather-slider tick row position
  when the user was actually calling out the horizontal mark inside the row.
- **Why:** I treated the rendered issue as an outer positioning problem before
  separating the tick row geometry from the inner mark placement.
- **Rule:** When a control has nested positioning, confirm which element is
  visually wrong before patching. Do not move the whole row when the issue is
  only the inner mark.

### 2026-04-20 - Remove state suffixes when the label itself is the requirement

- **What happened:** The weather mode control kept appending resolved theme
  state like `· Light` to `Location` and `System` after the user asked for
  plain labels only.
- **Why:** I preserved extra status context in the button copy instead of
  matching the explicit copy requirement.
- **Rule:** When a user asks for a specific control label, remove any derived
  status suffixes from that label unless they explicitly ask to keep them.

### 2026-04-29 - Use plain Symphony names after the Option 2 migration

- **What happened:** The repo kept `elixir` suffixes in local Symphony file,
  script, path, and environment variable names after the older Option 1
  implementation had been removed.
- **Why:** The names were useful during migration, but they became misleading
  once upstream Symphony was the only implementation path.
- **Rule:** When only the upstream Symphony reference implementation remains,
  use plain repo-owned names such as `WORKFLOW.md`, `scripts/symphony.sh`,
  `SYMPHONY_DIR`, and neutral `/tmp/symphony-*` paths. Reserve `elixir` only
  for the upstream repository subdirectory that must be executed.

### 2026-04-30 - Guard Symphony merge turns against premature Done moves

- **What happened:** A Symphony issue was moved from `Merging` to `Done` while
  its GitHub PR was still open, so the orchestrator treated the issue as
  terminal and stopped the active merge worker before it could run the final PR
  merge.
- **Why:** The workflow relied on operator discipline and prompt instructions
  to keep `Done` reserved for already-merged PRs, but Linear allowed the state
  transition before GitHub confirmed a merge.
- **Rule:** In Symphony workflows, protect merge handoff with a runner-side
  guard: if an issue is `Done` while its attached GitHub PR is still open, move
  it back to `Merging`. Workers must also verify `gh pr view --json
  state,mergedAt,mergeCommit` before setting `Done`.

### 2026-04-30 - Put new visual routes where users scan the nav

- **What happened:** A newly added visual component route was nested under the
  virtual `Shaders` group, so it was not visible as its own left-nav item where
  the user expected to find it.
- **Why:** I grouped by implementation flavor instead of checking the actual
  discoverability of the left navigation after wiring the route.
- **Rule:** When adding a new component route, verify the left-nav placement
  from the user's expected scan path. Only nest it under a virtual group when
  that grouping is explicitly part of the request or clearly matches the
  component category.

### 2026-04-30 - Keep visual demos focused on the requested surface

- **What happened:** A shadow overlay demo included decorative placeholder
  rectangle cards even though the user only needed the overlay on a white
  background.
- **Why:** I added context to make the effect easier to see, but that changed
  the requested visual surface.
- **Rule:** When porting a visual component, keep the preview backdrop as simple
  as the user requested. Do not add decorative mock UI or placeholder shapes
  unless they ask for surrounding context.

### 2026-04-30 - Make visual color swatches operable controls

- **What happened:** A color control in a visual demo rendered a passive swatch
  beside a text input, so the user could not click the swatch to choose a
  color.
- **Why:** I preserved support for CSS color strings but missed the expected
  GUI-style picker interaction.
- **Rule:** For visual demo color controls, provide a clickable color picker
  plus text entry when free-form CSS color strings are allowed. Do not render a
  passive swatch where users expect a control.

### 2026-04-30 - Match upstream visual defaults before styling

- **What happened:** A Framer shadow overlay port used an ADS blue-gray default
  color and enabled noise, producing a green/blue tint that was not present in
  the upstream Framer component screenshot.
- **Why:** I normalized the demo toward local palette preferences instead of
  preserving the upstream control values first.
- **Rule:** For reverse-engineered visual components, copy upstream/default
  control values before applying local styling. Check color, optional effects,
  and disabled-by-default controls against the source screenshot or module.

### 2026-04-30 - Match established demo radius

- **What happened:** A visual demo preview used a custom 28px corner radius
  instead of the smaller rounded corner convention used by adjacent visual
  demos.
- **Why:** I copied the radius from a different glass demo without checking the
  local visual-demo pattern for this surface.
- **Rule:** Before adding custom preview-frame radius, compare nearby demos in
  the same category. Use established utility radii like `rounded-lg` unless
  the component itself requires a different shape.

### 2026-05-01 - Preserve existing visual demos when adding upstream variants

- **What happened:** Adding Shader Lab shader routes reused existing VPK-rovo
  visual demo slugs and displaced the previous chromatic aberration, fluted
  glass, and pattern demos.
- **Why:** I treated upstream names as direct replacements instead of auditing
  which slugs already had local implementations.
- **Rule:** Before adding third-party shader/demo ports, diff the existing
  tracked demo files and preserve both implementations. Do not assume which
  implementation should receive the variant suffix.

### 2026-05-01 - Keep original shader demos on the base slug

- **What happened:** After restoring displaced local shader demos, I initially
  put the original VPK-rovo implementations under `-v2` and left the Shader
  Lab ports on the base slugs.
- **Why:** I interpreted `v2` as the recovered local variant instead of the new
  Shader Lab variant.
- **Rule:** When an existing VPK-rovo shader gets a newly ported third-party
  version, keep the existing local shader on the original slug and put the new
  third-party version under `-v2` unless the user says otherwise.

### 2026-05-01 - Verify Shader Lab layers against the upstream registry

- **What happened:** The Shader Lab visual demos shared one generic composition
  and missed source-layer entries like Fluid, Pixel Trail, Magnify Lens, Mesh
  Gradient, and Custom Shader.
- **Why:** I treated the npm package effect list as complete without checking
  the upstream editor layer picker and source-layer registry.
- **Rule:** For third-party visual shader ports, inspect the upstream layer
  picker, runtime type definitions, and registry/pass files before wiring the
  VPK catalog. Preserve all upstream layer categories and use a source texture
  that makes each pass visibly distinguishable.

### 2026-05-01 - Render-test Shader Lab source layers with screenshots

- **What happened:** Shader Lab effect demos appeared as black preview boxes
  because the wrapper fed the WebGPU media pass an SVG source texture and
  ordered the exported layer list source-first instead of effect-first.
- **Why:** I validated only route loading and canvas presence, not the visible
  rendered preview. I also missed that Shader Lab reverses exported
  top-to-bottom layers before rendering.
- **Rule:** For Shader Lab demos, use browser screenshots or route-level visual
  sampling to verify nonblack output. Export layer arrays in Shader Lab's
  top-to-bottom order and use PNG/WebP media sources for image layers.

### 2026-05-01 - Separate source simulations from image-backed shader effects

- **What happened:** After identifying Fluid as a distinct source simulation, I
  kept spending time browser-testing its black-backed plume instead of moving
  to the requested source-image UX fix.
- **Why:** I treated all black previews as the same image-source failure even
  after the evidence showed Fluid was using different runtime behavior.
- **Rule:** When Shader Lab source simulations are intentionally different from
  image-backed effects, stop retesting them once that distinction is clear.
  Focus image-source fixes on layers that actually consume a media layer, and
  give those layers a real PNG/WebP default plus upload controls.

### 2026-05-01 - Keep non-shader visual demos out of the shader group

- **What happened:** The restored CSS Pattern demo stayed named `Pattern` and
  remained under the visual Shaders group even though it is a CSS background
  tile generator, not a shader.
- **Why:** I restored the displaced demo under its previous route without
  rechecking whether the category still described the implementation.
- **Rule:** When restoring or renaming visual demos, verify whether the
  implementation is actually shader-based. Non-shader visual generators should
  use a descriptive name and live outside the Shaders sidebar group.

### 2026-05-01 - Curve only Personal Graph origin rays

- **What happened:** After making graph connectors more organic, node-to-node
  relationship edges also became curved when the desired treatment was only for
  lines emerging from the prompt/origin node.
- **Why:** I applied the curve treatment to both connector families instead of
  preserving separate visual semantics for origin rays and relationship edges.
- **Rule:** In Personal Graph, keep node-to-node relationship edges straight
  unless the user explicitly asks otherwise. Reserve organic curved paths for
  prompt/origin rays.

### 2026-05-01 - Treat ASCII custom text as sequence text

- **What happened:** Extra text appended to the ASCII custom character input,
  such as `ROVO`, did not reliably appear because the shader treated the whole
  string as a luminance ramp.
- **Why:** I assumed custom characters were only density glyphs, but user-entered
  words need to loop through the full text string instead of depending on
  signal buckets.
- **Rule:** For ASCII custom text, preserve signal-based glyph ramps as an
  explicit mode, but default custom charsets to sequential glyph selection so
  every typed character can appear.

### 2026-05-01 - Keep ASCII custom glyphs signal-driven by default

- **What happened:** Defaulting custom ASCII text to sequence mode made added
  characters stay in fixed grid positions instead of changing with each pixel
  block like the built-in charsets.
- **Why:** Sequence mode uses cell coordinates rather than the source signal, so
  it is useful only as an explicit fixed-text pattern.
- **Rule:** Keep custom ASCII charsets signal-driven by default; expose or pass
  sequence mode only when the requested behavior is a fixed repeating text
  pattern.

### 2026-05-01 - Keep demo media out of embedded visual effects

- **What happened:** I embedded the Pixel Trail effect into `/personal-graph`
  with the Shader Lab demo's ambient image source, so the illustrative preview
  image came along with the hover trail.
- **Why:** I treated demo preview media as implementation input instead of
  separating the effect behavior from the catalog's illustrative source asset.
- **Rule:** When reusing a visual demo effect in a route surface, do not copy
  its preview or placeholder media unless explicitly requested. Implement the
  effect against the route background or a transparent generated layer.

### 2026-05-01 - Bucket ASCII signal ramps across the full charset

- **What happened:** The ASCII binary charset showed only `0` because the signal
  ramp multiplied by `characterCount - 1`, making the final glyph reachable only
  at an exact `1.0` signal.
- **Why:** I treated the signal as an index interpolation value instead of
  dividing the signal into equal glyph buckets.
- **Rule:** For signal-driven ASCII glyph selection, bucket with
  `floor(signal * characterCount)` clamped to the final index so every glyph,
  especially two-character ramps like binary, can appear.

### 2026-05-01 - Do not freeze shared ASCII shader consumers

- **What happened:** `/personal-graph` imported the shared ASCII shader but
  passed `characterMode="sequence"`, so glyphs stayed fixed to their grid cells
  even after the shared shader default became signal-driven.
- **Why:** I copied the explicit fixed-sequence demo mode into a route surface
  where the expected behavior was the updated animated signal mode.
- **Rule:** When a route consumes a shared shader, avoid overriding newly
  corrected defaults unless the route explicitly needs different behavior; add
  route tests that guard against stale local overrides.

### 2026-05-01 - Keep Personal Graph header off the backdrop grid

- **What happened:** The `/personal-graph` header sat inside a glass container
  that visually masked the dashed backdrop grid.
- **Why:** I treated the header like the floating controls instead of preserving
  the canvas-like background behind the route title and top controls.
- **Rule:** On `/personal-graph`, keep the page header as transparent layout
  chrome. Use glass panels for popovers, inspector, and focused controls only
  when the user asks for a framed surface.

### 2026-05-02 - Use Tailwind-theme utilities for Personal Graph grid strokes

- **What happened:** I tried raw `--ds-*` grid colors and then a shadcn semantic
  text token while tuning the `/personal-graph` backdrop grid visibility.
- **Why:** I focused on the resolved ADS color instead of the user's requirement
  to use the existing Tailwind mapping in `app/tailwind-theme.css`.
- **Rule:** When the user asks for a Tailwind-theme token on Personal Graph
  pattern strokes, use the mapped utility class from `app/tailwind-theme.css`,
  such as `text-neutral-400`, and let the token resolve by theme. This is still
  the correct hook for `PatternTile front="currentColor"` because
  `currentColor` reads CSS `color`; `border-*` utilities do not drive that
  stroke paint path. Check the live computed value in both themes because the
  ADS neutral ramp can invert in dark mode. If token changes do not visibly
  affect the grid, inspect blend mode and opacity before trying more token
  swaps; `mix-blend-mode: multiply` can flatten the visible delta on dark
  surfaces.

### 2026-05-02 - Mirror live effect parameters, not just toggle labels

- **What happened:** I initially treated the ASCII Magic post-processing list as
  mostly toggle parity, missing that Chromatic and several adjacent effects each
  expose inline strength, offset, size, opacity, or blend controls.
- **Why:** I stopped at the visible effect names instead of checking the full
  control shape and default ranges before implementing the demo surface.
- **Rule:** When matching an external controls panel, capture each control's
  nested parameters, ranges, and defaults before coding; do not collapse
  parameterized effects into bare toggles.

### 2026-05-02 - Separate nested scrollbars from page overflow

- **What happened:** I identified the shader GUI panel as the horizontal
  scrollbar source but did not account for the document-level scrollbar caused
  by long component-doc import paths.
- **Why:** I stopped after measuring the nested GUI scrollport instead of also
  checking `documentElement.scrollWidth` and the top document-level overflow
  contributors.
- **Rule:** For visible horizontal-scrollbar bugs, measure both the nested
  scroll container and the document root. Fix every active overflow contributor
  before calling the issue resolved.

### 2026-05-02 - Post effects must sample the rendered shader output

- **What happened:** The ASCII Magic-inspired RGB Offset and Blur controls were
  wired to source-image sampling, so the sliders did not visibly split rendered
  ASCII channels or blur the final glyph layer.
- **Why:** I implemented single-pass approximations from the source texture
  instead of resampling the rendered ASCII composition inside the shader.
- **Rule:** For post-processing controls, verify whether the target effect acts
  on the final rendered layer. If it does, add a rendered-output sampling helper
  rather than reusing raw source texture samples.

### 2026-05-02 - Film dust should read as held artifacts

- **What happened:** The ASCII Film Dust effect reseeded dense speckles several
  times per second, which made the parameter look like falling snow instead of
  film dirt.
- **Why:** I treated dust as generic temporal noise instead of checking the
  reference behavior for sparse flecks and slow, held scratches.
- **Rule:** For analog post-processing effects, verify the motion character in
  the reference before coding. Film dust should use sparse held-frame flecks and
  scratches, not fast full-frame random speckle reseeding.

### 2026-05-02 - Hide inactive animation-specific controls

- **What happened:** The ASCII Animation Style select was visible while
  Animated ASCII was off, so users could change cascade options that had no
  visible effect.
- **Why:** I grouped all animation-related controls together without separating
  global playback controls from controls that only affect animated glyph
  cycling.
- **Rule:** Controls that depend on a toggle should either be hidden or visibly
  disabled until the dependency is active. For animation styles, also verify
  that each option produces a distinct visible motion pattern, not only a minor
  phase offset.

### 2026-05-02 - Keep animation modes discoverable

- **What happened:** Hiding the ASCII Animation Style controls behind Animated
  ASCII made the animation mode selector disappear from the animation section.
- **Why:** I fixed the no-op control state by removing controls instead of
  preserving the complete animation control surface.
- **Rule:** When a control is part of a copied/reference control surface, keep it
  discoverable. If changing it should imply activation, wire the edit to enable
  the dependent effect instead of hiding the control.

### 2026-05-02 - Route-owned graph params can mask shared visual defaults

- **What happened:** `/personal-graph` used the shared visual `Graph` wrapper
  but controlled its params from the Personal Graph storage defaults, so the
  latest visual graph preset such as square nodes was bypassed.
- **Why:** I verified the import path but missed that controlled `params`
  override the wrapper's `initialParams` defaults.
- **Rule:** When checking whether a route picked up a shared component visual
  change, verify both the import wiring and any controlled props or persisted
  local state that can mask the shared component defaults.

### 2026-05-02 - Keep graph-body origin separate from ray-tail origin

- **What happened:** The Personal Graph ray tail ended above the prompt input
  dot, but moving `originY` would also move the visible graph cluster.
- **Why:** The renderer used the same origin for node projection and ray
  convergence, so a tail-alignment tweak could not be made independently.
- **Rule:** For graph-tail alignment around route chrome, keep node projection
  parameters and decorative ray-tail parameters separate. Tune the ray origin
  first when the graph body is already correctly positioned.

### 2026-05-02 - Prompt chrome can mask graph-tail alignment

- **What happened:** The ray-tail origin was numerically aligned to the prompt
  dot, but the input glass/blur still made the final segment read as detached.
- **Why:** I measured canvas geometry without accounting for the route chrome
  stacking and masking over the ray convergence point.
- **Rule:** When graph rays need to connect to a route control, verify the
  visible stacking result, not only the canvas coordinate. If the control masks
  the canvas, add a route-level connector under the anchor dot and bump the
  stored preset key so stale localStorage cannot preserve the old alignment.
