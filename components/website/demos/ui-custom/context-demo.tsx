"use client";

import {
	Context,
	ContextTrigger,
	ContextContent,
	ContextContentHeader,
	ContextContentBody,
	ContextContentFooter,
	ContextInputUsage,
	ContextOutputUsage,
	ContextReasoningUsage,
	ContextCacheUsage,
} from "@/components/ui-custom/context";
import type { LanguageModelUsage } from "ai";

const SAMPLE_USAGE: LanguageModelUsage = {
	inputTokens: 12_450,
	outputTokens: 3_280,
	totalTokens: 21_490,
	inputTokenDetails: {
		noCacheTokens: 8_250,
		cacheReadTokens: 4_200,
		cacheWriteTokens: undefined,
	},
	outputTokenDetails: {
		textTokens: 1_720,
		reasoningTokens: 1_560,
	},
	reasoningTokens: 1_560,
	cachedInputTokens: 4_200,
};

export default function ContextDemo() {
	return <ContextDemoWithCost />;
}

export function ContextDemoWithCost() {
	return (
		<div className="flex items-center justify-center p-8">
			<Context
				maxTokens={128_000}
				usedTokens={21_490}
				usage={SAMPLE_USAGE}
				modelId="openai:gpt-4o"
			>
				<ContextTrigger />
				<ContextContent>
					<ContextContentHeader />
					<ContextContentBody>
						<ContextInputUsage />
						<ContextOutputUsage />
						<ContextReasoningUsage />
						<ContextCacheUsage />
					</ContextContentBody>
					<ContextContentFooter />
				</ContextContent>
			</Context>
		</div>
	);
}

export function ContextDemoMinimal() {
	return (
		<div className="flex items-center justify-center p-8">
			<Context maxTokens={128_000} usedTokens={64_000}>
				<ContextTrigger />
				<ContextContent>
					<ContextContentHeader />
				</ContextContent>
			</Context>
		</div>
	);
}

export function ContextDemoHighUsage() {
	const highUsage: LanguageModelUsage = {
		inputTokens: 95_000,
		outputTokens: 28_000,
		totalTokens: 123_000,
		inputTokenDetails: {
			noCacheTokens: 95_000,
			cacheReadTokens: undefined,
			cacheWriteTokens: undefined,
		},
		outputTokenDetails: {
			textTokens: 28_000,
			reasoningTokens: undefined,
		},
	};

	return (
		<div className="flex items-center justify-center p-8">
			<Context
				maxTokens={128_000}
				usedTokens={123_000}
				usage={highUsage}
				modelId="openai:gpt-4o"
			>
				<ContextTrigger />
				<ContextContent>
					<ContextContentHeader />
					<ContextContentBody>
						<ContextInputUsage />
						<ContextOutputUsage />
					</ContextContentBody>
					<ContextContentFooter />
				</ContextContent>
			</Context>
		</div>
	);
}

export function ContextDemoCustomTrigger() {
	return (
		<div className="flex items-center justify-center p-8">
			<Context
				maxTokens={200_000}
				usedTokens={45_000}
				usage={SAMPLE_USAGE}
				modelId="anthropic:claude-3.5-sonnet"
			>
				<ContextTrigger className="text-xs">
					<span className="text-muted-foreground">45K / 200K tokens</span>
				</ContextTrigger>
				<ContextContent>
					<ContextContentHeader />
					<ContextContentBody>
						<ContextInputUsage />
						<ContextOutputUsage />
						<ContextReasoningUsage />
						<ContextCacheUsage />
					</ContextContentBody>
					<ContextContentFooter />
				</ContextContent>
			</Context>
		</div>
	);
}
