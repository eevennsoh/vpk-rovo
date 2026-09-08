---
name: vpk-tunnel
description: "Share a live VPK localhost prototype with external participants through a public Atlas Tunnel URL. Hides the react-grab development control on public tunnel hosts. Use when the user says \"vpk-tunnel\", \"share my prototype\", \"make this localhost link public\", \"send a customer a prototype link\", or asks to start, inspect, or stop an Atlas Tunnel for a VPK Portless URL."
purpose: Expose one live VPK Portless frontend through a scoped, short-lived public Atlas Tunnel.
owner: VPK
category: workflow
inputs: Optional Portless URL and action (start, status, or stop).
outputs: Public prototype URL, local source URL, tunnel status, or a targeted shutdown result.
required_tools: shell, node, pnpm, atlas, cloudflared, tmux
validation_command: node --test .agents/skills/vpk-tunnel/scripts/vpk-tunnel.test.js
generated_artifacts: None. Runtime state is limited to a target-scoped tmux session.
common_failure_modes: Local prototype is unresponsive, Portless URL is stale, Atlas Tunnel or cloudflared is missing, the catalog root was shared instead of the project route, Next.js blocked Atlas Tunnel hosts in allowedDevOrigins, or the react-grab development control is still visible on the public URL.
---

# VPK Tunnel

Share a live VPK prototype with an external participant through Atlas Tunnel.
This workflow is for short research sessions, feedback rounds, and live reviews;
it is not production or long-term hosting.

## Interface

```text
vpk-tunnel
vpk-tunnel https://feature.vpk-rovo.localhost/path
vpk-tunnel status [Portless URL]
vpk-tunnel stop [Portless URL]
```

With no URL, target `https://vpk-rovo.localhost`. This is the persistent main
worktree's stable Portless hostname, regardless of which Git branch that
checkout currently has checked out. A supplied Portless URL selects another
live frontend. Preserve its path, query, and fragment in the public link.

## Share the route people should open

The catalog homepage (`/`) embeds project cards in iframes. Those previews look
empty on a public tunnel even when the real project works. Do not hand reviewers
the catalog unless they explicitly asked for it.

- If the user named a project or path, share that route
  (for example `/jira-golden-journeys-v4`), not `/` or `/preview/projects/...`.
- If `vpk-tunnel` is invoked with no path, resolve the hostname, then ask which
  route people should open before starting. Do not infer the catalog.
- After resolve, `isCatalogRoot: true` means you still need a share path.

## Public-sharing boundary

Atlas Tunnel makes the selected local application reachable from the public
internet. Invoking this skill or manually running `vpk-tunnel <Portless URL>`
authorizes public sharing for that prototype. Do not ask for a separate
synthetic-data or fake-data confirmation, and do not require an additional
confirmation flag. Always show the exact local URL before starting through an
agent workflow.

## One-time setup

The helper checks dependencies but does not install or upgrade them. If its
preflight reports missing Atlas Tunnel or `cloudflared`, ask before making any
machine-level change, then use the relevant commands:

```bash
atlas upgrade
atlas plugin install --name tunnel
brew install cloudflared
```

## Start

1. Run `pnpm ports once` so the user can see the live worktrees and Portless
   URLs. If a custom URL was supplied, require an exact hostname match in that
   inventory.
2. Resolve the target without exposing it:

   ```bash
   node .agents/skills/vpk-tunnel/scripts/vpk-tunnel.js resolve [Portless URL]
   ```

3. If resolution or the HTTP health probe fails, do not start a tunnel. Explain
   whether the prototype must be started, its route fixed, or its Portless URL
   corrected. Use `pnpm run dev:tmux:start` in the owning worktree only when the
   user asks to start it.
4. If resolve reports `isCatalogRoot: true` and the user named a project or
   screen, switch the target to that path and resolve again. If they did not
   name one, ask before continuing.
5. Show the resolved local URL. Invocation of this skill already authorizes
   public sharing; do not ask a synthetic-data or fake-data confirmation
   question.
