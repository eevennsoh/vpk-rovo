# Workflows (Extended)

## Build and Run

- Build: `pnpm run build`
- Build for production (static export): `NEXT_OUTPUT=export pnpm run build`
- Start frontend + backend locally: `pnpm run dev`

## Deployment

Preferred path:

- `/vpk-deploy`

Direct scripts:

- `./.cursor/skills/vpk-deploy/scripts/deploy.sh <service> <version> [env]`
- `./.cursor/skills/vpk-deploy/scripts/deploy-check.sh`
- `pnpm run deploy:micros`

Before first deployment:

1. Update `service-descriptor.yml` with your service name
2. Replace `YOUR-SERVICE-NAME`
3. Keep service name <= 26 chars, lowercase + hyphens

## Validation

There is no single `pnpm test` script. Run targeted `node --test` files or
`pnpm exec playwright test <spec>` for touched behavior, and keep observational
checks for UI changes.

Run on every change:

1. `pnpm run lint`
2. `pnpm run typecheck`

Run additionally for UI changes:

1. Visual checks via `/agent-browser` (`npx agent-browser`) — the standard tool for browser automation, screenshots, and snapshots
2. Accessibility checks:
   - `ads_analyze_a11y` for component code
   - `ads_analyze_localhost_a11y` for live page

Required UI verification coverage:

- Light and dark theme coverage
- Default, hover, active, disabled, empty, and error states
- Long text / missing optional data / empty-list edge cases
- Keyboard and semantic accessibility
- Responsive behavior on narrow viewport

Keep verification observable:

- Read lint/typecheck output directly
- Inspect browser snapshots/screenshots directly
- Monitor dev server logs for runtime/compile errors
