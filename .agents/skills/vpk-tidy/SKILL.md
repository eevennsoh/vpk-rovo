---
name: vpk-tidy
description: Repo-local VPK-rovo component refactoring and wrapper migration guidance. Use when the user asks to tidy or refactor a VPK React component, retire blocks/shared-ui wrappers, split an overgrown component under app or components, move VPK UI logic into hooks or data files, make a VPK component easier to reuse without changing behavior, or verify VPK route/accessibility impact after cleanup. Do not use for generic behavior-preserving simplification outside VPK UI; prefer the global code-simplification skill for that.
---

# VPK Tidy

Refactor VPK-rovo React component surfaces without losing repo conventions,
route behavior, or wrapper-migration safety. This skill is a repo-local router
and checklist; use broader system skills for generic React theory.

## Boundary

Use this skill for:

- VPK components under `app/**`, `components/**`, or VPK route demos.
- Retiring local wrappers such as `blocks/shared-ui/*`.
- Splitting oversized VPK components into local `components/`, `hooks/`, or
  `data/` files.
- Moving static route/component data out of JSX.
- Confirming VPK validation, browser, and ADS accessibility checks after UI
  cleanup.

Do not use this skill as the primary guide for:

- Generic behavior-preserving code cleanup with no VPK UI surface; use
  `code-simplification`.
- Designing a new reusable component API from scratch; use
  `building-components` or `vercel-composition-patterns`, then apply this
  skill for VPK placement and validation.
- Pure Next.js routing, RSC, image, font, or metadata work; use
  `next-best-practices`.
- shadcn registry install/update workflows; use `shadcn`, then apply this
  skill only for VPK integration.

## Related Skills

| Need | Prefer | How `vpk-tidy` adds value |
| --- | --- | --- |
| Generic readability cleanup | `code-simplification` | Adds VPK placement, route, and ADS verification gates |
| Component API design | `building-components`, `vercel-composition-patterns` | Keeps the final API aligned with VPK folders and imports |
| React/Next performance | `vercel-react-best-practices`, `next-best-practices` | Applies only the VPK-visible cleanup safely |
| shadcn primitive usage | `shadcn` | Ensures direct primitives replace local wrappers correctly |
| Behavior changes or bug fixes | `test-driven-development` | Keeps tests tied to VPK validation commands |

## Quick Rules

| Rule | Threshold | Action |
| --- | --- | --- |
| Component size | Over 150 lines or mixed responsibilities | Split into local sub-components |
| Business logic | Event flows, async state, derived decisions | Move to a custom hook near the feature |
| Static data | Lists, URLs, menu items, config, copy maps | Move to a local `data/` file |
| Public props | Exported/reused component | Use `Readonly<ComponentNameProps>` |
| UI changes | Any rendered route impact | Browser smoke + ADS accessibility checks |

## VPK Placement

| Location | Use when |
| --- | --- |
| `components/ui/` | Shared primitive used by multiple features, no feature logic |
| `components/blocks/[feature]/components/` | Feature-specific block sub-component |
| `components/blocks/[feature]/hooks/` | Feature-specific state or business logic |
| `components/blocks/[feature]/data/` | Feature-specific static data |
| Existing route/demo folder | Route-local cleanup that should not become shared |

Prefer `@/` imports when the alias applies. Preserve tabs in TS/JS files. Use
`cn()` for class merging. Use `cva()` only where the surrounding UI primitive
already uses variant styling or the component genuinely needs variants.

## Wrapper Migration Gates

Use these gates whenever replacing local wrappers with direct
`components/ui/*`, `components/ui-ai/*`, or `components/ui-audio/*` usage.

### 1. Inventory every reference

```bash
rg -n "blocks/shared-ui/<wrapper-name>|shared-ui/<wrapper-name>" components app
```

For multiple wrappers:

```bash
rg -n "blocks/shared-ui/(link|tag|lozenge|menu|inline-edit|custom-tooltip|icon-livepage)" components app
```

