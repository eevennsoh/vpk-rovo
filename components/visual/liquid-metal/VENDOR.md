# liquid-metal (metal-fx) Integration Notes

- Upstream package: `metal-fx@1.0.2` (pinned exactly in `package.json`)
- Source: `https://github.com/Jakubantalik/metal-fx`
- Demo: `https://libraries.dev/metal`
- License: `MIT` (see `LICENSE`)
- Status: **imported, not forked.** `index.tsx` is a thin alias; `data.ts`
  holds VPK-only demo/GUI metadata. No upstream source lives here.

## Why 1.0.2 and not latest

`1.0.2` is the last release published with npm provenance attestation. `1.0.3`
onward — including all of `2.x` — are unattested, and pnpm refuses them:

```
ERR_PNPM_TRUST_DOWNGRADE: High-risk trust downgrade for "metal-fx@2.0.10"
```

Same maintainer throughout and the break predates the `2.x` train by ~4 months,
so it reads as a publish-pipeline change rather than a takeover — but lifting a
supply-chain gate is a human decision, so we stay on the attested release.
`1.0.2` → `1.0.4` differs only by an added `onFirstCopy` callback, which VPK
does not use.

## Known limitation: one material per page

metal-fx renders every visible instance from **one shared offscreen GL canvas**,
so `preset` is effectively page-level. `CreateInstanceOptions` carries no preset
in `1.x` or `2.x`, and libraries.dev's own demo engine stores it on the shared
renderer too (`setSharedPreset` writes `renderer.preset`).

VPK previously forked the renderer to make materials per-instance so the example
tiles could show chromatic/silver/gold side by side. That fork is gone, so the
examples are now labelled by what actually differs (host shape, pulse treatment)
rather than by preset, and the interactive preview's preset control demonstrates
all three one at a time.

**To restore side-by-side materials, ask upstream for a per-instance preset**
(e.g. `preset` on `CreateInstanceOptions`) or a way to allocate more than one
renderer.

## The focus-ring fix lives in `app/globals.css`

Upstream normalizes child chrome with `border/outline/box-shadow: 0 !important`,
which also erases the keyboard focus ring inside a `<LiquidMetal>`. There is no
opt-out, so an unlayered higher-specificity `:focus-visible` rule in
`app/globals.css` restores it. Delete that rule if upstream adds a way to keep
focus styles.

## On upgrading

Verify rendered pixels, not just typecheck and tests. The migration off the fork
passed typecheck, lint and every unit test while collapsing all materials to
grey — only sampling mean RGB per instance canvas caught it.
