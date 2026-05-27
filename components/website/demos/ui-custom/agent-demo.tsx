"use client";

import { tool } from "ai";
import { useState } from "react";
import { z } from "zod";
import {
	Agent,
	AgentConfigFields,
	type AgentConfigFormValue,
	type AgentConfigListFieldName,
	type AgentConfigTextFieldName,
	AgentContent,
	AgentHeader,
	AgentInstructions,
	AgentOutput,
	AgentTool,
	AgentTools,
} from "@/components/ui-custom/agent";

const webSearch = tool({
	description: "Search the web for information",
	inputSchema: z.object({
		query: z.string().describe("The search query"),
	}),
});

const executeCode = tool({
	description: "Execute a code snippet in a sandboxed environment",
	inputSchema: z.object({
		code: z.string().describe("The code to execute"),
		language: z
			.enum(["javascript", "python", "typescript"])
			.describe("The programming language"),
	}),
});

const queryDatabase = tool({
	description: "Run a read-only SQL query against the database",
	inputSchema: z.object({
		query: z.string().describe("The SQL query to execute"),
		database: z.string().describe("Target database name"),
	}),
});

const outputSchema = `z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  score: z.number(),
  summary: z.string(),
})`;

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

export function AgentDemoFull() {
	const [config, setConfig] = useState<AgentConfigFormValue>(initialAgentConfig);

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
				name="Untitled agent"
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

export function AgentDemoWithTools() {
	return (
		<Agent className="w-full">
			<AgentHeader
				name="Code Assistant"
				model="anthropic/claude-sonnet-4-5"
				showActions={false}
			/>
			<AgentContent>
				<AgentTools multiple>
					<AgentTool tool={executeCode} value="execute_code" />
					<AgentTool tool={queryDatabase} value="query_database" />
					<AgentTool tool={webSearch} value="web_search" />
				</AgentTools>
			</AgentContent>
		</Agent>
	);
}

export function AgentDemoWithOutput() {
	return (
		<Agent className="w-full">
			<AgentHeader
				name="Data Classifier"
				model="anthropic/claude-haiku-3-5"
				showActions={false}
			/>
			<AgentContent>
				<AgentInstructions>
					Classify incoming data records into predefined categories and return
					structured results with confidence scores.
				</AgentInstructions>
				<AgentOutput schema={outputSchema} />
			</AgentContent>
		</Agent>
	);
}

export function AgentDemoMinimal() {
	return (
		<Agent className="w-full">
			<AgentHeader
				name="Research Assistant"
				model="anthropic/claude-opus-4"
				showActions={false}
			/>
		</Agent>
	);
}

export default function AgentDemo() {
	return <AgentDemoFull />;
}
