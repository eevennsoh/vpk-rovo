# Tool Icon Mapping Plan

## Goal
Create a provider-aware icon registry for RovoDev thinking/tool UIs that:

1. Prefers known provider logos when the tool source is known.
2. Uses exact Atlaskit icon components for native/built-in RovoDev tools.
3. Uses `public/3p/*` logos for third-party MCP providers.
4. Uses the existing VPK icon treatment for Atlassian 1P providers.
5. Falls back to the existing generic wrench icon for unknown tools.

This plan is grounded in ADS MCP icon inventory and intentionally assigns **one distinct native icon per mapped tool** without reusing the same icon twice.

## Resolution Strategy

Apply icon resolution in this order:

### 1. Provider/logo first
- If the tool is associated with a known third-party MCP provider, use the corresponding logo from `public/3p/<provider>/<size>.svg`.
- If the tool is associated with a known Atlassian 1P provider or product surface, use the **existing VPK icon treatment** via current logo primitives.

### 2. Exact native tool mapping second
- If no provider logo applies, map native RovoDev tools to exact Atlaskit icon components.
- Native tool-name mapping should be exact-name based, not fuzzy category based.

### 3. Optional generic type mapping third
- Only add generic MCP-type mappings later if they are clearly more informative than fallback and do not conflict with provider/logo precedence.
- This is not required for the first implementation pass.

### 4. Fallback last
- Unknown or unmapped tools should keep using the current generic wrench icon.

## Native Tool Mapping Plan
Map built-in/native RovoDev tools to exact Atlaskit icon components.

> These picks come from ADS MCP results and are intentionally unique across this native tool list.

### Human interaction
- `ask_user_questions` → `QuestionCircleIcon` (`@atlaskit/icon/core/question-circle`)

### Planning / orchestration
- `create_technical_plan` → `RoadmapIcon` (`@atlaskit/icon/core/roadmap`)
- `exit_plan_mode` → `DiagramSymbolTerminatorIcon` (`@atlaskit/icon-lab/core/diagram-symbol-terminator`)
- `update_todo` → `TaskToDoIcon` (`@atlaskit/icon/core/task-to-do`)
- `invoke_subagents` → `AiAgentIcon` (`@atlaskit/icon/core/ai-agent`)
- `get_skill` → `SkillIcon` (`@atlaskit/icon-lab/core/skill`)

### Inspect / search
- `open_files` → `FolderSharedIcon` (`@atlaskit/icon-lab/core/folder-shared`)
- `expand_code_chunks` → `DiagramSymbolFrontendIcon` (`@atlaskit/icon-lab/core/diagram-symbol-frontend`)
- `grep` → `SearchIcon` (`@atlaskit/icon/core/search`)
- `expand_folder` → `FolderClosedIcon` (`@atlaskit/icon/core/folder-closed`)

### Modify files/code
- `create_file` → `FileIcon` (`@atlaskit/icon/core/file`)
- `move_file` → `TableRowMoveDownIcon` (`@atlaskit/icon/core/table-row-move-down`)
- `find_and_replace_code` → `AngleBracketsIcon` (`@atlaskit/icon/core/angle-brackets`)
- `delete_file` → `DeleteIcon` (`@atlaskit/icon/core/delete`)

### Execute / permissions
- `bash` → `TerminalIcon` (`@atlaskit/icon-lab/core/terminal`)
- `powershell` → `AiComputeIcon` (`@atlaskit/icon-lab/core/ai-compute`)
- `update_allowed_external_paths` → `ShieldIcon` (`@atlaskit/icon/core/shield`)

## Registry Design
Use a **JSON-shaped TypeScript registry** plus a shared resolver.

### Why
Exact React icon components are not JSON-serializable, and not every surface can consume only `ComponentType<NewCoreIconProps>`. The registry should therefore store metadata and symbolic identifiers rather than raw JSX.

### Proposed registry layers
1. **Exact tool-name mappings**
   - Native tools keyed by exact tool name.
