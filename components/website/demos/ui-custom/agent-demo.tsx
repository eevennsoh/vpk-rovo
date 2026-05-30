"use client";

import { useState } from "react";
import {
	Agent,
	AgentConfigFields,
	type AgentConfigFormValue,
	type AgentConfigListFieldName,
	type AgentConfigTextFieldName,
	AgentContent,
	AgentHeader,
} from "@/components/ui-custom/agent";

const initialAgentConfig: AgentConfigFormValue = {
	name: "",
	description: "",
	summary: "",
	instructions: "",
	contextDescription: "",
	trigger: "",
	guardrail: "",
	tools: [],
	conversationStarters: [],
	agentId: "policy-checker",
	action: "draft",
};

const emptyAgentConfig: AgentConfigFormValue = {
	...initialAgentConfig,
	name: "Customer Insights",
	description:
		"Analyzes customer feedback from pages, links, or projects and surfaces themes, needs, risks, and recommended actions.",
	summary:
		"Analyzes customer feedback from pages, links, or projects and surfaces themes, needs, risks, and recommended actions.",
	agentId: "customer-insights",
};

const filledAgentConfig: AgentConfigFormValue = {
	name: "Policy Checker",
	description:
		"This agent helps employees quickly find and understand company guidelines, HR policies, and benefits information.",
	summary:
		"This agent helps employees quickly find and understand company guidelines, HR policies, and benefits information.",
	instructions: "",
	contextDescription: "",
	triggers: ["Company Handbook", "Company Handbook"],
	skills: ["create-work-items", "create-work-items"],
	tools: ["Tool name", "Tool name"],
	subagents: ["Subagent 1", "Subagent 1"],
	knowledge: ["Knowledge 1", "Knowledge 2"],
	conversationStarters: [],
	agentId: "policy-checker",
	action: "draft",
};

export function AgentDemoFull() {
	const [config, setConfig] = useState<AgentConfigFormValue>(filledAgentConfig);

	function handleTextChange(field: AgentConfigTextFieldName, value: string) {
		setConfig((current) => ({
			...current,
			[field]: value,
			...(field === "description" ? { summary: value } : {}),
		}));
	}

	function updateListItem(field: AgentConfigListFieldName, index: number, value: string) {
		setConfig((current) => {
			const items = Array.isArray(current[field]) ? [...current[field]] : [];
			items[index] = value;
			return { ...current, [field]: items };
		});
	}

	function removeListItem(field: AgentConfigListFieldName, index: number) {
		setConfig((current) => {
			const items = Array.isArray(current[field]) ? current[field] : [];
			return { ...current, [field]: items.filter((_, itemIndex) => itemIndex !== index) };
		});
	}

	function appendListItem(field: AgentConfigListFieldName) {
		setConfig((current) => {
			const items = Array.isArray(current[field]) ? current[field] : [];
			return { ...current, [field]: [...items, ""] };
		});
	}

	return (
		<Agent className="mx-auto min-h-[852px] w-full max-w-[720px]">
			<AgentHeader
				name={config.name?.trim() || "Untitled agent"}
				model="Draft"
			/>
			<AgentContent>
				<AgentConfigFields
					config={config}
					idPrefix="agent-demo-full"
					onTextChange={handleTextChange}
					onListItemChange={updateListItem}
					onRemoveListItem={removeListItem}
					onAppendListItem={appendListItem}
				/>
			</AgentContent>
		</Agent>
	);
}

export function AgentDemoEmpty() {
	const [config, setConfig] = useState<AgentConfigFormValue>(emptyAgentConfig);

	function handleTextChange(field: AgentConfigTextFieldName, value: string) {
		setConfig((current) => ({
			...current,
			[field]: value,
			...(field === "description" ? { summary: value } : {}),
		}));
	}

	function updateListItem(field: AgentConfigListFieldName, index: number, value: string) {
		setConfig((current) => {
			const items = Array.isArray(current[field]) ? [...current[field]] : [];
			items[index] = value;
			return { ...current, [field]: items };
		});
	}

	function removeListItem(field: AgentConfigListFieldName, index: number) {
		setConfig((current) => {
			const items = Array.isArray(current[field]) ? current[field] : [];
			return { ...current, [field]: items.filter((_, itemIndex) => itemIndex !== index) };
		});
	}

	function appendListItem(field: AgentConfigListFieldName) {
		setConfig((current) => {
			const items = Array.isArray(current[field]) ? current[field] : [];
			return { ...current, [field]: [...items, ""] };
		});
	}

	return (
		<Agent className="mx-auto min-h-[852px] w-full max-w-[720px]">
			<AgentHeader
				name={config.name?.trim() || "Customer Insights"}
				model="Draft"
			/>
			<AgentContent>
				<AgentConfigFields
					config={config}
					idPrefix="agent-demo-empty"
					onTextChange={handleTextChange}
					onListItemChange={updateListItem}
					onRemoveListItem={removeListItem}
					onAppendListItem={appendListItem}
				/>
			</AgentContent>
		</Agent>
	);
}

export default function AgentDemo() {
	return <AgentDemoFull />;
}
