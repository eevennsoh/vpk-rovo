# Production Checks

Run these checks after changing the skill, templates, theme, scripts, assets, or
examples:

```bash
node .agents/skills/vpk-html/scripts/ensure-fonts.mjs
node .agents/skills/vpk-html/scripts/build-gallery.mjs
node --test .agents/skills/vpk-html/scripts/test-templates.test.js
pnpm run lint
pnpm run typecheck
```

Routine user renders require:

```bash
node .agents/skills/vpk-html/scripts/render.mjs --input <payload.json>
node .agents/skills/vpk-html/scripts/check-html.mjs docs/html/<slug>.html
```
