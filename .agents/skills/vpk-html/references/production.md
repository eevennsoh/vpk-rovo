# Production Checks

Run these checks after changing the skill, templates, theme, scripts, assets, or
examples:

```bash
node .agents/skills/vpk-html/scripts/ensure-fonts.mjs
node .agents/skills/vpk-html/scripts/build.mjs --check-templates
pnpm run lint
pnpm run typecheck
```

Routine user renders require:

```bash
node .agents/skills/vpk-html/scripts/build.mjs --check-placeholders docs/html/<slug>.html
node .agents/skills/vpk-html/scripts/build.mjs --verify docs/html/<slug>.html
node .agents/skills/vpk-html/scripts/check-html.mjs docs/html/<slug>.html
```
