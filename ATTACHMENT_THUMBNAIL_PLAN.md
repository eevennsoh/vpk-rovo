# Attachment Placeholder Thumbnail Plan

## Goal

Create realistic placeholder attachment grids for work items using a small, mixed set of attachment types. Generated thumbnails should represent preview content only; React owns the card chrome, title, footer, icons, borders, shadows, and badges.

## Attachment Mix

Pick 5-8 attachments per work item:

- 2-3 document-like items: page, doc, spreadsheet, PDF
- 1 image item: png, jpg, or svg preview
- 1 video item: mp4 or walkthrough
- Optional 1 audio item: mp3

## Generated Thumbnail Rules

Use image generation only for image-backed visual previews:

- Good: document/page previews, spreadsheet previews, PDF packet previews, screenshot/image/video preview stills
- Avoid: generating audio thumbnails
- Avoid: third-party logos, file-type icons, source badges, humans, avatars, or webcam bubbles inside thumbnails

Generated thumbnails must:

- Be 16:9 edge-to-edge previews, saved as 640x360 PNG
- Show only the preview content, not the attachment card UI
- Use realistic fake document/UI copy, not skeleton/loading bars
- Avoid embedding the attachment display name or card title inside the image
- Avoid padded backdrops, inner rounded card shells, angled perspective, decorative mockups, and baked-in border strokes

React should render:

- Attachment title
- Footer area
- Source/file icon
- Card radius, clipping, border/shadow treatment
- Audio preview treatment

## Document Thumbnail Style

For document-like thumbnails, generate flat rendered document or app-content previews:

- White or light neutral document/page background
- Realistic fake byline/meta rows, paragraphs, tables, checklists, comments, chips, or callouts
- Small readable fake content is acceptable
- Do not repeat the attachment name as a title
- Do not use generic skeleton bars

## Audio Treatment

For MP3/audio, render it in React instead of image generation:

- Neutral preview area
- Centered 24x24 `IconTile`
- Bold orange variant
- VPK `Music2Icon`
- File name shown in the card footer
- No `previewSrc`

## UI Treatment

Use VPK UI treatment in React:

- File/media glyphs from `@/components/ui/vpk-icons`
- `IconTile` for 24x24 icon tiles
- `/website/vpk-logo-dark.svg` for source/app badges when needed
- Do not use Confluence, Loom, Google, Microsoft, or Atlassian product logos

## Storage

Store generated thumbnail assets under:

```text
public/generated/
```

Prefer work-item-scoped filenames once the set grows:

```text
rfp-101-intake-notes.png
rfp-101-compliance-matrix.png
rfp-102-supplier-portal.png
```

## Implementation Scope

Keep implementation route-local:

- Update the work item data
- Render in `components/projects/agents/components/work-item-modal/attachments-section.tsx`
- Do not change shared `components/ui-custom/attachments`

## Review Gate

Before wiring generated assets:

- Inspect the raw generated PNGs
- Reject thumbnails with duplicated card titles, skeleton bars, logos, avatars, webcam bubbles, or obvious mockup padding
- Only copy accepted assets into `public/generated/`

## Validation

Validate the exact work item modal, not just the raw files:

- Attachment count matches the badge
- Long names truncate cleanly
- MP3 has no `previewSrc`
- All image-backed attachments use `/generated/...`
- Image preview parents are transparent when `previewSrc` exists
- Image-backed attachments render with `object-fit: cover`
- Open the exact work item modal, scroll to attachments, and capture a screenshot of the attachment section

Run focused checks:

```bash
node --test components/projects/agents/rfp-context.test.js
pnpm run lint
```