2. **Provider aliases**
   - Normalize MCP/server identifiers to a canonical provider key.
3. **Logo metadata**
   - Third-party logo path and sizing metadata for `public/3p/*`.
4. **Atlassian 1P classification**
   - Explicit mapping for Atlassian-owned providers/tools to VPK branding.
5. **Fallback metadata**
   - Generic wrench icon for anything unresolved.

## Resolver Design
Create one shared resolver that returns render-ready metadata such as:
- normalized tool name
- normalized provider/server
- icon kind (`atlaskit-icon`, `third-party-logo`, `vpk-logo`, `fallback`)
- Atlaskit icon identifier or logo metadata
- accessible label text

The resolver should be **UI-agnostic**. It should return metadata, not JSX, so each consumer can adapt the result to its rendering constraints.

## Chain-of-Thought Integration
This work needs to integrate cleanly with `components/ui-ai/chain-of-thought.tsx`.

### Current implementation facts
- `ChainOfThoughtStep` currently accepts `icon?: ComponentType<NewCoreIconProps>`.
- This works for simple Atlaskit icons, but not for provider logos or VPK-branded render output.
- `components/projects/rovo-app/components/rovo-app-messages.tsx` currently renders tool-call steps using a single generic `StepToolIcon`.

### Required integration approach
Add a small renderable icon slot to `ChainOfThoughtStep` so tool-call rows can render:
- Atlaskit icon components,
- third-party provider logos,
- existing VPK / Atlassian branding,
- fallback wrench.

The existing `icon?: ComponentType<NewCoreIconProps>` prop should remain for simple callers and demo usage. The new slot should be additive so current non-tool consumers do not need to change.

### Recommended contract direction
Use a shared resolver that returns metadata, then adapt that metadata in the chain-of-thought surface into either:
- a standard Atlaskit icon component render, or
- a custom renderable/logo node via existing icon/logo primitives.

This avoids forcing provider/logo cases through the icon-component-only path.

## Integration Points
Apply the same shared resolver in both demo and production surfaces so behavior stays consistent.

### Primary targets
- `components/ui-ai/chain-of-thought.tsx`
- `components/projects/rovo-app/components/rovo-app-messages.tsx`
- shared standalone tool rendering under `components/projects/shared/thread-message/*`
- existing icon/logo primitives in:
  - `components/ui/icon.tsx`
  - `components/ui/logo.tsx`

## Provider Rules

### Third-party MCP tools
If the source provider is known and exists in `public/3p`, use that logo first.

Examples:
- Google Drive → `/3p/google-drive/...`
- Gmail → `/3p/gmail/...`
- Slack → `/3p/slack/...`
- GitHub → `/3p/github/...`

### Atlassian 1P tools/providers
If the tool is from an Atlassian-owned provider/surface, use the **existing VPK icon treatment** instead of a generic functional icon.

Examples:
- Atlassian project/goal/team/tenant
- Jira/Confluence/Compass/Teamwork Graph (where appropriate in the normalized provider layer)

## Validation Checklist
- Native built-in tools resolve to the intended exact Atlaskit icon identifiers.
- No duplicate icon assignment exists across the native tool mapping list.
- Third-party MCP providers resolve to the correct `public/3p` logo.
- Atlassian 1P providers resolve to the VPK icon treatment.
- Unknown tools still render the generic wrench icon.
- Demo and production thinking/tool-card surfaces use the same shared resolver.
- Rovo App tool-call rows no longer rely on a single generic `StepToolIcon` when a more specific resolved icon is available.
- `ChainOfThoughtStep` can render both icon-component and logo-style resolved outputs.

## Deliverable Shape
Implementation should produce:
1. a shared registry module,
2. a shared resolver function that returns metadata,
3. UI wiring in chain-of-thought and standalone tool cards,
4. a small additive `ChainOfThoughtStep` icon API update,
5. tests covering native, 3P, Atlassian 1P, and fallback cases.
