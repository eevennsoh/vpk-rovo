# Lessons

Running log of corrections and patterns learned during sessions.
Distill recurring patterns into permanent rules in CLAUDE.md or .claude/rules/.
Mark promoted entries with `[Promoted]` prefix — see vpk-lesson skill for details.

---

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
