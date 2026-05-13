---
version: alpha
revision: 0.0.7
theme: dark
name: Atlassian
description: >
  Portable, token-first manifest on top of the Atlassian Design System (ADS). YAML keys are
  hyphenated and section-prefix-free so references in the google-labs DESIGN.md reference syntax
  (`{colors.background-brand-bold}`) resolve cleanly. Opaque hex only in `colors` (no 8-digit
  alpha). Border widths live in their own top-level `borders:` group; elevation shadows, opacity,
  and other utility tokens are documented in prose (not in YAML). The frontmatter `theme:
  light|dark` field records which color scheme this catalog represents.
colors:
  'text': '#CECFD2'
  'text-accent-lime': '#B3DF72'
  'text-accent-lime-bolder': '#D3F1A7'
  'text-accent-red': '#FD9891'
  'text-accent-red-bolder': '#FFD5D2'
  'text-accent-orange': '#FBC828'
  'text-accent-orange-bolder': '#FCE4A6'
  'text-accent-yellow': '#EED12B'
  'text-accent-yellow-bolder': '#F5E989'
  'text-accent-green': '#7EE2B8'
  'text-accent-green-bolder': '#BAF3DB'
  'text-accent-teal': '#9DD9EE'
  'text-accent-teal-bolder': '#C6EDFB'
  'text-accent-blue': '#8FB8F6'
  'text-accent-blue-bolder': '#CFE1FD'
  'text-accent-purple': '#D8A0F7'
  'text-accent-purple-bolder': '#EED7FC'
  'text-accent-magenta': '#F797D2'
  'text-accent-magenta-bolder': '#FDD0EC'
  'text-accent-gray': '#A9ABAF'
  'text-accent-gray-bolder': '#E2E3E4'
  'text-disabled': '#E5E9F640'
  'text-inverse': '#1F1F21'
  'text-selected': '#669DF1'
  'text-brand': '#669DF1'
  'text-danger': '#FD9891'
  'text-danger-bolder': '#FFD5D2'
  'text-warning': '#FBC828'
  'text-warning-inverse': '#1F1F21'
  'text-warning-bolder': '#FCE4A6'
  'text-success': '#B3DF72'
  'text-success-bolder': '#D3F1A7'
  'text-discovery': '#D8A0F7'
  'text-discovery-bolder': '#EED7FC'
  'text-information': '#8FB8F6'
  'text-information-bolder': '#CFE1FD'
  'text-subtlest': '#96999E'
  'text-subtle': '#A9ABAF'
  'link': '#669DF1'
  'link-pressed': '#8FB8F6'
  'link-visited': '#D8A0F7'
  'link-visited-pressed': '#EED7FC'
  'icon': '#CECFD2'
  'icon-accent-lime': '#82B536'
  'icon-accent-red': '#E2483D'
  'icon-accent-orange': '#F68909'
  'icon-accent-yellow': '#EED12B'
  'icon-accent-green': '#2ABB7F'
  'icon-accent-teal': '#42B2D7'
  'icon-accent-blue': '#4688EC'
  'icon-accent-purple': '#BF63F3'
  'icon-accent-magenta': '#DA62AC'
  'icon-accent-gray': '#7E8188'
  'icon-disabled': '#E5E9F640'
  'icon-inverse': '#1F1F21'
  'icon-selected': '#669DF1'
  'icon-brand': '#669DF1'
  'icon-danger': '#F15B50'
  'icon-warning': '#FBC828'
  'icon-warning-inverse': '#1F1F21'
  'icon-success': '#82B536'
  'icon-discovery': '#BF63F3'
  'icon-information': '#4688EC'
  'icon-subtlest': '#96999E'
  'icon-subtle': '#A9ABAF'
  'border': '#E3E4F21F'
  'border-accent-lime': '#82B536'
  'border-accent-red': '#F15B50'
  'border-accent-orange': '#F68909'
  'border-accent-yellow': '#CF9F02'
  'border-accent-green': '#2ABB7F'
  'border-accent-teal': '#42B2D7'
  'border-accent-blue': '#4688EC'
  'border-accent-purple': '#BF63F3'
  'border-accent-magenta': '#DA62AC'
  'border-accent-gray': '#7E8188'
  'border-disabled': '#CECED912'
  'border-focused': '#8FB8F6'
  'border-input': '#7E8188'
  'border-inverse': '#18191A'
  'border-selected': '#669DF1'
  'border-brand': '#669DF1'
  'border-danger': '#F15B50'
  'border-warning': '#F68909'
  'border-success': '#82B536'
  'border-discovery': '#BF63F3'
  'border-information': '#4688EC'
  'border-bold': '#7E8188'
  'background-accent-lime-subtlest': '#28311B'
  'background-accent-lime-subtler': '#37471F'
  'background-accent-lime-subtle': '#4C6B1F'
  'background-accent-lime-bolder': '#94C748'
  'background-accent-red-subtlest': '#42221F'
  'background-accent-red-subtler': '#5D1F1A'
  'background-accent-red-subtle': '#AE2E24'
  'background-accent-red-bolder': '#F87168'
  'background-accent-orange-subtlest': '#3A2C1F'
  'background-accent-orange-subtler': '#693200'
  'background-accent-orange-subtle': '#9E4C00'
  'background-accent-orange-bolder': '#FCA700'
  'background-accent-yellow-subtlest': '#332E1B'
  'background-accent-yellow-subtler': '#533F04'
  'background-accent-yellow-subtle': '#7F5F01'
  'background-accent-yellow-bolder': '#DDB30E'
  'background-accent-green-subtlest': '#1C3329'
  'background-accent-green-subtler': '#164B35'
  'background-accent-green-subtle': '#216E4E'
  'background-accent-green-bolder': '#4BCE97'
  'background-accent-teal-subtlest': '#1E3137'
  'background-accent-teal-subtler': '#164555'
  'background-accent-teal-subtle': '#206A83'
  'background-accent-teal-bolder': '#6CC3E0'
  'background-accent-blue-subtlest': '#1C2B42'
  'background-accent-blue-subtler': '#123263'
  'background-accent-blue-subtle': '#1558BC'
  'background-accent-blue-bolder': '#669DF1'
  'background-accent-purple-subtlest': '#35243F'
  'background-accent-purple-subtler': '#48245D'
  'background-accent-purple-subtle': '#803FA5'
  'background-accent-purple-bolder': '#C97CF4'
  'background-accent-magenta-subtlest': '#3D2232'
  'background-accent-magenta-subtler': '#50253F'
  'background-accent-magenta-subtle': '#943D73'
  'background-accent-magenta-bolder': '#E774BB'
  'background-accent-gray-subtlest': '#303134'
  'background-accent-gray-subtler': '#4B4D51'
  'background-accent-gray-subtle': '#63666B'
  'background-accent-gray-bolder': '#96999E'
  'background-disabled': '#BDBDBD0A'
  'background-input': '#242528'
  'background-input-hovered': '#2B2C2F'
  'background-input-pressed': '#242528'
  'background-inverse-subtle': '#FFFFFF29'
  'background-inverse-subtle-hovered': '#FFFFFF3D'
  'background-inverse-subtle-pressed': '#FFFFFF52'
  'background-neutral': '#CECED912'
  'background-neutral-hovered': '#E3E4F21F'
  'background-neutral-pressed': '#E5E9F640'
  'background-neutral-subtle': '#00000000'
  'background-neutral-subtle-hovered': '#CECED912'
  'background-neutral-subtle-pressed': '#E3E4F21F'
  'background-neutral-bold': '#CECFD2'
  'background-neutral-bold-hovered': '#BFC1C4'
  'background-neutral-bold-pressed': '#A9ABAF'
  'background-selected': '#1C2B42'
  'background-selected-hovered': '#123263'
  'background-selected-pressed': '#1558BC'
  'background-selected-bold': '#669DF1'
  'background-selected-bold-hovered': '#8FB8F6'
  'background-selected-bold-pressed': '#CFE1FD'
  'background-brand-subtlest': '#1C2B42'
  'background-brand-subtlest-hovered': '#123263'
  'background-brand-subtlest-pressed': '#144794'
  'background-brand-bold': '#669DF1'
  'background-brand-bold-hovered': '#8FB8F6'
  'background-brand-bold-pressed': '#ADCBFB'
  'background-brand-boldest': '#E9F2FE'
  'background-brand-boldest-hovered': '#CFE1FD'
  'background-brand-boldest-pressed': '#ADCBFB'
  'background-danger': '#42221F'
  'background-danger-hovered': '#5D1F1A'
  'background-danger-pressed': '#872821'
  'background-danger-subtler': '#5D1F1A'
  'background-danger-subtler-hovered': '#872821'
  'background-danger-subtler-pressed': '#AE2E24'
  'background-danger-bold': '#F87168'
  'background-danger-bold-hovered': '#FD9891'
  'background-danger-bold-pressed': '#FFB8B2'
  'background-warning': '#3A2C1F'
  'background-warning-hovered': '#693200'
  'background-warning-pressed': '#7A3B00'
  'background-warning-subtler': '#693200'
  'background-warning-subtler-hovered': '#7A3B00'
  'background-warning-subtler-pressed': '#9E4C00'
  'background-warning-bold': '#FBC828'
  'background-warning-bold-hovered': '#FCA700'
  'background-warning-bold-pressed': '#F68909'
  'background-success': '#28311B'
  'background-success-hovered': '#37471F'
  'background-success-pressed': '#3F5224'
  'background-success-subtler': '#37471F'
  'background-success-subtler-hovered': '#3F5224'
  'background-success-subtler-pressed': '#4C6B1F'
  'background-success-bold': '#94C748'
  'background-success-bold-hovered': '#B3DF72'
  'background-success-bold-pressed': '#BDE97C'
  'background-discovery': '#35243F'
  'background-discovery-hovered': '#48245D'
  'background-discovery-pressed': '#673286'
  'background-discovery-subtler': '#48245D'
  'background-discovery-subtler-hovered': '#673286'
  'background-discovery-subtler-pressed': '#803FA5'
  'background-discovery-bold': '#C97CF4'
  'background-discovery-bold-hovered': '#D8A0F7'
  'background-discovery-bold-pressed': '#E3BDFA'
  'background-information': '#1C2B42'
  'background-information-hovered': '#123263'
  'background-information-pressed': '#144794'
  'background-information-subtler': '#123263'
  'background-information-subtler-hovered': '#144794'
  'background-information-subtler-pressed': '#1558BC'
  'background-information-bold': '#669DF1'
  'background-information-bold-hovered': '#8FB8F6'
  'background-information-bold-pressed': '#ADCBFB'
  'chart-categorical-1': '#4688EC'
  'chart-categorical-2': '#94C748'
  'chart-categorical-3': '#C97CF4'
  'chart-categorical-4': '#FCA700'
  'chart-categorical-5': '#1558BC'
  'chart-categorical-6': '#964AC0'
  'chart-categorical-7': '#42B2D7'
  'chart-categorical-8': '#E06C00'
  'chart-lime-bold': '#82B536'
  'chart-lime-bolder': '#94C748'
  'chart-lime-boldest': '#B3DF72'
  'chart-neutral': '#7E8188'
  'chart-neutral-hovered': '#96999E'
  'chart-red-bold': '#E2483D'
  'chart-red-bolder': '#F15B50'
  'chart-red-boldest': '#FD9891'
  'chart-orange-bold': '#F68909'
  'chart-orange-bolder': '#FCA700'
  'chart-orange-boldest': '#FBD779'
  'chart-yellow-bold': '#CF9F02'
  'chart-yellow-bolder': '#DDB30E'
  'chart-yellow-boldest': '#EED12B'
  'chart-green-bold': '#2ABB7F'
  'chart-green-bolder': '#4BCE97'
  'chart-green-boldest': '#7EE2B8'
  'chart-teal-bold': '#42B2D7'
  'chart-teal-bolder': '#6CC3E0'
  'chart-teal-boldest': '#9DD9EE'
  'chart-blue-bold': '#357DE8'
  'chart-blue-bolder': '#4688EC'
  'chart-blue-boldest': '#8FB8F6'
  'chart-purple-bold': '#AF59E1'
  'chart-purple-bolder': '#BF63F3'
  'chart-purple-boldest': '#D8A0F7'
  'chart-magenta-bold': '#CD519D'
  'chart-magenta-bolder': '#DA62AC'
  'chart-magenta-boldest': '#F797D2'
  'chart-gray-bold': '#7E8188'
  'chart-gray-bolder': '#96999E'
  'chart-gray-boldest': '#A9ABAF'
  'chart-brand': '#4688EC'
  'chart-danger': '#E2483D'
  'chart-danger-bold': '#FFB8B2'
  'chart-warning': '#F68909'
  'chart-warning-bold': '#FBC828'
  'chart-success': '#82B536'
  'chart-success-bold': '#B3DF72'
  'chart-discovery': '#BF63F3'
  'chart-discovery-bold': '#D8A0F7'
  'chart-information': '#4688EC'
  'chart-information-bold': '#8FB8F6'
  'blanket': '#10121499'
  'blanket-selected': '#1D7AFC14'
  'blanket-danger': '#E3493514'
  'interaction-hovered': '#ffffff33'
  'interaction-pressed': '#ffffff5c'
  'skeleton': '#CECED912'
  'skeleton-subtle': '#BDBDBD0A'
