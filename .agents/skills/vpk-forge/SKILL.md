---
name: vpk-forge
description: Create, deploy, install, and troubleshoot Atlassian Forge apps with bundled helper scripts and current Forge documentation. Use when Codex needs to scaffold a Forge app, choose a Forge template or module, configure Forge CLI prerequisites, discover developer spaces, deploy or install on Jira or Confluence, or debug Forge create or deploy failures.
---

# VPK Forge

## Apply These Rules

- Use `forge create` to scaffold apps so Forge assigns a valid app ID.
- Do not manually recreate the scaffold when `forge create` fails.
- Stop and hand the exact command back to the user if Forge requires an interactive terminal.
- Keep API tokens out of chat. Direct the user to run `forge login` in their own terminal.
- Ask the user to choose when multiple developer spaces or install targets exist.
- Ask the user for the Atlassian site URL before install. Do not try to infer it.
- Enable `view.theme.enable()` in Custom UI entry points before rendering so `--ds-*` tokens are injected.

## Use Current Forge Docs

- Call `forge-development-guide` for prerequisites, CLI usage, deployment flow, and debugging.
- Call `list-forge-modules` to enumerate current modules by product.
- Call `search-forge-docs` to map a requested module to the correct template or configuration.
- Call `forge-ui-kit-developer-guide`, `forge-backend-developer-guide`, and `forge-app-manifest-guide` while customizing generated code.
- Call `confluence-macro-developer-guide` or `jira-service-management-assets-guide` when the request is product-specific.

## Run The Workflow

1. Verify prerequisites.
   Call `forge-development-guide`, then run `node -v`, `forge --version`, and `forge whoami`.
   Install Node.js first, then `@forge/cli`, then have the user run `forge login` in their own terminal if authentication is missing.

2. Discover developer spaces.
   Run bundled scripts from this skill directory. Use `python3` on macOS if `python` is unavailable.

   ```bash
   python3 -m scripts.get_dev_spaces --json
   ```

   Ask the user to choose if multiple spaces are returned.

3. Choose and validate the template.
   Use `list-forge-modules` plus `search-forge-docs` to map the requested module to a template.
   Validate the template before creation.

   ```bash
   python3 -m scripts.list_templates --validate <template>
   ```

   List all templates when the user has not picked one yet.

   ```bash
   python3 -m scripts.list_templates --list
   ```

4. Create the app with `forge create`.
   Remember that `--directory` is the parent directory, not the final app directory.

   ```bash
   python3 -m scripts.create_forge_app \
     --template <template> \
     --name <app-name> \
     --dev-space-id <selected-id> \
     --directory <parent-directory>
   ```

5. Customize the generated app.
   Run `npm install` in the new app directory, then use the Forge docs tools above to implement the requested module, manifest, frontend, or resolver changes.

6. Enable theming for Custom UI.
   Add `view.theme.enable()` before rendering so Forge injects the current Atlassian theme tokens into the iframe.

   ```js
   import { view } from "@forge/bridge";

   view.theme.enable();
   ```

   Do not add this for UI Kit apps.

7. Deploy and install.
   Ask for the Atlassian site URL before install.

   ```bash
   python3 -m scripts.deploy_forge_app \
     --app-dir <app-directory> \
     --site <site-url> \
     --product <jira|confluence>
   ```

   Manual fallback:

   ```bash
   forge deploy --non-interactive -e development
   forge install --site <site-url> --product <Jira|Confluence|Bitbucket> --environment development --confirm-scopes --non-interactive
   ```

   Add `--upgrade` when scopes changed on an existing install.

8. Handle failures explicitly.
   If Forge reports that prompts cannot be rendered, stop and hand the `forge create` command back to the user.
   If no developer spaces exist, direct the user to `https://developer.atlassian.com/console/`.
   If the target directory already exists, explain that `--directory` points to the parent folder.
   If authentication fails, direct the user to `https://id.atlassian.com/manage/api-tokens` and then `forge login` in their own terminal.

## Scripts

| Script                          | Purpose                                                                |
| ------------------------------- | ---------------------------------------------------------------------- |
| - `scripts/get_dev_spaces.py`   | Discover developer spaces via GraphQL API.                             |
| - `scripts/create_forge_app.py` | Create an app after template validation and developer space selection. |
| - `scripts/list_templates.py`   | Fetch, list, and validate official Forge templates.                    |
| - `scripts/deploy_forge_app.py` | Run prerequisite checks, install dependencies, deploy, and install.    |

## Troubleshooting

- Use `forge-development-guide` for deeper CLI errors and debugging patterns.
- Check `forge logs -e development --limit 50` when the app installs but does not behave correctly.
- Run `forge lint` before deploy if the manifest or scopes changed.
- Reinstall with `--upgrade` when new scopes are introduced.
- Fix unstyled Custom UI apps by adding `view.theme.enable()` before rendering.
