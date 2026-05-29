import { CardDirectory } from "@/components/ui-custom/card-directory";

export default function CardDirectoryDemo() {
	return (
		<div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
			<CardDirectory
				name="Feedback analyzer"
				publisher="Atlassian"
				avatarSrc="/avatar-agent/product-agents/feedback-analyzer.svg"
				description="Surfaces themes and sentiment from raw customer feedback in seconds."
				verified
				rating={4.6}
				feedbackCount={1280}
				chatCount={9400}
				onSelect={() => {}}
				onMoreActions={() => {}}
			/>
			<CardDirectory
				name="Code reviewer"
				publisher="Mei Tan"
				avatarSrc="/avatar-agent/dev-agents/code-reviewer.svg"
				description="Reviews PRs for style, correctness, and security gotchas."
				rating={4.2}
				feedbackCount={340}
				chatCount={1500}
				onSelect={() => {}}
				onMoreActions={() => {}}
			/>
		</div>
	);
}
