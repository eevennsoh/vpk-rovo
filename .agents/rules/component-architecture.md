---
description: Component architecture patterns — Context State/Actions/Meta, compound components, CVA variants
---

# Component Architecture

Reference details: `.agents/skills/vpk-tidy/SKILL.md`

Quick rules:

- Keep components under 150 lines where practical
- Move logic into hooks
- Move static data into `data/` files
- Use `Readonly<Props>` interfaces
- Shared `components/ui/**`, `components/ui-custom/**`, and
  `components/projects/shared/**` owners must not import an experimental
  variant. Move reusable behavior behind a shared model or require an explicit
  capability at the feature boundary.
- Render an interactive affordance only when its consumer supplies the real
  capability. Missing callbacks must produce display-only, disabled, or omitted
  UI, never an enabled control backed by an optional call or no-op handler.
  Register advertised drop targets with the owning transaction, and cover both
  capability-present and capability-absent behavior in focused tests.

Context pattern (`State/Actions/Meta`) lives in:

- `app/contexts/context-[name].tsx`
- Reference implementation: `app/contexts/context-work-item-modal.tsx`

Use convenience hooks such as:

- `useFooState()`
- `useFooActions()`
- `useFooData()` or `useFooMeta()`

Compound component namespace pattern:

```tsx
export const Composer = {
	Container: ComposerContainer,
	Textarea: ComposerTextarea,
	Actions: ComposerActions,
} as const;
```

CVA variant pattern for `components/ui/*`:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva("base-classes", {
	variants: { variant: { default: "...", danger: "..." } },
	defaultVariants: { variant: "default" },
});

interface BadgeProps extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {}
```

## Performance ownership

For responsiveness, mounting or subscription changes, read [the performance playbook](../docs/playbooks/improve-ui-performance.md).

- Rovo consumers that need only supported surface/actions use `useRovoChatControls()`; provider-optional blocks use `useOptionalRovoChatControls()`. Keep message readers on the full context. Destructuring a broad context does not narrow its subscription.
- Reuse `MountOnFirstUse` for expensive unused project surfaces and `RetainedView` only for measured, bounded revisits. First-use deferral retains mounted effects after opening; Activity-based retention suspends hidden effects. Preserve drafts and verify hidden keyboard/focus behavior before choosing either.
- Keep hover/drag chrome separate from unchanged content and coalesce continuous geometry work to a frame. Promote measured behavior-preserving fixes at their shared owner; lifecycle/memory choices remain explicit capabilities until affected consumers are verified.
