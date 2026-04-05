# VPK (Venn Prototype Kit)

Next.js 16 + Express backend with RovoDev Serve for primary chat and AI Gateway
for explicit helper and media routes, deployable to Atlassian Micros.

## Architecture

This project uses a dual-mode runtime:

**Local Development (two processes):**

```text
Browser → Next.js (:3000) → app/api/* proxy → Express (:8080) → RovoDev Serve
                                                        ↘ AI Gateway-assisted helper/media routes
```

**Production (single process):**

```text
Browser → Express (:8080) → serves static export + handles /api/* → RovoDev Serve
                                                        ↘ AI Gateway-assisted helper/media routes
```

Both modes use the same `/api/*` relative paths - no code changes needed between environments.

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- ASAP credentials for AI Gateway (see [guide-setup.md](./.cursor/skills/vpk-setup/references/guide-setup.md))

### Installation

```bash
# Install all dependencies (frontend + backend via pnpm workspaces)
pnpm install

# Copy and configure environment
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

### Development

**Option 1: Concurrent (recommended)**

```bash
pnpm run dev
```

**Option 2: Separate terminals**

```bash
# Terminal 1: Backend
pnpm run dev:backend

# Terminal 2: Frontend
pnpm run dev:frontend
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Verify Setup

```bash
curl http://localhost:8080/api/health
```

Should show `"authMethod": "ASAP"` and all env vars as `"SET"`.

## Commands

```bash
# Development
pnpm run dev              # Start frontend (:3000) + backend (:8080)
pnpm run dev:frontend     # Frontend only (Next.js with Turbopack)
pnpm run dev:backend      # Backend only (Express)

# Building
pnpm run build            # Next.js build

# Linting
pnpm run lint             # ESLint

# Deployment
./.cursor/skills/vpk-deploy/scripts/deploy.sh <service> <version> [env]
./.cursor/skills/vpk-deploy/scripts/deploy-check.sh  # Pre-deploy validation

# Utilities
curl http://localhost:8080/api/health     # Health check
lsof -ti:3000,8080 | xargs kill -9        # Kill lingering port processes
```

## Skills

VPK includes AI-assisted skills for common workflows:

| Skill  | Command       | Type     | Purpose                                                       |
| ------ | ------------- | -------- | ------------------------------------------------------------- |
| Setup  | `/vpk-setup`  | Workflow | Initial setup: ASAP credentials, .env.local, dev servers      |
| Deploy | `/vpk-deploy` | Workflow | Deploy to Atlassian Micros (auto-detects initial vs redeploy) |
| Tidy   | `/vpk-tidy`   | Utility  | Refactor React components for reusability and modularity      |
| Share  | `/vpk-share`  | Utility  | Create GitHub repos with VPK sync, export boilerplate, reset  |
| Sync   | `/vpk-sync`   | Utility  | Sync changes with upstream VPK (pull updates, push via PR)    |

Skills are defined in `.cursor/skills/`.

### Agents

VPK includes specialized AI agents that are invoked proactively:

| Agent | Purpose |
|-------|---------|
| vpk-agent-tidy | React refactoring specialist for code cleanup and modularization |

Agents are defined in `.cursor/agents/`.

## Deployment to Micros

For complete deployment instructions, see [guide-deployment.md](./.cursor/skills/vpk-deploy/references/guide-deployment.md).

**Quick deploy:**

```bash
./.cursor/skills/vpk-deploy/scripts/deploy.sh <service-name> <version>
# Example: ./.cursor/skills/vpk-deploy/scripts/deploy.sh my-prototype 1.0.1
```

**Before first deployment:**

- Update `service-descriptor.yml` with your service name (replace `YOUR-SERVICE-NAME`)
- Service name limit: ≤26 characters, lowercase-with-hyphens

## Project Structure

```
app/                    # Next.js App Router
├── api/                # Dev-only proxy routes (chat-sdk, health)
├── contexts/           # React Context providers
│   ├── context-chat.tsx           # Generic chat panel state
│   ├── context-rovo-chat.tsx      # Rovo AI chat with streaming/widgets
│   ├── context-sidebar.tsx        # Sidebar visibility and route tracking
│   ├── context-system-prompt.tsx  # Custom AI prompt with localStorage
│   └── context-work-item-modal.tsx # Work item detail modal state
├── hooks/              # Custom React hooks
│   └── index.ts                  # Hook exports
├── providers.tsx       # Client-side provider composition
├── [page routes]/      # confluence/, jira/, rovo/, search/, widgets/
└── layout.tsx          # Root layout (server component)

backend/
└── server.js           # Express server (production runtime)

components/
├── blocks/             # Feature blocks (modular structure)
│   ├── layout/         # AppLayout shell (nav + sidebar + content)
│   ├── navigation/     # TopNavigation
│   ├── sidebar/        # Sidebar with product variants
│   ├── confluence/     # Document editing
│   ├── jira/           # Kanban board
│   ├── rovo/           # AI chat (full + panel)
│   ├── search/         # Search results
│   └── widget/         # Embeddable widgets
├── ui/                 # Shared UI primitives
└── utils/              # Utility components (theme-wrapper.tsx)

lib/                    # Shared utilities (api-config.ts, platform-feature-flags.ts)
rovo/                   # AI config (config.js - prompt builder)
scripts/                # Dev scripts (dev-backend.js, dev-frontend.js)
.cursor/                # AI configs (agents, skills)
```

