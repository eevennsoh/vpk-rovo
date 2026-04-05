import { Sources, SourcesTrigger, SourcesContent, Source } from "@/components/ui-ai/sources";
import { ChevronDownIcon, ExternalLinkIcon } from "@/components/ui/vpk-icons";

export default function SourcesDemo() {
	return (
		<Sources>
			<SourcesTrigger count={3} />
			<SourcesContent>
				<Source href="#" title="React Documentation" />
				<Source href="#" title="MDN Web Docs" />
				<Source href="#" title="TypeScript Handbook" />
			</SourcesContent>
		</Sources>
	);
}

const customSources = [
	{ href: "https://stripe.com/docs/api", title: "Stripe API Documentation" },
	{ href: "https://docs.github.com/en/rest", title: "GitHub REST API" },
	{ href: "https://docs.aws.amazon.com/sdk-for-javascript/", title: "AWS SDK for JavaScript" },
];

export function SourcesDemoCustomRendering() {
	return (
		<Sources>
			<SourcesTrigger count={customSources.length}>
				<p className="font-medium">Using {customSources.length} citations</p>
				<ChevronDownIcon className="size-4" />
			</SourcesTrigger>
			<SourcesContent>
				{customSources.map((source) => (
					<Source href={source.href} key={source.href}>
						{source.title}
						<ExternalLinkIcon className="size-4" />
					</Source>
				))}
			</SourcesContent>
		</Sources>
	);
}
