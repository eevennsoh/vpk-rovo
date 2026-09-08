/**
 * The full sticker set, in atlas order. Index into this list is what a
 * `StickerSeed.kind` refers to.
 */

import type { StickerDef } from "./art-kit";
import { CHROME_STICKERS } from "./art-chrome";
import { HOLO_STICKERS } from "./art-holo";
import { PAPER_STICKERS } from "./art-paper";

export const ALL_STICKERS: readonly StickerDef[] = [
	...PAPER_STICKERS,
	...HOLO_STICKERS,
	...CHROME_STICKERS,
];

export type { StickerDef, StickerFamily } from "./art-kit";
