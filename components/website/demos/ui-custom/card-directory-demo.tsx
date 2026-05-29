import { type ReactNode } from "react";
import Image from "next/image";
import PageIcon from "@atlaskit/icon/core/page";
import SearchIcon from "@atlaskit/icon/core/search";

import {
	CardDirectoryAgent,
	CardDirectorySkill,
	CardDirectoryTemplate,
	CardDirectoryTool,
} from "@/components/ui-custom/card-directory";
import { ConfluenceLogo } from "@/components/ui/logo";

function DemoSection({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
	return (
		<section className="flex w-full flex-col gap-3">
			<h3 className="text-xs font-semibold tracking-wide text-text-subtlest uppercase">{title}</h3>
			<div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
		</section>
	);
}

export default function CardDirectoryDemo() {
	return (
		<div className="flex w-full max-w-2xl flex-col gap-8">
			<DemoSection title="Agent">
				<CardDirectoryAgent
					avatarSrc="/avatar-agent/product-agents/feedback-analyzer.svg"
					chatCount={9400}
					description="Surfaces themes and sentiment from raw customer feedback in seconds."
					feedbackCount={1280}
					name="Feedback analyzer"
					onMoreActions={() => {}}
					onSelect={() => {}}
					publisher="Atlassian"
					rating={4.6}
					verified
				/>
				<CardDirectoryAgent
					avatarSrc="/avatar-agent/dev-agents/code-reviewer.svg"
					chatCount={1500}
					description="Reviews PRs for style, correctness, and security gotchas."
					feedbackCount={340}
					name="Code reviewer"
					onMoreActions={() => {}}
					onSelect={() => {}}
					publisher="Mei Tan"
					rating={4.2}
				/>
			</DemoSection>

			<DemoSection title="Skill">
				<CardDirectorySkill
					description="Create a new formatted, rich text document or page in Confluence."
					icon={<PageIcon label="" />}
					iconVariant="blue"
					name="Create page"
					onMoreActions={() => {}}
					onSelect={() => {}}
					publisher="Atlassian"
					publisherLogo={<ConfluenceLogo size="xsmall" />}
					starCount={38}
					viewCount={6273}
				/>
				<CardDirectorySkill
					description="Find related issues and pages across your team's workspace."
					icon={<SearchIcon label="" />}
					iconVariant="purple"
					name="Find similar work"
					onMoreActions={() => {}}
					onSelect={() => {}}
					publisher="Atlassian"
					publisherLogo={<ConfluenceLogo size="xsmall" />}
					starCount={120}
					viewCount={4100}
				/>
			</DemoSection>

			<DemoSection title="Tool">
				<CardDirectoryTool
					appLogo={<ConfluenceLogo size="small" />}
					description="Create, search, and update pages across your Confluence sites."
					name="Confluence"
					onMoreActions={() => {}}
					onSelect={() => {}}
					teammateCount={258}
					toolCount={36}
				/>
				<CardDirectoryTool
					appLogo={<Image alt="" aria-hidden height={24} src="/3p/slack/32.svg" width={24} />}
					description="Send messages and search conversations from your workspace."
					name="Slack"
					onSelect={() => {}}
					teammateCount={540}
					toolCount={12}
				/>
			</DemoSection>

			<DemoSection title="Agent template">
				<CardDirectoryTemplate
					description="Surface customer feedback themes from trusted sources."
					iconSrc="/avatar-agent/teamwork-agents/customer-insights.svg"
					name="Customer Insights"
					onSelect={() => {}}
					skills={[
						{ color: "software", label: "jql-search" },
						{ color: "teamwork", label: "theme-grouping" },
						{ color: "product", label: "confluence-retrieval" },
					]}
					sources={[
						{ id: "jira", label: "Jira", provider: "jira" },
						{ id: "confluence", label: "Confluence", provider: "confluence" },
						{ id: "google-drive", label: "Google Drive", provider: "google-drive" },
					]}
				/>
				<CardDirectoryTemplate
					description="Group Jira work items into clear themes and epics."
					iconSrc="/avatar-agent/dev-agents/code-reviewer.svg"
					name="Jira Theme Analyzer"
					onSelect={() => {}}
					skills={[
						{ color: "software", label: "jql-search" },
						{ color: "teamwork", label: "epic-suggestions" },
					]}
					sources={[
						{ id: "jira", label: "Jira", provider: "jira" },
						{ id: "jira-product-discovery", label: "Jira Product Discovery", provider: "jira-product-discovery" },
					]}
				/>
			</DemoSection>
		</div>
	);
}