### 2. Map old API to new API before edits

| Wrapper | Old API | New API | Callsite action |
| --- | --- | --- | --- |
| `shared-ui/tag` | `text`, `appearance` | `children`, `shape` | Map text to children and appearance to shape |
| `shared-ui/link` | `appearance="subtle"` | `className` override | Port subtle styling to classes |

Include removed props, renamed props, type substitutions, and behavior
differences. Do not delete a wrapper before every callsite compiles.

### 3. Migrate callsites first

- Update imports and callsites.
- Run the affected typecheck/lint path.
- Delete wrapper files only after callsites compile.
- If interaction behavior changed, smoke-test every impacted route.

### 4. Prove no retired imports remain

```bash
rg -n "blocks/shared-ui/(<wrapper-1>|<wrapper-2>|...)" components app
```

Expected result: no matches for retired wrappers.

## Refactor Workflow

1. Confirm the exact target file, route, and current git status.
2. Read the target component and nearby files before editing.
3. Search for existing VPK primitives or sibling patterns before creating new
   files.
4. If wrappers are being retired, complete the wrapper migration gates.
5. Make the smallest behavior-preserving structural change that solves the
   tidy request.
6. Validate with repo commands and route evidence.

## Structural Rules

- Split components only when it removes real mixed responsibility or makes a
  route surface easier to review.
- Keep feature-specific pieces near the feature; do not promote to
  `components/ui/` until at least two real callsites need the primitive.
- Move event handlers and async/business logic into custom hooks when the JSX
  is no longer easy to scan.
- Move static data to `data/` files only when it is reused, long, or obscures
  the rendered structure.
- Preserve existing public prop names and behavior unless the user explicitly
  asked for an API change.
- Use React 19 patterns from `AGENTS.md`: `use(Context)`, `<Context value={}>`,
  and `ref` as a normal prop.
- Render conditionally with ternaries (`cond ? <X /> : null`) instead of `&&`
  when the condition may be numeric.

## Type Rules

For exported or reused components:

```tsx
export interface CardProps extends React.ComponentProps<"div"> {
	title: string;
	variant?: "default" | "elevated" | "outlined";
}

export function Card({ title, variant = "default", className, ...props }: Readonly<CardProps>) {
	return <div className={cn("...", className)} {...props}>{title}</div>;
}
```

- Name interfaces `[ComponentName]Props`.
- Export prop interfaces for exported components.
- Use discriminated unions for variant-like props.
- Extend `React.ComponentProps<"element">` when wrapping a DOM element.
- Spread props last when user overrides should win.

## Accessibility Checks

During refactors, fix obvious regressions in touched UI:

| If you find | Replace or add |
| --- | --- |
| `<div onClick>` | `<button>` or an appropriate semantic element |
| Icon-only button | `aria-label` describing the action |
| Form field without label | Associated `<label>` or `aria-labelledby` |
| Dialog/modal | Focus handling, Escape behavior, dialog semantics |
| Dynamic status update | `aria-live="polite"` where useful |

Use `references/accessibility.md` only when the touched component needs focus,
ARIA, or data-attribute examples.

## Validation

Always run:

```bash
pnpm run lint
pnpm run typecheck
```

If repo-wide lint fails because of unrelated baseline issues, also run:

```bash
pnpm exec eslint <changed-file-1> <changed-file-2> ...
```

For UI changes:

- Verify affected route(s) in browser snapshots, light and dark when feasible.
- Run `ads_analyze_a11y` on changed components when available.
- Run `ads_analyze_localhost_a11y` on affected routes or scoped selectors.
- Classify findings as introduced regressions vs. unrelated page-shell,
  tooling, or pre-existing issues.

## References

- `references/patterns.md`: local examples for composition, hooks, and
  simplification. Prefer global `building-components`,
  `vercel-composition-patterns`, and `code-simplification` for broad theory.
- `references/accessibility.md`: local accessibility examples for component
  refactors.
