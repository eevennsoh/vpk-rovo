import { DocSection } from "./doc-section";
import { DocCodeSnippet } from "./doc-code-snippet";

interface DocInstallationProps {
	importPath: string;
	name: string;
	importStatement?: string;
}

export function DocInstallation({ importPath, name, importStatement }: Readonly<DocInstallationProps>) {
	const componentName = name.replace(/\s+/g, "");
	const importPaths = importPath
		.split("\n")
		.map(path => path.trim())
		.filter(Boolean);
	const resolvedImportStatement =
		importStatement ??
		(importPaths.length > 1
			? importPaths.map(path => `import "${path}";`).join("\n")
			: `import { ${componentName} } from "${importPaths[0] ?? importPath}";`);

	return (
		<DocSection id="installation" title="Import">
			<DocCodeSnippet code={resolvedImportStatement} language="tsx" title="Import" />
		</DocSection>
	);
}
