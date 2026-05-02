# ASCII Magic Feature Gap Plan

## Summary

I inspected ASCII Magic live in Chrome and compared it with our current ASCII shader in `components/website/demos/visual/shaders/ascii.tsx` and `components/website/demos/visual/ascii-demo.tsx`. Our shader already covers the serious shader core: generated glyph atlas, image/field source, custom charsets, blend/mask modes, color modes, background color, signal shaping, shimmer, and bloom.

ASCII Magic is broader: it is a full ASCII image/video generator with upload/export, crop/rotate, background presets, intensity controls, animation, lights, masks, and post-processing.

## Feature Gaps Worth Porting

- Add an ASCII Magic-style "creative controls" layer over the existing shader: `Coverage`, `Edge Emphasis`, `Density`, `Brightness`, `Contrast`, `Character Opacity`, `Dot Grid Overlay`, `Randomize Characters`, and `Animated ASCII`.
- Implement these as additive props on `Ascii`, preserving existing low-level props. Map `Coverage` to presence threshold, `Edge Emphasis` to `directionBias`, `Density` to inverse `cellSize`, and add real shader uniforms for brightness/contrast, character opacity, seeded random glyph jitter, grid overlay, and time-based character cycling.
- Add background treatment parity: `solid color`, `source image`, and `blurred source` modes with blur radius and opacity. This is directly portable and visually high impact.
- Treat the post-processing stack as a second phase. We already have bloom; the best next shader-native effects are vignette, scan lines, CRT curvature, RGB/chromatic split, film grain, and pixelate. Glitch, film dust, halftone, and full export/rendering should stay out of v1 unless we build a full generator page.

## Not Recommended For Shader Component V1

- Do not port PNG/video export, resolution presets, crop/rotate, or upload-video handling into the shader component. Those belong to a separate generator/editor route.
- Do not copy ASCII Magic assets or source. Recreate analogous behavior from observed public UI and our existing shader architecture.

## Test Plan

- Extend `components/website/demos/visual/ascii-demo.test.js` to assert the new controls and props are wired.
- Add shader-source assertions for the new uniforms and mapping branches.
- Run `node --test components/website/demos/visual/ascii-demo.test.js`, `pnpm run typecheck`, and `pnpm run lint`.
- Browser-verify `/visual/ascii` or `/components/visual/ascii` with presets covering blurred background, high density, randomized glyphs, animated glyphs, and RGB/chromatic post effects.

## Assumptions

- Default scope is shader/demo parity, not a full ASCII Magic clone.
- Existing unrelated `personal-graph` worktree changes stay untouched.
- The first implementation should prioritize background, density/intensity, random/animated glyphs, and lightweight post effects before export/video workflows.
