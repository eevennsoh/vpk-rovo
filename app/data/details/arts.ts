import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ART_DETAILS: Record<string, ComponentDetail> = {
	weather: {
		description:
			"Art study inspired by a Framer reference: four tall capsule pills in a horizontal row on a light background. The first pill is a vertical elastic slider that lets you add and switch between world cities. The remaining three pills show the selected city's live clock, humidity, and temperature with animated weather icons — all backed by holographic shader cards.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
};
