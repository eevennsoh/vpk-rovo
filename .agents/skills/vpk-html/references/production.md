# Production Checks

Run these checks after changing the skill, templates, theme, scripts, assets, or
examples:

```bash
node .agents/skills/vpk-html/scripts/ensure-fonts.mjs
node .agents/skills/vpk-html/scripts/build.mjs --sync
node .agents/skills/vpk-html/scripts/build.mjs --check-templates
pnpm run lint
pnpm run typecheck
```

When changing the shared color/font contract, edit `references/tokens.json`,
then regenerate and check the mirrored CSS:

```bash
node .agents/skills/vpk-html/scripts/build.mjs --write-styles
node .agents/skills/vpk-html/scripts/build.mjs --sync
```

Do not hand-edit token copies into individual demos or templates. Port scripts
should import `scripts/shared.mjs` and inline the shared block, font stacks, and
Kami-to-VPK color map from there.

Routine user renders require:

```bash
node .agents/skills/vpk-html/scripts/build.mjs --check-placeholders docs/html/<slug>.html
node .agents/skills/vpk-html/scripts/build.mjs --verify docs/html/<slug>.html
node .agents/skills/vpk-html/scripts/check-html.mjs docs/html/<slug>.html
```
