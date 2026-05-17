import {
	Snippet,
	SnippetAddon,
	SnippetInput,
	SnippetText,
	SnippetCopyButton,
} from "@/components/ui-custom/snippet";

export default function SnippetDemo() {
	return (
		<Snippet code="npm install ai" className="w-full">
			<SnippetAddon>
				<SnippetText>$</SnippetText>
			</SnippetAddon>
			<SnippetInput />
			<SnippetCopyButton />
		</Snippet>
	);
}

export function SnippetDemoPlain() {
	return (
		<Snippet code="npm install ai" className="w-full">
			<SnippetInput />
			<SnippetCopyButton />
		</Snippet>
	);
}

export function SnippetDemoMultiple() {
	return (
		<div className="flex w-full flex-col gap-3">
			<Snippet code="npm install ai" className="w-full">
				<SnippetAddon>
					<SnippetText>$</SnippetText>
				</SnippetAddon>
				<SnippetInput />
				<SnippetCopyButton />
			</Snippet>
			<Snippet code="npx create-next-app@latest" className="w-full">
				<SnippetAddon>
					<SnippetText>$</SnippetText>
				</SnippetAddon>
				<SnippetInput />
				<SnippetCopyButton />
			</Snippet>
			<Snippet code="pnpm add @ai-sdk/react" className="w-full">
				<SnippetAddon>
					<SnippetText>$</SnippetText>
				</SnippetAddon>
				<SnippetInput />
				<SnippetCopyButton />
			</Snippet>
		</div>
	);
}

export function SnippetDemoCallbacks() {
	return (
		<Snippet code="curl -X POST https://api.example.com/v1/chat" className="w-full">
			<SnippetAddon>
				<SnippetText>$</SnippetText>
			</SnippetAddon>
			<SnippetInput />
			<SnippetCopyButton
				onCopy={() => console.log("Copied!")}
				onError={(error) => console.error("Copy failed:", error)}
				timeout={3000}
			/>
		</Snippet>
	);
}
