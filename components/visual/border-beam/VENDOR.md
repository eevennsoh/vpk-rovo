# border-beam Integration Notes

- Upstream package: `border-beam@1.3.0` (pinned exactly in `package.json`)
- Source: `https://github.com/Jakubantalik/border-beam`
- Demo: `https://libraries.dev/border-beam`
- License: `MIT` (see `LICENSE.md`)
- Status: **imported, not forked.** `index.tsx` is a thin alias; `data.ts`
  holds VPK-only demo/GUI metadata. No upstream source lives here.

## The two wrappers in `index.tsx`

Both work around defects in upstream `1.3.0` from the outside. Re-check them
on every upgrade and delete the wrapper once upstream fixes it.

### 1. Fade events are not scoped to the beam

Upstream matches `animationName.includes("fade-in"/"fade-out")` on a bubbling
`animationend` with no target check, so **any** descendant with a matching
animation name fires `onActivate` / `onDeactivate` and flips the beam's
internal state. VPK ships `@keyframes stagger-fade-in`, so this is reachable.

Fix: a capture-phase `animationend` listener on the host that calls
`stopPropagation()` for events whose target is not the beam, so they never
reach upstream's bubble handler.

### 2. Reduced motion hides the beam completely

`--beam-opacity-<id>` is registered `initial-value: 0` and only ever raised to
1 inside `@keyframes beam-fade-in-<id>`. Upstream's reduced-motion block sets
`animation: none !important`, so the keyframe never runs and the beam renders
invisible for reduced-motion users.

Fix: the property is registered `inherits: true`, so we set it directly on the
beam element while the query matches, and remove it otherwise.

Verified in-browser: 17/17 beams sit at opacity `1` under
`prefers-reduced-motion: reduce`.

## Removed in the de-fork: the `rovo` colour variant

VPK previously carried a `colorVariant="rovo"` (Rovo brand blue/orange/purple/
lime), which required forking upstream's entire CSS generation — `rovo` was
threaded through five palette tables. Upstream cannot express it:

- `BorderBeamColorVariant` is a closed union.
- `staticColors` is a **boolean**, not a colour array.
- Gradients are built from an internal table of *literal* colour strings; only
  angle/opacity/blur/hue are exposed as CSS custom properties.

**To bring it back, ask upstream for caller-supplied colours** (a colour array,
or an open `colorVariant` registry). Until then, re-adding `rovo` means
re-adopting a ~3,000-line fork.

## On upgrading

Verify rendered pixels, not just typecheck and tests. A comparable `metal-fx`
migration passed typecheck, lint and every unit test while silently collapsing
all materials to grey — only pixel sampling caught it.
