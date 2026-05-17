"use client";

import { useState } from "react";

import {
	ModelSelector,
	ModelSelectorContent,
	ModelSelectorEmpty,
	ModelSelectorGroup,
	ModelSelectorInput,
	ModelSelectorItem,
	ModelSelectorList,
	ModelSelectorLogo,
	ModelSelectorLogoGroup,
	ModelSelectorName,
	ModelSelectorSeparator,
	ModelSelectorTrigger,
} from "@/components/ui-custom/model-selector";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/vpk-icons";

// — Shared model data —

const ANTHROPIC_MODELS = [
	{ value: "claude-4-sonnet", label: "Claude 4 Sonnet" },
	{ value: "claude-4-opus", label: "Claude 4 Opus" },
	{ value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
];

const OPENAI_MODELS = [
	{ value: "gpt-4o", label: "GPT-4o" },
	{ value: "gpt-4o-mini", label: "GPT-4o Mini" },
	{ value: "o3", label: "o3" },
];

const GOOGLE_MODELS = [
	{ value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
	{ value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
];

const MISTRAL_MODELS = [
	{ value: "mistral-large", label: "Mistral Large" },
	{ value: "codestral", label: "Codestral" },
];

// — Default: minimal command palette —

export default function ModelSelectorDemo() {
	return (
		<ModelSelector>
			<ModelSelectorTrigger render={<Button variant="outline" size="sm" />}>
				Select model
			</ModelSelectorTrigger>
			<ModelSelectorContent>
				<ModelSelectorList>
					<ModelSelectorGroup heading="Models">
						<ModelSelectorItem value="gpt-4o">
							<ModelSelectorName>GPT-4o</ModelSelectorName>
						</ModelSelectorItem>
						<ModelSelectorItem value="claude-4-sonnet">
							<ModelSelectorName>Claude 4 Sonnet</ModelSelectorName>
						</ModelSelectorItem>
					</ModelSelectorGroup>
				</ModelSelectorList>
			</ModelSelectorContent>
		</ModelSelector>
	);
}

// — With search: includes ModelSelectorInput and empty state —

export function ModelSelectorDemoWithSearch() {
	const [selected, setSelected] = useState("claude-4-sonnet");

	return (
		<ModelSelector>
			<ModelSelectorTrigger render={<Button variant="outline" size="sm" />}>
				{ANTHROPIC_MODELS.concat(OPENAI_MODELS)
					.concat(GOOGLE_MODELS)
					.find((m) => m.value === selected)?.label ?? "Select model"}
			</ModelSelectorTrigger>
			<ModelSelectorContent>
				<ModelSelectorInput placeholder="Search models..." />
				<ModelSelectorList>
					<ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
					<ModelSelectorGroup heading="Anthropic">
						{ANTHROPIC_MODELS.map((m) => (
							<ModelSelectorItem
								key={m.value}
								value={m.value}
								onSelect={() => setSelected(m.value)}
							>
								<ModelSelectorName>{m.label}</ModelSelectorName>
								{selected === m.value ? (
									<CheckIcon className="ml-auto size-4 text-text-subtle" />
								) : null}
							</ModelSelectorItem>
						))}
					</ModelSelectorGroup>
					<ModelSelectorGroup heading="OpenAI">
						{OPENAI_MODELS.map((m) => (
							<ModelSelectorItem
								key={m.value}
								value={m.value}
								onSelect={() => setSelected(m.value)}
							>
								<ModelSelectorName>{m.label}</ModelSelectorName>
								{selected === m.value ? (
									<CheckIcon className="ml-auto size-4 text-text-subtle" />
								) : null}
							</ModelSelectorItem>
						))}
					</ModelSelectorGroup>
					<ModelSelectorGroup heading="Google">
						{GOOGLE_MODELS.map((m) => (
							<ModelSelectorItem
								key={m.value}
								value={m.value}
								onSelect={() => setSelected(m.value)}
							>
								<ModelSelectorName>{m.label}</ModelSelectorName>
								{selected === m.value ? (
									<CheckIcon className="ml-auto size-4 text-text-subtle" />
								) : null}
							</ModelSelectorItem>
						))}
					</ModelSelectorGroup>
				</ModelSelectorList>
			</ModelSelectorContent>
		</ModelSelector>
	);
}

// — With logos: provider logos on items and trigger —

export function ModelSelectorDemoWithLogos() {
	const [selected, setSelected] = useState("claude-4-sonnet");

	const allModels = [
		...ANTHROPIC_MODELS.map((m) => ({ ...m, provider: "anthropic" })),
		...OPENAI_MODELS.map((m) => ({ ...m, provider: "openai" })),
		...GOOGLE_MODELS.map((m) => ({ ...m, provider: "google" })),
		...MISTRAL_MODELS.map((m) => ({ ...m, provider: "mistral" })),
	];

	const current = allModels.find((m) => m.value === selected);

	return (
		<ModelSelector>
			<ModelSelectorTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
				<ModelSelectorLogoGroup>
					<ModelSelectorLogo provider={current?.provider ?? "anthropic"} />
				</ModelSelectorLogoGroup>
				{current?.label ?? "Select model"}
			</ModelSelectorTrigger>
			<ModelSelectorContent>
				<ModelSelectorInput placeholder="Search models..." />
				<ModelSelectorList>
					<ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
					<ModelSelectorGroup heading="Anthropic">
						{ANTHROPIC_MODELS.map((m) => (
							<ModelSelectorItem
								key={m.value}
								value={m.value}
								onSelect={() => setSelected(m.value)}
							>
								<ModelSelectorLogo provider="anthropic" />
								<ModelSelectorName>{m.label}</ModelSelectorName>
							</ModelSelectorItem>
						))}
					</ModelSelectorGroup>
					<ModelSelectorSeparator />
					<ModelSelectorGroup heading="OpenAI">
						{OPENAI_MODELS.map((m) => (
							<ModelSelectorItem
								key={m.value}
								value={m.value}
								onSelect={() => setSelected(m.value)}
							>
								<ModelSelectorLogo provider="openai" />
								<ModelSelectorName>{m.label}</ModelSelectorName>
							</ModelSelectorItem>
						))}
					</ModelSelectorGroup>
					<ModelSelectorSeparator />
					<ModelSelectorGroup heading="Google">
						{GOOGLE_MODELS.map((m) => (
							<ModelSelectorItem
								key={m.value}
								value={m.value}
								onSelect={() => setSelected(m.value)}
							>
								<ModelSelectorLogo provider="google" />
								<ModelSelectorName>{m.label}</ModelSelectorName>
							</ModelSelectorItem>
						))}
					</ModelSelectorGroup>
					<ModelSelectorSeparator />
					<ModelSelectorGroup heading="Mistral">
						{MISTRAL_MODELS.map((m) => (
							<ModelSelectorItem
								key={m.value}
								value={m.value}
								onSelect={() => setSelected(m.value)}
							>
								<ModelSelectorLogo provider="mistral" />
								<ModelSelectorName>{m.label}</ModelSelectorName>
							</ModelSelectorItem>
						))}
					</ModelSelectorGroup>
				</ModelSelectorList>
			</ModelSelectorContent>
		</ModelSelector>
	);
}

// — Multi-provider trigger: logo group showing multiple provider logos —

export function ModelSelectorDemoMultiProvider() {
	const [selected, setSelected] = useState("claude-4-sonnet");

	return (
		<ModelSelector>
			<ModelSelectorTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
				<ModelSelectorLogoGroup>
					<ModelSelectorLogo provider="anthropic" />
					<ModelSelectorLogo provider="openai" />
					<ModelSelectorLogo provider="google" />
				</ModelSelectorLogoGroup>
				{ANTHROPIC_MODELS.concat(OPENAI_MODELS)
					.concat(GOOGLE_MODELS)
					.find((m) => m.value === selected)?.label ?? selected}
			</ModelSelectorTrigger>
			<ModelSelectorContent>
				<ModelSelectorInput placeholder="Search models..." />
				<ModelSelectorList>
					<ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
					<ModelSelectorGroup heading="Anthropic">
						{ANTHROPIC_MODELS.map((m) => (
							<ModelSelectorItem
								key={m.value}
								value={m.value}
								onSelect={() => setSelected(m.value)}
							>
								<ModelSelectorLogo provider="anthropic" />
								<ModelSelectorName>{m.label}</ModelSelectorName>
							</ModelSelectorItem>
						))}
					</ModelSelectorGroup>
					<ModelSelectorGroup heading="OpenAI">
						{OPENAI_MODELS.map((m) => (
							<ModelSelectorItem
								key={m.value}
								value={m.value}
								onSelect={() => setSelected(m.value)}
							>
								<ModelSelectorLogo provider="openai" />
								<ModelSelectorName>{m.label}</ModelSelectorName>
							</ModelSelectorItem>
						))}
					</ModelSelectorGroup>
					<ModelSelectorGroup heading="Google">
						{GOOGLE_MODELS.map((m) => (
							<ModelSelectorItem
								key={m.value}
								value={m.value}
								onSelect={() => setSelected(m.value)}
							>
								<ModelSelectorLogo provider="google" />
								<ModelSelectorName>{m.label}</ModelSelectorName>
							</ModelSelectorItem>
						))}
					</ModelSelectorGroup>
				</ModelSelectorList>
			</ModelSelectorContent>
		</ModelSelector>
	);
}
