"use client";

import JiraCreatePage from "@/components/blocks/jira-create/page";

export default function JiraCreateDemo() {
	return <JiraCreatePage example="work-item" />;
}

export function JiraCreateDemoWorkItem() {
	return <JiraCreatePage example="work-item" />;
}

export function JiraCreateDemoSessions() {
	return <JiraCreatePage example="work-item-sessions" />;
}
