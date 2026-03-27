"use client";

import {
	CodeBlock,
	CodeBlockHeader,
	CodeBlockTitle,
	CodeBlockActions,
	CodeBlockCopyButton,
	CodeBlockDownloadButton,
} from "@/components/ui-ai/code-block";
import type { BundledLanguage } from "shiki";

interface DocCodeSnippetProps {
	code: string;
	language?: BundledLanguage;
	title?: string;
}

export function DocCodeSnippet({ code, language = "tsx", title }: Readonly<DocCodeSnippetProps>) {
	return (
		<CodeBlock code={code} language={language}>
			<CodeBlockHeader>
				<CodeBlockTitle>{title}</CodeBlockTitle>
				<CodeBlockActions>
					<CodeBlockDownloadButton />
					<CodeBlockCopyButton />
				</CodeBlockActions>
			</CodeBlockHeader>
		</CodeBlock>
	);
}
