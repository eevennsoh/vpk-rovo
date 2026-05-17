"use client";

import {
	Sandbox,
	SandboxContent,
	SandboxHeader,
	SandboxTabContent,
	SandboxTabs,
	SandboxTabsBar,
	SandboxTabsList,
	SandboxTabsTrigger,
} from "@/components/ui-custom/sandbox";
import { CodeBlock } from "@/components/ui-custom/code-block";

const SAMPLE_CODE = `import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const { text } = await generateText({
  model: openai("gpt-4o"),
  prompt: "Calculate the fibonacci sequence up to 10 terms.",
});

console.log(text);`;

const SAMPLE_OUTPUT = `> Executing code.tsx...
1, 1, 2, 3, 5, 8, 13, 21, 34, 55
✓ Completed in 0.42s`;

export default function SandboxDemo() {
	return (
		<Sandbox>
			<SandboxHeader state="output-available" title="code.tsx" />
			<SandboxContent>
				<SandboxTabs defaultValue="code">
					<SandboxTabsBar>
						<SandboxTabsList>
							<SandboxTabsTrigger value="code">Code</SandboxTabsTrigger>
							<SandboxTabsTrigger value="output">Output</SandboxTabsTrigger>
						</SandboxTabsList>
					</SandboxTabsBar>
					<SandboxTabContent value="code">
						<CodeBlock code={SAMPLE_CODE} language="tsx" />
					</SandboxTabContent>
					<SandboxTabContent value="output">
						<CodeBlock code={SAMPLE_OUTPUT} language="log" />
					</SandboxTabContent>
				</SandboxTabs>
			</SandboxContent>
		</Sandbox>
	);
}

export function SandboxDemoRunning() {
	return (
		<Sandbox>
			<SandboxHeader state="input-available" title="analysis.py" />
			<SandboxContent>
				<SandboxTabs defaultValue="code">
					<SandboxTabsBar>
						<SandboxTabsList>
							<SandboxTabsTrigger value="code">Code</SandboxTabsTrigger>
							<SandboxTabsTrigger value="output">Output</SandboxTabsTrigger>
						</SandboxTabsList>
					</SandboxTabsBar>
					<SandboxTabContent value="code">
						<CodeBlock
							code={`import pandas as pd\n\ndf = pd.read_csv("data.csv")\nprint(df.describe())`}
							language="python"
						/>
					</SandboxTabContent>
					<SandboxTabContent value="output">
						<CodeBlock code="> Running analysis.py..." language="log" />
					</SandboxTabContent>
				</SandboxTabs>
			</SandboxContent>
		</Sandbox>
	);
}

export function SandboxDemoError() {
	return (
		<Sandbox>
			<SandboxHeader state="output-error" title="fetch.ts" />
			<SandboxContent>
				<SandboxTabs defaultValue="output">
					<SandboxTabsBar>
						<SandboxTabsList>
							<SandboxTabsTrigger value="code">Code</SandboxTabsTrigger>
							<SandboxTabsTrigger value="output">Output</SandboxTabsTrigger>
						</SandboxTabsList>
					</SandboxTabsBar>
					<SandboxTabContent value="code">
						<CodeBlock
							code={`const res = await fetch("https://api.example.com/data");\nconst data = await res.json();`}
							language="typescript"
						/>
					</SandboxTabContent>
					<SandboxTabContent value="output">
						<CodeBlock
							code={`> Executing fetch.ts...\nError: TypeError: fetch failed\n  at Object.fetch (node:internal/deps/undici:12:28)\n  Caused by: ConnectTimeoutError: Connect Timeout Error`}
							language="log"
						/>
					</SandboxTabContent>
				</SandboxTabs>
			</SandboxContent>
		</Sandbox>
	);
}

export function SandboxDemoCollapsed() {
	return (
		<Sandbox defaultOpen={false}>
			<SandboxHeader state="output-available" title="transform.js" />
			<SandboxContent>
				<SandboxTabs defaultValue="code">
					<SandboxTabsBar>
						<SandboxTabsList>
							<SandboxTabsTrigger value="code">Code</SandboxTabsTrigger>
							<SandboxTabsTrigger value="output">Output</SandboxTabsTrigger>
						</SandboxTabsList>
					</SandboxTabsBar>
					<SandboxTabContent value="code">
						<CodeBlock code={SAMPLE_CODE} language="javascript" />
					</SandboxTabContent>
					<SandboxTabContent value="output">
						<CodeBlock code={SAMPLE_OUTPUT} language="log" />
					</SandboxTabContent>
				</SandboxTabs>
			</SandboxContent>
		</Sandbox>
	);
}
