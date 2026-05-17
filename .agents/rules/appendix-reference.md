---
description: Directory structure, env vars, provider reference, skills catalog, team workflow, validation checklists
globs: backend/**, app/contexts/**, app/providers.tsx, .agents/skills/**
alwaysApply: false
paths:
  - "backend/**"
  - "app/contexts/**"
  - "app/providers.tsx"
  - ".agents/skills/**"
---

# Appendix

## Detailed Directory Structure

```text
app/
  api/                         # Dev-only proxy routes
  components/                  # Component docs routes
  contexts/                    # React Context providers
  data/                        # Component/example data files
  hooks/                       # App-level hooks
  preview/                     # Component preview routes (blocks, projects)
  providers.tsx                # Client-side provider composition
  [category]/page.tsx          # Category landing routes (ui, ui-ai, blocks, projects)
  [page routes]/               # plan/, make/, confluence/, fullscreen-chat/, jira/, search/, sidebar-chat/
  layout.tsx                   # Root layout (server component)

backend/
  server.js                    # Express server (production runtime)
  lib/                         # Backend utilities
    rovodev-gateway.js         # RovoDev Serve streaming/text bridge
    rovodev-client.js          # Low-level V3 REST + SSE client for rovodev serve
    rovodev-pool.js            # Port pool manager for concurrent RovoDev sessions
    rovodev-port-assignment.js # Deterministic panel-to-port mapping
    rovodev-port-recovery.js   # Graceful restart for stuck RovoDev instances
    orchestrator-log.js        # Cross-panel activity log (JSONL persistence)
    question-card-extractor.js # Extracts clarification cards from assistant responses
    smart-audio-routing.js     # Audio generation intent routing
    dag-inference.js           # DAG inference for task dependencies
    genui-chat-handler.js      # Generative UI chat handler
    planning-intent.js         # Planning intent detection
    team-run-lanes.js          # Team run lane management
    ticket-classifier.js       # Ticket classification
    smart-image-routing.js     # Image generation intent routing

components/
  projects/                    # ADS-themed feature surfaces
    confluence/                # Document editing
    dashboard/                 # Dashboard view
    fullscreen-chat/           # Full-screen AI chat
    jira/                      # Kanban board
    make/                      # Make/creation interface
    plan/                      # Agent team interface
    search/                    # Search results
    sidebar-chat/              # Chat with sidebar
    work-items/                # Work items management
    shared/                    # Shared project utilities (ThreadMessage compound component, message processing)
  ui-ai/                       # AI element components (TS excluded)
  blocks/                      # Block features
    chat/                      # ADS-themed chat block
    chat-composer/             # ADS-themed chat composer block
  charts/                      # Chart components
  hooks/                       # Shared reusable hooks
  ui/                          # Shared UI primitives
  utils/                       # Utility components
  website/                     # Component docs/demo site

hooks/                         # Root-level shared hooks
lib/                           # Shared utilities (tokens, api-config, utils, rovo-suggestions, rovo-ui-messages, make-run-types, make-config-types, sprint-board-types)
rovo/                          # AI config
scripts/                       # Dev scripts
types/                         # TS declarations

public/
  1p/                          # First-party product logos (e.g. rovo.svg)
  3p/                          # Third-party integration logos (e.g. slack.svg, google-drive.svg)
  avatar-agent/                # Agent avatar variants
  avatar-human/                # Human avatar variants
  avatar-project/              # Project avatar variants
  avatar-user/                 # User avatar variants
  illustration/                # ADS rich-icon illustrations (gesture + standard variants)
  illustration-ai/             # AI-themed illustrations with light/dark variants
  illustration-spot/           # Spot illustrations

.agents/                       # Canonical source (rules, skills, agents, docs, hooks)
.cursor/                       # Cursor config (symlinks to .agents/)
.claude/                       # Claude config (symlinks to .agents/)
.codex/                        # Codex config (symlinks to .agents/)
.rovodev/                      # RovoDev config (symlinks to .agents/)
```

## Environment Variables

**Hybrid chat mode** — AI Gateway-backed chat requires AI Gateway credentials, while RovoDev-selected flows require RovoDev Serve plus the session token printed by `pnpm run rovodev`.

Optional environment variables:

- `DEBUG=true` - Enable verbose logging
- `PORT=8080` - Backend server port
- `BACKEND_URL=http://localhost:8080` - Backend URL for frontend
- `ROVODEV_PORT` - RovoDev Serve port (auto-set by `pnpm run rovodev`; do not set manually)
- `ROVODEV_POOL_SIZE=1` - Number of RovoDev Serve instances in pool (default 1; set `pnpm run rovodev -- 6` for full pool)
- `ROVODEV_FORCE_CLEAN_START=true` - Kill all existing RovoDev instances before starting
- `AI_GATEWAY_URL`, `AI_GATEWAY_URL_GOOGLE`, `AI_GATEWAY_USE_CASE_ID`, `AI_GATEWAY_CLOUD_ID`, `AI_GATEWAY_USER_ID`, `ASAP_*` - Configure AI Gateway-backed chat, image, sound, suggestions, and Realtime voice routes
- `NEXT_PUBLIC_API_URL` - API URL for production builds

## Provider Reference

| Context         | File                                       | Purpose                                             |
| --------------- | ------------------------------------------ | --------------------------------------------------- |
| Rovo chat       | `app/contexts/context-rovo-chat.tsx`       | AI chat via AI SDK `useChat` with streaming/widgets |
| Creation mode   | `app/contexts/context-creation-mode.tsx`   | Creation mode state                                 |
| Sidebar         | `app/contexts/context-sidebar.tsx`         | Sidebar visibility and route                        |
| Agents team     | `app/contexts/context-plan.tsx`            | Agent team State/Actions/Meta (route-level mount)   |
| Make            | `app/contexts/context-make.tsx`            | Make/creation mode state and actions                |
| Work item modal | `app/contexts/context-work-item-modal.tsx` | Work item detail modal using State/Actions/Meta     |
| Theme           | `components/utils/theme-wrapper.tsx`       | Light/dark/system mode                              |

## Skills Catalog

| Skill        | Command             | Type     | Purpose                                               |
| ------------ | ------------------- | -------- | ----------------------------------------------------- |
| Setup        | `/vpk-setup`        | Workflow | Interactive setup: asks mode (Both/RovoDev/AI Gateway), credentials, dev servers |
| Deploy       | `/vpk-deploy`       | Workflow | Deploy to Atlassian Micros                            |
| Design       | `/vpk-design`       | Workflow | Figma to VPK implementation with validation           |
| Tidy         | `/vpk-tidy`         | Utility  | Refactor React components for reusability             |
| Component    | `/vpk-component`    | Utility  | Map ADS components to VPK equivalents                 |
| Component Ext | `/vpk-component-ext` | Utility  | Migrate custom AI components to ui-ai                 |
| Agent Creator | `/agent-creator`   | Workflow | Create or update repo-local Markdown agents           |

Symphony worker skills:

- `/linear`: raw Linear GraphQL via Symphony's injected `linear_graphql` tool.
- `/commit`, `/pull`, `/push`, `/land`, `/debug`: upstream Symphony workflow
  helpers customized for this repo.

Figma pipeline agents:

- `vpk-agent-extractor` (haiku)
- `vpk-agent-implementer` (opus)
- `vpk-agent-validator` (haiku)

## Agent Team Workflow Reference

Recommended role ownership:

| Phase     | Role                                     | Owns                              | Purpose                                  |
| --------- | ---------------------------------------- | --------------------------------- | ---------------------------------------- |
| Explore   | Explorer                                 | Read-only investigation           | Find patterns and scope files            |
| Implement | Frontend/Backend/Token/Docs implementers | Distinct file sets                | Deliver changes without conflicts        |
| Test      | Tester                                   | Validation tools + browser checks | Verify lint, type, visual, and a11y      |
| Tidy      | General-purpose agent + `/vpk-tidy` skill | Modified implementation files     | Enforce architecture and maintainability |

Team rules:

- Start with exploration
- Do not assign the same file to multiple implementers
- Tester reports issues back; does not apply fixes
- Run tidy last after validation passes

## Validation Template

Use this checklist in PR descriptions:

```markdown
## Validation

- [ ] ESLint passed (`pnpm run lint`)
- [ ] TypeScript passed (`pnpm run typecheck`)
- [ ] Design token usage verified
- [ ] Imports resolved correctly
- [ ] Visual checks completed in light and dark mode
- [ ] Accessibility checks passed
```

## UI Verification Checklist

- [ ] Theme coverage (light + dark)
- [ ] State coverage (default, hover, active, disabled, empty, error)
- [ ] Content edge cases (long text, missing optional data, empty lists)
- [ ] Accessibility (semantic HTML, keyboard support, a11y analysis tools)
- [ ] Responsive behavior at narrow viewport widths
