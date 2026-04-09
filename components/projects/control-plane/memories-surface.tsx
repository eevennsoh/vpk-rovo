"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lozenge } from "@/components/ui/lozenge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { HermesMemoryDocument, HermesMemoryTarget } from "@/lib/rovo-runtime-types";

import { addMemoryEntry, deleteMemoryEntry, fetchMemoryDocuments, replaceMemoryDocument } from "./lib/control-plane-api";
import { calculateUsage, formatControlPlaneDateTime, joinMemoryEntries, splitMemoryEntries } from "./lib/control-plane-utils";
import { ControlPlanePageShell } from "./control-plane-page-shell";

function createEmptyDocument(target: HermesMemoryTarget): HermesMemoryDocument {
	return {
		entries: [],
		exists: false,
		limit: null,
		path: "",
		target,
		totalChars: 0,
		updatedAt: null,
	};
}

export function MemoriesSurfacePage() {
	const [documents, setDocuments] = useState<Record<HermesMemoryTarget, HermesMemoryDocument>>({
		memory: createEmptyDocument("memory"),
		user: createEmptyDocument("user"),
	});
	const [activeTarget, setActiveTarget] = useState<HermesMemoryTarget>("memory");
	const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
	const [draftText, setDraftText] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isMutating, setIsMutating] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const activeDocument = documents[activeTarget];
	const entries = activeDocument.entries;
	const selectedEntry = entries.find((entry) => entry.id === selectedEntryId) ?? entries[0] ?? null;
	const usage = calculateUsage(
		activeDocument.totalChars,
		activeDocument.limit ?? activeDocument.totalChars ?? 1,
	);
	const joinedEntries = useMemo(
		() => joinMemoryEntries(entries.map((entry) => entry.text)),
		[entries],
	);

	useEffect(() => {
		let cancelled = false;

		async function loadDocuments() {
			setIsLoading(true);
			try {
				const nextDocuments = await fetchMemoryDocuments();
				if (cancelled) {
					return;
				}
				setDocuments(nextDocuments);
				const firstEntry = nextDocuments[activeTarget].entries[0] ?? null;
				setSelectedEntryId(firstEntry?.id ?? null);
				setDraftText(firstEntry?.text ?? "");
				setErrorMessage(null);
			} catch (error) {
				if (!cancelled) {
					setErrorMessage(error instanceof Error ? error.message : String(error));
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		}

		void loadDocuments();

		return () => {
			cancelled = true;
		};
	}, [activeTarget]);

	useEffect(() => {
		const fallbackEntry = entries[0] ?? null;
		const nextSelectedEntry = entries.find((entry) => entry.id === selectedEntryId) ?? fallbackEntry;
		setSelectedEntryId(nextSelectedEntry?.id ?? null);
		setDraftText(nextSelectedEntry?.text ?? "");
	}, [activeTarget, entries, selectedEntryId]);

	function handleSelectTarget(target: HermesMemoryTarget) {
		setActiveTarget(target);
	}

	function handleSelectEntry(entryId: string) {
		const entry = entries.find((item) => item.id === entryId) ?? null;
		setSelectedEntryId(entry?.id ?? null);
		setDraftText(entry?.text ?? "");
	}

	async function handleRefresh() {
		setIsLoading(true);
		try {
			const nextDocuments = await fetchMemoryDocuments();
			setDocuments(nextDocuments);
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsLoading(false);
		}
	}

	async function handleAddEntry() {
		const nextTexts = splitMemoryEntries(draftText);
		if (nextTexts.length === 0) {
			return;
		}

		setIsMutating(true);
		try {
			let nextDocument = activeDocument;
			for (const text of nextTexts) {
				nextDocument = await addMemoryEntry(activeTarget, text);
			}
			setDocuments((current) => ({
				...current,
				[activeTarget]: nextDocument,
			}));
			setSelectedEntryId(nextDocument.entries[0]?.id ?? null);
			setDraftText(nextDocument.entries[0]?.text ?? "");
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsMutating(false);
		}
	}

	async function handleReplaceEntry() {
		const nextTexts = splitMemoryEntries(draftText);
		if (nextTexts.length === 0) {
			return;
		}

		setIsMutating(true);
		try {
			const replacementEntries = selectedEntry
				? entries.map((entry) =>
					entry.id === selectedEntry.id
						? nextTexts[0]
						: entry.text,
				)
				: [...entries.map((entry) => entry.text), ...nextTexts];
			const nextDocument = await replaceMemoryDocument(activeTarget, {
				entries: replacementEntries,
			});
			setDocuments((current) => ({
				...current,
				[activeTarget]: nextDocument,
			}));
			const nextSelectedEntry = selectedEntry
				? nextDocument.entries.find((entry) => entry.index === selectedEntry.index) ?? nextDocument.entries[0] ?? null
				: nextDocument.entries[0] ?? null;
			setSelectedEntryId(nextSelectedEntry?.id ?? null);
			setDraftText(nextSelectedEntry?.text ?? "");
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsMutating(false);
		}
	}

	async function handleDeleteEntry() {
		if (!selectedEntry) {
			return;
		}

		setIsMutating(true);
		try {
			const nextDocument = await deleteMemoryEntry(activeTarget, selectedEntry.id);
			setDocuments((current) => ({
				...current,
				[activeTarget]: nextDocument,
			}));
			const nextSelectedEntry = nextDocument.entries[0] ?? null;
			setSelectedEntryId(nextSelectedEntry?.id ?? null);
			setDraftText(nextSelectedEntry?.text ?? "");
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsMutating(false);
		}
	}

	return (
		<ControlPlanePageShell
			description="Read and edit the local Hermes memory model with live entry counts and character usage."
			title="Memories"
			actions={
				<div className="flex items-center gap-2">
					<Badge variant="neutral">{entries.length} entries</Badge>
					<Button variant="outline" onClick={() => void handleRefresh()} disabled={isLoading}>
						Refresh
					</Button>
				</div>
			}
		>
			<div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
				<div className="space-y-4">
					{errorMessage ? (
						<Card>
							<CardContent className="pt-4 text-sm text-text-danger">
								{errorMessage}
							</CardContent>
						</Card>
					) : null}

					<div className="grid gap-3 sm:grid-cols-2">
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Target</CardDescription>
								<CardTitle>{activeTarget === "memory" ? "MEMORY.md" : "USER.md"}</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-wrap gap-2">
								<Button
									variant={activeTarget === "memory" ? "default" : "outline"}
									onClick={() => handleSelectTarget("memory")}
								>
									MEMORY.md
								</Button>
								<Button
									variant={activeTarget === "user" ? "default" : "outline"}
									onClick={() => handleSelectTarget("user")}
								>
									USER.md
								</Button>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Usage</CardDescription>
								<CardTitle>{usage.percentage}%</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<Progress value={usage.percentage} />
								<div className="text-xs text-text-subtle">
									{activeDocument.totalChars.toLocaleString()} chars used{activeDocument.limit ? ` of ${activeDocument.limit.toLocaleString()}` : ""}.
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Entries</CardTitle>
							<CardDescription>Pick an entry to inspect, replace, or remove it.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{isLoading ? (
								<div className="rounded-xl border border-border bg-surface-raised px-3 py-8 text-center text-sm text-text-subtle">
									Loading Hermes memories...
								</div>
							) : entries.length === 0 ? (
								<div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-sm text-text-subtle">
									No memory entries yet.
								</div>
							) : (
								entries.map((entry) => {
									const isActive = entry.id === selectedEntryId;
									return (
										<button
											key={entry.id}
											type="button"
											className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${isActive ? "border-border-selected bg-bg-selected" : "border-border bg-surface-raised hover:bg-bg-neutral-subtle-hovered"}`}
											onClick={() => handleSelectEntry(entry.id)}
										>
											<div className="flex items-center justify-between gap-2">
												<div className="min-w-0">
													<div className="truncate text-sm font-medium">{entry.text}</div>
													<div className="mt-1 flex flex-wrap gap-2 text-xs text-text-subtlest">
														<span>{formatControlPlaneDateTime(activeDocument.updatedAt)}</span>
														<span>{entry.chars} chars</span>
													</div>
												</div>
												<Lozenge variant="information">entry</Lozenge>
											</div>
										</button>
									);
								})
							)}
						</CardContent>
					</Card>
				</div>

				<div className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between gap-3">
								<div>
									<CardTitle>{selectedEntry ? "Edit entry" : "Create entry"}</CardTitle>
									<CardDescription>
										Changes are written through the Hermes-backed memory routes.
									</CardDescription>
								</div>
								<div className="flex items-center gap-2">
									<Button variant="outline" onClick={() => void handleAddEntry()} disabled={isMutating}>
										Add entry
									</Button>
									<Button onClick={() => void handleReplaceEntry()} disabled={isMutating}>
										Replace entry
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-1.5">
								<div className="text-sm font-medium">Entry text</div>
								<Textarea
									value={draftText}
									onChange={(event) => setDraftText(event.target.value)}
									placeholder="Write a compact memory entry separated by § when needed."
								/>
							</div>

							<div className="grid gap-3 sm:grid-cols-2">
								<div className="rounded-lg border border-border bg-surface-raised px-3 py-2">
									<div className="text-xs uppercase tracking-wide text-text-subtlest">Selected entry</div>
									<div className="text-sm">{selectedEntry ? selectedEntry.text : "No entry selected"}</div>
								</div>
								<div className="rounded-lg border border-border bg-surface-raised px-3 py-2">
									<div className="text-xs uppercase tracking-wide text-text-subtlest">Remaining</div>
									<div className="text-sm">{usage.remaining.toLocaleString()} chars</div>
								</div>
							</div>

							<Separator />

							<div className="flex flex-wrap items-center gap-2">
								<Button variant="outline" onClick={() => void handleDeleteEntry()} disabled={!selectedEntry || isMutating}>
									Delete entry
								</Button>
								<Button
									variant="ghost"
									onClick={() => setDraftText(joinedEntries)}
								>
									Load raw joined text
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Raw memory view</CardTitle>
							<CardDescription>The entries are joined with the Hermes `§` delimiter.</CardDescription>
						</CardHeader>
						<CardContent>
							<ScrollArea className="max-h-[18rem]">
								<pre className="whitespace-pre-wrap rounded-xl border border-border bg-surface-raised p-3 text-sm text-text-subtle">
									{joinedEntries || "No entries yet."}
								</pre>
							</ScrollArea>
						</CardContent>
					</Card>
				</div>
			</div>
		</ControlPlanePageShell>
	);
}
