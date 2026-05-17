const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const VPK_ICONS_SOURCE = fs.readFileSync(path.join(__dirname, "vpk-icons.tsx"), "utf8");

const DEPRECATED_LUCIDE_COMPAT_ALIASES = [
	"ArchiveX",
	"Bot",
	"Check",
	"ChevronDown",
	"ChevronLeft",
	"ChevronRight",
	"ChevronUp",
	"Copy",
	"ExternalLink",
	"GalleryVerticalEnd",
	"Globe",
	"Home",
	"LifeBuoy",
	"Maximize2",
	"MessageCircle",
	"Minus",
	"MousePointerClick",
	"Pause",
	"Play",
	"RotateCw",
	"Search",
	"Settings",
	"Settings2",
	"Square",
	"Trash2",
	"TreePine",
	"TrendingDown",
	"TrendingUp",
	"VolumeX",
	"Waves",
];

test("vpk icon module does not re-export deprecated Lucide-compatible aliases", () => {
	for (const alias of DEPRECATED_LUCIDE_COMPAT_ALIASES) {
		assert.doesNotMatch(
			VPK_ICONS_SOURCE,
			new RegExp(`export const ${alias}\\b`),
			`${alias} should stay removed; use the stable ${alias}Icon export when one exists.`,
		);
	}
});
