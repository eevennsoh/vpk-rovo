---
description: UI component gotchas — Base UI menus, Popover, Toggle, Sonner
globs: components/**/*.tsx
alwaysApply: false
paths:
  - components/**/*.tsx
---

# UI Gotchas

- Only use Base UI menu primitives (`DropdownMenuItem`, `MenuPrimitive.Item`) inside a `Menu.Root`/`DropdownMenu` wrapper. For menu-item styling without menu context, use a plain `<button>` with Tailwind classes.
- Use `onSelect` (not `onClick`) on `DropdownMenuItem` — `onSelect` auto-closes the dropdown.
- For popups anchored to a trigger, use `Popover` from `components/ui/popover.tsx` with controlled `open`/`onOpenChange`. Don't hardcode `position: fixed` pixel offsets or manual backdrop divs.
- When animated or offscreen UI keeps interactive descendants mounted while visually hidden, pair the hidden state with both `aria-hidden` and `inert` on the wrapper, or unmount the controls. Add a focused closed-state regression test for the accessibility/focus contract.
- For ADS Toggle parity work, lock geometry before token polish: use ADS content-box geometry, keep the regular thumb at 12px, and use `@atlaskit/icon/core/check-mark` + `@atlaskit/icon/core/cross` (`size="small"`) wrapped in VPK `Icon`.
- On pages that render multiple Sonner demos, give each `<Toaster />` a unique `id` and pass matching `toasterId` in `toast.*` calls so a single action does not render through multiple toasters.
