"use client";

import {
	OpenIn,
	OpenInTrigger,
	OpenInContent,
	OpenInChatGPT,
	OpenInClaude,
	OpenInCursor,
	OpenInT3,
	OpenInScira,
	OpenInv0,
	OpenInSeparator,
	OpenInLabel,
} from "@/components/ui-custom/open-in-chat";
import { SendIcon } from "@/components/ui/vpk-icons";

export default function OpenInChatDemo() {
	return <OpenInChatDemoAllProviders />;
}

export function OpenInChatDemoAllProviders() {
	return (
		<OpenIn query="Explain the difference between React Server Components and Client Components">
			<OpenInTrigger />
			<OpenInContent>
				<OpenInLabel>AI Assistants</OpenInLabel>
				<OpenInSeparator />
				<OpenInChatGPT />
				<OpenInClaude />
				<OpenInT3 />
				<OpenInScira />
				<OpenInv0 />
				<OpenInCursor />
			</OpenInContent>
		</OpenIn>
	);
}

export function OpenInChatDemoMinimal() {
	return (
		<OpenIn query="What is TypeScript?">
			<OpenInTrigger />
			<OpenInContent>
				<OpenInChatGPT />
				<OpenInClaude />
			</OpenInContent>
		</OpenIn>
	);
}

export function OpenInChatDemoCustomTrigger() {
	return (
		<OpenIn query="Help me debug this React useEffect cleanup function">
			<OpenInTrigger>
				<SendIcon className="size-4" />
				Ask AI
			</OpenInTrigger>
			<OpenInContent>
				<OpenInLabel>Choose assistant</OpenInLabel>
				<OpenInSeparator />
				<OpenInChatGPT />
				<OpenInClaude />
				<OpenInCursor />
			</OpenInContent>
		</OpenIn>
	);
}

export function OpenInChatDemoGrouped() {
	return (
		<OpenIn query="Write a REST API with Express and TypeScript">
			<OpenInTrigger />
			<OpenInContent>
				<OpenInLabel>Chat</OpenInLabel>
				<OpenInChatGPT />
				<OpenInClaude />
				<OpenInT3 />
				<OpenInSeparator />
				<OpenInLabel>Code</OpenInLabel>
				<OpenInv0 />
				<OpenInCursor />
				<OpenInSeparator />
				<OpenInLabel>Search</OpenInLabel>
				<OpenInScira />
			</OpenInContent>
		</OpenIn>
	);
}
