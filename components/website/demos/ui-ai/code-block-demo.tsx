"use client";

import {
	CodeBlock,
	CodeBlockActions,
	CodeBlockCopyButton,
	CodeBlockDownloadButton,
	CodeBlockFilename,
	CodeBlockHeader,
	CodeBlockLanguageSelector,
	CodeBlockLanguageSelectorContent,
	CodeBlockLanguageSelectorItem,
	CodeBlockLanguageSelectorTrigger,
	CodeBlockTitle,
} from "@/components/ui-ai/code-block";
import { useState } from "react";
import type { BundledLanguage } from "shiki";

const adsBasicCode = `type WorkItem = {
	id: string;
	summary: string;
	status: "To do" | "In progress" | "Done";
};

export function toDisplayStatus(item: WorkItem) {
	return item.status === "In progress" ? "In progress" : item.status;
}`;

const adsLineNumbersCode = `import { token } from "@/lib/tokens";

export function SurfaceCard({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<div
			style={{
				border: \`1px solid \${token("color.border")}\`,
				backgroundColor: token("elevation.surface"),
				borderRadius: token("radius.medium"),
				padding: token("space.200"),
			}}
		>
			{children}
		</div>
	);
}`;

const adsShellCode = `pnpm install
pnpm run lint
pnpm tsc --noEmit
pnpm run dev`;

const adsLanguageDemos = {
	typescript: {
		filename: "resolver.ts",
		code: `export function resolveAssignee(input: string | null) {
	return input?.trim() || "Unassigned";
}`,
	},
	python: {
		filename: "resolver.py",
		code: `def resolve_assignee(raw: str | None) -> str:
    if raw is None:
        return "Unassigned"
    value = raw.strip()
    return value or "Unassigned"`,
	},
	bash: {
		filename: "resolver.sh",
		code: `#!/usr/bin/env bash
assignee="\${1:-}"
if [ -z "$(echo "$assignee" | tr -d '[:space:]')" ]; then
	echo "Unassigned"
else
	echo "$assignee"
fi`,
	},
} as const;

type AdsLanguage = keyof typeof adsLanguageDemos;

const adsLanguageOptions: ReadonlyArray<{ value: AdsLanguage; label: string }> = [
	{ value: "typescript", label: "TypeScript" },
	{ value: "python", label: "Python" },
	{ value: "bash", label: "Bash" },
];

export default function CodeBlockDemo() {
	return <CodeBlockDemoAdsBasic />;
}

export function CodeBlockDemoAdsBasic() {
	return (
		<CodeBlock code={adsBasicCode} language="typescript" className="w-full text-xs">
			<CodeBlockHeader>
				<CodeBlockTitle>
					<CodeBlockFilename>status.ts</CodeBlockFilename>
				</CodeBlockTitle>
				<CodeBlockActions>
					<CodeBlockDownloadButton />
					<CodeBlockCopyButton />
				</CodeBlockActions>
			</CodeBlockHeader>
		</CodeBlock>
	);
}

export function CodeBlockDemoAdsLineNumbers() {
	return (
		<CodeBlock code={adsLineNumbersCode} language="typescript" showLineNumbers className="w-full text-xs">
			<CodeBlockHeader>
				<CodeBlockTitle>
					<CodeBlockFilename>surface-card.tsx</CodeBlockFilename>
				</CodeBlockTitle>
				<CodeBlockActions>
					<CodeBlockDownloadButton />
					<CodeBlockCopyButton />
				</CodeBlockActions>
			</CodeBlockHeader>
		</CodeBlock>
	);
}

export function CodeBlockDemoAdsShell() {
	return (
		<CodeBlock code={adsShellCode} language="bash" className="w-full text-xs">
			<CodeBlockHeader>
				<CodeBlockTitle>
					<CodeBlockFilename>commands.sh</CodeBlockFilename>
				</CodeBlockTitle>
				<CodeBlockActions>
					<CodeBlockDownloadButton />
					<CodeBlockCopyButton />
				</CodeBlockActions>
			</CodeBlockHeader>
		</CodeBlock>
	);
}

export function CodeBlockDemoAdsLanguageSelector() {
	const [language, setLanguage] = useState<AdsLanguage>("typescript");
	const current = adsLanguageDemos[language];

	return (
		<CodeBlock code={current.code} language={language as BundledLanguage} className="w-full text-xs">
			<CodeBlockHeader>
				<CodeBlockTitle>
					<CodeBlockFilename>{current.filename}</CodeBlockFilename>
				</CodeBlockTitle>
				<CodeBlockActions>
					<CodeBlockLanguageSelector value={language} onValueChange={(value) => setLanguage(value as AdsLanguage)}>
						<CodeBlockLanguageSelectorTrigger>
							{adsLanguageOptions.find((o) => o.value === language)?.label ?? language}
						</CodeBlockLanguageSelectorTrigger>
						<CodeBlockLanguageSelectorContent>
							{adsLanguageOptions.map((option) => (
								<CodeBlockLanguageSelectorItem key={option.value} value={option.value}>
									{option.label}
								</CodeBlockLanguageSelectorItem>
							))}
						</CodeBlockLanguageSelectorContent>
					</CodeBlockLanguageSelector>
					<CodeBlockDownloadButton />
					<CodeBlockCopyButton />
				</CodeBlockActions>
			</CodeBlockHeader>
		</CodeBlock>
	);
}
