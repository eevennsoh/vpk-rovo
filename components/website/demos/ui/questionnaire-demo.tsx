"use client";

import { useState, type FormEvent } from "react";

import {
	Questionnaire,
	QuestionnaireChoice,
	QuestionnaireChoiceInput,
	QuestionnaireChoiceLabel,
	QuestionnaireChoiceShortcut,
	QuestionnaireChoices,
	QuestionnaireDescription,
	QuestionnaireError,
	QuestionnaireInput,
	QuestionnaireItem,
	QuestionnaireNext,
	QuestionnairePrevious,
	QuestionnaireProgress,
	QuestionnaireSkip,
	QuestionnaireSubmit,
	QuestionnaireTitle,
	type QuestionnaireItemDefinition,
} from "@/components/ui/questionnaire";

type Choice = {
	value: string;
	label: string;
	description?: string;
};

type Question = Omit<QuestionnaireItemDefinition, "choices"> & {
	prompt: string;
	description: string;
	multiple?: boolean;
	choices: readonly Choice[];
	input?: { label: string; placeholder: string };
};

const PROTOTYPE_QUESTIONS: readonly Question[] = [
	{
		name: "surface",
		required: true,
		prompt: "What should we prototype next?",
		description: "Pick a direction, or write your own.",
		choices: [
			{
				value: "delegation",
				label: "Delegation",
				description: "Hand a task to an agent and track it.",
			},
			{
				value: "questions",
				label: "Question prompts",
				description: "Ask before acting on an ambiguous request.",
			},
			{ value: "both", label: "Both together" },
		],
		input: { label: "Another answer", placeholder: "Type another answer…" },
	},
	{
		name: "detail",
		prompt: "How much detail should it include?",
		description: "Skip this if you are not sure yet.",
		choices: [
			{ value: "focused", label: "Focused", description: "One happy path." },
			{ value: "complete", label: "Complete flow", description: "Every state." },
		],
	},
	{
		name: "audience",
		required: true,
		prompt: "Who is the first audience?",
		description: "This decides how much polish the first pass needs.",
		choices: [
			{ value: "team", label: "The team" },
			{ value: "leadership", label: "Leadership review" },
			{ value: "customers", label: "Customer research" },
		],
	},
];

const SHORTCUT_QUESTIONS: readonly Question[] = [
	{
		name: "priority",
		required: true,
		prompt: "Which release should this land in?",
		description: "Press a number key to answer without leaving the keyboard.",
		choices: [
			{ value: "next", label: "Next release" },
			{ value: "quarter", label: "This quarter" },
			{ value: "backlog", label: "Backlog" },
		],
	},
];

const CHANNEL_QUESTIONS: readonly Question[] = [
	{
		name: "channels",
		required: true,
		multiple: true,
		prompt: "Where should we announce it?",
		description: "Choose every channel that applies.",
		choices: [
			{ value: "changelog", label: "Changelog" },
			{ value: "slack", label: "Slack" },
			{ value: "email", label: "Email digest" },
			{ value: "demo", label: "Demo day" },
		],
	},
];

function QuestionList({ questions }: Readonly<{ questions: readonly Question[] }>) {
	return (
		<>
			{questions.map((question) => (
				<QuestionnaireItem
					key={question.name}
					name={question.name}
					required={question.required}
					multiple={question.multiple}
				>
					<QuestionnaireTitle>{question.prompt}</QuestionnaireTitle>
					<QuestionnaireDescription>{question.description}</QuestionnaireDescription>
					<QuestionnaireChoices>
						{question.choices.map((choice) => (
							<QuestionnaireChoice key={choice.value} value={choice.value}>
								<QuestionnaireChoiceInput />
								<QuestionnaireChoiceLabel>
									<span>{choice.label}</span>
									{choice.description ? <span>{choice.description}</span> : null}
								</QuestionnaireChoiceLabel>
								<QuestionnaireChoiceShortcut />
							</QuestionnaireChoice>
						))}
						{question.input ? (
							<QuestionnaireInput
								aria-label={question.input.label}
								placeholder={question.input.placeholder}
							/>
						) : null}
					</QuestionnaireChoices>
					<QuestionnaireError />
				</QuestionnaireItem>
			))}
		</>
	);
}

function Actions() {
	return (
		<div className="flex items-center gap-2 pt-1">
			<QuestionnairePrevious />
			<div className="flex-1" />
			<QuestionnaireSkip />
			<QuestionnaireNext />
			<QuestionnaireSubmit />
		</div>
	);
}

function Answers({ answers }: Readonly<{ answers: Record<string, string> | null }>) {
	if (!answers) {
		return null;
	}

	return (
		<dl className="border-border bg-surface-sunken text-text-subtle grid gap-1 rounded-lg border p-3 text-xs">
			{Object.entries(answers).map(([name, value]) => (
				<div key={name} className="flex gap-2">
					<dt className="text-text font-medium">{name}</dt>
					<dd className="min-w-0 truncate">{value || "—"}</dd>
				</div>
			))}
		</dl>
	);
}

function useAnswers() {
	const [answers, setAnswers] = useState<Record<string, string> | null>(null);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const next: Record<string, string> = {};
		for (const key of new Set(formData.keys())) {
			next[key] = formData.getAll(key).join(", ");
		}
		setAnswers(next);
	}

	return { answers, handleSubmit };
}

export default function QuestionnaireDemo() {
	return <QuestionnaireDemoDefault />;
}

export function QuestionnaireDemoDefault() {
	const { answers, handleSubmit } = useAnswers();

	return (
		<div className="flex w-full max-w-lg flex-col gap-3">
			<Questionnaire items={PROTOTYPE_QUESTIONS} onSubmit={handleSubmit}>
				<QuestionnaireProgress />
				<QuestionList questions={PROTOTYPE_QUESTIONS} />
				<Actions />
			</Questionnaire>
			<Answers answers={answers} />
		</div>
	);
}

export function QuestionnaireDemoShortcuts() {
	const { answers, handleSubmit } = useAnswers();

	return (
		<div className="flex w-full max-w-lg flex-col gap-3">
			<Questionnaire
				items={SHORTCUT_QUESTIONS}
				shortcuts="numbers"
				onSubmit={handleSubmit}
			>
				<QuestionnaireProgress />
				<QuestionList questions={SHORTCUT_QUESTIONS} />
				<Actions />
			</Questionnaire>
			<Answers answers={answers} />
		</div>
	);
}

export function QuestionnaireDemoMultiple() {
	const { answers, handleSubmit } = useAnswers();

	return (
		<div className="flex w-full max-w-lg flex-col gap-3">
			<Questionnaire items={CHANNEL_QUESTIONS} onSubmit={handleSubmit}>
				<QuestionnaireProgress />
				<QuestionList questions={CHANNEL_QUESTIONS} />
				<Actions />
			</Questionnaire>
			<Answers answers={answers} />
		</div>
	);
}
