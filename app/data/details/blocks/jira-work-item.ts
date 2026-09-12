import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_WORK_ITEM_DETAIL: ComponentDetail = {
	description: "Jira work-item surface with a standard current-state variant and independently versioned experimental forks for agent/chat iteration.",
	importStatement: `import JiraWorkItem from "@/components/blocks/jira-work-item";`,
	usage: `import JiraWorkItem from "@/components/blocks/jira-work-item";

<JiraWorkItem variant="experimental" initialExperimentalPreset="running" />`,
	examples: [
		{
			title: "Standard",
			description: "Current Jira agent sessions surface with the work item modal trigger and floating Rovo chat.",
			demoSlug: "jira-work-item-demo-standard",
		},
		{
			title: "Experimental · Filled context",
			description: "Work-item-scoped experimental variant: independent context/session state, deterministic Empty/Filled/Running presets, concurrent mock agents, and one shared floating chat/session experience.",
			demoSlug: "jira-work-item-demo-experimental",
		},
		{
			title: "Experimental · Empty context",
			description: "Experimental empty-context preset with an automatic deterministic AI Planner pass that immediately prefills the normal work-item fields, supports natural-language refinement, and keeps one explicit confirmation action.",
			demoSlug: "jira-work-item-demo-experimental-empty",
		},
		{
			title: "Experimental · Multiple agents running",
			description: "Experimental variant seeded with the running preset: several work-item-scoped agents progressing concurrently on a deterministic metronome, with live status pills and progress.",
			demoSlug: "jira-work-item-demo-experimental-running",
		},
		{
			title: "Experimental v2 · Filled context",
			description: "Experimental v2 session: a standalone fork of the experimental surface that starts identical to v1 and diverges independently. Shares the session/planner model, owns its own component tree.",
			demoSlug: "jira-work-item-demo-experimental-v2",
		},
		{
			title: "Experimental v2 · Empty context",
			description: "Experimental v2 empty-context preset with the same automatic deterministic AI Planner pass, natural-language refinement, and single explicit confirmation action as v1.",
			demoSlug: "jira-work-item-demo-experimental-v2-empty",
		},
		{
			title: "Experimental v2 · Multiple agents running",
			description: "Experimental v2 seeded with the running preset: several work-item-scoped agents progressing concurrently on a deterministic metronome, with live status pills and progress.",
			demoSlug: "jira-work-item-demo-experimental-v2-running",
		},
		{
			title: "Experimental v3 · Filled context",
			description: "Experimental v3 session: a standalone fork of the experimental v2 surface that starts identical to v2 and diverges independently. Shares the session/planner model, owns its own component tree.",
			demoSlug: "jira-work-item-demo-experimental-v3",
		},
		{
			title: "Experimental v3 · Empty context",
			description: "Experimental v3 empty-context preset with the same automatic deterministic AI Planner pass, natural-language refinement, and single explicit confirmation action as v2.",
			demoSlug: "jira-work-item-demo-experimental-v3-empty",
		},
		{
			title: "Experimental v3 · Multiple agents running",
			description: "Experimental v3 seeded with the running preset: several work-item-scoped agents progressing concurrently on a deterministic metronome, with live status pills and progress.",
			demoSlug: "jira-work-item-demo-experimental-v3-running",
		},
{
			title: "Experimental v4 · Filled context",
			description: "Experimental v4 session: a standalone fork of the source variant surface that starts identical to the source variant and diverges independently. Shares the session/planner model, owns its own component tree.",
			demoSlug: "jira-work-item-demo-experimental-v4",
		},
{
			title: "Experimental v4 · Empty context",
			description: "Experimental v4 empty-context preset with the same automatic deterministic AI Planner pass, natural-language refinement, and single explicit confirmation action as the source variant.",
			demoSlug: "jira-work-item-demo-experimental-v4-empty",
		},
{
			title: "Experimental v4 · Multiple agents running",
			description: "Experimental v4 seeded with the running preset: several work-item-scoped agents progressing concurrently on a deterministic metronome, with live status pills and progress.",
			demoSlug: "jira-work-item-demo-experimental-v4-running",
		},
		{
			title: "Experimental v5 · Filled context",
			description: "Experimental v5 session: a standalone fork of the experimental v4 surface that starts identical to v4 and can diverge independently. Shares the session/planner model and owns its own component tree.",
			demoSlug: "jira-work-item-demo-experimental-v5",
		},
		{
			title: "Experimental v5 · Empty context",
			description: "Experimental v5 empty-context preset with the same automatic deterministic AI Planner pass, natural-language refinement, and single explicit confirmation action as v4.",
			demoSlug: "jira-work-item-demo-experimental-v5-empty",
		},
		{
			title: "Experimental v5 · Multiple agents running",
			description: "Experimental v5 seeded with the running preset: several work-item-scoped agents progressing concurrently on a deterministic metronome, with live status pills and progress.",
			demoSlug: "jira-work-item-demo-experimental-v5-running",
		},
		{
			title: "Team EU26",
			description: "Team EU26 work item experience recreated with VPK components and design tokens.",
			demoSlug: "jira-work-item-demo-team-eu26",
		},
		{
			title: "Team EU26 · Empty context",
			description: "Team EU26 empty-context preset: VITA-1 chrome with sparse description, add-resource actions, seed activity, and empty Details / Development / Automation rail.",
			demoSlug: "jira-work-item-demo-team-eu26-empty",
		},
	],
	props: [
		{
			name: "initialIssueOpen",
			type: "boolean",
			default: "false",
			description: "Opens the Jira work item modal on initial render.",
		},
		{
			name: "onIssueClose",
			type: "() => void",
			description: "Called after the Jira work item modal closes.",
		},
		{
			name: "variant",
			type: "\"default\" | \"experimental\" | \"experimental-v2\" | \"experimental-v3\" | \"experimental-v4\" | \"experimental-v5\" | \"team-eu26\"",
			default: "\"default\"",
			description: "Opt-in layout variation with independently owned component trees.",
		},
		{
			name: "initialExperimentalPreset",
			type: "\"blank\" | \"empty\" | \"filled\" | \"running\"",
			default: "\"filled\"",
			description: "Deterministic starting state for the experimental variants: true empty context, AI-planned suggestions, filled context, or filled context with concurrent running agents.",
		},
	],
};
