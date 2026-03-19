# Lessons

Running log of corrections and patterns learned during sessions.
Distill recurring patterns into permanent rules in CLAUDE.md or .claude/rules/.
Mark promoted entries with `[Promoted]` prefix — see vpk-lesson skill for details.

---

## 2026-02-21

- Correction: wave shimmer behavior should be implemented in shared `components/ui-ai/shimmer.tsx` (not bespoke logic inside `Reasoning`) so it can be reused consistently.
- Prevention rule: when enabling per-character motion in text components, do not rely on `truncate`/`overflow-hidden` containers; wave mode must preserve `overflow-visible` to avoid glyph clipping.

### 2026-02-22 - Use wait-for-turn over cancel-and-retry for 409 conflicts
- **What happened:** The cancel-and-retry conflict strategy for `streamViaRovoDev()` caused destructive cascades in multiports — panels aggressively canceled each other's turns, pre-canceled sessions that weren't stale, and triggered force port recovery (SIGTERM/SIGKILL). Even after killing all ports and restarting, the demo was unusable.
- **Why:** Cancel-and-retry is wrong for shared ports. `generateTextViaRovoDev()` already had `"wait-for-turn"` but `streamViaRovoDev()` only supported `cancelOnConflict`/`cancelAfterMs` with no patient queue option.
- **Rule:** Use `conflictPolicy: "wait-for-turn"` for all interactive chat streaming. Skip pre-cancel in wait-for-turn mode. Let the retry loop wait with bounded backoff and a 10-minute patience budget. Show "Queued — waiting for turn" in the reasoning indicator.

### 2026-03-04 - Clean up lib data/types when removing a feature
- **What happened:** Features (time-tracking, inventory, it-assets, asset-requests) were removed from `app/` and `components/templates/` but their supporting files in `lib/` (types, seed data), `hooks/` (storage hooks), `components/blocks/`, and `components/ui-ai/` were left behind as dead code.
- **Why:** Deletion only targeted the route and template entry points without tracing the full dependency chain downward.
- **Rule:** When removing a feature/template, trace and remove the full dependency chain: route files → template components → block components → hooks → lib types → lib seed data → ui-ai cards. Run `pnpm tsc --noEmit` after to catch any remaining broken imports.

### 2026-03-07 - Use local avatar-user assets for demo avatar swaps
- **What happened:** A demo avatar replacement initially updated only the primary `shadcn` face and introduced a new path under `public/avatar-human`, while other demo avatars still pointed at remote GitHub images.
- **Why:** The implementation did not first inspect the existing local avatar catalog or follow the user's intent to keep demo avatars sourced from `public/avatar-user`.
- **Rule:** When replacing demo avatar faces, inspect `public/avatar-user` first and convert the full demo set off remote avatar URLs in the same pass. Do not introduce a new avatar location unless the existing avatar catalog is actually insufficient.

### 2026-03-08 - Respect env.local as the source of truth for configured models
- **What happened:** The speech transcription helper hardcoded a default STT model in code even though `GOOGLE_STT_MODEL` was already defined in `.env.local`.
- **Why:** The implementation mixed runtime fallback policy into a config-driven codepath instead of treating local env as authoritative.
- **Rule:** When a model/provider is already configured in `.env.local`, do not hardcode a replacement default in code. Read the configured env value directly and fail loudly if the required env var is missing.

### 2026-03-09 - Remove frontend model state when runtime selection is env-driven
- **What happened:** Future Chat still carried frontend model constants and selector-era state even after chat was fixed to RovoDev and voice STT was meant to be controlled from `.env.local`.
- **Why:** The cleanup stopped at hiding the selector instead of tracing and removing the underlying model-config dependency chain.
- **Rule:** When a surface is locked to backend/env-driven model routing, remove the frontend model config/state entirely and let `.env.local` plus backend defaults be the only source of truth.

