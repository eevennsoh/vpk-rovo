import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import type { AgentSession } from "@/components/blocks/jira-work-item/data/session-state";

function includesComposerToken(text: string, token: string): boolean {
	let index = text.indexOf(token);
	while (index >= 0) {
		const previousCharacter = text[index - 1];
		const nextCharacter = text[index + token.length];
		const hasLeadingBoundary = previousCharacter === undefined || /[\s([{'"“‘]/u.test(previousCharacter);
		const hasTrailingBoundary = nextCharacter === undefined || /[\s,.!?;:)\]}"”’]/u.test(nextCharacter);
		if (hasLeadingBoundary && hasTrailingBoundary) {
			return true;
		}
		index = text.indexOf(token, index + token.length);
	}
	return false;
}

export function includesComposerAgentMention(text: string, agentName: string): boolean {
	return includesComposerToken(text, `@${agentName}`);
}

/** Distinct directory agents explicitly mentioned in a submitted composer draft. */
export function findMentionedAvailableAgents(
	agents: readonly AgentSelectorAgent[],
	draft: string,
	excludedAgentIds: ReadonlySet<string> = new Set(),
	excludedAgentNames: ReadonlySet<string> = new Set(),
): AgentSelectorAgent[] {
	const matchedAgentIds = new Set(excludedAgentIds);
	const matchedAgentNames = new Set(excludedAgentNames);
	const matches: AgentSelectorAgent[] = [];
	for (const agent of agents) {
		if (
			matchedAgentIds.has(agent.id)
			|| matchedAgentNames.has(agent.name)
			|| !includesComposerAgentMention(draft, agent.name)
		) {
			continue;
		}
		matchedAgentIds.add(agent.id);
		matchedAgentNames.add(agent.name);
		matches.push(agent);
	}
	return matches;
}

function isWorkingSession(session: Readonly<AgentSession>): boolean {
	return session.status === "running" || session.status === "waiting";
}

/** Latest active session for every distinct agent explicitly mentioned in the draft. */
export function findMentionedWorkingAgentSessions(
	sessions: readonly AgentSession[],
	draft: string,
): AgentSession[] {
	const matchedAgentIds = new Set<string>();
	const matches: AgentSession[] = [];
	for (let index = sessions.length - 1; index >= 0; index -= 1) {
		const session = sessions[index];
		if (
			isWorkingSession(session)
			&& !session.agentId.startsWith("skill:")
			&& !matchedAgentIds.has(session.agentId)
			&& includesComposerAgentMention(draft, session.agentName)
		) {
			matchedAgentIds.add(session.agentId);
			matches.push(session);
		}
	}
	return matches;
}

/** Latest active agent session explicitly referenced by an @mention in the draft. */
export function findMentionedWorkingAgentSession(
	sessions: readonly AgentSession[],
	draft: string,
): AgentSession | null {
	return findMentionedWorkingAgentSessions(sessions, draft)[0] ?? null;
}

/** Latest active agent or skill session for every distinct submitted token. */
export function findSteeredWorkingSessions(
	sessions: readonly AgentSession[],
	draft: string,
): AgentSession[] {
	const matchedAgentIds = new Set<string>();
	const matches: AgentSession[] = [];
	for (let index = sessions.length - 1; index >= 0; index -= 1) {
		const session = sessions[index];
		if (!isWorkingSession(session) || matchedAgentIds.has(session.agentId)) {
			continue;
		}
		const token = session.agentId.startsWith("skill:")
			? `/${session.title ?? session.agentName}`
			: `@${session.agentName}`;
		if (includesComposerToken(draft, token)) {
			matchedAgentIds.add(session.agentId);
			matches.push(session);
		}
	}
	return matches;
}

/** Latest active agent or skill session that the submitted draft should steer. */
export function findSteeredWorkingSession(
	sessions: readonly AgentSession[],
	draft: string,
): AgentSession | null {
	return findSteeredWorkingSessions(sessions, draft)[0] ?? null;
}
