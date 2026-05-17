import {
	TwgTool,
	TwgToolSourceIcon,
	type TwgToolSource,
} from "@/components/ui-ai/twg-tool";

const TWG_SOURCE: TwgToolSource = {
	id: "twg",
	label: "Teamwork Graph",
	provider: "twg",
};

const CONFLUENCE_SOURCE: TwgToolSource = {
	id: "confluence",
	label: "Confluence",
	provider: "confluence",
};

const DRIVE_SOURCE: TwgToolSource = {
	id: "google-drive",
	label: "Google Drive",
	provider: "google-drive",
};

const JIRA_SOURCE: TwgToolSource = {
	id: "jira",
	label: "Jira",
	provider: "jira",
};

const TEAMS_SOURCE: TwgToolSource = {
	id: "teams",
	label: "Teams",
	provider: "teams",
};

const SALESFORCE_SOURCE: TwgToolSource = {
	id: "salesforce",
	label: "Salesforce",
	provider: "salesforce",
};

const ALL_SOURCES = [
	TWG_SOURCE,
	CONFLUENCE_SOURCE,
	DRIVE_SOURCE,
	JIRA_SOURCE,
	TEAMS_SOURCE,
	SALESFORCE_SOURCE,
] as const;

function InlineSource({
	children,
	source,
}: {
	children: string;
	source: TwgToolSource;
}) {
	return (
		<span className="inline-flex min-w-0 items-center gap-1">
			<TwgToolSourceIcon source={source} size="sm" />
			<span className="truncate italic">{children}</span>
		</span>
	);
}

function ExpandedSourceList({ sources }: { sources: ReadonlyArray<TwgToolSource> }) {
	return (
		<div className="rounded-md border border-border bg-surface px-3 py-2">
			<div className="mb-1 font-medium text-text">Sources read</div>
			<div className="flex flex-wrap gap-1.5">
				{sources.map((source) => (
					<span key={source.id} className="inline-flex items-center gap-1 rounded-md bg-surface-sunken px-2 py-1">
						<TwgToolSourceIcon source={source} size="sm" />
						{source.label}
					</span>
				))}
			</div>
		</div>
	);
}

export default function TwgToolDemo() {
	return (
		<div className="flex w-full max-w-3xl flex-col gap-8">
			<TwgTool
				description={<InlineSource source={TWG_SOURCE}>Upper arm strain repair</InlineSource>}
				sources={[TWG_SOURCE]}
				defaultOpen={false}
			>
				<ExpandedSourceList sources={[TWG_SOURCE]} />
			</TwgTool>
			<TwgTool
				description={<InlineSource source={CONFLUENCE_SOURCE}>Kerb collision post-incident analysis</InlineSource>}
				sources={[TWG_SOURCE, CONFLUENCE_SOURCE]}
				defaultOpen={false}
			>
				<ExpandedSourceList sources={[TWG_SOURCE, CONFLUENCE_SOURCE]} />
			</TwgTool>
			<TwgTool
				description={<InlineSource source={DRIVE_SOURCE}>Upper arm faring refinement</InlineSource>}
				sources={[TWG_SOURCE, CONFLUENCE_SOURCE, DRIVE_SOURCE]}
				defaultOpen={false}
			>
				<ExpandedSourceList sources={[TWG_SOURCE, CONFLUENCE_SOURCE, DRIVE_SOURCE]} />
			</TwgTool>
			<TwgTool
				description="Read through 6 sources"
				sources={ALL_SOURCES}
				status="complete"
				defaultOpen
			>
				<ExpandedSourceList sources={ALL_SOURCES} />
			</TwgTool>
		</div>
	);
}

export function TwgToolDemoSingleSource() {
	return (
		<TwgTool
			className="w-full max-w-2xl"
			description={<InlineSource source={TWG_SOURCE}>Upper arm strain repair</InlineSource>}
			sources={[TWG_SOURCE]}
			defaultOpen
		>
			<ExpandedSourceList sources={[TWG_SOURCE]} />
		</TwgTool>
	);
}

export function TwgToolDemoMultipleSources() {
	return (
		<TwgTool
			className="w-full max-w-2xl"
			description={<InlineSource source={DRIVE_SOURCE}>Upper arm faring refinement</InlineSource>}
			sources={[TWG_SOURCE, CONFLUENCE_SOURCE, DRIVE_SOURCE, JIRA_SOURCE]}
			defaultOpen
		>
			<ExpandedSourceList sources={[TWG_SOURCE, CONFLUENCE_SOURCE, DRIVE_SOURCE, JIRA_SOURCE]} />
		</TwgTool>
	);
}

export function TwgToolDemoCompleted() {
	return (
		<TwgTool
			className="w-full max-w-2xl"
			description="Read through 6 sources"
			sources={ALL_SOURCES}
			status="complete"
			defaultOpen
		>
			<ExpandedSourceList sources={ALL_SOURCES} />
		</TwgTool>
	);
}
