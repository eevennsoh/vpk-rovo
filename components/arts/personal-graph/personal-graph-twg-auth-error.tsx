"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PersonalGraphGlassPanel } from "./personal-graph-glass-panel";

const TWG_LOGIN_COMMAND = "twg login";

interface PersonalGraphTwgAuthErrorProps {
	isRetrying?: boolean;
	onRetry: () => void;
}

export function PersonalGraphTwgAuthError({
	isRetrying = false,
	onRetry,
}: Readonly<PersonalGraphTwgAuthErrorProps>) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		void navigator.clipboard
			?.writeText(TWG_LOGIN_COMMAND)
			.then(() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 1500);
			})
			.catch(() => undefined);
	};

	return (
		<aside aria-label="Team Work Graph authentication required" className="text-text">
			<PersonalGraphGlassPanel contentClassName="space-y-3 p-4" radius={20}>
				<div className="space-y-1">
					<h3 className="text-sm font-semibold">Team Work Graph needs authentication</h3>
					<p className="text-xs text-text-subtle">
						Run <code className="rounded bg-bg-neutral-subtle px-1.5 py-0.5 font-mono text-[11px]">{TWG_LOGIN_COMMAND}</code> in
						your terminal, then click Retry.
					</p>
				</div>
				<div className="flex items-center justify-end gap-2">
					<Button
						aria-label="Copy twg login command"
						className="rounded-full border-border bg-bg-neutral-subtle text-text shadow-none hover:bg-bg-neutral-subtle-hovered"
						onClick={handleCopy}
						size="sm"
						variant="outline"
					>
						{copied ? "Copied" : "Copy command"}
					</Button>
					<Button
						aria-label="Retry Team Work Graph fetch"
						className="rounded-full"
						disabled={isRetrying}
						isLoading={isRetrying}
						onClick={onRetry}
						size="sm"
					>
						Retry
					</Button>
				</div>
			</PersonalGraphGlassPanel>
		</aside>
	);
}
