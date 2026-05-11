# Interactivity Rules

Inline JavaScript is allowed only to keep a single-file offline artifact useful.

- Do not import remote scripts.
- Keep default editor state in memory. Do not use `localStorage` for editor data
  unless the user explicitly asks for persistence.
- Decks must support arrow-key navigation and visible progress.
- Editors must support keyboard operation plus copy/export/import when relevant.
- Prototypes and math demos should use small inline controls and inline SVG.
- Static math should be rendered at generation time instead of shipping a live
  LaTeX compiler into every document.
