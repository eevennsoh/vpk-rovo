import {
	ChainOfThought,
	ChainOfThoughtContent,
	ChainOfThoughtHeader,
	ChainOfThoughtImage,
	ChainOfThoughtSearchResult,
	ChainOfThoughtSearchResults,
	ChainOfThoughtStep,
} from "@/components/ui-ai/chain-of-thought";
import ImageIcon from "@atlaskit/icon/core/image";
import SearchIcon from "@atlaskit/icon/core/search";
import AiSparkleIcon from "@atlaskit/icon/core/ai-sparkle";
import Image from "next/image";

const PROFILE_SOURCES = [
	"https://www.x.com/haydenbleasel",
	"https://www.instagram.com/haydenbleasel",
	"https://www.github.com/haydenbleasel",
] as const;

const RECENT_WORK_SOURCES = [
	"https://www.github.com/haydenbleasel",
	"https://www.dribbble.com/haydenbleasel",
] as const;

const toHostname = (url: string) => new URL(url).hostname;

export default function ChainOfThoughtDemo() {
	return <ChainOfThoughtDemoThinking />;
}

export function ChainOfThoughtDemoPreload() {
	return (
		<ChainOfThought className="w-full max-w-2xl">
			<ChainOfThoughtHeader showChevron={false} shimmer>Tracing model reasoning</ChainOfThoughtHeader>
			<ChainOfThoughtContent>
				<ChainOfThoughtStep
					icon={SearchIcon}
					label="Searching public profiles for Hayden Bleasel"
					status="pending"
				/>
			</ChainOfThoughtContent>
		</ChainOfThought>
	);
}

export function ChainOfThoughtDemoThinking() {
	return (
		<ChainOfThought defaultOpen className="w-full max-w-2xl">
			<ChainOfThoughtHeader shimmer>Tracing model reasoning</ChainOfThoughtHeader>
			<ChainOfThoughtContent>
				<ChainOfThoughtStep
					icon={SearchIcon}
					label="Searching public profiles for Hayden Bleasel"
					status="complete"
				collapsible
				>
					<ChainOfThoughtSearchResults>
						{PROFILE_SOURCES.map((website) => (
							<ChainOfThoughtSearchResult key={website}>
								{toHostname(website)}
							</ChainOfThoughtSearchResult>
						))}
					</ChainOfThoughtSearchResults>
				</ChainOfThoughtStep>

				<ChainOfThoughtStep
					icon={ImageIcon}
					label="Found a likely profile image from the source set"
					status="complete"
				collapsible
				>
					<ChainOfThoughtImage caption="Public profile image selected from matched sources.">
						<Image
							alt="Profile image result"
							className="h-40 w-40 rounded-md border border-border object-cover"
							height={160}
							src="/avatar-human/anthony-chen.png"
							width={160}
						/>
					</ChainOfThoughtImage>
				</ChainOfThoughtStep>

				<ChainOfThoughtStep
					icon={AiSparkleIcon}
					label="Synthesizing a short profile summary from validated signals"
					status="complete"
				/>

				<ChainOfThoughtStep
					icon={SearchIcon}
					label="Checking for recent work updates..."
					status="active"
				collapsible
				>
					<ChainOfThoughtSearchResults>
						{RECENT_WORK_SOURCES.map((website) => (
							<ChainOfThoughtSearchResult key={website}>
								{toHostname(website)}
							</ChainOfThoughtSearchResult>
						))}
					</ChainOfThoughtSearchResults>
				</ChainOfThoughtStep>
			</ChainOfThoughtContent>
		</ChainOfThought>
	);
}

