import { DocSection } from "./doc-section";
import { DocCodeSnippet } from "./doc-code-snippet";

interface DocUsageProps {
	usage: string;
}

export function DocUsage({ usage }: Readonly<DocUsageProps>) {
	return (
		<DocSection id="usage" title="Usage">
			<DocCodeSnippet code={usage} language="tsx" title="Usage example" />
		</DocSection>
	);
}