### 2026-03-09 - Keep Google STT preset naming provider-generic
- **What happened:** The Google STT preset was renamed to a model-specific env key even though the actual Google model is selected separately via `GOOGLE_STT_MODEL`.
- **Why:** The preset naming conflated provider selection with model selection and drifted from the intended generic-provider env design.
- **Rule:** For provider-routed presets, keep the preset/env key generic to the provider (`google`) and use provider-specific model vars like `GOOGLE_STT_MODEL` for the concrete model choice.

### 2026-03-09 - Inspect git and working-tree diffs first for reported regressions
- **What happened:** A Future Chat streaming bug was initially treated as a generic rendering issue even though the user had already identified it as a regression.
- **Why:** The investigation started from current behavior instead of first comparing the working tree and recent file history to the last known-good implementation.
- **Rule:** When the user reports a regression, check recent git history and the current working-tree diff on the affected files before broadening the fix. Treat uncommitted local refactors as prime suspects.

### 2026-03-11 - Match live VPK primitives, not stale markup, when restoring regressions
- **What happened:** The top-navigation search regression was "fixed" by restoring an older plain `Input` implementation even though the current repo standard for search fields is `InputGroup`, which changed the DOM structure and icon treatment.
- **Why:** The regression recovery over-weighted historical markup and under-weighted the current design-system primitives already used elsewhere in the repo.
- **Rule:** When restoring a regressed UI, compare the last known-good behavior against the current VPK component patterns before reintroducing old markup. If the repo now standardizes on `InputGroup`, use it and match the repo's current icon/addon pattern instead of restoring raw `Input` wrappers.

### 2026-03-12 - Audit the full ADS MCP surface before claiming skill coverage
- **What happened:** ADS MCP coverage was reported as updated even though newly available tools like `ads_i18n_conversion_guide`, `ads_get_all_tokens`, `ads_get_all_icons`, and some cross-skill fallback paths were not fully wired into the affected skill docs.
- **Why:** The check focused on the tools already mentioned in the edited prompts instead of reconciling the skills against the complete current ADS MCP tool list.
- **Rule:** When updating skill docs for an MCP integration, compare each affected skill against the full current tool inventory and patch every relevant workflow, fallback, and tool-reference section before calling coverage complete.

### 2026-03-12 - Make async UI intros visibly durable
- **What happened:** A live-voice waveform entrance fix relied on a transient `processing` state, but the mic stream often became ready too quickly for the user to perceive the intro.
- **Why:** The implementation assumed async setup latency would naturally create a visible animation window instead of enforcing one in the UI state.
- **Rule:** When a first-appearance animation depends on async readiness, hold the intro state for a short minimum duration so the motion is visibly perceptible even on fast paths.

### 2026-03-13 - Do not trade realtime voice latency for exact transcript timing without explicit approval
- **What happened:** A transcription-highlight experiment replaced native GPT-Realtime assistant audio with a second-pass TTS pipeline, which made the voice response feel too slow and unstable.
- **Why:** The implementation optimized for highlight precision before validating that conversational latency remained the primary UX requirement.
- **Rule:** For live voice surfaces, keep the native low-latency audio path unless the user explicitly accepts slower playback for timing accuracy. Prefer approximate highlight on the realtime stream over adding a second synthesis pass by default.

### 2026-03-15 - Recheck local env/config before hardcoding agent-browser launch overrides
- **What happened:** A code-level `--auto-connect false` override was added to `agent-browser` integrations after runtime failures showed the CLI trying to attach to a debuggable Chrome.
- **Why:** The failure was caused by a user shell export in `~/.zshrc`, not by a repo-level requirement. The code was patched before confirming whether the local environment had already been corrected.
- **Rule:** Before baking environment-specific `agent-browser` launch overrides into repo code, verify whether the behavior comes from user shell config or machine-local defaults and retest after the environment is fixed. Prefer environment correction over permanent repo workarounds when the issue is not repo-owned.

