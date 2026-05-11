import { z } from "zod";

export const TEMPLATE_IDS = [
	"exploration-code-approaches",
	"exploration-visual-designs",
	"implementation-plan",
	"code-review-pr",
	"pr-writeup",
	"code-understanding",
	"design-system",
	"component-variants",
	"prototype-animation",
	"prototype-interaction",
	"svg-illustrations",
	"flowchart-diagram",
	"slide-deck",
	"research-feature-explainer",
	"research-concept-explainer",
	"status-report",
	"incident-report",
	"editor-triage-board",
	"editor-feature-flags",
	"editor-prompt-tuner",
	"one-pager",
	"long-doc",
	"letter",
	"portfolio",
	"resume",
	"equity-report",
	"changelog",
	"math-knowledge",
	"math-proof",
	"math-procedure",
	"math-handout",
	"math-concept-map",
	"math-interactive",
];

export const DIAGRAM_PRIMITIVES = [
	"architecture",
	"flowchart",
	"quadrant",
	"bar-chart",
	"line-chart",
	"donut-chart",
	"state-machine",
	"timeline",
	"swimlane",
	"tree",
	"layer-stack",
	"venn",
	"candlestick",
	"waterfall",
];

const templateEnum = z.enum(TEMPLATE_IDS);
const diagramEnum = z.enum(DIAGRAM_PRIMITIVES);
const slugSchema = z
	.string()
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lower-case kebab-case");

const noRemoteUrl = value => {
	if (typeof value !== "string") return true;
	return !/^(?:https?:)?\/\//i.test(value.trim());
};

const sectionSchema = z
	.object({
		type: z.string().default("section"),
		heading: z.string().optional(),
		kicker: z.string().optional(),
		body: z.string().optional(),
		items: z.array(z.string()).optional(),
		cards: z
			.array(
				z.object({
					title: z.string(),
					body: z.string().optional(),
					status: z.string().optional(),
					meta: z.string().optional(),
					href: z.string().refine(noRemoteUrl, "Remote links are not allowed in generated cards").optional(),
				}),
			)
			.optional(),
		steps: z
			.array(
				z.object({
					title: z.string(),
					body: z.string().optional(),
					code: z.string().optional(),
				}),
			)
			.optional(),
		code: z.string().optional(),
		table: z
			.object({
				headers: z.array(z.string()),
				rows: z.array(z.array(z.string())),
			})
			.optional(),
		diagram: z
			.object({
				type: diagramEnum.default("flowchart"),
				title: z.string().optional(),
				nodes: z.array(z.string()).optional(),
				edges: z.array(z.tuple([z.string(), z.string()])).optional(),
			})
			.optional(),
		slides: z
			.array(
				z.object({
					title: z.string(),
					body: z.string().optional(),
					items: z.array(z.string()).optional(),
				}),
			)
			.optional(),
		controls: z
			.array(
				z.object({
					label: z.string(),
					value: z.string().optional(),
					min: z.number().optional(),
					max: z.number().optional(),
				}),
			)
			.optional(),
		trustedHtml: z.string().optional(),
	})
	.passthrough();

const sourceSchema = z.object({
	label: z.string(),
	url: z.string().url().optional(),
	path: z.string().optional(),
	note: z.string().optional(),
	license: z.string().optional(),
});

const assetSchema = z
	.object({
		path: z.string().refine(noRemoteUrl, "Remote assets are not allowed"),
		alt: z.string().optional(),
		kind: z.enum(["image", "font", "data", "svg"]).default("image"),
		credit: z.string().optional(),
		algebrica: z.boolean().default(false),
	})
	.refine(asset => asset.kind !== "image" || Boolean(asset.alt), {
		message: "Meaningful image assets require alt text",
		path: ["alt"],
	});

export const renderPayloadSchema = z.object({
	template: templateEnum,
	title: z.string().min(1),
	slug: slugSchema.optional(),
	subtitle: z.string().optional(),
	audience: z.string().optional(),
	theme: z
		.object({
			initialMode: z.enum(["light", "dark", "system"]).default("system"),
			allowToggle: z.boolean().default(true),
		})
		.default({ initialMode: "system", allowToggle: true }),
	sections: z.array(sectionSchema).default([]),
	sources: z.array(sourceSchema).default([]),
	assets: z.array(assetSchema).default([]),
	options: z
		.object({
			print: z.boolean().default(true),
			interactive: z.boolean().default(false),
			useAlgebrica: z.boolean().default(false),
		})
		.default({ print: true, interactive: false, useAlgebrica: false }),
});

export function validateRenderPayload(payload) {
	return renderPayloadSchema.parse(payload);
}

export function isKnownTemplate(templateId) {
	return TEMPLATE_IDS.includes(templateId);
}
