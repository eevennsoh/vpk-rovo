# Upgrade Clicky Into A Web Screen Assistant

## Summary

- Build a shared web screen-assistant layer used by both `/studio` and `/rovo`: voice, pointer context, visual cursor cues, self-moving cursor guidance, and paintable screen regions.
- Keep the app powered by the existing `gpt-realtime-2` Realtime WebSocket relay; use `openai/realtime-voice-component` as a reference pattern for app-owned tools, visible confirmation, and controller ownership, not as a package dependency.
- Adapt TipTour's AI pointer experience to the browser app: no macOS permissions, no raw OS/DOM automation, only app-owned actions through existing Rovo/Studio handlers.

## Key Changes

- Create a shared `screen-assistant` subsystem:
	- Move Studio's newer pointer/visible-target/screen-context model into shared types and helpers.
	- Consolidate duplicated Clicky hooks/components from `components/projects/rovo` and `components/projects/studio` into shared hooks/components, with route-specific adapters for labels, target metadata, and allowed actions.
	- Port Studio's structured `screen_assistant_result` behavior back into Rovo so both surfaces support target grounding instead of legacy `[POINT:x,y:label]` only.

- Rework voice and cursor ownership:
	- Decouple `visualCursorEnabled` from `screenAssistantEnabled`; voice can still use pointer/region/app actions when the visual cursor is off.
	- Do not disconnect an existing voice session when the AI cursor is turned off.
	- Include pointer position, visible targets, active panel/context, and optional painted region in the next Realtime turn.

- Replace the Clicky Claude detour with Realtime-driven screen assistance:
	- Send screenshot and structured screen context to `gpt-realtime-2`.
	- Add app-owned Realtime tools for `show_screen_cue`, `set_composer_text`, `submit_composer`, `apply_agent_draft_patch` where supported, and `delegate_to_rovo`.
	- Add generic client tool-result plumbing so the browser executes allowed actions and sends `function_call_output` back through the relay.

- Add paint-region UX:
	- Add a paint/region button beside the AI cursor control in the composer.
	- When active, the next drag paints a visible freeform region; store path points, viewport bounding box, screenshot-relative box, and target hints under or near the region.
	- Keep the region highlighted until the next region is painted, Escape clears it, or voice/tool action clears it.

## Interfaces

- Add shared types:
	- `ScreenAssistantSnapshot`: route, active panel, composer state, pointer context, visible targets, optional region, route-specific domain context.
	- `ScreenAssistantRegion`: path points, viewport rect, screenshot rect, label, createdAt.
	- `ScreenAssistantTarget`: id, fieldId, label, role, rect.
	- `ScreenAssistantAction`: whitelisted app actions only, never raw DOM click/type.
	- `ScreenAssistantAdapter`: route-owned methods for `getSnapshot()`, `groundTarget()`, and `executeAction()`.

- Extend Realtime client/server protocol:
	- Client to server: `function_call_output`.
	- Server to client: generic `function_call` remains, plus route-safe screen-assistant tool calls.
	- Preserve legacy `clicky_text_completed` and `[POINT]` parsing temporarily for backward compatibility during migration.

## Test Plan

- Unit tests:
	- Backend Realtime tool schema, `function_call_output` forwarding, and legacy POINT fallback.
	- Shared screen-assistant coordinate mapping, region bounding, target grounding, and adapter action filtering.
	- Rovo and Studio hooks: turning off visual cursor does not kill voice; paint region appears in the next snapshot.

- Browser verification:
	- In `/studio` and `/rovo`, enable AI cursor, speak while pointing at a UI area, and verify Realtime receives pointer context.
	- Paint a region, ask a voice question about "this," and verify the region is included and visually retained.
	- Ask the assistant to direct attention to a visible control and verify the cursor flies to the grounded target.
	- Turn off AI cursor and verify voice-only can still set/submit composer text or delegate through app-owned handlers.

- Standard checks:
	- `pnpm run lint`
	- `pnpm run typecheck`
	- Targeted `node --test` files for backend Realtime and new shared screen-assistant helpers.

## Assumptions

- "Perform actions" means app-owned Rovo/Studio actions only: no raw DOM `click()`, no browser automation, no OS-level control.
- The first implementation covers `/studio` and `/rovo`; other demos can adopt the shared adapter later.
- The OpenAI reference is used architecturally, not vendored, because the current repo already owns a custom Realtime relay/audio stack.
