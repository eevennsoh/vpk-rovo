"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { HermesMemoryDocument } from "@/lib/rovo-runtime-types";

import { addMemoryEntry, deleteMemoryEntry, fetchMemoryDocument } from "./lib/control-plane-api";
import { calculateUsage, splitMemoryEntries } from "./lib/control-plane-utils";
import { CONTROL_PLANE_MEMORY_LIMITS } from "./lib/control-plane-data";

export function UserProfileCard() {
	const [document, setDocument] = useState<HermesMemoryDocument | null>(null);
	const [draftText, setDraftText] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isMutating, setIsMutating] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isAddingEntry, setIsAddingEntry] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			setIsLoading(true);
			try {
				const doc = await fetchMemoryDocument("user");
				if (!cancelled) {
					setDocument(doc);
					setErrorMessage(null);
				}
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

		void load();
		return () => {
			cancelled = true;
		};
	}, []);

	const entries = document?.entries ?? [];
	const usage = calculateUsage(
		document?.totalChars ?? 0,
		document?.limit ?? CONTROL_PLANE_MEMORY_LIMITS.user,
	);

	async function handleRefresh() {
		setIsLoading(true);
		try {
			const doc = await fetchMemoryDocument("user");
			setDocument(doc);
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsLoading(false);
		}
	}

	async function handleAddEntry() {
		const texts = splitMemoryEntries(draftText);
		if (texts.length === 0) {
			return;
		}

		setIsMutating(true);
		try {
			let nextDocument = document;
			for (const text of texts) {
				nextDocument = await addMemoryEntry("user", text);
			}
			setDocument(nextDocument);
			setDraftText("");
			setIsAddingEntry(false);
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsMutating(false);
		}
	}

	async function handleDeleteEntry(entryId: string) {
		setIsMutating(true);
		try {
			const nextDocument = await deleteMemoryEntry("user", entryId);
			setDocument(nextDocument);
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsMutating(false);
		}
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between gap-3">
					<div>
						<CardTitle>User Profile</CardTitle>
						<CardDescription>Hermes user memory — preferences and identity.</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="neutral">{entries.length} entries</Badge>
						<Button variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={isLoading}>
							Refresh
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{errorMessage ? (
					<div className="text-sm text-text-danger">{errorMessage}</div>
				) : null}

				<div className="space-y-2">
					<div className="flex items-center justify-between text-xs text-text-subtle">
						<span>{usage.percentage}% used</span>
						<span>{(document?.totalChars ?? 0).toLocaleString()} / {(document?.limit ?? CONTROL_PLANE_MEMORY_LIMITS.user).toLocaleString()} chars</span>
					</div>
					<Progress value={usage.percentage} />
				</div>

				{isLoading ? (
					<div className="rounded-xl border border-border bg-surface-raised px-3 py-8 text-center text-sm text-text-subtle">
						Loading user profile...
					</div>
				) : entries.length === 0 ? (
					<div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-sm text-text-subtle">
						No user profile entries yet.
					</div>
				) : (
					<div className="space-y-2">
						{entries.map((entry) => (
							<div
								key={entry.id}
								className="group flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-raised px-3 py-3"
							>
								<div className="min-w-0 flex-1">
									<div className="truncate text-sm">{entry.text}</div>
									<div className="mt-1 text-xs text-text-subtlest">{entry.chars} chars</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									className="opacity-0 group-hover:opacity-100"
									onClick={() => void handleDeleteEntry(entry.id)}
									disabled={isMutating}
								>
									Delete
								</Button>
							</div>
						))}
					</div>
				)}

				{isAddingEntry ? (
					<div className="space-y-3">
						<Textarea
							value={draftText}
							onChange={(event) => setDraftText(event.target.value)}
							placeholder="Write a user profile entry. Separate multiple entries with § on its own line."
							rows={3}
						/>
						<div className="flex items-center gap-2">
							<Button size="sm" onClick={() => void handleAddEntry()} disabled={isMutating || draftText.trim().length === 0}>
								Save
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setIsAddingEntry(false);
									setDraftText("");
								}}
							>
								Cancel
							</Button>
						</div>
					</div>
				) : (
					<Button variant="outline" size="sm" onClick={() => setIsAddingEntry(true)}>
						+ Add entry
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
