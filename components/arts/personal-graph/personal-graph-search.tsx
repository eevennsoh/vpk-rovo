"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { useVaultSearch } from "./hooks/use-vault-search";
import {
	PersonalGraphControlFlyoutActions,
	PersonalGraphControlFlyoutTrigger,
	type PersonalGraphControlFlyoutAction,
} from "./personal-graph-control-flyout";
import {
	PersonalGraphGlassPanel,
} from "./personal-graph-glass-panel";
import { PixelArrowRightIcon } from "./personal-graph-pixel-icons";

interface PersonalGraphSearchProps {
	chatError?: string | null;
	assistantMessage?: string | null;
	chatStatus?: "idle" | "streaming" | "done" | "error";
	className?: string;
	collapseFlyoutKey?: number;
	flyoutActions: ReadonlyArray<PersonalGraphControlFlyoutAction>;
	isFlyoutDisabled?: boolean;
	mode?: "vault" | "twg";
	onAskChat?: (prompt: string) => void;
	onSelectSlug: (slug: string) => void;
}

export function PersonalGraphSearch({
	chatError = null,
	assistantMessage = null,
	chatStatus = "idle",
	className,
	collapseFlyoutKey = 0,
	flyoutActions,
	isFlyoutDisabled = false,
	mode = "vault",
	onAskChat,
	onSelectSlug,
}: Readonly<PersonalGraphSearchProps>) {
	const [query, setQuery] = useState("");
	const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
	const isTwgMode = mode === "twg";
	const { results, status } = useVaultSearch(isTwgMode ? "" : query);
	const firstResult = results[0];
	const trimmedQuery = query.trim();
	const canAskTwg = isTwgMode && Boolean(onAskChat) && Boolean(trimmedQuery);
	const isSubmitDisabled = isTwgMode
		? !canAskTwg || chatStatus === "streaming"
		: !firstResult;
	const placeholder = isTwgMode
		? "Ask a question or search your work…"
		: "Ask or search your graph...";
	const shouldShowChatPanel = isTwgMode && (Boolean(chatError) || Boolean(assistantMessage) || chatStatus === "streaming");
	const chatPanelTitle = chatError ? "TWG error" : chatStatus === "streaming" ? "Thinking…" : "Answer";
	const chatPanelText = chatError ?? assistantMessage ?? "";

	useEffect(() => {
		setIsFlyoutOpen(false);
	}, [collapseFlyoutKey, isFlyoutDisabled]);

	useEffect(() => {
		if (!isFlyoutOpen) return;
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") setIsFlyoutOpen(false);
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isFlyoutOpen]);

	return (
		<form
			className={cn("relative w-full", className)}
			onSubmit={(event) => {
				event.preventDefault();
				if (canAskTwg && onAskChat) {
					onAskChat(trimmedQuery);
					setQuery("");
					return;
				}
				if (!firstResult) return;
				onSelectSlug(firstResult.slug);
				setQuery("");
			}}
		>
			<PersonalGraphControlFlyoutActions
				actions={flyoutActions}
				className="right-[72px] top-1/2"
				isOpen={isFlyoutOpen}
			/>
			<PersonalGraphGlassPanel
				className="relative z-10"
				contentClassName="flex h-16 items-center gap-2 p-4 pl-6"
				glassProps={{
					backgroundOpacity: 0.08,
				}}
				radius={30}
			>
				<input
					aria-label={isTwgMode ? "Ask or search Team Work Graph" : "Ask or search Personal Graph"}
					className="min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-text-subtlest"
					onChange={(event) => setQuery(event.target.value)}
					placeholder={placeholder}
					style={{ font: token("font.body") }}
					value={query}
				/>
				<PersonalGraphControlFlyoutTrigger
					disabled={isFlyoutDisabled}
					isOpen={isFlyoutOpen}
					onToggle={() => {
						if (!isFlyoutDisabled) setIsFlyoutOpen((current) => !current);
					}}
				/>
				<Button
					aria-label={isTwgMode ? "Submit TWG prompt" : "Open top search result"}
					className="rounded-full"
					disabled={isSubmitDisabled}
					size="icon"
					type="submit"
					variant="ghost"
				>
					<PixelArrowRightIcon />
				</Button>
			</PersonalGraphGlassPanel>
			{shouldShowChatPanel ? (
				<div className="absolute bottom-[calc(100%+0.75rem)] left-0 right-0 z-40 text-text">
					<PersonalGraphGlassPanel contentClassName="space-y-2 p-4" radius={22}>
						<div className={cn("text-[10px] uppercase tracking-wide text-text-subtlest", chatError ? "text-text-danger" : null)}>
							{chatPanelTitle}
						</div>
						<p className={cn("whitespace-pre-wrap text-sm leading-6 text-text", chatError ? "text-text-danger" : null)}>
							{chatPanelText}
						</p>
					</PersonalGraphGlassPanel>
				</div>
			) : null}
			{!isTwgMode && query ? (
				<div className="absolute bottom-[calc(100%+0.75rem)] left-0 right-0 z-40 text-text">
					<PersonalGraphGlassPanel contentClassName="max-h-[min(42svh,320px)] overflow-auto p-1" radius={22}>
						{status === "loading" ? <div className="px-3 py-2 text-xs text-text-subtlest">Searching...</div> : null}
						{status === "error" ? <div className="px-3 py-2 text-xs text-text-danger">Search failed.</div> : null}
						{results.map((result) => (
							<button
								className="block w-full rounded-2xl px-3 py-2 text-left transition-colors duration-normal hover:bg-bg-neutral-subtle-hovered"
								key={`${result.path}-${result.title}`}
								onClick={() => {
									onSelectSlug(result.slug);
									setQuery("");
								}}
								type="button"
							>
								<div className="truncate text-xs font-medium text-text">{result.title}</div>
								<div className="mt-1 line-clamp-2 text-xs text-text-subtle">{result.excerpt}</div>
							</button>
						))}
						{status === "ready" && results.length === 0 ? (
							<div className="px-3 py-2 text-xs text-text-subtlest">No results.</div>
						) : null}
					</PersonalGraphGlassPanel>
				</div>
			) : null}
		</form>
	);
}
