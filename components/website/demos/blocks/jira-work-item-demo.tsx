"use client";

import JiraWorkItem from "@/components/blocks/jira-work-item";
import JiraWorkItemPage from "@/components/blocks/jira-work-item/page";

export default function JiraWorkItemDemo() {
	return <JiraWorkItemPage />;
}

export function JiraWorkItemDemoStandard() {
	return <JiraWorkItem variant="default" />;
}

export function JiraWorkItemDemoExperimental() {
	return <JiraWorkItem variant="experimental" initialExperimentalPreset="filled" />;
}

export function JiraWorkItemDemoExperimentalEmpty() {
	return <JiraWorkItem variant="experimental" initialExperimentalPreset="empty" />;
}

export function JiraWorkItemDemoExperimentalRunning() {
	return <JiraWorkItem variant="experimental" initialExperimentalPreset="running" />;
}

export function JiraWorkItemDemoExperimentalV2() {
	return <JiraWorkItem variant="experimental-v2" initialExperimentalPreset="filled" />;
}

export function JiraWorkItemDemoExperimentalV2Empty() {
	return <JiraWorkItem variant="experimental-v2" initialExperimentalPreset="empty" />;
}

export function JiraWorkItemDemoExperimentalV2Running() {
	return <JiraWorkItem variant="experimental-v2" initialExperimentalPreset="running" />;
}

export function JiraWorkItemDemoExperimentalV3() {
	return <JiraWorkItem variant="experimental-v3" initialExperimentalPreset="filled" />;
}
export function JiraWorkItemDemoExperimentalV4() {
	return <JiraWorkItem variant="experimental-v4" initialExperimentalPreset="filled" />;
}
export function JiraWorkItemDemoExperimentalV5() {
	return <JiraWorkItem variant="experimental-v5" initialExperimentalPreset="filled" />;
}
export function JiraWorkItemDemoExperimentalV6() {
	return <JiraWorkItem variant="experimental-v6" initialExperimentalPreset="filled" />;
}
export function JiraWorkItemDemoTeamEu26() {
	return <JiraWorkItem variant="team-eu26" initialExperimentalPreset="filled" />;
}

export function JiraWorkItemDemoExperimentalV3Empty() {
	return <JiraWorkItem variant="experimental-v3" initialExperimentalPreset="empty" />;
}
export function JiraWorkItemDemoExperimentalV4Empty() {
	return <JiraWorkItem variant="experimental-v4" initialExperimentalPreset="empty" />;
}
export function JiraWorkItemDemoExperimentalV5Empty() {
	return <JiraWorkItem variant="experimental-v5" initialExperimentalPreset="empty" />;
}
export function JiraWorkItemDemoExperimentalV6Empty() {
	return <JiraWorkItem variant="experimental-v6" initialExperimentalPreset="empty" />;
}

export function JiraWorkItemDemoExperimentalV3Running() {
	return <JiraWorkItem variant="experimental-v3" initialExperimentalPreset="running" />;
}
export function JiraWorkItemDemoExperimentalV4Running() {
	return <JiraWorkItem variant="experimental-v4" initialExperimentalPreset="running" />;
}
export function JiraWorkItemDemoExperimentalV5Running() {
	return <JiraWorkItem variant="experimental-v5" initialExperimentalPreset="running" />;
}
export function JiraWorkItemDemoExperimentalV6Running() {
	return <JiraWorkItem variant="experimental-v6" initialExperimentalPreset="running" />;
}
