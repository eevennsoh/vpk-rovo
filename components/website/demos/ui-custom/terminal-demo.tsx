"use client";

import {
	Terminal,
	TerminalActions,
	TerminalClearButton,
	TerminalContent,
	TerminalCopyButton,
	TerminalHeader,
	TerminalStatus,
	TerminalTitle,
} from "@/components/ui-custom/terminal";
import { useCallback, useEffect, useRef, useState } from "react";

const SAMPLE_OUTPUT = `$ npm install
added 120 packages in 3s

$ npm run build
> my-app@1.0.0 build
> next build

   Creating an optimized production build...
   Compiled successfully.

   Route (app)              Size     First Load JS
   \u250c \u25cb /                    5.2 kB        89.1 kB
   \u251c \u25cb /about               3.1 kB        87.0 kB
   \u2514 \u25cb /api/hello           0 B            83.9 kB
   + First Load JS shared by all  83.9 kB

\u2713 Build completed successfully`;

const SAMPLE_LINES = SAMPLE_OUTPUT.split("\n");

export default function TerminalDemo() {
	return (
		<Terminal
			output={"$ npm install\nadded 120 packages in 3s"}
			className="w-full text-xs"
		/>
	);
}

export function TerminalDemoStreaming() {
	const [output, setOutput] = useState("");
	const [isStreaming, setIsStreaming] = useState(true);
	const indexRef = useRef(0);

	useEffect(() => {
		const interval = setInterval(() => {
			if (indexRef.current < SAMPLE_LINES.length) {
				setOutput((prev) =>
					prev ? `${prev}\n${SAMPLE_LINES[indexRef.current]}` : SAMPLE_LINES[indexRef.current],
				);
				indexRef.current++;
			} else {
				setIsStreaming(false);
				clearInterval(interval);
			}
		}, 200);
		return () => clearInterval(interval);
	}, []);

	return (
		<Terminal
			output={output}
			isStreaming={isStreaming}
			className="w-full text-xs"
		/>
	);
}

export function TerminalDemoClearable() {
	const [output, setOutput] = useState(
		"$ echo 'Hello, world!'\nHello, world!\n\n$ ls -la\ntotal 48\ndrwxr-xr-x  12 user  staff   384 Feb 17 10:00 .\ndrwxr-xr-x   5 user  staff   160 Feb 17 09:00 ..\n-rw-r--r--   1 user  staff  1024 Feb 17 10:00 package.json\n-rw-r--r--   1 user  staff   512 Feb 17 10:00 tsconfig.json",
	);

	const handleClear = useCallback(() => setOutput(""), []);

	return (
		<Terminal
			output={output}
			onClear={handleClear}
			className="w-full text-xs"
		/>
	);
}

export function TerminalDemoComposed() {
	const [output, setOutput] = useState(
		"$ pnpm run test\n\n PASS  src/utils.test.ts\n  \u2713 adds numbers correctly (2ms)\n  \u2713 handles edge cases (1ms)\n\nTest Suites: 1 passed, 1 total\nTests:       2 passed, 2 total\nTime:        0.842s",
	);

	const handleClear = useCallback(() => setOutput(""), []);

	return (
		<Terminal output={output} onClear={handleClear} className="w-full text-xs">
			<TerminalHeader>
				<TerminalTitle>Test Runner</TerminalTitle>
				<div className="flex items-center gap-1">
					<TerminalStatus />
					<TerminalActions>
						<TerminalCopyButton />
						<TerminalClearButton />
					</TerminalActions>
				</div>
			</TerminalHeader>
			<TerminalContent />
		</Terminal>
	);
}

export function TerminalDemoAnsi() {
	const ansiOutput = [
		"$ git status",
		"\x1b[32mOn branch main\x1b[0m",
		"Your branch is up to date with '\x1b[36morigin/main\x1b[0m'.",
		"",
		"Changes to be committed:",
		"  \x1b[32mnew file:   src/components/terminal.tsx\x1b[0m",
		"  \x1b[33mmodified:   src/index.ts\x1b[0m",
		"",
		"Changes not staged for commit:",
		"  \x1b[31mdeleted:    src/old-file.ts\x1b[0m",
	].join("\n");

	return (
		<Terminal
			output={ansiOutput}
			className="w-full text-xs"
		/>
	);
}
