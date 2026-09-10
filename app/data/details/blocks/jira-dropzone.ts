import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_DROPZONE_DETAIL: ComponentDetail = {
	description:
		"Create well that receives dragged agent sessions and flies one elevated chip — a mention for one session, a cohort pill for many — into the well. The default drop is a straight tween, the same recipe as the Team EU26 board; Motion arc() strength, peak, rotate, and direction are an optional catalog override. Bounce is on by default; turning it off settles the well back to rest as soon as the last chip lands. Marching ants move the existing dashed stroke along the well; off keeps the static dash.",
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { JiraDropzone, JiraDropzoneField, useJiraDropzoneReceive } from "@/components/blocks/jira-dropzone";`,
	props: [
		{ name: "drag", type: '"idle" | "active" | "armed"', required: true, description: "What the surrounding session drag is doing to this well. Idle shows renderResting; active or armed opens the labeled drop target. The host must pass active only when this well is an eligible drop." },
		{ name: "label", type: "string", required: true, description: "Copy shown inside the open well." },
		{ name: "title", type: "string", required: true, description: "Column identity used as the hit-test key and receipt address." },
		{ name: "renderResting", type: "() => ReactElement", required: true, description: "Host chrome for the idle slot. The block decides when resting ends." },
		{ name: "ants", type: "boolean", default: "true", description: "Moves the existing 1px dashed stroke along the well. Off keeps the static dashed chrome." },
		{ name: "exclusiveWinner", type: "boolean", default: "true", description: "Magnetic exclusive-proximity winner from the board coordinator. Visual only." },
		{ name: "measuredRef", type: "RefObject<HTMLDivElement | null>", description: "Optional hit-test node ref so the board can register exclusive proximity against the measured well." },
	],
};
