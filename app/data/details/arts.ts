import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ART_DETAILS: Record<string, ComponentDetail> = {
	awake: {
		description:
			"Art study inspired by a Framer reference: four tall capsule pills in a horizontal row on a light background. The first pill is a vertical elastic slider that lets you add and switch between world cities. The remaining three pills show the selected city's live clock, humidity, and temperature with animated weather icons — all backed by holographic shader cards.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
	"personal-graph": {
		description:
			"Obsidian-backed Personal Graph inspired by Nicholas Spisak's second-brain, Karpathy's LLM Wiki pattern, and Tobi Lutke's qmd: a live vault graph where raw captures, source notes, entities, concepts, and synthesis pages can be read as one connected workspace.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
};