export function ChainOfThoughtDemoCompleted() {
	return (
		<ChainOfThought className="w-full max-w-2xl">
			<ChainOfThoughtHeader>Tracing model reasoning</ChainOfThoughtHeader>
			<ChainOfThoughtContent>
				<ChainOfThoughtStep
					icon={SearchIcon}
					label="Searching public profiles for Hayden Bleasel"
					status="complete"
				collapsible
				>
					<ChainOfThoughtSearchResults>
						{PROFILE_SOURCES.map((website) => (
							<ChainOfThoughtSearchResult key={website}>
								{toHostname(website)}
							</ChainOfThoughtSearchResult>
						))}
					</ChainOfThoughtSearchResults>
				</ChainOfThoughtStep>

				<ChainOfThoughtStep
					icon={ImageIcon}
					label="Found a likely profile image from the source set"
					status="complete"
				collapsible
				>
					<ChainOfThoughtImage caption="Public profile image selected from matched sources.">
						<Image
							alt="Profile image result"
							className="h-40 w-40 rounded-md border border-border object-cover"
							height={160}
							src="/avatar-human/anthony-chen.png"
							width={160}
						/>
					</ChainOfThoughtImage>
				</ChainOfThoughtStep>

				<ChainOfThoughtStep
					icon={AiSparkleIcon}
					label="Synthesizing a short profile summary from validated signals"
					status="complete"
				/>

				<ChainOfThoughtStep
					icon={SearchIcon}
					label="Checked recent work updates"
					status="complete"
				collapsible
				>
					<ChainOfThoughtSearchResults>
						{RECENT_WORK_SOURCES.map((website) => (
							<ChainOfThoughtSearchResult key={website}>
								{toHostname(website)}
							</ChainOfThoughtSearchResult>
						))}
					</ChainOfThoughtSearchResults>
				</ChainOfThoughtStep>
			</ChainOfThoughtContent>
		</ChainOfThought>
	);
}

export function ChainOfThoughtDemoStatusVariants() {
	return (
		<ChainOfThought defaultOpen className="w-full max-w-xl">
			<ChainOfThoughtHeader>Status progression</ChainOfThoughtHeader>
			<ChainOfThoughtContent>
				<ChainOfThoughtStep label="Collected source pages" status="complete" />
				<ChainOfThoughtStep label="Cross-checking publication dates" status="active" />
				<ChainOfThoughtStep label="Drafting the final answer" status="pending" />
			</ChainOfThoughtContent>
		</ChainOfThought>
	);
}

export function ChainOfThoughtDemoSearchResults() {
	return (
		<ChainOfThought defaultOpen className="w-full max-w-xl">
			<ChainOfThoughtHeader>Search result chips</ChainOfThoughtHeader>
			<ChainOfThoughtContent>
				<ChainOfThoughtStep
					icon={SearchIcon}
					label="Evaluating sources by recency and authority"
					status="active"
				collapsible
				>
					<ChainOfThoughtSearchResults>
						{[
							"https://www.atlassian.com",
							"https://www.vercel.com",
							"https://www.github.com",
							"https://www.npmjs.com",
						].map((website) => (
							<ChainOfThoughtSearchResult key={website}>
								{toHostname(website)}
							</ChainOfThoughtSearchResult>
						))}
					</ChainOfThoughtSearchResults>
				</ChainOfThoughtStep>
			</ChainOfThoughtContent>
		</ChainOfThought>
	);
}

export function ChainOfThoughtDemoImageStep() {
	return (
		<ChainOfThought defaultOpen className="w-full max-w-xl">
			<ChainOfThoughtHeader>Image evidence</ChainOfThoughtHeader>
			<ChainOfThoughtContent>
				<ChainOfThoughtStep
					icon={ImageIcon}
					label="Attached visual evidence for reasoning context"
					status="complete"
				collapsible
				>
					<ChainOfThoughtImage caption="Image context included before summary generation.">
						<Image
							alt="Reasoning evidence image"
							className="h-40 w-40 rounded-md border border-border object-cover"
							height={160}
							src="/avatar-human/priya-hansra.png"
							width={160}
						/>
					</ChainOfThoughtImage>
				</ChainOfThoughtStep>
			</ChainOfThoughtContent>
		</ChainOfThought>
	);
}