typography:
  'heading-xxlarge':
    fontFamily: 'Atlassian Sans'
    fontSize: '2rem'
    fontWeight: 653
    lineHeight: '2.25rem'
  'heading-xlarge':
    fontFamily: 'Atlassian Sans'
    fontSize: '1.75rem'
    fontWeight: 653
    lineHeight: '2rem'
  'heading-large':
    fontFamily: 'Atlassian Sans'
    fontSize: '1.5rem'
    fontWeight: 653
    lineHeight: '1.75rem'
  'heading-medium':
    fontFamily: 'Atlassian Sans'
    fontSize: '1.25rem'
    fontWeight: 653
    lineHeight: '1.5rem'
  'heading-small':
    fontFamily: 'Atlassian Sans'
    fontSize: '1rem'
    fontWeight: 653
    lineHeight: '1.25rem'
  'heading-xsmall':
    fontFamily: 'Atlassian Sans'
    fontSize: '0.875rem'
    fontWeight: 653
    lineHeight: '1.25rem'
  'heading-xxsmall':
    fontFamily: 'Atlassian Sans'
    fontSize: '0.75rem'
    fontWeight: 653
    lineHeight: '1rem'
  'body-large':
    fontFamily: 'Atlassian Sans'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: '1.5rem'
  'body':
    fontFamily: 'Atlassian Sans'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: '1.25rem'
  'body-small':
    fontFamily: 'Atlassian Sans'
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: '1rem'
  'metric-large':
    fontFamily: 'Atlassian Sans'
    fontSize: '1.75rem'
    fontWeight: 653
    lineHeight: '2rem'
  'metric-medium':
    fontFamily: 'Atlassian Sans'
    fontSize: '1.5rem'
    fontWeight: 653
    lineHeight: '1.75rem'
  'metric-small':
    fontFamily: 'Atlassian Sans'
    fontSize: '1rem'
    fontWeight: 653
    lineHeight: '1.25rem'
  'code':
    fontFamily: 'Atlassian Mono'
    fontSize: '0.875em'
    fontWeight: 400
    lineHeight: '1'
  'weight-regular':
    fontWeight: 400
  'weight-medium':
    fontWeight: 500
  'weight-semibold':
    fontWeight: 600
  'weight-bold':
    fontWeight: 653
  'family-heading':
    fontFamily: 'Atlassian Sans'
  'family-body':
    fontFamily: 'Atlassian Sans'
  'family-code':
    fontFamily: 'Atlassian Mono'
  'family-brand-heading':
    fontFamily: 'Charlie Display'
  'family-brand-body':
    fontFamily: 'Charlie Text'
rounded:
  'xsmall': '0.125rem'
  'small': '0.25rem'
  'medium': '0.375rem'
  'large': '0.5rem'
  'xlarge': '0.75rem'
  'xxlarge': '1rem'
  'full': '624.9375rem'
  'tile': '25%'
spacing:
  '0': '0rem'
  '025': '0.125rem'
  '050': '0.25rem'
  '075': '0.375rem'
  '100': '0.5rem'
  '150': '0.75rem'
  '200': '1rem'
  '250': '1.25rem'
  '300': '1.5rem'
  '400': '2rem'
  '500': '2.5rem'
  '600': '3rem'
  '800': '4rem'
  '1000': '5rem'
  'negative-025': '-0.125rem'
  'negative-050': '-0.25rem'
  'negative-075': '-0.375rem'
  'negative-100': '-0.5rem'
  'negative-150': '-0.75rem'
  'negative-200': '-1rem'
  'negative-250': '-1.25rem'
  'negative-300': '-1.5rem'
  'negative-400': '-2rem'
borders:
  'width': '0.0625rem'
  'width-selected': '0.125rem'
  'width-focused': '0.125rem'
components:
  button-default:
    backgroundColor: '{colors.background-neutral-subtle}'
    textColor: '{colors.text-subtle}'
    borderColor: '{colors.border}'
    borderWidth: '{borders.width}'
    rounded: '{rounded.small}'
    typography: '{typography.body}'
    padding: '{spacing.075}'
  button-default-hovered:
    backgroundColor: '{colors.background-neutral-subtle-hovered}'
  button-default-pressed:
    backgroundColor: '{colors.background-neutral-subtle-pressed}'
  button-default-selected:
    backgroundColor: '{colors.background-selected}'
    textColor: '{colors.text-selected}'
    borderColor: '{colors.border-selected}'
  button-default-disabled:
    backgroundColor: transparent
    textColor: '{colors.text-disabled}'
    borderColor: '{colors.border-disabled}'
  button-primary:
    backgroundColor: '{colors.background-brand-bold}'
    textColor: '{colors.text-inverse}'
    rounded: '{rounded.small}'
    typography: '{typography.body}'
    padding: '{spacing.075}'
  button-primary-hovered:
    backgroundColor: '{colors.background-brand-bold-hovered}'
  button-primary-pressed:
    backgroundColor: '{colors.background-brand-bold-pressed}'
  button-primary-disabled:
    backgroundColor: '{colors.background-disabled}'
    textColor: '{colors.text-disabled}'
  button-subtle:
    backgroundColor: '{colors.background-neutral-subtle}'
    textColor: '{colors.text-subtle}'
    rounded: '{rounded.small}'
    typography: '{typography.body}'
    padding: '{spacing.075}'
  button-subtle-hovered:
    backgroundColor: '{colors.background-neutral-subtle-hovered}'
  button-subtle-pressed:
    backgroundColor: '{colors.background-neutral-subtle-pressed}'
  button-warning:
    backgroundColor: '{colors.background-warning-bold}'
    textColor: '{colors.text-warning-inverse}'
    rounded: '{rounded.small}'
    typography: '{typography.body}'
    padding: '{spacing.075}'
  button-warning-hovered:
    backgroundColor: '{colors.background-warning-bold-hovered}'
  button-warning-pressed:
    backgroundColor: '{colors.background-warning-bold-pressed}'
  button-danger:
    backgroundColor: '{colors.background-danger-bold}'
    textColor: '{colors.text-inverse}'
    rounded: '{rounded.small}'
    typography: '{typography.body}'
    padding: '{spacing.075}'
  button-danger-hovered:
    backgroundColor: '{colors.background-danger-bold-hovered}'
  button-danger-pressed:
    backgroundColor: '{colors.background-danger-bold-pressed}'
  button-discovery:
    backgroundColor: '{colors.background-discovery-bold}'
    textColor: '{colors.text-inverse}'
    rounded: '{rounded.small}'
    typography: '{typography.body}'
    padding: '{spacing.075}'
  button-discovery-hovered:
    backgroundColor: '{colors.background-discovery-bold-hovered}'
  button-discovery-pressed:
    backgroundColor: '{colors.background-discovery-bold-pressed}'
  button-link-legacy:
    backgroundColor: transparent
    textColor: '{colors.link}'
    rounded: '{rounded.small}'
    typography: '{typography.body}'
    padding: '{spacing.075}'
  button-link-legacy-pressed:
    textColor: '{colors.link-pressed}'
  button-compact:
    padding: '{spacing.025}'
  icon-button:
    backgroundColor: '{colors.background-neutral-subtle}'
    textColor: '{colors.text-subtle}'
    rounded: '{rounded.small}'
    width: 2rem
    height: 2rem
    padding: '{spacing.0}'
  icon-button-circle:
    rounded: '{rounded.full}'
  icon-button-compact:
    width: 1.5rem
    height: 1.5rem
  button-group:
    gap: '{spacing.050}'
  textfield-standard:
    backgroundColor: '{colors.background-input}'
    textColor: '{colors.text}'
    borderColor: '{colors.border-input}'
    borderWidth: '{borders.width}'
    rounded: '{rounded.small}'
    typography: '{typography.body}'
    padding: '{spacing.075}'
    placeholderColor: '{colors.text-subtlest}'
  textfield-standard-hovered:
    backgroundColor: '{colors.background-input-hovered}'
  textfield-standard-focused:
    backgroundColor: '{colors.background-input-pressed}'
    borderColor: '{colors.border-focused}'
  textfield-standard-invalid:
    borderColor: '{colors.border-danger}'
  textfield-standard-disabled:
    backgroundColor: '{colors.background-disabled}'
    textColor: '{colors.text-disabled}'
  textfield-subtle:
    backgroundColor: transparent
    textColor: '{colors.text}'
    borderColor: transparent
    borderWidth: '{borders.width}'
    rounded: '{rounded.small}'
    typography: '{typography.body}'
    padding: '{spacing.075}'
    placeholderColor: '{colors.text-subtlest}'
  textfield-subtle-hovered:
    backgroundColor: '{colors.background-input-hovered}'
    borderColor: '{colors.border-input}'
  textfield-subtle-focused:
    backgroundColor: '{colors.background-input-pressed}'
    borderColor: '{colors.border-focused}'
  textfield-none:
    backgroundColor: transparent
    textColor: '{colors.text}'
    borderColor: transparent
    rounded: '{rounded.small}'
    typography: '{typography.body}'
    padding: '{spacing.075}'
  textfield-compact:
    padding: '{spacing.025}'
  form-label:
    textColor: '{colors.text-subtle}'
    typography: '{typography.body-small}'
  form-helper-message:
    textColor: '{colors.text-subtlest}'
    typography: '{typography.body-small}'
  form-error-message:
    textColor: '{colors.text-danger}'
    typography: '{typography.body-small}'
  form-valid-message:
    textColor: '{colors.text-success}'
    typography: '{typography.body-small}'
---

# Atlassian DESIGN.md

> A portable, token-first manifest for producing anything that should look like it belongs at
> Atlassian — product UI, slides, charts, dashboards, onboarding screens, or marketing surfaces.

### Table of contents

