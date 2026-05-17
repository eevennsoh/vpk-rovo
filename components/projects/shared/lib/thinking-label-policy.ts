import type { ReasoningPhase } from "@/components/projects/shared/hooks/use-reasoning-phase";
import { getDefaultThinkingLabel } from "@/components/projects/shared/lib/reasoning-labels";

interface ResolveThinkingLabelForSurfaceOptions {
	baseLabel: string;
	surface: "sidebar" | "fullscreen";
	reasoningPhase: ReasoningPhase;
}

const GENERIC_THINKING_LABELS = new Set([
	"thinking",
	"rovo is thinking",
	"rovo is tihking",
]);

function normalizeLabelKey(label: string): string {
	return label.trim().replace(/\s+/g, " ").toLowerCase();
}

export function resolveThinkingLabelForSurface({
	baseLabel,
}: Readonly<ResolveThinkingLabelForSurfaceOptions>): string {
	const trimmedLabel = baseLabel.trim();
	if (!trimmedLabel) {
		return getDefaultThinkingLabel();
	}

	return GENERIC_THINKING_LABELS.has(normalizeLabelKey(trimmedLabel))
		? getDefaultThinkingLabel()
		: trimmedLabel;
}
