"use client";

import {
	JSXPreview,
	JSXPreviewContent,
	JSXPreviewError,
} from "@/components/ui-custom/jsx-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCallback, useEffect, useState } from "react";

const BASIC_JSX = `<div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>
  <h3 style={{ margin: 0, fontWeight: 600 }}>Welcome</h3>
  <p style={{ margin: 0, color: "var(--ds-text-subtle)" }}>
    This JSX was rendered dynamically from a string.
  </p>
</div>`;

export function JsxPreviewDemoBasic() {
	return (
		<div className="w-full rounded-md border">
			<div className="border-b px-3 py-1.5 text-xs text-muted-foreground">
				Preview
			</div>
			<JSXPreview jsx={BASIC_JSX}>
				<JSXPreviewContent className="p-4" />
				<JSXPreviewError className="m-4" />
			</JSXPreview>
		</div>
	);
}

const STREAMING_FRAMES = [
	`<div style={{ padding: "16px" }}>`,
	`<div style={{ padding: "16px" }}>\n  <h3 style={{ margin: 0 }}>Loading`,
	`<div style={{ padding: "16px" }}>\n  <h3 style={{ margin: 0 }}>Loading results</h3>`,
	`<div style={{ padding: "16px" }}>\n  <h3 style={{ margin: 0 }}>Loading results</h3>\n  <ul>`,
	`<div style={{ padding: "16px" }}>\n  <h3 style={{ margin: 0 }}>Loading results</h3>\n  <ul>\n    <li>Item one</li>`,
	`<div style={{ padding: "16px" }}>\n  <h3 style={{ margin: 0 }}>Loading results</h3>\n  <ul>\n    <li>Item one</li>\n    <li>Item two</li>`,
	`<div style={{ padding: "16px" }}>\n  <h3 style={{ margin: 0 }}>Loading results</h3>\n  <ul>\n    <li>Item one</li>\n    <li>Item two</li>\n    <li>Item three</li>\n  </ul>\n</div>`,
];

export function JsxPreviewDemoStreaming() {
	const [frame, setFrame] = useState(0);
	const isStreaming = frame < STREAMING_FRAMES.length - 1;

	useEffect(() => {
		if (!isStreaming) return;
		const timer = setInterval(() => {
			setFrame((prev) =>
				prev < STREAMING_FRAMES.length - 1 ? prev + 1 : prev,
			);
		}, 600);
		return () => clearInterval(timer);
	}, [isStreaming]);

	const restart = useCallback(() => setFrame(0), []);

	return (
		<div className="flex w-full flex-col gap-3">
			<div className="flex items-center gap-2">
				<Badge variant={isStreaming ? "default" : "secondary"}>
					{isStreaming ? "Streaming" : "Complete"}
				</Badge>
				<Button variant="outline" size="sm" onClick={restart}>
					Restart
				</Button>
			</div>
			<div className="rounded-md border">
				<div className="border-b px-3 py-1.5 text-xs text-muted-foreground">
					Preview
				</div>
				<JSXPreview jsx={STREAMING_FRAMES[frame]} isStreaming={isStreaming}>
					<JSXPreviewContent className="p-4" />
					<JSXPreviewError className="m-4" />
				</JSXPreview>
			</div>
		</div>
	);
}

const COMPONENTS_JSX = `<div style={{ display: "flex", gap: "8px", padding: "16px", flexWrap: "wrap" }}>
  <Badge>Default</Badge>
  <Badge variant="secondary">Secondary</Badge>
  <Badge variant="outline">Outline</Badge>
  <Badge variant="destructive">Destructive</Badge>
</div>`;

export function JsxPreviewDemoWithComponents() {
	return (
		<div className="w-full rounded-md border">
			<div className="border-b px-3 py-1.5 text-xs text-muted-foreground">
				Preview — Custom components injected
			</div>
			<JSXPreview
				jsx={COMPONENTS_JSX}
				// @ts-expect-error — Badge's ReactElement return doesn't satisfy react-jsx-parser's ComponentsType
				components={{ Badge }}
			>
				<JSXPreviewContent />
				<JSXPreviewError className="m-4" />
			</JSXPreview>
		</div>
	);
}

const ERROR_JSX = `<div onclick={alert('xss')}>
  <span style={{ invalid syntax here }}>broken</span>
</div>`;

export function JsxPreviewDemoWithError() {
	return (
		<div className="w-full rounded-md border">
			<div className="border-b px-3 py-1.5 text-xs text-muted-foreground">
				Preview — Error state
			</div>
			<JSXPreview jsx={ERROR_JSX}>
				<JSXPreviewContent className="p-4" />
				<JSXPreviewError className="m-4" />
			</JSXPreview>
		</div>
	);
}

export function JsxPreviewDemoCustomError() {
	return (
		<div className="w-full rounded-md border">
			<div className="border-b px-3 py-1.5 text-xs text-muted-foreground">
				Preview — Custom error content
			</div>
			<JSXPreview jsx={ERROR_JSX}>
				<JSXPreviewContent className="p-4" />
				<JSXPreviewError className="m-4 border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
					<div className="flex flex-col gap-1">
						<span className="font-medium">Render failed</span>
						<span className="text-xs opacity-75">
							The component could not be resolved
						</span>
					</div>
				</JSXPreviewError>
			</JSXPreview>
		</div>
	);
}

export default function JsxPreviewDemo() {
	return <JsxPreviewDemoBasic />;
}