6. Start the scoped tunnel:

   ```bash
   vpk-tunnel [Portless URL]
   ```

   The helper refuses to start when `next.config.ts` `allowedDevOrigins` is
   missing `*.public.atlastunnel.com` and `*.atlastunnel.com`. Add those hosts,
   restart that worktree's frontend, re-resolve (the port may change), then
   start again. Do not leave a tunnel bound to the previous port.

   Atlas commands may need permission to write their machine-local cache or use
   the network. Request that permission through the active tool rather than
   weakening the preflight.
7. Open the returned `publicUrl` and confirm it is not a blank shell. Body text
   that is only `Skip to content` means Next.js blocked `/_next` chunks from the
   tunnel host. HTTP 200 is not enough. Also confirm the react-grab development
   control is hidden — the floating cursor/chevron pill and any
   `[data-react-grab]` or `[data-react-grab-toolbar]` nodes. Atlas Tunnel hosts
   skip that tooling automatically. Do not hide it with injected CSS or by
   clicking the pill. Do not hand off the link until the intended UI is visible
   and that control is gone.
8. Report the returned `publicUrl` as the shareable link and include the
   `localUrl`. State that the link works only while the local server, scoped
   tunnel session, laptop, and network connection remain active.

The helper runs the canonical command in a hostname-scoped tmux session:

```bash
atlas tunnel start --port <resolved-frontend-port> --public
```

Starting the same hostname again reuses its existing tunnel. Different paths
on that hostname share one tunnel but receive path-specific public links.

Public Atlas Tunnel hosts automatically hide the react-grab development
control. Local Portless URLs keep it for development.

## Status and stop

Inspect only the selected hostname's tunnel:

```bash
node .agents/skills/vpk-tunnel/scripts/vpk-tunnel.js status [Portless URL]
```

Stop only that hostname's tunnel:

```bash
node .agents/skills/vpk-tunnel/scripts/vpk-tunnel.js stop [Portless URL]
```

Never use `atlas tunnel clean`: it deletes every Atlas Tunnel created by the
CLI and can disrupt unrelated prototype sessions. Do not stop the VPK dev
server unless the user separately asks for it, or `allowedDevOrigins` must
change. After any frontend restart, re-resolve and start the tunnel again.

## Troubleshooting

- **Unknown Portless URL:** run `pnpm ports once` and use an exact listed URL.
- **Recorded route but dead port:** start or repair that worktree's frontend.
- **HTTP probe times out or returns an error:** open the local route and fix it
  before exposing it; port liveness alone is not enough.
- **Public page is blank / catalog cards are empty white boxes:** Next.js
  blocked `/_next` chunks from the Atlas Tunnel host. Confirm
  `allowedDevOrigins` includes `*.public.atlastunnel.com` and
  `*.atlastunnel.com`, restart the owning frontend, re-resolve, then start
  again. Check `.next/dev/logs/next-development.log` for
  `Blocked cross-origin request` if the page is still empty.
- **Shared the homepage and it looks empty:** share the project route
  (for example `/jira-golden-journeys-v4`), not the catalog iframe.
- **Public page still shows the react-grab control:** Atlas Tunnel hosts skip
  `DevReactGrabMount`. Hard-refresh the public URL. If the floating
  cursor/chevron pill remains, the frontend may be serving a stale bundle —
  restart that worktree's frontend, re-resolve, then start again.
- **Frontend restarted and the tunnel died:** the frontend port likely
  changed. Re-resolve, then start again. The helper replaces a session whose
  stored port no longer matches.
- **Missing Atlas Tunnel plugin:** run the one-time Atlas commands after user
  approval, then retry.
- **Missing `cloudflared`:** install it with Homebrew after user approval.
- **Tunnel session exists but has no public URL:** inspect `status`; if Atlas
  exited or authentication failed, stop the scoped session and retry after
  fixing the reported error.

## Report format

For a successful start, keep the handoff compact:

```text
Public link: <public URL>
Local source: <Portless URL>
Status: Live while the local server, tunnel, laptop, and network stay running.
Stop: vpk-tunnel stop <Portless URL>
```