### Block Structure Pattern

Each feature block follows a modular structure:

```
components/blocks/[feature]/
├── page.tsx              # Main container (public API)
├── components/           # Feature-specific sub-components
└── hooks/, data/, lib/   # Optional: hooks, static data, types
```

## Environment Variables

Required in `.env.local`:

```
AI_GATEWAY_URL
AI_GATEWAY_USE_CASE_ID
AI_GATEWAY_CLOUD_ID
AI_GATEWAY_USER_ID
ASAP_PRIVATE_KEY
ASAP_KID
ASAP_ISSUER
```

Optional:

```
DEBUG=true                              # Verbose logging
PORT=8080                               # Backend port
BACKEND_URL=http://localhost:8080       # Backend URL for dev proxy
```

LLM routing behavior:

- Default: RovoDev-first (`pnpm run rovodev` starts a single instance by default; use `pnpm run rovodev --6` for full pool)
- Main chat: `/api/chat-sdk` requires RovoDev Serve and returns `503` if RovoDev is unavailable
- AI Gateway-assisted helper/media tasks: image, sound, suggestions, titles/metadata, and Realtime voice use AI Gateway when configured
- Inspect current routing at `GET /api/health` under `llmRouting`

See [guide-setup.md](./.cursor/skills/vpk-setup/references/guide-setup.md) for detailed credential setup.

## Theming

VPK supports light/dark/system theme modes with localStorage persistence:

- Theme state managed by `ThemeWrapper` at `components/utils/theme-wrapper.tsx`
- Applies `.light`/`.dark` classes on `<html>` and relies on local token aliases in `app/tokens.css`
- Exports: `useTheme()`, `ThemeToggle`, `ThemeSelector`

## Code Style

- **Package manager**: pnpm
- **Indentation**: Tabs
- **Imports**: Use `@/` path alias
- **UI**: shadcn/Base UI-style primitives in `components/ui`, styled with Tailwind + CSS variables
- **Icons**: `lucide-react` + Atlassian product/app logos via `components/ui/logo.tsx` (`@atlaskit/logo`)

## Component Architecture

Components follow mandatory architectural rules:

1. **Modular** - Components <150 lines; split larger ones into sub-components
2. **Logic isolated** - Business logic in custom hooks, components are pure UI
3. **Data decoupled** - Static data (nav items, configs) in separate data files
4. **Type safe** - All components have `Readonly<ComponentNameProps>` interfaces
5. **No boolean props** - Use variants, slots, or compound components

Use the `/vpk-tidy` skill to refactor components following these patterns.

See [AGENTS.md](./AGENTS.md) for detailed architectural guidelines.

## Documentation

- [guide-setup.md](./.cursor/skills/vpk-setup/references/guide-setup.md) - Local development setup with ASAP auth
- [guide-deployment.md](./.cursor/skills/vpk-deploy/references/guide-deployment.md) - Micros deployment guide
- [guide-model-switch.md](./.cursor/skills/vpk-setup/references/guide-model-switch.md) - Switch between Claude and GPT models

## Troubleshooting

**Port already in use:**

```bash
lsof -ti:3000,8080 | xargs kill -9
```

**ASAP_PRIVATE_KEY missing:**

- Ensure `.env.local` exists
- Private key must be quoted and use `\n` for newlines

**AI Gateway 401 errors:**

- Verify ASAP credentials in health check
- Check principal is whitelisted for your use case

For more help, see the troubleshooting sections in [guide-setup.md](./.cursor/skills/vpk-setup/references/guide-setup.md) or [guide-deployment.md](./.cursor/skills/vpk-deploy/references/guide-deployment.md).

**Dev server not starting:**

- Check ports: `lsof -ti:3000,8080`
- Kill processes: `lsof -ti:3000,8080 | xargs kill -9`

**"Cannot find module" errors:**

- Reinstall: `rm -rf node_modules && pnpm install`

**Theme not persisting:**

- Clear localStorage: `localStorage.removeItem('ui-theme')` and refresh