**Canonical (spec-shaped):** [Overview](#overview) · [Colors](#colors) · [Typography](#typography) ·
[Layout](#layout) · [Borders](#borders) · [Elevation & Depth](#elevation--depth) · [Shapes](#shapes)
· [Components](#components) · [Do's and Don'ts](#dos-and-donts)

**Atlassian extensions:** [Iconography and imagery](#iconography-and-imagery) · [Motion](#motion) ·
[Voice and tone](#voice-and-tone) · [Accessibility](#accessibility) ·
[Brand vs product](#brand-vs-product) · [Responsive behavior](#responsive-behavior) ·
[Agent prompt guide](#agent-prompt-guide) ·
[Design rigor and anti-template checks](#design-rigor-and-anti-template-checks) ·
[Related](#related)

---

## Overview

### Which skill to use

- **Building in React with ADS packages, theming, and a proper product runtime** → Use the
  **atlassian-design-system** skill for components, primitives, and token APIs.
- **Building raw HTML, generating images, slides, email, PDFs, static exports, or any context
  without ADS packages** → Use **this file** (`DESIGN.md`): token names from the YAML frontmatter
  plus hex anchors for concrete values.

**How to use this file.** Every rule uses RFC 2119 language (MUST / MUST NOT / SHOULD / SHOULD NOT /
MAY). Tokens are referenced by their hyphenated YAML key — e.g. `text-subtle`,
`background-brand-bold`, `space-100`, `rounded-medium` — defined in the frontmatter. Hex values are
provided in **light and dark pairings** for non-code output (images, slides, email, static exports);
pick the hex for the target theme and never mix the two in the same artifact. This file encodes
_taste and design intent_ on top of the ADS token catalog; for tokens not listed here, look them up
at [`atlassian.design/tokens`](https://atlassian.design/tokens) rather than guessing.

Atlassian product UI is **neutral-dominant with restrained saturation, built on an 8px rhythm, a
t-shirt radius scale, and a four-plane elevation model.** Surfaces are calm; color carries meaning;
depth is earned, not decorative. Where brand expression is needed, a single layer of Charlie
typography and logo artwork is applied over an otherwise product-native canvas.

### Atmosphere rules

- **MUST** default to neutral backgrounds (`surface`, `background-neutral`) for the ~90% of the
  canvas that is not communicating meaning.
- **MUST** reserve saturated color for one of: semantic roles (brand, danger, warning, success,
  information, discovery), decorative accents (tags, file types, avatar chips), or data
  visualization.
- **MUST** compose layouts on the 8px grid via the `spacing` scale (`space-100`, `space-200`, etc. —
  see [Layout](#layout)).
- **MUST** pair every elevated surface with its matching shadow token
  ([Elevation & Depth](#elevation--depth)).
- **MUST NOT** imitate Material's depth theatre (floating cards everywhere), generic Shadcn/Tailwind
  neutral gradients, or the marketing-site brand-vibes aesthetic found in most public "DESIGN.md"
  corpora. Those rely on vibes; Atlassian relies on tokens.
- **SHOULD** prefer whitespace and borders for grouping before reaching for elevation.
- **SHOULD** let the canvas be mostly quiet so that color and motion (when used) carry actual
  signal.

### Reference points

- **Aligned with:** IBM Carbon (token-first discipline), Linear (restraint), GitHub Primer (neutral
  backbone with semantic accents).
- **Not aligned with:** Material Design (heavier elevation, broader saturation), Shadcn/Tailwind
  defaults (greyscale gradients, generic radius), Fluent (heavier acrylic/blur effects).

---

## Colors

Refer to colors by token name in prose; emit literal hex in HTML/CSS output. Hex values below come
from the YAML `colors:` block at the top of this file — they reflect the build's theme.

### Neutral backbone (use for 80–90% of surface area)

| Role                                              | Token                               | Hex         | Use                                                                                                 |
| ------------------------------------------------- | ----------------------------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| Default canvas                                    | `surface`                           | `#1F1F21`   | Page background, card fill                                                                          |
| Sunken canvas                                     | `surface-sunken`                    | `#18191A`   | Wells for grouping (Kanban columns, content backdrops)                                              |
| Raised card                                       | `surface-raised`                    | `#242528`   | Movable cards — MUST pair with `shadow-raised`                                                      |
| Overlay                                           | `surface-overlay`                   | `#2B2C2F`   | Modals, dropdowns, flags, popovers — MUST pair with `shadow-overlay`                                |
| Primary text                                      | `text`                              | `#CECFD2`   | Paragraphs, list items, descriptions, titles, table cells, button labels — **all continuous prose** |
| Secondary text                                    | `text-subtle`                       | `#A9ABAF`   | Field labels, captions, bylines, nav items, metadata — **never paragraph text**                     |
| Tertiary text                                     | `text-subtlest`                     | `#96999E`   | Placeholders, helper text, breadcrumb separators, timestamps                                        |
| Inverse text                                      | `text-inverse`                      | `#1F1F21`   | Text on bold backgrounds                                                                            |
| Disabled text                                     | `text-disabled`                     | `#E5E9F640` | Any disabled state                                                                                  |
| Icon                                              | `icon`                              | `#CECFD2`   | Primary icons, paired with `text`                                                                   |
| Subtle icon                                       | `icon-subtle`                       | `#A9ABAF`   | Secondary icons                                                                                     |
| Subtlest icon                                     | `icon-subtlest`                     | `#96999E`   | Paired with `text-subtlest`                                                                         |
| Inverse icon                                      | `icon-inverse`                      | `#1F1F21`   | Icons on bold backgrounds                                                                           |
| Default border                                    | `border`                            | `#E3E4F21F` | Dividers, input outlines, cards                                                                     |
| Strong border                                     | `border-bold`                       | `#7E8188`   | When 3:1 non-text contrast is required                                                              |
| Input border                                      | `border-input`                      | `#7E8188`   | Form fields                                                                                         |
| Input background                                  | `background-input`                  | `#242528`   | Form fields                                                                                         |
| Neutral background (invisible-til-hover controls) | `background-neutral-subtle`         | transparent | IconButton hit targets, subtle fills                                                                |
| Neutral hovered                                   | `background-neutral-subtle-hovered` | `#CECED912` | Hover state for subtle controls                                                                     |
| Link                                              | `link`                              | `#669DF1`   | Navigational and textual links                                                                      |
| Selected surface                                  | `background-selected`               | `#1C2B42`   | Active tabs, selected list rows                                                                     |
| Selected border                                   | `border-selected`                   | `#669DF1`   | Paired with `border-width-selected` (2px) for selection                                             |
| Selected text                                     | `text-selected`                     | `#669DF1`   | Text in active/selected state                                                                       |
| Focus ring                                        | `border-focused`                    | `#8FB8F6`   | Paired with `border-width-focused` (2px)                                                            |

Rules for selected state:

- **MUST** apply the full selected triad — `background-selected` + `border-selected` (at
  `border-width-selected`, 2px) + `text-selected` — together. Applying only the border or only the
  background produces an incomplete state that reads as a styling bug, not a selection.
- **MUST** use the selected triad for the active/current item in any list, table row, tab, or
  navigation group — including non-interactive contexts like "this is the current meeting" or "this
  is today's date." Selected state communicates "you are here," not just "you clicked this."
- **MUST NOT** substitute `border-brand` or `text-brand` for the selected tokens. Brand and selected
  share the same hex values today, but they carry different semantic meaning and may diverge in
  future themes.

### Semantic roles (use only when communicating meaning)

Each role has a full family: text, icon, background (subtle/bold/subtler/bolder with
hovered/pressed), and border. The table below shows the **primary** tokens per role and the
bold-background hex anchor; emphasis variants (`*.subtler`, `*.bolder`) and `.hovered` / `.pressed`
states follow the same naming pattern.

| Role            | When to use                          | Text               | Icon               | Bold background               | Border               | Bold bg hex | On-bold text |
| --------------- | ------------------------------------ | ------------------ | ------------------ | ----------------------------- | -------------------- | ----------- | ------------ |
| **brand**       | Primary CTAs, brand moments          | `text-brand`       | `icon-brand`       | `background-brand-bold`       | `border-brand`       | `#669DF1`   | `#1F1F21`    |
| **danger**      | Destructive actions, blocking errors | `text-danger`      | `icon-danger`      | `background-danger-bold`      | `border-danger`      | `#F87168`   | `#1F1F21`    |
| **warning**     | Caution, non-blocking issues         | `text-warning`     | `icon-warning`     | `background-warning-bold`     | `border-warning`     | `#FBC828`   | `#1F1F21`    |
| **success**     | Positive outcomes, completion        | `text-success`     | `icon-success`     | `background-success-bold`     | `border-success`     | `#94C748`   | `#1F1F21`    |
| **information** | Neutral info, in-progress            | `text-information` | `icon-information` | `background-information-bold` | `border-information` | `#669DF1`   | `#1F1F21`    |
| **discovery**   | New features, beta, change           | `text-discovery`   | `icon-discovery`   | `background-discovery-bold`   | `border-discovery`   | `#C97CF4`   | `#1F1F21`    |

Rules:

- **MUST** use the semantic role that matches the message (e.g. a destructive confirmation is
  `danger`, not `warning`).
- **MUST** use `text-inverse` (or the role's `*-bolder` text token) on bold backgrounds for AA
  contrast.
- **MUST** use `text-warning-inverse` and `icon-warning-inverse` on **bold warning** backgrounds —
  the yellow is light, so inverse is dark, not white.
- **MUST NOT** use accent ramps (next section) to express status. A blue tag is decorative; an
  _information_ lozenge is semantic.
- **MUST** use the role's `icon-*` (`icon-information`, `icon-warning`, etc.) on role-tinted
  backgrounds — the icon carries the semantic color.
- **MUST NOT** tint paragraph / body text with a semantic text token on semantic backgrounds. Inside
  a section message, flag, or banner on a semantic subtle/subtler surface, the prose uses `text` /
  `text-subtle` (neutral); the semantic colour is carried by the background and the leading icon,
  not the copy. Blue text on a blue `information` background is the drift pattern.
- On `*-bold` (filled) surfaces, text is either `text-inverse` (most roles) or
  `text-warning-inverse` (the yellow exception). Controls like primary buttons and banners live
  here.
- Emphasis ladder: `*-subtlest` → `*-subtler` → `*-subtle` → `*` (default) → `*-bold` → `*-bolder`.
  Each level has `-hovered` and `-pressed` variants.

### Accent ramps (decoration only — never meaning)

Ten hues: `lime`, `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `magenta`, `gray`.
Each hue has four background steps with paired text/icon/border tokens.

| Step     | Background token pattern           | Typical use                                                |
| -------- | ---------------------------------- | ---------------------------------------------------------- |
| subtlest | `background-accent-<hue>-subtlest` | Avatar chip backgrounds, file-type tiles                   |
| subtler  | `background-accent-<hue>-subtler`  | Tag backgrounds paired with `text-accent-<hue>`            |
| subtle   | `background-accent-<hue>-subtle`   | Stronger tag/label backgrounds paired with `*-bolder` text |
| bolder   | `background-accent-<hue>-bolder`   | High-emphasis accent blocks (used sparingly)               |

Rules:

- **MUST NOT** use `background-accent-red-*` for danger, `accent-yellow` for warning, `accent-green`
  for success, or `accent-blue` for information. Use the semantic role instead.
- **MUST** pair each accent step with the correct text token: e.g. `background-accent-blue-subtler`
  pairs with `text-accent-blue`; `background-accent-blue-subtle` pairs with
  `text-accent-blue-bolder`.
- **MAY** use accents freely for non-semantic decoration: file types, user-chosen tag colors,
  categorical data viz keys, avatar labels.

### Data visualization

- **MUST** use `chart-*` tokens for categorical series, paired with the matching
  `text-accent-*-bolder` for legends.
- **MUST** use icon shapes, patterns, or labels in addition to color so the chart is readable
  without color.
- **MUST NOT** hardcode a chart palette. ADS does not ship sequential or diverging scales yet; if
  one is required, document the gap rather than inventing a ramp.

### Interaction states

- **MUST** express hovered / pressed / selected / focused / disabled via the matching token variant
  (e.g. `background-brand-bold-hovered`), not a custom overlay.
- **SHOULD** use `interaction-hovered` / `interaction-pressed` as a transparent overlay only when
  the base fill cannot be swapped.
- **MUST NOT** simulate interaction state with a hand-authored shadow or `filter: brightness()`.

---

## Typography

### Families

| Token                  | Family          | Use                               |
| ---------------------- | --------------- | --------------------------------- |
| `family-body`          | Atlassian Sans  | Default product body text         |
| `family-heading`       | Atlassian Sans  | Default product headings          |
| `family-code`          | Atlassian Mono  | Code (block and inline)           |
| `family-brand-heading` | Charlie Display | Marketing and brand surfaces only |
| `family-brand-body`    | Charlie Text    | Marketing and brand surfaces only |

Rules:

- **MUST** use Atlassian Sans for product UI (in-app screens, dashboards, settings, empty/error
  states).
- **MUST** use Atlassian Mono for code and monospace numerics in technical contexts.
- **MUST** use Charlie Display/Text **only** on marketing surfaces, onboarding welcome moments,
  brand promotion sections, and empty-state illustrations. See
  [Brand vs product](#brand-vs-product).
- **MUST NOT** introduce third-party fonts (Inter, SF Pro, Roboto, Helvetica, or legacy web font families). The system
  fallback stack already covers platforms where Atlassian Sans is unavailable.

### Heading scale

Use plain `<h1>`–`<h6>` (one H1 per page, no skipped levels) and apply the size/line-height/weight
pair from the table below.

| Token             | Size / line        | Weight | Use                                                 |
| ----------------- | ------------------ | ------ | --------------------------------------------------- |
| `heading-xxlarge` | 2rem / 2.25rem     | 653    | Marketing promotion overlap, rare in product        |
| `heading-xlarge`  | 1.75rem / 2rem     | 653    | Brand/marketing and the largest product page titles |
| `heading-large`   | 1.5rem / 1.75rem   | 653    | Default product page titles (forms, detail pages)   |
| `heading-medium`  | 1.25rem / 1.5rem   | 653    | Modal headers, large component titles               |
| `heading-small`   | 1rem / 1.25rem     | 653    | Card titles, small component headers                |
| `heading-xsmall`  | 0.875rem / 1.25rem | 653    | Section headers in tight spaces                     |
| `heading-xxsmall` | 0.75rem / 1rem     | 653    | Fine print headers — use sparingly                  |

Rules:

- **MUST** descend heading levels (H1 → H2 → H3) without skipping.
- **MUST** use one H1 per page, typically the page title.
- **MUST NOT** use heading sizes for emphasis on body copy. Use `weight-medium` on a `<span>`
  instead.

### Body scale

| Token        | Size / line        | Weight | Use                                                 |
| ------------ | ------------------ | ------ | --------------------------------------------------- |
| `body-large` | 1rem / 1.5rem      | 400    | Long-form content (blogs, documentation bodies)     |
| `body`       | 0.875rem / 1.25rem | 400    | **Default** for components and product UI           |
| `body-small` | 0.75rem / 1rem     | 400    | Fine print, helper text, secondary labels — sparing |

Rules:

- **MUST** default to `body` (14px / 0.875rem) for component text. This is the single most common
  typography choice in product UI.
- **SHOULD** use `body-small` only when space is the constraint, not by default.
- **MUST** render paragraphs, list items, descriptions, and any continuous prose the user is
  expected to _read_ in `text` (primary text color). Using `text-subtle` for paragraph text to
  create a hierarchy against headings is a drift pattern — headings already provide the hierarchy
  via size and weight.
- Reserve `text-subtle` for **secondary metadata**: field labels, captions, bylines, timestamps, nav
  items, supplementary annotations inside components. Reserve `text-subtlest` for
  placeholder/helper/meta text only.

### No overlines or eyebrows

Atlassian does not use an "overline" / "eyebrow" pattern (small label above a heading). Category or
context information belongs in the page breadcrumb, a sibling lozenge, or sentence-case body copy —
not as a separate typographic layer above the H1.

- **MUST NOT** render any user-visible text in ALL CAPS, small caps, or `letter-spacing`-stretched
  uppercase — including eyebrows, overlines, section labels above headings, table column headers,
  subheadings, lozenges, tags, badges, and tab labels. There is no size or scope exemption.
- **MUST NOT** color an eyebrow-like label in `text-brand` or an accent hue to make it stand out.
  Use a lozenge (semantic) or a tag (decorative) if a categorical label is genuinely needed; both
  render in sentence case.
- **SHOULD** replace any "EYEBROW / Heading" composition with a plain sentence-case heading plus, at
  most, a small lozenge beside it.

### Weights

| Token             | Value | Use                                                                       |
| ----------------- | ----- | ------------------------------------------------------------------------- |
| `weight-regular`  | 400   | Default body                                                              |
| `weight-medium`   | 500   | Text beside icons (buttons, nav items) — the "safe" bold                  |
| `weight-semibold` | 600   | Use with caution — fallback fonts do not support 600 and collapse to bold |
| `weight-bold`     | 653   | Rare emphasis (lozenges, headings)                                        |

Rules:

- **MUST** set font weight to one of the four values above, not arbitrary numerics like
  `fontWeight: 700`.
- **SHOULD** use `weight-medium` (500) for any text beside an icon so weight reads correctly against
  the stroke.
- **MUST NOT** use `weight-semibold` where a font load failure would visibly affect the layout —
  prefer `weight-medium` or `weight-bold`.

### Case

- **MUST** use **sentence case** for every piece of user-visible text in product UI: titles,
  headings, buttons, menu items, tab labels, tooltips, flag titles, empty-state headings, table
  column headers, form labels, settings pages — everything.
- **MUST** capitalize proper nouns (people, company names, product names: _Jira_, _Confluence_,
  _Trello_, _Atlassian_, _Compass_).
- **MUST NOT** use Title Case ("Create Work Item"). This is one of the most common drift patterns
  when an LLM generates Atlassian UI — correct to sentence case ("Create work item") on sight.
- **MUST NOT** use ALL CAPS anywhere in product UI: not in eyebrows, subheadings, lozenges, tags,
  badges, tab labels, table column headers, or form labels. There is no "small enough" exemption.
  Small caps / spaced caps belong only in data-visualization axis labels, and even there sparingly.

### Code

- **MUST** use Atlassian Mono (the `code` token) for inline code and code blocks, via `<code>` and
  `<pre>`.
- **MUST NOT** wrap UI identifiers (button labels, filenames in breadcrumbs) in code styling unless
  they genuinely are tokens the user will type.

---

## Layout

Atlassian spacing is an 8px-base system. Every distance on the canvas (padding, margin, gap, inset)
MUST land on a token step from the scale below. No off-grid `px`, `rem`, or `em` values.

### The full scale

| Token        | rem      | px   | Band                  |
| ------------ | -------- | ---- | --------------------- |
| `space-0`    | 0        | 0    | —                     |
| `space-025`  | 0.125rem | 2px  | small                 |
| `space-050`  | 0.25rem  | 4px  | small                 |
| `space-075`  | 0.375rem | 6px  | small                 |
| `space-100`  | 0.5rem   | 8px  | small (**base unit**) |
| `space-150`  | 0.75rem  | 12px | medium                |
| `space-200`  | 1rem     | 16px | medium                |
| `space-250`  | 1.25rem  | 20px | medium                |
| `space-300`  | 1.5rem   | 24px | medium                |
| `space-400`  | 2rem     | 32px | large                 |
| `space-500`  | 2.5rem   | 40px | large                 |
| `space-600`  | 3rem     | 48px | large                 |
| `space-800`  | 4rem     | 64px | large                 |
| `space-1000` | 5rem     | 80px | large                 |

Negative steps `space-negative-025` through `space-negative-400` mirror the positive scale for
overlap and bleed; use them only at token-aligned rem steps.

### Usage bands

- **Small (0–8px)** — tight component interiors: gap between icon and label, padding inside
  badges/lozenges/icon-buttons, gap within button groups, padding inside input fields, vertical
  stack inside a card (title → description).
- **Medium (12–24px)** — roomier component interiors: button padding, section-message padding,
  avatar-to-content gutter, spacing between card elements.
- **Large (32–80px)** — page-level layout: space between page header and body, section separators,
  large flag padding, sidebar-to-content gutters.

### Layout principles

- **MUST** express relationships via proximity. Things that belong together SHOULD sit closer
  (small/medium gaps); unrelated things SHOULD sit further apart (medium/large gaps).
- **MUST** use consistent spacing within repeating elements (list items, table rows, card grids).
  Consistency creates the visual rhythm that makes scanning fast.
- **MUST** vary the step to express hierarchy — e.g. `space-100` / `space-150` between a label and
  its field, `space-300` / `space-400` between unrelated blocks. The same `space-200` on every edge
  flattens hierarchy.
- **SHOULD** use a larger step around more important blocks. Bigger surrounding space = more
  important.
- **MAY** make optical adjustments (±one step) when strict tokens produce a visual imbalance — but
  the starting point is always a token, not a pixel measurement.

### Implementation

- Emit CSS `gap`, `padding`, `margin`, and `inset` using the **rem value** for the chosen token
  (e.g. `gap: 0.75rem` for `space-150`, `padding: 1rem` for `space-200`).
- **MUST NOT** use off-rail pixel values such as `gap: 13px` or `padding: 10px 14px` — round to the
  nearest token step instead.

---

## Borders

Border widths live on a three-step scale, distinct from spacing and radius. Stroke weight carries
meaning (resting vs selected vs focused) and never drifts into decoration.

| Token                   | rem       | px  | Use                                                                            |
| ----------------------- | --------- | --- | ------------------------------------------------------------------------------ |
| `border-width`          | 0.0625rem | 1px | Default hairline: input borders, card outlines, dividers, table row rules.     |
| `border-width-selected` | 0.125rem  | 2px | Selected state: the left rail on an active tab/nav row, selected card outline. |
| `border-width-focused`  | 0.125rem  | 2px | Focus ring on every focusable control (see [Shapes](#shapes) → Focus ring).    |

Rules:

- **MUST** use `border-width` (1px) for all resting borders. Anything thicker reads as emphasis.
- **MUST** pair `border-width-selected` with the `border-selected` color (and the matching
  text/background tokens) for selected state — never just thicken the resting border.
- **MUST** pair `border-width-focused` with `border-focused` for focus rings; geometry rules live in
  [Shapes](#shapes) → Focus ring.
- **MUST NOT** use thicker borders as a decorative "stripe" on cards, callouts, or list rows —
  that's the side-stripe anti-pattern. Reach for a semantic surface plus `border` instead.
- **MUST NOT** invent fractional widths (e.g. 1.5px) to land between steps. If no step fits, the
  surface treatment is wrong, not the border.
- **SHOULD** prefer `border` + whitespace over elevation when the goal is grouping (see
  [Elevation & Depth](#elevation--depth)).

---

## Elevation & Depth

Atlassian elevation is a four-plane system plus an overflow treatment. Each plane has a specific
purpose; raising or overlaying is an intentional choice, not decoration.

### The four planes

| Plane       | Surface token     | Shadow token     | Use                                                                                                                                                                         |
| ----------- | ----------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Default** | `surface`         | —                | The flat canvas. Cards and containers here use borders, not shadows.                                                                                                        |
| **Raised**  | `surface-raised`  | `shadow-raised`  | Movable cards (Trello, Jira board cards). Use sparingly for emphasis — at most one raised region per screen.                                                                |
| **Overlay** | `surface-overlay` | `shadow-overlay` | Modals, dialogs, dropdown menus, floating toolbars, flags, popovers, tooltips, spotlight. Overlays can stack on overlays.                                                   |
| **Sunken**  | `surface-sunken`  | —                | Wells that group content (Kanban columns, background panels) **inside** a page whose canvas is already `surface`. Only on the default plane — never stack sunken on raised. |

Hex values for each surface token are in the neutral table in [Colors](#colors).

### Page canvas

- **MUST** use `surface` (`#1F1F21`) as the page / artifact background. This is the rule for every
  standalone surface — product pages, reports, dashboards, embedded views, email, slides, exported
  documents. `surface` _is_ the canvas.
- **MUST NOT** use `surface-sunken` as the page background to create contrast against cards. Sunken
  is a **well inside** a page — used behind a grouped panel (Kanban columns, a filters rail, a
  conversation thread) — not as the outermost surface. "Grey page, white cards" is the common drift
  pattern; the Atlassian pattern is "white page, bordered cards, optional sunken wells inside".
- **MUST NOT** use `surface-sunken` as a card, panel, or section-container background to "group"
  content within a page. Sunken is for **structural wells** (Kanban columns, filter rails,
  conversation threads, scrollable side panels) — not for content cards, info blocks, stat tiles,
  settings rows, or "grouped" section containers. Use `surface` + `border` (or `border` + extra
  `space-*` padding) for grouping; use `surface-raised` + `shadow-raised` when the content is
  genuinely movable.
- To create visual separation between a card and its container without switching surface tokens, use
  `border` + `space-200` / `space-300` padding, or raise the card to `surface-raised` +
  `shadow-raised` — do not darken the canvas.

### Shadow recipes

The two elevation shadows render with these CSS values when no token resolver is available:

| Token            | Light                                                             | Dark                             |
| ---------------- | ----------------------------------------------------------------- | -------------------------------- |
| `shadow-raised`  | `0 1px 1px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31)`  | `0 1px 1px rgba(3, 4, 4, 0.5)`   |
| `shadow-overlay` | `0 8px 12px rgba(9, 30, 66, 0.15), 0 0 1px rgba(9, 30, 66, 0.31)` | `0 8px 12px rgba(3, 4, 4, 0.31)` |

### Overflow

- **MUST** use `shadow-overflow` to signal content scrolled under its container (horizontal table
  scroll, modal body scroll).
- **MUST** use `shadow-overflow-perimeter` + `shadow-overflow-spread` only if the primary overflow
  token cannot be applied (legacy platforms).

### Interaction states

- Hovered: `surface-hovered`, `surface-raised-hovered`, `surface-overlay-hovered`.
- Pressed: `surface-pressed`, `surface-raised-pressed`, `surface-overlay-pressed`.
- Dragged: switch to the **overlay** surface + shadow for the duration of the drag, then return to
  the prior plane.

### Rules

- **MUST** pair every `surface-raised` with `shadow-raised`, and every `surface-overlay` with
  `shadow-overlay`. Mixing shadows across planes is a bug.
- **MUST** prefer a border or whitespace to elevation when the goal is grouping, not motion or
  overlap.
- **MUST** use the border-on-scroll treatment (`border` at the clip edge) as the default scroll cue;
  reach for an overflow shadow only when borders would be missed.
- **SHOULD** limit raised/overlay usage on any one screen — "every card is floating" is a Material
  pattern, not an Atlassian one.
- **MUST NOT** author bespoke `box-shadow` values. If the catalog does not cover a case, document
  the gap and ship the closest pairing.

### Z-index scale

| z-index | Example                 |
| ------- | ----------------------- |
| 100     | (reserved)              |
| 200     | Atlassian navigation    |
| 300     | Inline dialog           |
| 400     | Popup                   |
| 500     | Blanket (modal dimming) |
| 510     | Modal                   |
| 600     | Flag                    |
| 700     | Spotlight               |
| 800     | Tooltip                 |

- **MUST** use the scale above for stacking. New overlays slot into an existing bucket; do not
  invent new z-index values.

---

## Shapes

### Corner radius

Atlassian uses a t-shirt radius scale, and each size maps to a class of component. Choose radius by
_what the thing is_, not by taste.

| Token            | rem                                | px   | Component class                                                         |
| ---------------- | ---------------------------------- | ---- | ----------------------------------------------------------------------- |
| `radius-xsmall`  | 0.125rem                           | 2px  | Badges, checkboxes, avatar labels, keyboard shortcuts                   |
| `radius-small`   | 0.25rem                            | 4px  | Lozenges, tags, timestamps, tooltips, table thumbnails, compact buttons |
| `radius-medium`  | 0.375rem                           | 6px  | Buttons, inputs, selects, nav items, smart links                        |
| `radius-large`   | 0.5rem                             | 8px  | Cards, in-page containers, dropdown menus, floating UI                  |
| `radius-xlarge`  | 0.75rem                            | 12px | Modal dialogs, Kanban columns, large containers, tables                 |
| `radius-xxlarge` | 1rem                               | 16px | Video players only                                                      |
| `radius-full`    | 624.9375rem (effectively infinite) | —    | Avatars, pills, user-related UI, emoji reactions                        |
| `radius-tile`    | 25%                                | —    | Tile components only (icon tile, object tile)                           |

Rules:

- **MUST** select radius by the component class table above. A button is `radius-medium`; a card is
  `radius-large`; a modal is `radius-xlarge`.
- **MUST** use `radius-full` for circular avatars and pill-shaped elements.
- **MUST NOT** emit arbitrary radius values like `border-radius: 8px` or `10px`. Map to the nearest
  token step.
- **MUST NOT** use `radius-tile` outside the tile component system.

### Focus ring

- **MUST** apply focus rings with `border-width-focused` (2px) and the `border-focused` color.
- **MUST** offset the ring 2px from the component's bounding box.
- **MUST** set the ring's own radius to the component's radius **+ 2px** (so a `radius-medium`
  button gets a focus ring at `radius-large`).
- **MUST NOT** remove focus outlines without providing the same ring contract by hand (width, color,
  radius + 2px).

---

## Components

The visual recipe (tokens, padding, radius, typography) for each component lives in the YAML
frontmatter at the top of this document under `components:` (e.g. `button-primary`,
`textfield-standard`). This section adds the **behavioural** and **layout** notes that YAML can't
capture: variant lists, when to use which, accessibility contracts, and the rules to follow when
rendering raw HTML/CSS to mimic a component. Token names below are the YAML keys (e.g.
`text-subtle`, `space-150`, `radius-small`).

### Button

- **Appearances (6):** `default`, `primary`, `subtle`, `warning`, `danger`, `discovery`. There is no
  `link` appearance — for anchor semantics use a real `<a>` styled like a `subtle` button, or rely
  on link tokens.
- **Sizing:** default height `2rem` (paddingBlock `space-075`); compact height `1.5rem`
  (paddingBlock `space-025`). PaddingInline is `space-150` in both. A "fit container" mode stretches
  the button to its parent's width.
- **States (all appearances):** disabled, loading (spinner overlay, **no layout shift**), selected
  (maps to `background-selected` + `text-selected` + `border-selected`). Hover and pressed use the
  matching `*-hovered` / `*-pressed` token variants — never hand-author hover fills.
- **Icons:** an icon may sit before or after the label. Icons inherit `currentColor` from the button
  so text and icon share the same token; do not pass a hardcoded icon color.
- **Layout:** corner radius `radius-small`, gap between icon and label `space-050`, typography
  `body` + `weight-medium`.
- **Token bindings per appearance** (the `*-hovered` / `*-pressed` variants follow the same family —
  see YAML `components:` for the full state matrix):

| Appearance     | Background                                                                                 | Text                   | Border (hairline) |
| -------------- | ------------------------------------------------------------------------------------------ | ---------------------- | ----------------- |
| **default**    | `background-neutral-subtle`                                                                | `text-subtle`          | `border`          |
| **primary**    | `background-brand-bold`                                                                    | `text-inverse`         | —                 |
| **subtle**     | `background-neutral-subtle`                                                                | `text-subtle`          | —                 |
| **warning**    | `background-warning-bold`                                                                  | `text-warning-inverse` | —                 |
| **danger**     | `background-danger-bold`                                                                   | `text-inverse`         | —                 |
| **discovery**  | `background-discovery-bold`                                                                | `text-inverse`         | —                 |
| selected (any) | `background-selected` (+ `*-hovered` / `*-pressed`)                                        | `text-selected`        | `border-selected` |
| disabled       | `background-disabled` (primary/warning/danger/discovery) or `transparent` (default/subtle) | `text-disabled`        | `border-disabled` |

- **Button group:** wrap related siblings with `gap` `space-050`. Use for paired actions; not
  appropriate for a long toolbar.
- **Icon-only button:** square `2rem` (default) / `1.5rem` (compact) with `padding: 0`, or circular
  (radius `full`). Appearance set is a **subset** — `default`, `primary`, `discovery`, `subtle` only
  (no `warning` / `danger`). **MUST** carry an accessible name (e.g. `aria-label="Close"`) — without
  one the control is unreadable to assistive tech.

Rules:

- **MUST** use sentence case, imperative verbs (see [Voice and tone](#voice-and-tone)). "Create work
  item", not "Submit" or "OK".
- **MUST NOT** use `primary` for more than one action per section. If you feel tempted to, one of
  them is probably `default`.
- **MUST NOT** use `warning` or `danger` for CTAs that aren't warning or danger — an orange "Save"
  button is a drift pattern.
- **MUST NOT** hand-author hover/pressed fills — every appearance has matching `*-hovered` /
  `*-pressed` tokens.
- **SHOULD** reach for `subtle` (or a styled link) before inventing a "text-only" appearance.

### TextField / input

- **Appearances (3):** `standard` (filled with visible border), `subtle` (transparent until
  hover/focus), `none` (no chrome; for in-place editing and table-cell inputs).
- **States:** hover, focus, invalid, disabled, read-only, compact, required, monospaced (swaps
  typography to `family-code`).
- **Slots:** an element may sit before or after the input inline — use for icons (search, copy),
  currency prefixes, clear buttons. There is no token gap between slots and the input; spacing comes
  from the input's own padding.
- **Token bindings by appearance** (the `*-hovered` / `*-pressed` / invalid families follow the same
  shape; see YAML `components:` for the full state matrix):

| Appearance   | Background (rest)  | Background (hover)         | Border (rest)  | Border (focus)   | Border (invalid) |
| ------------ | ------------------ | -------------------------- | -------------- | ---------------- | ---------------- |
| **standard** | `background-input` | `background-input-hovered` | `border-input` | `border-focused` | `border-danger`  |
| **subtle**   | `transparent`      | `background-input-hovered` | `transparent`  | `border-focused` | `border-danger`  |
| **none**     | `transparent`      | `transparent`              | `transparent`  | transparent ring | `border-danger`  |

- **Layout:** padding block `space-075` (default) / `space-025` (compact); padding inline
  `space-075`. Container padding block compensates for the 1px border (`paddingBlock` =
  `border-width`) so visible height stays on the 8px rhythm. Corner radius `radius-small`.
- **Typography:** input value is `body-large` below `30rem` viewport, `body` at and above. Don't
  override unless you need monospaced (`family-code`).
- **Placeholder:** `text-subtlest`. Placeholder MUST NOT be the only label — pair with a real
  `<label>`.
- **Focus ring:** `border-focused` plus an inset `box-shadow` of `border-width` in the same color
  (so the ring reads as ~2px total without layout shift). Invalid uses the same pattern with
  `border-danger`.
- **Disabled:** `background-disabled`, `text-disabled` (text, placeholder, and icons all shift),
  `cursor: not-allowed`.
- **Form wiring around the input** (label, helper, error, valid messages):
  - Label: `family-body`, `body-small`, `weight-bold`, color `text-subtle`; `margin-block-end` =
    `space-050`.
  - Helper / error / valid messages: `body-small`, `margin-block-start` = `space-050`, gap
    `space-075`. Helper uses `text-subtlest`, error `text-danger`, valid `text-success`.
  - Wire `aria-invalid`, `aria-describedby` (helper/error/valid IDs), and `aria-labelledby`
    yourself; wrap messages in an `aria-live="polite"` region so validation announcements reach
    assistive tech.

Rules:

- **MUST** provide a visible label (`<label for>`). Placeholder-as-label is banned — placeholder
  disappears on input and is unreliable for assistive tech.
- **MUST** set `aria-invalid` and associate an error element via `aria-describedby` for the invalid
  state.
- **MUST** use the compact size only in dense surfaces (tables, inline filters) — never as a
  default.
- **MUST NOT** render `subtle` or `none` without a visual affordance that the field is editable
  (hover border, icon, or surrounding chrome). An invisible input is a UX bug.
- **MUST NOT** put interactive elements in the slot-before / slot-after unless you handle focus
  order — nested interactives inside a labelled input break keyboard navigation.

### Select / Checkbox / Radio

- **Checkbox radius** `radius-xsmall` (2px). **Select radius** `radius-medium` (6px).
- Use native form controls with the same radii, borders, and focus/disabled colors from the token
  tables — never browser defaults alone.

### Card

- Single surface tile. Fill `surface`, hairline `border`, radius `radius-large` (8px). Use raised
  surface + paired shadow only when the card is movable (see
  [Elevation & Depth](#elevation--depth)).
- Padding `space-200` (16px) for compact cards; `space-300` (24px) default.

### Modal / Dialog

- Surface `surface-overlay` + paired `shadow-overlay`; radius `radius-xlarge` (12px); body padding
  `space-400` (32px); footer gap `space-200`.
- Footer button order: primary action **right**, cancel **left**.
- Use a `<dialog>` element or a `role="dialog"` region with focus trap and Escape-to-dismiss (see
  [Accessibility](#accessibility)).

### Flag / Toast / Banner / Section message

- **Flag (toast):** overlay surface + overlay shadow + `radius-large`.
- **Banner (persistent, page-wide):** semantic `*-bold` background with `text-inverse` (or
  `text-warning-inverse` for warning).
- **Section message (inline on a page):** semantic `*` (default-emphasis) background — e.g.
  `background-information`, `background-warning`, `background-success` — with **neutral** text
  (`text` for the title, `text-subtle` for supporting copy). The semantic colour is carried by the
  background and the leading icon, not by the prose. Tinting the body text blue on a blue
  information background is the common drift pattern; don't.
- **Layout (all four):** a leading 16px icon in a left gutter, content flowing to the right. Icon
  colour matches the role (`icon-information`, `icon-warning`, `icon-success`, `icon-danger`,
  `icon-discovery`). Gap between icon and content is `space-100`. Padding is `space-200` on all
  sides. Corner radius `radius-small` (section message / banner) or `radius-large` (flag).
- **Content shape:** title → reason → what the user can do → (optional) link to detail. Title in
  `body` + `weight-bold`; body in `body` + `weight-regular`. See [Voice and tone](#voice-and-tone).
- **MUST NOT** omit the icon. A section message without an icon reads as a plain coloured box and
  loses its semantic affordance.

### Lozenge / Tag / Badge

All three render as short, single-line pills. Sentence case, no ALL CAPS, no letter-spacing — see
[Typography](#typography).

| Property                 | Lozenge                                                                                              | Tag                                                                               | Badge                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Purpose                  | Semantic status ("In progress")                                                                      | Decorative / categorical ("Design", user-chosen)                                  | Numeric count (unread, notifications)                                         |
| Radius                   | `radius-small`                                                                                       | `radius-small`                                                                    | `radius-xsmall`                                                               |
| Typography               | `body-small` (12px / 1rem)                                                                           | `body-small` (12px / 1rem)                                                        | `body-small` (12px / 1rem)                                                    |
| Font weight              | `weight-bold` (653)                                                                                  | `weight-medium` (500)                                                             | `weight-bold` (653)                                                           |
| Padding (block / inline) | `space-025` / `space-075`                                                                            | `space-025` / `space-100`                                                         | `space-025` / `space-075` (min width `1rem`)                                  |
| Color pairing            | Semantic `*-subtler` bg + `text-*-bolder` text (or `*-bold` bg + `text-inverse` for "bold" emphasis) | Accent `*-subtler` bg + `text-accent-<hue>` (see accent-ramp pairing rules below) | Neutral (`background-neutral` + `text`) or semantic `*-bold` + `text-inverse` |

**Accent-ramp pairing (tags specifically) — cross-referenced from [Colors](#colors):**

- `background-accent-<hue>-subtler` pairs with `text-accent-<hue>` (resting).
- `background-accent-<hue>-subtle` pairs with `text-accent-<hue>-bolder` (stronger emphasis).
- Tags never use `*-bolder` backgrounds.

Rules:

- **MUST NOT** use a tag for status — status is a lozenge. "Done" is semantic, not categorical.
- **MUST NOT** use `weight-regular` (400) on any of the three — the small size needs the heavier
  weight for legibility.
- **MUST** keep each to a single line; truncate with ellipsis if content overflows the container.

### Tooltip

- Floating element with overlay surface + overlay shadow + `radius-small`; typography `body-small`;
  max-width ~240px; padding `space-050` / `space-100`.
- Don't rely only on `title=""` for rich content — it isn't keyboard-accessible.

### Empty state

- Small heading (sentence case) → `body` explanation → primary CTA (imperative verb). Optional
  illustration (see [Iconography and imagery](#iconography-and-imagery)).
- Always include a next step; "No data" alone is a dead-end.

### Table

- **Typography — cells:** `body` (14px / 1.25rem), `weight-regular`, colour `text`. This is the
  default; don't drop to `body-small` to gain density (12px is for lozenges, tags, badges, captions,
  and helper text, not tabular data the user has to read).
- **Typography — header:** `body-small` (12px / 1rem), `weight-medium` (500), colour `text-subtle`.
  Sentence case — table headers are not exempt from the [no ALL CAPS rule](#typography).
- **Spacing:** row padding `space-100` (block) / `space-200` (inline). For dense / compact tables
  use `space-075` / `space-150`; reserve for read-only data views (filters, admin lists), never
  primary content.
- **Dividers:** pick borders **or** zebra striping per table, not both. Row separators use `border`;
  zebra uses `background-neutral-subtle` on alternating rows.
- **States:** row hover `background-neutral-subtle-hovered`; selected row `background-selected` +
  `text-selected`.
- **Numeric columns:** right-align; use `family-code` (`font.code`) for figures that need to align
  decimal-by-decimal.
- **MUST NOT** render table column headers in ALL CAPS or `letter-spacing`-stretched uppercase — see
  [Typography](#typography).
- **MUST NOT** shrink cell typography below `body` to fit more rows. If the table is too wide, let
  it scroll horizontally (see [Elevation overflow](#elevation--depth)).

### Page layout and navigation

- Use semantic regions (`<header>`, `<nav>`, `<main>`) and spacing from [Layout](#layout). Keep the
  visual rhythm consistent across pages — don't fork the layout shell per surface.

### Charts

- **MUST** map series colors to `chart-*` tokens; cite the categorical palette from
  [Colors](#colors).
- **MUST** add pattern/shape or labels so charts work in grayscale.
- **MUST** use `body-small` on axes, `body` for titles, `family-code` for dense numeric ticks.

### Slides and non-code artifacts (images, decks, email, PDF)

For output where no runtime resolves tokens:

- **MUST** pick a single theme up front — light or dark — and use the matching hex anchors from
  [Colors](#colors). **MUST NOT** mix hex from both themes in the same artifact.
- **MUST** specify the font family by name (Atlassian Sans, or Charlie Display for marketing decks)
  so downstream tools can substitute via the standard fallback stack.
- **MUST** keep neutrals dominant: `surface` hex as the background, `text` hex for body,
  `text-subtle` for captions, `text-brand` for a single accent line per slide.
- **MUST** use `space-400`–`space-800` (32–64px) as slide margins, not arbitrary values like "1
  inch".
- **SHOULD** limit each slide to one semantic accent.
- **SHOULD** default to light theme for external audiences; use dark only when demonstrating a
  dark-themed product surface.

---

## Do's and Don'ts

The scan-friendly TL;DR. Each line is a drift pattern the model MUST correct on sight. Tokens are
referenced by their YAML key (e.g. `text`, `space-200`, `radius-medium`); the corresponding hex
values are in [Colors](#colors).

| DO                                                                                                                                                                                  | DON'T                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hex anchors mapped to a token (e.g. `text` → `#CECFD2`)                                                                                                                             | Arbitrary one-off hex (`color: '#172B4D'`) with no token mapping                                                                                              |
| Padding / margin / gap on a `space-*` step (`space-200`)                                                                                                                            | `padding: 16px` not aligned to a token step                                                                                                                   |
| Corner radius from `radius-*` (`radius-medium`)                                                                                                                                     | `border-radius: 6px` not aligned to a token                                                                                                                   |
| Elevation via `shadow-overlay` / `shadow-raised` recipe                                                                                                                             | Hand-authored `box-shadow` values                                                                                                                             |
| `surface-raised` paired with `shadow-raised`                                                                                                                                        | Raised surface with no paired shadow                                                                                                                          |
| `background-danger-bold` for destructive CTAs                                                                                                                                       | `background-accent-red-bolder` for destructive CTAs (accent ≠ semantic)                                                                                       |
| Button per [Components](#components) (Button) recipe                                                                                                                                | `<button>` with arbitrary inline hex                                                                                                                          |
| Input per [Components](#components) (TextField) recipe                                                                                                                              | Raw `<input>` with arbitrary colors                                                                                                                           |
| Status as Lozenge (semantic role)                                                                                                                                                   | Decorative Tag treatment for status                                                                                                                           |
| Sentence case ("Create work item")                                                                                                                                                  | Title Case ("Create Work Item")                                                                                                                               |
| Sentence-case heading, optionally beside a lozenge                                                                                                                                  | ALL CAPS / letter-spaced "EYEBROW" or "OVERLINE" label above a heading                                                                                        |
| Paragraphs, list items, descriptions in `text`                                                                                                                                      | Paragraph body text in `text-subtle` to "differentiate it from headings"                                                                                      |
| Section message: semantic background + neutral text + role icon                                                                                                                     | Section message with blue prose on blue background (tinted body text)                                                                                         |
| `surface` as the page / artifact canvas, cards on top with `border`                                                                                                                 | `surface-sunken` as the page background to create contrast against cards                                                                                      |
| `surface` + `border` cards, `surface-sunken` only inside structural wells                                                                                                           | `surface-sunken` on info blocks, stat tiles, settings rows, or "grouped" content containers                                                                   |
| Table cells in `body` (14px)                                                                                                                                                        | Table cells shrunk to `body-small` / 12px / 13px for density                                                                                                  |
| Atlassian core icon (16px) for chevrons, checks, arrows, warnings                                                                                                                   | Unicode / emoji / HTML-entity glyphs like `›` `→` `▶` `✓` `✕` `…` `⚠` as icons                                                                                |
| `icon-subtle` / `icon-subtlest` for secondary indicators (list bullets, chevrons, sort arrows)                                                                                      | `icon-brand` as the default "important" icon colour, or raw hex for a secondary indicator                                                                     |
| Chevrons drawn at 12px 'small' size in buttons and menus. 16px chevrons only used when the chevron is the sole indicator for an action and looks too small alone, like an accordion | 16px "medium" sized chevrons used in dropdown menus                                                                                                           |
| Full selected triad (`background-selected` + `border-selected` 2px + `text-selected`) on the active/current item                                                                    | Only the selected border, only the selected background, or `border-brand` / `text-brand` standing in for selected                                             |
| Imperative CTA ("Save", "Delete")                                                                                                                                                   | "Submit", "OK", "Click here"                                                                                                                                  |
| Descriptive link ("Learn about permissions")                                                                                                                                        | "Learn more", "Click here"                                                                                                                                    |
| Error: reason + action                                                                                                                                                              | Error: "Oops, something went wrong. Please try again."                                                                                                        |
| Empty state with next-step CTA                                                                                                                                                      | "No data" / "Nothing here yet"                                                                                                                                |
| Official Atlassian icons at 16px (or mimic [Iconography and imagery](#iconography-and-imagery))                                                                                     | Material Symbols / Lucide / Heroicons                                                                                                                         |
| Atlassian Sans in product                                                                                                                                                           | Inter / SF Pro / Roboto / legacy web font families in product                                                                                                 |
| Charlie on marketing surfaces                                                                                                                                                       | Charlie in product settings pages                                                                                                                             |
| Focus ring per [Shapes](#shapes) → Focus ring                                                                                                                                       | `outline: none` with no replacement                                                                                                                           |
| `prefers-reduced-motion` respected                                                                                                                                                  | Auto-playing loops on dashboards                                                                                                                              |
| Accessible name on every icon-only control (`aria-label`)                                                                                                                           | Icon-only buttons with no accessible name                                                                                                                     |
| Stack / flex `gap` at token steps (e.g. `space-150`)                                                                                                                                | `gap: 12px` off the rhythm                                                                                                                                    |
| Semantic surface + `border-*` for callouts                                                                                                                                          | Thick colored `border-left` / `border-right` > 1px as sole callout emphasis ([Design rigor and anti-template checks](#design-rigor-and-anti-template-checks)) |
| Solid `text-*` + `weight-*` for hierarchy                                                                                                                                           | Gradient-filled text (`background-clip: text` + gradient) ([Design rigor and anti-template checks](#design-rigor-and-anti-template-checks))                   |
| `chart-*` / semantic roles / accent ramps from [Colors](#colors)                                                                                                                    | Cyan–purple–neon decorative palettes not mappable to ADS tokens                                                                                               |
| Single card surface + `border` ([Components](#components) — Card)                                                                                                                   | Nested card-on-card or stacked floating shadows everywhere                                                                                                    |
| Restrained metrics per [Components](#components)                                                                                                                                    | Default "hero metric" template (giant number + tiny label + stat row + gradient)                                                                              |

---

## Iconography and imagery

### Icons

- **MUST** use Atlassian's official icon set (core, utility, logo, object, file-type). Where you
  only have generic assets, match the visual language: 1.5px stroke, rounded exterior corners, sharp
  interior corners, square line caps, straight-on metaphors (no diagonal or 3D).
- **MUST NOT** mix in Material Symbols, Lucide, Heroicons, Feather, or other families. Atlassian
  icons read as a dialect — mixing breaks coherence immediately.
- **Sizes:** **16px** is the default for every product surface. **12px** only for chevrons, field
  validation, dense chips, app-affiliation icons, and secondary action indicators. **MUST NOT**
  scale icons to 20px or larger — for any larger presentation use an [icon tile](#icontile--tile)
  (which renders the icon at 16px inside a 20–48px tile) or, for empty-state and welcome surfaces,
  an illustration from the spot/scene library.
- **Color:** apply via `icon-*` tokens. Pair with the matching text token (e.g. `icon-subtlest`
  pairs with `text-subtlest`). **MUST NOT** tint an icon with a raw hex outside the `icon-*` palette
  — if a color isn't in `icon-*`, document the gap rather than working around it.
- **MUST** use `icon-subtle` or `icon-subtlest` for secondary indicators — list bullets, chevron
  markers, breadcrumb separators, sort arrows, disclosure carets, and decorative affordances that
  are **not** the primary action. Reserve `icon-brand` for icons that represent the primary CTA or
  an intentional brand moment; it is not a default "important icon" colour.
- **MUST NOT** substitute Unicode characters, HTML entities, or emoji for icons. If a UI element
  functions as a directional indicator, status marker, or action affordance and there is a
  corresponding glyph in this guidance, use the icon — not text characters like `›` `→` `▶` `✓` `✕`
  `…` `★` `⚠` or OS emoji. Text glyphs do not inherit `icon-*` token colours, cannot be sized
  independently of the font, and drift visually from the 1.5px-stroke Atlassian icon dialect. For
  cases where a bullet or separator is genuinely typographic (inline body text, breadcrumb
  separators in `text-subtlest`), a hyphen / middle-dot / slash is fine — the rule is about
  replacing an _icon_ with a character, not about forbidding punctuation.
- **Accessibility:** every icon needs an accessible name (`aria-label` on the wrapper, or an
  `aria-label`-bearing parent control) unless it is purely decorative — in which case mark it
  `aria-hidden="true"`.

### Core icon SVGs (the 20 most-used)

When you're generating output where you can't reference an icon component (static HTML, slides,
PDFs, email), paste the SVG inline. Each icon below is the **exact** 16×16 `core` glyph from the
official Atlassian set, ranked by approximate frequency of use in typical product UI. Every SVG uses
`fill="currentcolor"` — set the parent element's `color` to an `icon-*` hex (e.g. `color: #F15B50`
for `icon-danger`) and the icon follows.

Rules for inline SVGs:

- **MUST** size via `width` / `height` on the SVG (or wrapper), not by mutating the `viewBox`.
  Supported sizes match [Icons](#icons): **12 or 16 px only**. For larger visual emphasis use an
  [icon tile](#icontile--tile), not a scaled-up icon.
- **MUST** set an accessible name. For **meaningful** icons add `role="img"` + `aria-label="..."` on
  the `<svg>`. For **decorative** icons add `aria-hidden="true"` and rely on adjacent text.
- **MUST NOT** recolor by editing `fill` on the `<path>`. Change `color` on the wrapper.
- **MUST NOT** paste these as `<img src="data:...">` or as `<img src="icon.svg">` with a hardcoded
  fill — you lose theming.

`#` is the rank; higher rank means the icon tends to appear more often in common product patterns.

| #   | Name                   | Common use                                               | SVG                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ---------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `chevron-down`         | Disclosure, dropdown triggers, expand/collapse           | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" d="m14.53 6.03-6 6a.75.75 0 0 1-1.004.052l-.056-.052-6-6 1.06-1.06L8 10.44l5.47-5.47z"/></svg>`                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2   | `cross`                | Close, dismiss, clear input, remove chip                 | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" d="M14.03 3.03 9.06 8l4.97 4.97-1.06 1.06L8 9.06l-4.97 4.97-1.06-1.06L6.94 8 1.97 3.03l1.06-1.06L8 6.94l4.97-4.97z"/></svg>`                                                                                                                                                                                                                                                                                                                                                                                         |
| 3   | `status-error`         | Error state — pair with `icon-danger`                    | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" fill-rule="evenodd" d="M6.586.603a2 2 0 0 1 2.828 0l5.983 5.983a2 2 0 0 1 0 2.828l-5.983 5.982a2 2 0 0 1-2.828 0L.604 9.414a2 2 0 0 1 0-2.828zM8 10.25a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-.75-6.5V9h1.5V3.75z" clip-rule="evenodd"/></svg>`                                                                                                                                                                                                                                                                                |
| 4   | `add`                  | Add item, create, new                                    | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" fill-rule="evenodd" d="M7.25 8.75V15h1.5V8.75H15v-1.5H8.75V1h-1.5v6.25H1v1.5z" clip-rule="evenodd"/></svg>`                                                                                                                                                                                                                                                                                                                                                                                                          |
| 5   | `show-more-horizontal` | Overflow menu, "more actions"                            | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" fill-rule="evenodd" d="M0 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0m6.5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0M13 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0" clip-rule="evenodd"/></svg>`                                                                                                                                                                                                                                                                                                                                     |
| 6   | `status-warning`       | Warning state — pair with `icon-warning`                 | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" fill-rule="evenodd" d="M6.242 1.168c.756-1.395 2.76-1.395 3.516 0l5.9 10.878c.723 1.333-.242 2.953-1.758 2.953H2.1C.584 15-.38 13.38.342 12.046zM8 10.75a1 1 0 1 0 0 2.001 1 1 0 0 0 0-2M7.25 4.5v5h1.5v-5z" clip-rule="evenodd"/></svg>`                                                                                                                                                                                                                                                                            |
| 7   | `status-information`   | Info state — pair with `icon-information`                | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" fill-rule="evenodd" d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0M6.5 6.75v1.5h.75v4.25h1.5v-5A.75.75 0 0 0 8 6.75zM8 3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2" clip-rule="evenodd"/></svg>`                                                                                                                                                                                                                                                                                                                                           |
| 8   | `chevron-right`        | Breadcrumb separator, navigation forward, tree expand    | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" d="m6.03 1.47 6 6a.75.75 0 0 1 .052 1.004l-.052.056-6 6-1.06-1.06L10.44 8 4.97 2.53z"/></svg>`                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 9   | `link-external`        | "Opens in new tab" affordance                            | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" fill-rule="evenodd" d="M3 2.5a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5v-3H15v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h3v1.5zM10 1h4.25a.75.75 0 0 1 .75.75V6h-1.5V3.56L7.53 9.53 6.47 8.47l5.97-5.97H10z" clip-rule="evenodd"/></svg>`                                                                                                                                                                                                                                                          |
| 10  | `search`               | Search input, filter                                     | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" fill-rule="evenodd" d="M7 2.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9M1 7a6 6 0 1 1 10.74 3.68l3.29 3.29-1.06 1.06-3.29-3.29A6 6 0 0 1 1 7" clip-rule="evenodd"/></svg>`                                                                                                                                                                                                                                                                                                                                                 |
| 11  | `status-success`       | Success state — pair with `icon-success`                 | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" fill-rule="evenodd" d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0M6.75 9.828 4.826 7.52l-1.152.96 2.5 3a.75.75 0 0 0 1.152 0l5-6-1.152-.96z" clip-rule="evenodd"/></svg>`                                                                                                                                                                                                                                                                                                                                                     |
| 12  | `edit`                 | Edit in place, rename                                    | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" fill-rule="evenodd" d="M11.586.854a2 2 0 0 1 2.828 0l.732.732a2 2 0 0 1 0 2.828L10.01 9.551a2 2 0 0 1-.864.51l-3.189.91a.75.75 0 0 1-.927-.927l.91-3.189a2 2 0 0 1 .51-.864zm1.768 1.06a.5.5 0 0 0-.708 0l-.585.586L13.5 3.94l.586-.586a.5.5 0 0 0 0-.708zM12.439 5 11 3.56 7.51 7.052a.5.5 0 0 0-.128.216l-.54 1.891 1.89-.54a.5.5 0 0 0 .217-.127zM3 2.501a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V10H15v3.001a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2h3v1.5z" clip-rule="evenodd"/></svg>` |
| 13  | `delete`               | Destructive remove — pair with `icon-danger` when active | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" fill-rule="evenodd" d="M5 .75A.75.75 0 0 1 5.75 0h4.5a.75.75 0 0 1 .75.75V2.5h3.5V4h-1v10a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V4h-1V2.5H5zM6.5 2.5h3v-1h-3zM4 4v10a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V4zm1.75 9V5.5h1.5V13zm3 0V5.5h1.5V13z" clip-rule="evenodd"/></svg>`                                                                                                                                                                                                                                                  |
| 14  | `check-mark`           | Selected, confirmed, done                                | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" d="m13.959 3.97-7.25 9a.75.75 0 0 1-1.163.007l-3.5-4.25 1.158-.954 2.914 3.539 6.673-8.283z"/></svg>`                                                                                                                                                                                                                                                                                                                                                                                                                |
| 15  | `lock-locked`          | Restricted access, private                               | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" fill-rule="evenodd" d="M8 1.5A2.5 2.5 0 0 0 5.5 4v3h5V4A2.5 2.5 0 0 0 8 1.5M12 7V4a4 4 0 0 0-8 0v3a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2M4 8.5a.5.5 0 0 0-.5.5v5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V9a.5.5 0 0 0-.5-.5zM7.25 13v-3h1.5v3z" clip-rule="evenodd"/></svg>`                                                                                                                                                                                                                      |
| 16  | `arrow-right`          | "Continue", "next step", CTA trailing icon               | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" fill-rule="evenodd" d="M12.44 7.25 8.72 3.53l1.06-1.06 5 5a.75.75 0 0 1 0 1.06l-5 5-1.06-1.06 3.72-3.72H1v-1.5z" clip-rule="evenodd"/></svg>`                                                                                                                                                                                                                                                                                                                                                                        |
| 17  | `chevron-up`           | Collapse, sort-ascending indicator                       | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" d="m14.53 9.97-6-6a.75.75 0 0 0-1.004-.052l-.056.052-6 6 1.06 1.06L8 5.56l5.47 5.47z"/></svg>`                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 18  | `calendar`             | Date picker, scheduling                                  | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" fill-rule="evenodd" d="M4.5 2.5v2H6v-2h4v2h1.5v-2H13a.5.5 0 0 1 .5.5v3h-11V3a.5.5 0 0 1 .5-.5zm-2 5V13a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V7.5zm9-6.5H13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1.5V0H6v1h4V0h1.5z" clip-rule="evenodd"/></svg>`                                                                                                                                                                                                                                             |
| 19  | `link`                 | Inline hyperlink, copy link action                       | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" fill-rule="evenodd" d="M8.22 2.22a3.932 3.932 0 1 1 5.56 5.56l-2.25 2.25-1.06-1.06 2.25-2.25a2.432 2.432 0 0 0-3.44-3.44L7.03 5.53 5.97 4.47zm3.06 3.56-5.5 5.5-1.06-1.06 5.5-5.5zM2.22 8.22l2.25-2.25 1.06 1.06-2.25 2.25a2.432 2.432 0 0 0 3.44 3.44l2.25-2.25 1.06 1.06-2.25 2.25a3.932 3.932 0 1 1-5.56-5.56" clip-rule="evenodd"/></svg>`                                                                                                                                                                       |
| 20  | `information-circle`   | Informational callout, helper-text icon                  | `<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentcolor" fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.25.25H6.5v-1.5H8a.75.75 0 0 1 .75.75v5h-1.5z" clip-rule="evenodd"/><path fill="currentcolor" d="M9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/></svg>`                                                                                                                                                                                                                                                                  |

**Usage example (HTML — hex values match the theme in this file's frontmatter (`theme:`); pick one
theme per artifact and do not mix light and dark hex):**

```html
<!-- meaningful icon: give it an accessible name. color = icon-danger (#F15B50) -->
<span style="color: #F15B50; display: inline-flex;">
	<svg width="16" height="16" fill="none" viewBox="0 0 16 16" role="img" aria-label="Error">
		<path
			fill="currentcolor"
			fill-rule="evenodd"
			d="M6.586.603a2 2 0 0 1 2.828 0l5.983 5.983a2 2 0 0 1 0 2.828l-5.983 5.982a2 2 0 0 1-2.828 0L.604 9.414a2 2 0 0 1 0-2.828zM8 10.25a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-.75-6.5V9h1.5V3.75z"
			clip-rule="evenodd"
		/>
	</svg>
</span>

<!-- decorative icon inside a labelled button: hide from AT -->
<button type="button" aria-label="Close">
	<svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true">
		<path
			fill="currentcolor"
			d="M14.03 3.03 9.06 8l4.97 4.97-1.06 1.06L8 9.06l-4.97 4.97-1.06-1.06L6.94 8 1.97 3.03l1.06-1.06L8 6.94l4.97-4.97z"
		/>
	</svg>
</button>
```

If you need an icon that isn't in this list, obtain the matching **core** SVG from the official
Atlassian Design System icon library on
[`atlassian.design`](https://atlassian.design/components/icon) — hundreds of core glyphs exist; this
section only surfaces the most common twenty.

### IconTile / Tile

When you need an icon at a size larger than 16px — feature highlights, category lists, content-type
chips, settings rows, "what's new" cards — **never** scale a core icon up. Use an **icon tile**
instead: a sized, colored container with the icon kept at 16px in the center.

Three flavors of tile exist as a concept:

- **Tile** — the generic primitive: a sized box with an optional background, border, and inset
  padding. Slot any asset into it (icon, avatar, custom SVG, file-type chip, product logo).
- **IconTile** — the icon-specific convenience built on top of `Tile`. Picks an `appearance` (color
  preset) and a `size`, and renders a 16px core icon centered in the tile with the right token
  bindings.
- **ObjectTile** — the variant for Atlassian-specific content types (page, live doc, bug). Use this
  whenever you'd otherwise pick a custom icon for a Jira / Confluence object.

**Sizes** — Tile and IconTile share the scale, except IconTile drops the 16px row (at that size you
should just use a bare icon):

| Size      | Tile px | IconTile?     | When to use                                                       |
| --------- | ------- | ------------- | ----------------------------------------------------------------- |
| `xxsmall` | 16      | —             | Tile only. For an icon at 16px use [Icons](#icons), not IconTile. |
| `xsmall`  | 20      | yes           | Inline-with-text emphasis, dense lists.                           |
| `small`   | 24      | yes           | List rows, settings rows, secondary nav items.                    |
| `medium`  | 32      | yes (default) | Cards, feature rows, primary nav, "what's new" entries.           |
| `large`   | 40      | yes           | Hero blocks within a card, single-feature highlights.             |
| `xlarge`  | 48      | yes           | Section headers, top-of-page feature anchors.                     |

**Color presets** — 20 token-backed appearances, one per accent color × emphasis: `gray`, `blue`,
`teal`, `green`, `lime`, `yellow`, `orange`, `red`, `magenta`, `purple` (subtle background) plus the
same names with a `Bold` suffix (`grayBold`, `blueBold`, …) for the bold variant. Each maps to:

- subtle: background `background-accent-<color>-subtler` + icon `icon-accent-<color>`
- bold: background `background-accent-<color>-bolder` + icon `icon-inverse`

**MUST NOT** override the color outside this palette — pick the closest preset, or document the gap.

**Shape** — `square` (default, uses tile radius — `radius-medium` for most sizes, `radius-large` at
`xlarge`) or `circle` (`radius-full`). Square is the default product look; reserve `circle` for
avatar-adjacent usage and personality moments.

Best practices:

- **MUST** match tile size to the height of adjacent content for visual balance (e.g. `medium`
  (32px) next to a two-line card title; `xsmall` (20px) inline with body copy).
- **MUST** give every tile an accessible name. If the surrounding text already names the thing, mark
  the tile decorative (`aria-hidden="true"` on the SVG and no `aria-label` on the wrapper).
- **SHOULD** use the subtle appearance for grouped or repeating elements (lists, settings,
  navigation). Reserve **bold** for **stand-alone** moments — a single hero card, an empty state —
  never as the primary decoration in a list of 5+ rows.
- **SHOULD** use a plain Tile (not IconTile) when the asset is not a core icon — avatars,
  illustrations, custom SVG marks, file-type chips, product logos.
- **SHOULD NOT** pair an icon tile with a single line of body copy — at that density the tile
  out-shouts the text. Use a 16px icon instead.
- **MUST NOT** use IconTile to "make an icon visible" at a small size — if a 16px icon doesn't read,
  the issue is contrast or the wrong icon, not size.
- **MUST NOT** mix tile sizes within a single repeating list. Pick one and stick to it for the whole
  row set.

**Plain HTML / non-React fallback** (hex values match the theme in this file's frontmatter
(`theme:`); pick one theme per artifact and do not mix light and dark hex):

```html
<!-- A 32px square icon tile equivalent: blue subtle bg, blue accent icon -->
<!-- background = background-accent-blue-subtler (#123263), color = icon-accent-blue (#4688EC) -->
<span
	role="img"
	aria-label="Add"
	style="
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 0.375rem;
    background: #123263;
    color: #4688EC;
  "
>
	<svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true">
		<path
			fill="currentcolor"
			fill-rule="evenodd"
			d="M7.25 8.75V15h1.5V8.75H15v-1.5H8.75V1h-1.5v6.25H1v1.5z"
			clip-rule="evenodd"
		/>
	</svg>
</span>
```

Match the wrapper width/height to the size table above (`1.25rem` / `1.5rem` / `2rem` / `2.5rem` /
`3rem` for xsmall → xlarge), keep the inner glyph at 16px, and pair
`background-accent-<color>-subtler` with `icon-accent-<color>` (or
`background-accent-<color>-bolder` with `icon-inverse` for the bold variant).

### Imagery and illustrations

- **SHOULD** keep product UI imagery-light. Photography and illustration belong in onboarding, empty
  states, and marketing surfaces.
- **MUST** use Atlassian's illustration library (spots, scenes) in empty states, not stock
  illustrations.
- **MUST NOT** place photography behind body text or form fields (legibility).

### Logos

- **MUST** use official Atlassian logo artwork only — no recolor, no drop shadows, no strokes, no
  container backgrounds.
- **MUST** maintain minimum clearance around the logo equal to the cap-height of the wordmark.
- **MUST NOT** resize or reposition the tile within a logo mark.
- **Alt text conventions:** for the corporate mark, `alt="Atlassian"`. For app logos, `alt="Jira"`,
  `alt="Confluence"`, etc. For app-affiliation lockups, `alt="Jira by Atlassian"`.

---

## Motion

Atlassian motion is **restrained**: it supports comprehension (where did that modal come from?) and
signals state change (success flash), not decoration.

- **MUST** respect `prefers-reduced-motion: reduce` — disable or drastically shorten non-essential
  transitions (see [Accessibility](#accessibility) — Motion and flashing).
- **MUST** keep transitions short — typically ≤200ms for small UI, ≤400ms for larger surface moves.
  Long transitions feel slow and blocking.
- **MUST NOT** animate elevation _and_ surface-color change at the same time — pick one cue.
- **MUST NOT** use motion to compensate for unclear hierarchy. If the user can't find the primary
  action, motion won't fix it.
- **MUST NOT** use bounce, elastic, or spring-style easing curves (`cubic-bezier` with overshoot,
  bounce-style `steps`) in product UI — motion should decelerate smoothly (`ease-out`,
  `ease-in-out`, or equivalent).
- **SHOULD** prefer `transform` and `opacity` (including `translate`, subtle `scale`) for
  transitions, not `width` / `height` / `padding` / `margin` / `top` / `left` — layout-affecting
  animation is harder to keep smooth and accessible.
- **SHOULD NOT** auto-play looping animations on dashboards or content-dense screens.

**Gap acknowledged:** the system does not ship a canonical duration/easing token set yet. When
motion is unavoidable, document the chosen duration/easing inline and keep it close to 150–200ms
with `ease-out` or `ease-in-out`.

---

## Voice and tone

Atlassian voice is **Bold, Optimistic, Practical — with a wink.** Tone shifts across contexts (error
vs. success, trial vs. power user) but voice stays consistent.

### Rules that apply everywhere

- **MUST** write in sentence case (see [Typography](#typography)).
- **MUST** use active voice.
- **MUST** prefer short sentences and plain language.
- **SHOULD** use contractions ("you're", "we'll") with curly apostrophes.
- **MUST NOT** use jargon, idioms, or metaphors that don't translate across cultures.
- **MUST NOT** use "please" or "sorry" in error messages. Empathy is shown by precision, not
  courtesy words.
- **MUST NOT** address the user as "you" when the message is about what the system did ("We couldn't
  save your changes", not "You failed to save").

### Errors

Structure: **reason + what to do + (optional) consequence or link**.

- Title (if the component has one): what went wrong, scannable, max ~6 words.
- Body: one sentence on reason, one on resolution.
- **MUST** use imperative CTAs ("Try again", "Reconnect", "Sign in"). **MUST NOT** use "OK".
- **MUST NOT** invent causes. If the server didn't tell us why, say "Something went wrong" + offer a
  retry, don't guess.
- **MUST NOT** use exclamation marks in error titles.

Example:

- **DO** — "Can't reach Jira. Check your network and try again."
- **DON'T** — "Oops! Sorry, an error has occurred. Please try again later."

### Empty states

Structure: **why empty + what the user can do next + primary CTA**.

- **MUST** explain what will populate this space and how to make it happen.
- **MAY** include a tasteful wink in the title when the empty state isn't an error (a new board, a
  new project).
- **MUST NOT** leave dead ends. Every empty state has a next step.

Example:

- **DO** — "Your first board is a click away. Create a project to start tracking work."
- **DON'T** — "No data to display."

### Success and confirmation

- **MUST** confirm what happened and where to see the result. "Page published. View it in Spaces."
- **SHOULD** allow one-click undo for reversible actions.
- **MUST NOT** use multiple exclamation marks or emoji in product confirmation text.

### Buttons and labels

- **MUST** use imperative verbs: "Save", "Delete", "Invite", "Publish".
- **MUST NOT** use articles in tight actions ("Create password", not "Create a password").
- **MUST NOT** use "Submit", "OK", "Click here" — they carry no meaning. The button label SHOULD
  name the action.

### Links

- **MUST** use descriptive link text that makes sense out of context. A screen reader listing links
  should expose meaning.
- **MUST NOT** use "Learn more", "Click here", "Here", or "Read more" as the full link text. Pair
  with context: "Learn more about permissions", or rewrite the sentence.

### Inclusive language

- **MUST** use terms from the ADS inclusive writing guide. Replace gendered, ableist, or
  exclusionary terms with neutral alternatives.
- **MUST** use plain English that translates across cultures — avoid idioms ("piece of cake",
  "ballpark figure").
- **MUST NOT** hide meaning in `aria-label` to keep visible text short. Both the visible text and
  the accessible label need to carry meaning on their own.

---

## Accessibility

Accessibility is a design constraint that shapes the visual language, not a review step at the end.
These minimums are non-negotiable.

### Contrast

- **MUST** meet WCAG AA: **4.5:1** for body text; **3:1** for large text (24px+) and essential
  non-text UI (borders defining an input, focus rings, meaningful icons).
- **MUST** re-verify in dark mode. Tokens handle most of it, but stacked overlays can drift.
- **MUST NOT** rely on color alone to communicate meaning. Pair color with shape, icon, or text
  (e.g. an error is red _and_ has an alert icon _and_ has text).

### Keyboard

- **MUST** provide full keyboard paths — every action reachable by tab/shift-tab.
- **MUST** trigger actions with Enter and Space, dismiss dialogs/menus with Escape.
- **MUST** trap focus inside modals and restore focus to the invoking element on close.
- **MUST** render a visible focus ring on every focusable element (see [Shapes](#shapes) (Focus
  ring)).
- **SHOULD** support arrow keys inside composite widgets (menus, tabs, listbox).

### Semantics

- **MUST** use semantic regions (`<header>`, `<nav>`, `<main>`, `<footer>`) and proper heading order
  (one `<h1>`, no skipped levels).
- **MUST** associate form labels with their inputs (`<label for>` / `aria-labelledby`).
- **MUST** use `aria-invalid` and `aria-describedby` to connect form errors to the field.
- **MUST NOT** use placeholder text as the only label. Placeholders disappear on input and are
  unreliable for assistive tech.

### Images and icons

- **MUST** provide `alt` text that conveys the image's purpose, not its appearance ("Open menu", not
  "Three horizontal lines icon"). Decorative images use `alt=""`.
- **MUST** give icon-only controls an accessible name via `aria-label` (or visually hidden text).
  Without it, the control is unreadable for screen readers.

### Motion and flashing

- **MUST** respect `prefers-reduced-motion`.
- **MUST NOT** produce content that flashes more than 3 times per second.
- **SHOULD** allow users to pause, stop, or hide autoplaying content over 5 seconds.

---

## Brand vs product

Atlassian has two adjacent visual languages: the **product** language (Atlassian Sans, ADS tokens,
restrained everything) and the **brand** language (Charlie Display/Text, richer color, more
expressive typography). The ADS does not fully cover brand; this section gives the operational
heuristic.

### When to lean product (Atlassian Sans, ADS tokens only)

- All in-app experiences: workspaces, dashboards, boards, documents, settings, reports.
- Admin and operations surfaces.
- Status and system notifications.
- Documentation bodies.

### When to lean brand (Charlie Display/Text permitted, richer color allowed)

- Marketing sites and landing pages.
- Onboarding welcome moments and product introductions (the _first_ screen only).
- Empty-state illustrations and hero graphics.
- Atlassian Team / World / Summit moments inside the product.
- Slide decks for external audiences.

### Rules at the boundary

- **MUST** snap back to product language (Atlassian Sans, ADS tokens) within the first interaction.
  A brand splash is fine; a brand-styled settings page is not.
- **MUST NOT** mix Charlie and Atlassian Sans in the same block of text.
- **MUST NOT** introduce brand saturation into product UI. A dashboard with a Charlie headline and a
  pink gradient hero is wrong — it reads as a marketing page leaking into the product.
- **SHOULD** use official Atlassian logo artwork with the required clearance (≥ wordmark cap-height)
  — no bespoke containers, recoloring, or drop shadows. See
  [Iconography and imagery](#iconography-and-imagery) (Logos).

### Authoritative guidance

The Atlassian Design System covers the _product_ side authoritatively; the brand side lives in
Atlassian Mosaic and the brand team's guidelines. When asked to design a brand surface, cite the
product-side tokens where they apply and flag the brand-side as outside ADS's canonical coverage
rather than inventing a brand rule.

---

## Responsive behavior

- **MUST** use rem-based values for spacing, type, and radii (every spacing, typography, and rounded
  token in this file is rem-based) so browser zoom and OS text-size settings propagate.
- **MUST** collapse navigation to a compact pattern (hamburger or drawer) at narrow viewports —
  never force horizontal page scroll to keep a desktop nav visible.
- **MUST** reflow content columns rather than horizontally scroll the page. Horizontal scroll is
  acceptable only inside data tables and Kanban boards, where it signals "more content exists."
- **SHOULD** use a ~12-column mental model at desktop (CSS grid with proportional `fr` tracks):
  sidebars ~2–3 columns, main ~9–10.
- **MUST NOT** hide essential information at narrow viewports. If it matters at desktop, it matters
  on mobile — reflow, don't drop.

**Gap acknowledged:** ADS does not yet ship density tokens (compact/comfortable). If density is
needed, document the gap rather than inventing a multiplier.

---

## Agent prompt guide

Templates for well-specified Atlassian design requests. Each one cites tokens by name, names the
structure, and pins voice. Adapt the verbs and surfaces; keep the token discipline.

### Product screen

> Build a project overview screen for Jira using semantic `<header>` / `<nav>` / `<main>` regions.
> Page title in `heading-large` ("Project overview", sentence case). Two-column layout (CSS grid,
> ~9/3 split). Left column: a card surface using `surface` background, `border` outline,
> `rounded-large` corners, padding `space-300`, containing recent activity (small heading + `body`).
> Right column: a metrics card with the headline number in `metric-medium` and a `body-small`
> `text-subtle` label. Primary CTA "Create work item" on `background-brand-bold` with
> `text-inverse`. Tokens by name only — no raw hex.

### Dashboard card

> Build a status card showing "Open incidents: 14". Container: `<div>` with `surface` background,
> `border` outline, `rounded-large` corners, padding `space-300`. Label row: `body-small` +
> `weight-medium` + `text-subtle` ("Open incidents"). Number: `metric-medium`. Below the number, a
> status pill on `background-danger` with `text-danger` text and `rounded-small` corners. The
> accessible name describes the metric and any delta together (not just the number).

### Title slide

> Build a title slide for an internal Atlassian deck. Background: `surface` (`#1F1F21`).
> Left-aligned within `space-800` margins. Title in Charlie Display 40pt bold, `text` (`#CECFD2`).
> Subtitle in Atlassian Sans 18pt regular, `text-subtle` (`#A9ABAF`). Single accent: a 4px-tall
> horizontal rule in `text-brand` (`#669DF1`) below the title, 64px wide. Atlassian wordmark
> bottom-left at default proportions. No gradients, no photography, no additional color.

The hex above resolves to whichever theme this artifact represents (see the `theme:` field at the
top of the file). For the opposite theme, use another copy of **this same manifest** generated for
that theme — **MUST NOT** mix light and dark hex from different builds in the same slide.

### Chart

> Build a bar chart of weekly active users with four product series (Jira, Confluence, Loom,
> Trello). Series colors: `chart-categorical-1` through `chart-categorical-4`. Axis labels in
> `body-small` + `text-subtle`. Gridlines in `border`. Pattern each series with a distinct hatch or
> shape in addition to color so the chart reads in grayscale. Legend uses each series color
> alongside the series name in `body`. Y-axis numbers in `family-code`.

### Empty state

> Build an empty state for a new Confluence space with no pages: stacked heading + body + buttons,
> centered, padding `space-400`. Title in `heading-small`, sentence case with a tasteful wink:
> "Start writing your team's story". Body in `body` + `text-subtle`: "Your first page anchors
> everything — meeting notes, decisions, how-tos. Create one to see this space come alive." Primary
> CTA "Create page" (brand fill); secondary "Learn about templates" (subtle).

### Error state

> Build a connection-lost error inside a panel: alert region with `background-danger` fill,
> `border-danger` outline, `rounded-large` corners, padding `space-300`. Title in `heading-small`
> `text-danger`: "Can't reach the server" (sentence case, no "oops" or "sorry"). Body in `body`
> `text`: one sentence reason, one sentence action. Primary "Try again" button on
> `background-brand-bold`. Support link as descriptive text ("Check Statuspage") — never "Click
> here". No stack trace.

---

## Design rigor and anti-template checks

This section encodes **process**, **build order**, and **deterministic anti-template** checks so
generated UI does not collapse into generic "template" output. **ADS token names and
[Overview](#overview) through [Agent prompt guide](#agent-prompt-guide) remain authoritative** — if
anything here could be read two ways, follow the token tables and component rules above.

### Pre-flight context (before generating UI)

The agent **MUST** resolve these from the brief (or ask) before committing layout and color — code
alone cannot infer them:

- **Surface type** — product vs brand-adjacent (**[Brand vs product](#brand-vs-product)**): in-app
  screens use Atlassian Sans and ADS tokens only; Charlie and richer expression only where
  [Brand vs product](#brand-vs-product) (marketing surfaces) permits.
- **Theme** — one theme per artifact: light vs dark anchors (**[Colors](#colors)**,
  **[Components](#components) (Slides)** for non-code); **MUST NOT** mix light and dark hex columns
  in the same output.
- **Primary user job** — what success looks like; drives empty states, CTAs, and errors
  (**[Voice and tone](#voice-and-tone)**, **[Components](#components)**).
- **Semantic intent** — which messages are `danger` / `warning` / `information` / `brand`
  (**[Colors](#colors)**), not decorative color for "vibe."

### Build order

Follow this order so structure and tokens stay aligned:

1. **Semantic structure** — regions, headings, landmarks, primary content
   (**[Components](#components)** without styling drift).
2. **Layout and spacing** — grid/flex, `gap` and padding at `space.*` steps (**[Layout](#layout)**).
3. **Typography and color** — `font.*` scale (**[Typography](#typography)**), neutrals and semantics
   (**[Colors](#colors)**).
4. **Interactive and focus** — hover/pressed/disabled + focus ring (**[Shapes](#shapes) (Focus
   ring)**).
5. **Edge states** — empty, loading, error, overflow (**[Components](#components)**,
   **[Voice and tone](#voice-and-tone)** (Empty states)).
6. **Motion** — only if it aids comprehension; short, reduced-motion-safe (**[Motion](#motion)**,
   **[Accessibility](#accessibility) (Motion)**).
7. **Responsive** — reflow and density; **MUST NOT** drop essential actions
   (**[Responsive behavior](#responsive-behavior)**).

### Deterministic anti-patterns (MUST NOT + rewrite)

Each pattern below is objective to spot in CSS/markup; rewrite using the cited ADS rules.

| Anti-pattern                       | MUST NOT                                                                                                                                                                  | Rewrite using                                                                                                                                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Side-stripe emphasis**           | `border-left` or `border-right` with width **greater than 1px** and saturated color as the **sole** card/list/callout emphasis                                            | Semantic surfaces: `background.*.subtle` / role backgrounds, `border`, ADS `SectionMessage` / `Flag` / `Banner` patterns (**[Colors](#colors)**, **[Components](#components) (Flag)**) — not a thick accent stripe                |
| **Gradient-filled text**           | `background-clip: text` or `-webkit-background-clip: text` with `linear-gradient` / `radial-gradient` / `conic-gradient` on the same fill                                 | Solid `text` / role text tokens; hierarchy via `heading.*`, `weight.*` (**[Typography](#typography)**)                                                                                                                            |
| **Unmapped "AI default" palette**  | Decorative cyan-on-dark, purple–blue gradients, neon accents **not** mapped to `chart.*`, semantic roles (**[Colors](#colors)**), or accent ramps (**[Colors](#colors)**) | Only those token families for color meaning and decoration                                                                                                                                                                        |
| **Card clutter**                   | Nested floating cards (card inside card each with shadow/border pretending to be depth)                                                                                   | Single surface + `border` or one elevation plane (**[Elevation & Depth](#elevation--depth)**, **[Components](#components) (Card)**)                                                                                               |
| **Template grids**                 | Repeated identical tiles (icon + heading + body + CTA × N) as the only layout                                                                                             | Vary grouping, density, or sectioning while staying on `space.*` and token radii (**[Overview](#overview), [Layout](#layout), [Components](#components)**)                                                                        |
| **Hero-metric cliché**             | Default dashboard hero: oversized metric + tiny label + secondary stats + decorative gradient                                                                             | Metrics use `metric.*` and surfaces per **[Components](#components)** without extra decorative gradients                                                                                                                          |
| **Decorative glass / blur**        | `backdrop-filter` blur stacks, glass cards, glow borders used as generic polish                                                                                           | **[Overview](#overview)** / **[Elevation & Depth](#elevation--depth)**: depth and blur only when the pattern is specified by ADS or product guidance — otherwise borders and whitespace                                           |
| **Sparklines as ornament**         | Tiny charts with no labeled metric or legend                                                                                                                              | **[Components](#components) (Charts)** — charts convey a quantity; if it is not data, do not use chart chrome                                                                                                                     |
| **Eyebrow / overline labels**      | ALL CAPS, spaced-caps, or `text-brand`-tinted mini-label above a heading ("OVERVIEW / Report name")                                                                       | Sentence-case heading + optional beside-it lozenge; no separate typographic layer (**[Typography](#typography)**)                                                                                                                 |
| **Tinted prose on semantic bg**    | Blue paragraph text on a blue `information` surface, green text on a green `success` surface, etc.                                                                        | Neutral `text` / `text-subtle` prose + role icon carries the semantic colour (**[Components](#components) (Section message)**)                                                                                                    |
| **Subtle body text for hierarchy** | `text-subtle` on paragraphs / list items / descriptions to "create contrast" with headings                                                                                | `text` for continuous prose; hierarchy comes from heading size + weight (**[Typography](#typography) (Body scale)**)                                                                                                              |
| **Sunken page canvas**             | `surface-sunken` as the outermost page background to make cards "pop"                                                                                                     | `surface` (white) as the page canvas; cards use `border` or `surface-raised` + `shadow-raised` for separation (**[Elevation & Depth](#elevation--depth) (Page canvas)**)                                                          |
| **Sunken as card background**      | `surface-sunken` on an info block, stat tile, settings row, or "grouped" section container to make it feel separate                                                       | `surface` + `border` (+ padding) for grouping, or `surface-raised` + `shadow-raised` when genuinely movable (**[Elevation & Depth](#elevation--depth) (Page canvas)**)                                                            |
| **Shrunk table text**              | `body-small` / 12px / 13px in table cells as the default, to fit more rows                                                                                                | `body` (14px) cells + `body-small` `weight-medium` `text-subtle` headers (**[Components](#components) (Table)**). If the table is too wide, scroll horizontally.                                                                  |
| **Glyphs as icons**                | Unicode characters, HTML entities, or emoji standing in for icons — `›` `→` `▶` `✓` `✕` `…` `⚠` `★` as chevrons, checks, arrows, status markers, or action affordances    | Atlassian core icon at 16px via `icon-*` token. Text glyphs do not inherit token colour, cannot size independently of the font, and drift from the 1.5px-stroke dialect (**[Iconography and imagery](#iconography-and-imagery)**) |
| **Brand icon as emphasis**         | `icon-brand` applied to every "important" icon (chevrons, sort arrows, bullets, list markers) to make them stand out                                                      | `icon-subtle` / `icon-subtlest` for secondary indicators; `icon-brand` reserved for the primary CTA or an intentional brand moment (**[Iconography and imagery](#iconography-and-imagery)**)                                      |
| **Partial selected state**         | Only the selected border, only the selected background, or `border-brand` / `text-brand` standing in for the selected triad                                               | Full `background-selected` + `border-selected` (at `border-width-selected`, 2px) + `text-selected` on the active/current item (**[Colors](#colors)** — Neutral backbone → Selected state)                                         |

**Modals.** **SHOULD** prefer inline expansion, drawers, or an inline section message
(**[Components](#components) (Flag)**) when the task fits without trapping focus. When a true dialog
is required, **MUST** follow **[Components](#components) (Modal)** — focus trap, tokenized overlay
surface, paired overlay shadow.

### Review checklist

Use this after a first implementation pass (especially for LLM-generated UI):

| If this is true                                                                        | Then                                                                                                                                        |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Raw hex / rgb / hsl in product code                                                    | Replace with the matching token name from **[Colors](#colors)** (**[Do's and Don'ts](#dos-and-donts)** table)                               |
| Title Case or vague CTAs                                                               | **[Typography](#typography)**, **[Voice and tone](#voice-and-tone)** (Buttons and labels)                                                   |
| Side stripe or gradient text present                                                   | **[Design rigor and anti-template checks](#design-rigor-and-anti-template-checks)**                                                         |
| Colors not from semantic roles, accent ramps, or chart tokens in **[Colors](#colors)** | Map or remove                                                                                                                               |
| Same `space.*` on every edge                                                           | Apply **[Layout](#layout)** rhythm (tight in-group, larger between groups)                                                                  |
| More than one raised/overlay region without reason                                     | **[Elevation & Depth](#elevation--depth)** — elevation is sparse                                                                            |
| Any uppercase or letter-spaced text in the output                                      | Rewrite to sentence case (**[Typography](#typography) (Case)**) — no exceptions for eyebrows, subheadings, table headers, or lozenges       |
| Paragraph / body text rendered in `text-subtle`                                        | Change to `text`; hierarchy comes from headings, not dimmed body (**[Typography](#typography) (Body scale)**)                               |
| Page background is `surface-sunken`                                                    | Change to `surface`; sunken is a well inside a page (**[Elevation & Depth](#elevation--depth) (Page canvas)**)                              |
| `surface-sunken` on a card, info block, or settings row                                | Change to `surface` + `border`; sunken is for structural wells, not content grouping (**[Elevation & Depth](#elevation--depth)**)           |
| Unicode / emoji / HTML-entity glyphs used as icons                                     | Replace with Atlassian core icon + `icon-*` token (**[Iconography and imagery](#iconography-and-imagery)**)                                 |
| Only a selected border (no background) or only a selected background (no border/text)  | Apply the full triad — `background-selected` + `border-selected` (2px) + `text-selected` (**[Colors](#colors)**)                            |
| `border-brand` / `text-brand` used on the current/active item                          | Swap to the selected triad — brand and selected share hex today but not meaning (**[Colors](#colors)**)                                     |
| "AI made this" reads as immediately believable                                         | Tighten to token-only choices from **[Overview](#overview)–[Components](#components)** and voice from **[Voice and tone](#voice-and-tone)** |

---

## Related

- [Atlassian Design System](https://atlassian.design) — canonical token catalog, component APIs, and
  foundations.
- **atlassian-design-system** skill — progressive-disclosure skill for token/component lookup and
  ADS MCP usage when you have an ADS-capable stack.
- ADS MCP tools — direct token, component, and linting integrations where available.
- ADS ESLint plugins (design system and UI styling standards) — enforcement layer for CI in repos
  that wire them up.