### 2026-03-16 - Do not replace real-agent latency with hardcoded replies when the user is debugging the agent path
- **What happened:** A local fast path for greetings/acknowledgements was added to avoid RovoDev latency on `future-chat`.
- **Why:** The optimization solved perceived slowness, but it bypassed the exact RovoDev path the user wanted to inspect and debug.
- **Rule:** When the user is investigating latency or behavior in the real agent pipeline, do not short-circuit the request with hardcoded/local fallback behavior unless they explicitly ask for that tradeoff.

### 2026-03-16 - Preserve the reference states when matching one visual state to another
- **What happened:** A waveform change flattened `User Speaking` and `AI Speaking` when the request was to make `Idle` inherit their treatment.
- **Why:** The implementation treated the shader as a shared rebalance problem instead of keeping the unchanged states as the visual source of truth.
- **Rule:** When the user asks for one state to match another, leave the reference states untouched and scope the edit to the named target state unless they explicitly ask for a full rebalance.

### 2026-03-17 - Probe versioned API endpoints before concluding a local service lacks support
- **What happened:** Agent-mode support was declared unavailable after checking only the unversioned `/agent-mode` and `/available-modes` paths, even though the running RovoDev Serve exposed the supported endpoints under `/v3/agent-mode` and `/v3/available-modes`.
- **Why:** The investigation anchored too early on one failing path and a backend compatibility response instead of doing endpoint discovery across likely versioned routes.
- **Rule:** When diagnosing local service capability, do not stop at the first 404. Check likely versioned endpoints such as `/v3/*`, compare direct service responses with backend proxy behavior, and verify whether the running backend process may be stale relative to the file on disk.

### 2026-03-18 - Do not reserve action-button space when the user explicitly wants label truncation
- **What happened:** A sidebar thread-row change kept `pr-10` on hover/active/open states to reserve room for the overflow button even after the user said the label should simply truncate under that button.
- **Why:** The implementation optimized for preventing visual overlap instead of following the requested interaction model, which already relied on `truncate` to handle long labels.
- **Rule:** When a user explicitly says an overlaid action is acceptable because text should ellipsize, remove reserved padding entirely and let the existing truncation behavior handle overflow instead of preserving hover or active gutters.

### 2026-03-18 - Do not treat cross-site Atlassian work discovery as data bleed by default
- **What happened:** Cross-site Confluence results were flagged as a likely bug in a last-7-days work summary even though the user expected work to be discoverable across multiple Atlassian sites.
- **Why:** The analysis assumed the prompt should stay strictly site-local instead of checking whether the product intent allowed scattered work across connected sites.
- **Rule:** For work-summary or activity-audit prompts, do not classify multi-site Atlassian results as incorrect by default. First confirm whether the surface is intended to aggregate work across sites, then judge the output against that scope.

### 2026-03-20 - Debug GenUI failures by tracing the full code path, not just the suspected bottleneck
- **What happened:** GenUI cards showed "I couldn't produce a renderable interactive summary" after tool output suppression. The initial plan assumed the two-step GenUI LLM received suppressed text and couldn't generate a spec. Adding `unsuppressedAssistantText` tracking and passing it to the GenUI LLM didn't fix the issue because (1) the existing `extractDirectSpec` already tried to detect the RovoDev agent's spec fence but read from the suppressed `assistantText`, and (2) a fallback code path (`else if (!hasEmittedQuestionCard)`) didn't check `hasEmittedGenuiWidget`, so it overwrote a successfully extracted spec with a failed re-generation.
- **Why:** The plan addressed a plausible but secondary bottleneck without first tracing the actual execution path with debug logging. The real fix was two one-line changes: use unsuppressed text for `extractDirectSpec` and add a `!hasEmittedGenuiWidget` guard on the fallback path.
- **Rule:** Before implementing a multi-step fix for a rendering/routing bug, add targeted debug logging and reproduce the issue to identify which code path is actually executed. Trace from the failure symptom backward through all guard conditions and branching paths, not just the suspected bottleneck.
