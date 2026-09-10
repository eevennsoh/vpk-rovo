"use client";

import Page from "@/components/blocks/agent-session/page";

export default function AgentSessionDemo() {
	return <Page />;
}

export function AgentSessionDemoMediumDetached() {
	return <Page variant="medium-detached" />;
}

export function AgentSessionDemoMediumAttached() {
	return <Page variant="medium-attached" />;
}

export function AgentSessionDemoSmall() {
	return <Page variant="small" />;
}

export function AgentSessionDemoDrag() {
	return <Page drag />;
}
