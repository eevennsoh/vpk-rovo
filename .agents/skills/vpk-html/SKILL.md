---
name: vpk-html
description: 'Use only when the user explicitly invokes /vpk-html. Render supplied material into an offline, single-file HTML artifact using the VPK HTML editorial system.'
---

# vpk-html

Use this skill only when the user explicitly invokes `/vpk-html`. Opening a
Markdown file, asking for HTML in natural language, or mentioning documents is
not enough to activate it.

## Workflow

1. Confirm the request contains the exact `/vpk-html` invocation.
2. Extract intent silently: purpose, audience, constraints, success condition.
3. Pick one template from `CHEATSHEET.md` or ask one focused clarifying question
   when multiple templates materially fit.
4. Distill raw material when source notes are unstructured, conflicting,
   incomplete, or need prerequisite ordering.
5. Write a structured JSON render payload.
6. Render with `node .agents/skills/vpk-html/scripts/render.mjs --input <payload.json>`.
7. Validate with `node .agents/skills/vpk-html/scripts/check-html.mjs <output.html>`.
8. For skill, template, theme, script, or asset changes, rebuild examples and run
   `node --test .agents/skills/vpk-html/scripts/test-templates.test.js`.

## Rules

- Default output path is `docs/html/<slug>.html`.
- Never hand-edit final `docs/html/*.html` during normal renders.
- Ask before using `--overwrite`.
- Do not use remote fonts, stylesheets, scripts, images, or runtime assets.
- Escape source HTML by default. Use `trustedHtml` only when the payload and
  template intentionally allow trusted markup.
- Render a visible Sources or Credits section when external research,
  third-party copied/adapted material, or Algebrica-derived material is used.
- Unknown or ambiguous routes do not fall back to a generic template; ask one
  clarifying question.

## Main Commands

```bash
node .agents/skills/vpk-html/scripts/ensure-fonts.mjs
node .agents/skills/vpk-html/scripts/render.mjs --input <payload.json>
node .agents/skills/vpk-html/scripts/check-html.mjs docs/html/<slug>.html
node .agents/skills/vpk-html/scripts/build-gallery.mjs
node --test .agents/skills/vpk-html/scripts/test-templates.test.js
```
