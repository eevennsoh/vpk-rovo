# vpk-html Design System

The visual system is a portable editorial manual. It is type-led, technical,
slightly raw, and suitable for long-form explanations as well as compact
business documents.

## Fonts

Generated HTML declares these families and embeds local OTF/TTF files as data
URIs:

- Display: `Charlie Display`
- Body: `Charlie Text`
- Mono: `Atlassian Mono`
- Numeric: `Atlassian Mono Numeric`, sourced from Atlassian Mono with `unicode-range: U+0030-0039`

System fallbacks remain in the CSS so the file is readable even if a browser
declines a font face.

## Tokens

Tokens are authored once in `references/tokens.json` and mirrored in root
`styles.css`, matching Kami's top-level stylesheet shape. The renderer embeds the resolved theme block in every
HTML document instead of letting individual templates own hard-coded palettes.

Token groups cover paper/background, headline/body ink, muted text, primary
blue, collection accents, chart/diagram accents, grid dots/lines, rule, raised
surfaces, focus ring, code surface, math highlight, and
success/warning/danger/info accents for light and dark modes.

## Dark Mode

Every rendered document includes `color-scheme: light dark`, initializes from
`prefers-color-scheme`, renders a visible toggle when `theme.allowToggle` is
true, persists only that user override in `localStorage`, and respects
`prefers-reduced-motion`.
