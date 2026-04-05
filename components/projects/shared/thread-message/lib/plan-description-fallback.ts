import type { ParsedPlanWidgetPayload } from "@/components/projects/shared/lib/plan-widget";
import { extractPlanRenderableText } from "@/components/projects/shared/lib/message-text-utils";

interface BuildPlanDescriptionFallbackOptions {
	messageText: string;
	planPayload: ParsedPlanWidgetPayload;
}

export function buildPlanDescriptionFallback({
	messageText,
}: BuildPlanDescriptionFallbackOptions): string {
	const planRenderableText = extractPlanRenderableText(messageText, {
		summaryMode: "full",
	});
	const narrativeSummary = planRenderableText.summary.trim();
	const dependencyMermaid = planRenderableText.mermaid.trim();

	const sections: string[] = [];
	if (narrativeSummary) {
		sections.push(narrativeSummary);
	}

	if (dependencyMermaid) {
		const dependencySection: string[] = ["### Task dependency graph"];
		dependencySection.push(dependencyMermaid);
		sections.push(dependencySection.join("\n\n"));
	}

	return sections.join("\n\n").trim();
}
