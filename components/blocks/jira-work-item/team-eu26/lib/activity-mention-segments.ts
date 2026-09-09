import type { JiraActivitySegment } from "@/components/blocks/jira-activity";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";

/** A mentionable agent, resolved from the activity stream's own sessions. */
export interface ActivityMentionTarget {
	name: string;
	avatarSrc?: string;
	brandName?: ThirdPartyLogoName;
	vpkLogo?: "rovo";
}

/**
 * `@` is only a mention when the roster name ends on a word boundary, so
 * "@Code Planners" never resolves to the "Code Planner" agent.
 */
function endsOnWordBoundary(content: string, endIndex: number): boolean {
	const nextCharacter = content[endIndex];
	return nextCharacter === undefined || !/[\p{L}\p{N}]/u.test(nextCharacter);
}

function matchTargetAt(
	content: string,
	lowerContent: string,
	startIndex: number,
	targets: readonly ActivityMentionTarget[],
): ActivityMentionTarget | undefined {
	return targets.find((target) => {
		const name = target.name.toLowerCase();
		return (
			lowerContent.startsWith(name, startIndex)
			&& endsOnWordBoundary(content, startIndex + name.length)
		);
	});
}

/**
 * Splits authored comment copy into rich inline segments, promoting every
 * `@Name` that resolves to a known agent into an `agent-mention` chip and
 * leaving everything else — including unmatched `@` runs — as plain text.
 *
 * Matching is case-insensitive but the chip always renders the roster's
 * canonical name, so authored copy can drift in casing without changing the
 * rendered mention. Targets are matched longest-first so an agent whose name
 * prefixes another ("Code Planner" vs "Code Planner Pro") can never shadow it.
 */
export function toActivityMentionSegments(
	content: string,
	targets: readonly ActivityMentionTarget[],
): JiraActivitySegment[] {
	if (content.length === 0) return [];
	if (targets.length === 0) return [{ type: "text", text: content }];

	const orderedTargets = [...targets].sort((left, right) => right.name.length - left.name.length);
	const lowerContent = content.toLowerCase();
	const segments: JiraActivitySegment[] = [];
	let cursor = 0;
	let searchIndex = content.indexOf("@");

	while (searchIndex !== -1) {
		const target = matchTargetAt(content, lowerContent, searchIndex + 1, orderedTargets);
		if (!target) {
			searchIndex = content.indexOf("@", searchIndex + 1);
			continue;
		}

		if (searchIndex > cursor) {
			segments.push({ type: "text", text: content.slice(cursor, searchIndex) });
		}
		segments.push({
			type: "agent-mention",
			text: target.name,
			...(target.vpkLogo
				? { vpkLogo: target.vpkLogo }
				: {
					...(target.avatarSrc ? { avatarSrc: target.avatarSrc } : {}),
					...(target.brandName ? { brandName: target.brandName } : {}),
				}),
		});

		cursor = searchIndex + 1 + target.name.length;
		searchIndex = content.indexOf("@", cursor);
	}

	if (cursor < content.length) {
		segments.push({ type: "text", text: content.slice(cursor) });
	}

	return segments;
}
