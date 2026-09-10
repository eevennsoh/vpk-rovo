import type { JiraLinkingPoint } from "./drop";

/** Exact recipe from agentic-jira-board's animateUnattachedSessionDropToCard. */
export const JIRA_LINKING_GLOW_DROP_DURATION_MS = 260;
export const JIRA_LINKING_GLOW_FADE_DURATION_MS = 420;
export const JIRA_LINKING_GLOW_PULSE_DURATION_MS = 800;
export const JIRA_LINKING_GLOW_DEFAULT_COLOR = "var(--ds-border-focused)";
const DROP_APEX_FRACTION = 0.4;
const DROP_KEYFRAME_STEPS = 60;

export function resolveJiraLinkingGlowSettleMs(shouldReduceMotion: boolean | null): number {
	return shouldReduceMotion ? 0 : JIRA_LINKING_GLOW_DROP_DURATION_MS;
}

/** Centers are viewport coordinates. X stays at release, matching the source. */
export function createJiraLinkingGlowDropKeyframes(
	from: JiraLinkingPoint,
	landing: JiraLinkingPoint,
): Keyframe[] {
	return Array.from({ length: DROP_KEYFRAME_STEPS + 1 }, (_, index) => {
		const progress = index / DROP_KEYFRAME_STEPS;
		const collapse = progress * progress * (3 - 2 * progress);
		let y: number;
		if (progress <= DROP_APEX_FRACTION) {
			const upward = progress / DROP_APEX_FRACTION;
			const incoming = Math.pow(upward, 1.5);
			const outgoing = Math.pow(1 - upward, 1.2);
			y = from.y - 20 * incoming / (incoming + outgoing);
		} else {
			const downward = (progress - DROP_APEX_FRACTION) / (1 - DROP_APEX_FRACTION);
			const gravity = Math.pow(downward, 1.2) * (0.4326 + downward * (0.7348 - 0.1674 * downward));
			y = from.y + (landing.y + 8 - from.y) * gravity - 20 * (1 - gravity);
		}
		return {
			offset: progress,
			transform: `translate3d(${from.x}px, ${y}px, 0) scale(${1 + (0.65 - 1) * collapse})`,
			opacity: 1 - collapse,
		};
	});
}

function clampChannel(channel: number): number {
	return Math.round(Math.min(1, Math.max(0, channel)) * 255);
}

/** Converts the shader's normalized sRGB identity tint into a CSS colour. */
export function resolveJiraLinkingGlowColor(
	tint: readonly [number, number, number],
): string {
	return `rgb(${clampChannel(tint[0])} ${clampChannel(tint[1])} ${clampChannel(tint[2])})`;
}

/** The two focused-border halos from getCardTransferGlow, tinted by the lead avatar. */
export function resolveJiraLinkingGlowShadow(
	color = JIRA_LINKING_GLOW_DEFAULT_COLOR,
): string {
	return [
		`0 0 6px color-mix(in srgb, ${color} 28%, transparent)`,
		`0 0 12px color-mix(in srgb, ${color} 14%, transparent)`,
	].join(", ");
}

/** Keeps the backdrop sweep subtle while preserving the lead avatar's hue. */
export function resolveJiraLinkingGlowPulseColor(color: string): string {
	return `color-mix(in srgb, ${color} 28%, transparent)`;
}
