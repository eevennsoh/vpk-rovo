import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PROJECT_DETAILS: Record<string, ComponentDetail> = {
	"rovo-app": {
		description: "A Vercel-style AI chat workspace with persistent thread history, local attachments, artifact editing, and RovoDev-backed streaming.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
};
