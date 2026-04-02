# Unify generated card visual identity

This plan keeps the existing raw Atlaskit icon inventory intact and focuses on
consolidating semantic icon and logo selection for generated cards. The first
pass unifies generative widget cards and artifact cards under one canonical
visual identity resolver.

## Summary

This section defines the overall direction for the refactor and what stays out
of scope in the first pass.

- Keep `components/projects/shared/components/icon-registry.tsx` as the only
  raw runtime icon inventory.
- Do not introduce a second registry and do not upgrade Atlaskit packages in
  this pass.
- Promote `components/projects/shared/lib/visual-identity.ts` into the
  canonical semantic resolver for generated-card identity.
- Preserve current outer precedence for generated cards: explicit external
  `logoSrc` first, inferred Atlassian 1p logo next when the source or product
  name matches a known Atlassian logo, then icon tile fallback.
- Make tile color "random once per artifact" by picking from the 10 subtle
  icon-tile variants via a stable seed so the same plan, task, and artifact
  keep the same color across renders.

## API changes

This section defines the public types and resolver entry points that become the
single source of truth for generated-card identity.

- Add `ResolvedCardIdentity` in
  `components/projects/shared/lib/visual-identity.ts` with these variants:
- `{ kind: "external-logo"; logoSrc: string }`
- `{ kind: "atlassian-logo"; logoName: AtlassianLogoName }`
- `{ kind: "icon-tile"; iconName: string; tileVariant: VisualIdentityTileVariant }`
- Add `resolveGenerativeCardIdentity(input)` and
  `resolveArtifactCardIdentity(input)` as the only public selectors for
  generated-card headers.
- Add `GeneratedCardIdentityInput.identitySeed?: string` and
  `ArtifactCardProps.identitySeed?: string`.
- When `identitySeed` is absent, derive a fallback seed from stable fields such
  as `contentType` or `kind`, title, source name, and description.
- Narrow AI hints from "any installed icon name" to a curated generated-card
  hint set. Keep `iconHint` as input, but only honor it when it resolves
  through the curated catalog.

## Implementation changes

This section groups the concrete code changes needed to centralize behavior
without changing unrelated systems.

- In `components/projects/shared/lib/visual-identity.ts`, add a human-edited
  generated-card semantic catalog keyed by current artifact kinds and
  generative content types.
- For each catalog entry, define the preferred fallback icon, optional allowed
  AI hint aliases, and optional source-name keywords for special cases.
- Introduce `CardIdentityTile` as the shared renderer for
  `ResolvedCardIdentity`. It must render either an external logo image, an
  Atlassian logo component, or an `IconTile`.
- Keep `VisualIdentityTile` as the icon-tile-only primitive used internally.
- Refactor `components/projects/shared/components/content-type-tile.tsx` into a
  thin adapter that builds `GeneratedCardIdentityInput`, calls
  `resolveGenerativeCardIdentity`, and renders `CardIdentityTile` instead of
  owning its own fallback chain.
- Update artifact cards to use `resolveArtifactCardIdentity` plus
  `CardIdentityTile` instead of calling `resolveArtifactVisualIdentity(kind)`
  directly.
- Preserve explicit artifact overrides, but normalize them through the new
  canonical resolver.
- Move current special-case heuristics into the canonical resolver:
- existing content-type mapping
- greeting-suggestion matches
- current artifact-kind defaults
- 1p and 3p source detection
- curated AI hint validation
- Update `backend/lib/genui-system-prompt.js` so the model is offered only the
  curated generated-card icon hint surface, not the full raw installed icon
  list.

## Test plan

This section covers the minimum regression and unit-test surface needed to make
the refactor safe.

- Unit test resolver precedence: external `logoSrc` > inferred Atlassian 1p
  logo > curated AI hint > contextual content or artifact mapping > default
  icon tile.
- Unit test tile-variant stability: the same `identitySeed` always returns the
  same one of the 10 subtle variants, different seeds can vary, and bold
  variants are never used for generated cards.
- Unit test curated hint behavior: allowed hints resolve, unknown or disallowed
  hints are ignored, and fallback resolution still returns a valid
  `ResolvedCardIdentity`.
- Regression test generative widget cards for `translation`, `calendar`,
  `message`, `work-item`, `page`, `code`, `image`, `video`, `table`, and `ui`.
- Regression test artifact cards for `text`, `code`, `image`, `sheet`, and
  `react`, including explicit override behavior.
- Smoke test unchanged scope: plan widgets and tool or provider icon rendering
  keep current behavior.

## Assumptions

This section records the defaults chosen so implementation does not need to
reopen product decisions.

- "Master set" means the current installed curated runtime inventory generated
  by the existing script, not the full latest ADS catalog.
- This pass unifies generative widget cards and artifact cards only. Plan-card
  identity and tool or provider icon systems stay on their current APIs unless
  they reuse helpers without behavior changes.
- The semantic catalog is scoped to current generated-card intents, not a full
  taxonomy of every installed Atlaskit icon.
- "Random" tile color means deterministic from seed after generation, matching
  the requirement that the same plan, task, and artifact keep the same tile
  color.
