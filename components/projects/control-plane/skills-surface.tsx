"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Lozenge } from "@/components/ui/lozenge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
	FileTree,
	FileTreeFile,
	FileTreeFolder,
	FileTreeIcon,
	FileTreeName,
} from "@/components/ui-custom/file-tree";
import type {
	HermesHubInspectResult,
	HermesHubSkill,
	HermesSkillBundleDetail,
	HermesSkillDetail,
	HermesSkillDraftDetail,
	HermesSkillDraftSummary,
	HermesSkillSummary,
} from "@/lib/rovo-runtime-types";
import { cn } from "@/lib/utils";

import {
	approveSkillDraft,
	browseSkillsHub,
	deleteSkillDraft,
	fetchSkillBundleDetail,
	fetchSkillDetail,
	fetchSkillDraftDetail,
	fetchSkillDrafts,
	fetchSkills,
	inspectHubSkill,
	installHubSkillById,
	rejectSkillDraft,
	toggleSkill,
} from "./lib/control-plane-api";
import { ControlPlanePageShell } from "./control-plane-page-shell";
import { formatControlPlaneDateTime } from "./lib/control-plane-utils";

interface SkillsSurfacePageProps {
	initialCategory?: string | null;
	initialSlug?: string | null;
}

type SkillsSurfaceView = "drafts" | "hub" | "installed";

function buildSkillKey(skill: { category: string; name: string }): string {
	return `${skill.category}/${skill.name}`;
}

function buildSkillRoute(skill: { category: string; name: string }): string {
	return `/rovo/skills/${encodeURIComponent(skill.category)}/${encodeURIComponent(skill.name)}`;
}

function groupSkillsByCategory(skills: ReadonlyArray<HermesSkillSummary>) {
	const groupedSkills = new Map<string, HermesSkillSummary[]>();

	for (const skill of skills) {
		const group = groupedSkills.get(skill.category) ?? [];
		group.push(skill);
		groupedSkills.set(skill.category, group);
	}

	return Array.from(groupedSkills.entries())
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([category, items]) => ({
			category,
			skills: items.sort((left, right) => left.title.localeCompare(right.title)),
		}));
}

function resolveDraftBadgeVariant(
	status: HermesSkillDraftSummary["status"],
): "danger" | "neutral" | "success" | "warning" {
	if (status === "approved") {
		return "success";
	}
	if (status === "rejected") {
		return "danger";
	}
	return "warning";
}

function findDraftSkillFile(
	draft: HermesSkillDraftDetail | null,
	requestedPath: string,
): string | null {
	if (!draft) {
		return null;
	}

	const file = draft.files.find((candidate) => candidate.path === requestedPath);
	return file?.content ?? null;
}

function buildDraftPreviewSummary(draft: HermesSkillDraftSummary): string {
	return [
		draft.summary,
		draft.rationale,
	].filter(Boolean).join(" ");
}

function collectDraftComparisonPaths(
	draft: HermesSkillDraftDetail | null,
	liveSkillBundle: HermesSkillBundleDetail | null,
): string[] {
	const paths = new Set<string>();

	for (const file of draft?.files ?? []) {
		paths.add(file.path);
	}

	for (const file of liveSkillBundle?.files ?? []) {
		paths.add(file.path);
	}

	return [...paths].sort((left, right) => left.localeCompare(right));
}

function findBundleFileContent(
	files: ReadonlyArray<{ path: string; content: string }> | undefined,
	requestedPath: string,
): string | null {
	const file = files?.find((candidate) => candidate.path === requestedPath);
	return file?.content ?? null;
}

export function SkillsSurfacePage({
	initialCategory = null,
	initialSlug = null,
}: Readonly<SkillsSurfacePageProps>) {
	const router = useRouter();
	const [activeView, setActiveView] = useState<SkillsSurfaceView>("installed");
	const [skills, setSkills] = useState<HermesSkillSummary[]>([]);
	const [skillDrafts, setSkillDrafts] = useState<HermesSkillDraftSummary[]>([]);
	const [selectedSkillKey, setSelectedSkillKey] = useState<string | null>(null);
	const [selectedSkill, setSelectedSkill] = useState<HermesSkillDetail | null>(null);
	const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
	const [selectedDraft, setSelectedDraft] = useState<HermesSkillDraftDetail | null>(null);
	const [draftTargetSkill, setDraftTargetSkill] = useState<HermesSkillBundleDetail | null>(null);
	const [selectedDraftFilePath, setSelectedDraftFilePath] = useState<string>("SKILL.md");
	const [query, setQuery] = useState("");
	const [showDisabled, setShowDisabled] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isMutating, setIsMutating] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	// Hub tab state
	const [hubSkills, setHubSkills] = useState<HermesHubSkill[]>([]);
	const [hubTotal, setHubTotal] = useState(0);
	const [hubPage, setHubPage] = useState(1);
	const [hubTotalPages, setHubTotalPages] = useState(1);
	const [hubSource] = useState("all");
	const [hubQuery, setHubQuery] = useState("");
	const [hubSelectedSkill, setHubSelectedSkill] = useState<HermesHubSkill | null>(null);
	const [hubInspectResult, setHubInspectResult] = useState<HermesHubInspectResult | null>(null);
	const [isHubLoading, setIsHubLoading] = useState(false);
	const [isHubInstalling, setIsHubInstalling] = useState(false);

	const filteredSkills = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		return skills.filter((skill) => {
			if (!showDisabled && skill.disabled) {
				return false;
			}

			if (!normalizedQuery) {
				return true;
			}

			return `${skill.title} ${skill.name} ${skill.description ?? ""} ${skill.category}`
				.toLowerCase()
				.includes(normalizedQuery);
		});
	}, [query, showDisabled, skills]);
	const groupedSkills = useMemo(() => groupSkillsByCategory(filteredSkills), [filteredSkills]);
	const filteredDrafts = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		return skillDrafts.filter((draft) => {
			if (!normalizedQuery) {
				return true;
			}

			return `${draft.category} ${draft.name} ${draft.summary ?? ""} ${draft.rationale ?? ""}`
				.toLowerCase()
				.includes(normalizedQuery);
		});
	}, [query, skillDrafts]);
	const pendingDraftCount = useMemo(
		() => skillDrafts.filter((draft) => draft.status === "pending").length,
		[skillDrafts],
	);

	async function refreshInstalledSkills() {
		const nextSkills = await fetchSkills();
		setSkills(nextSkills);
		if (!selectedSkillKey && nextSkills[0]) {
			setSelectedSkillKey(buildSkillKey(nextSkills[0]));
		}
	}

	async function refreshSkillDrafts() {
		const nextDrafts = await fetchSkillDrafts();
		setSkillDrafts(nextDrafts);
		if (!selectedDraftId && nextDrafts[0]) {
			setSelectedDraftId(nextDrafts[0].id);
		}
	}

	async function refreshAll() {
		setIsLoading(true);
		try {
			await Promise.all([
				refreshInstalledSkills(),
				refreshSkillDrafts(),
			]);
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsLoading(false);
		}
	}

	async function loadHubSkills(page: number, source: string, searchQuery?: string) {
		setIsHubLoading(true);
		try {
			if (searchQuery && searchQuery.trim()) {
				const { searchSkillsHub } = await import("./lib/control-plane-api");
				const results = await searchSkillsHub(searchQuery.trim(), { source, limit: 20 });
				setHubSkills(results);
				setHubTotal(results.length);
				setHubPage(1);
				setHubTotalPages(1);
			} else {
				const result = await browseSkillsHub({ page, pageSize: 20, source });
				setHubSkills(result.results);
				setHubTotal(result.total);
				setHubPage(result.page);
				setHubTotalPages(result.totalPages);
			}
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsHubLoading(false);
		}
	}

	async function handleHubSelectSkill(skill: HermesHubSkill) {
		setHubSelectedSkill(skill);
		if (skill.identifier) {
			try {
				const result = await inspectHubSkill(skill.identifier);
				setHubInspectResult(result);
			} catch {
				setHubInspectResult(null);
			}
		}
	}

	async function handleHubInstall() {
		if (!hubSelectedSkill?.identifier) return;
		setIsHubInstalling(true);
		try {
			await installHubSkillById(hubSelectedSkill.identifier);
			setErrorMessage(null);
			await refreshInstalledSkills();
			setActiveView("installed");
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsHubInstalling(false);
		}
	}

	useEffect(() => {
		let cancelled = false;

		async function loadSurfaceData() {
			const [skillsResult, draftsResult] = await Promise.allSettled([
				fetchSkills(),
				fetchSkillDrafts(),
			]);
			if (cancelled) {
				return;
			}

			const nextSkills = skillsResult.status === "fulfilled"
				? skillsResult.value
				: [];
			const nextDrafts = draftsResult.status === "fulfilled"
				? draftsResult.value
				: [];

			try {
				setSkills(nextSkills);
				setSkillDrafts(nextDrafts);
				const routeKey =
					initialCategory && initialSlug
						? `${decodeURIComponent(initialCategory)}/${decodeURIComponent(initialSlug)}`
						: null;
				const nextSelectedSkillKey = routeKey && nextSkills.some((skill) => buildSkillKey(skill) === routeKey)
					? routeKey
					: nextSkills[0]
						? buildSkillKey(nextSkills[0])
						: null;
				setSelectedSkillKey(nextSelectedSkillKey);
				setSelectedDraftId((currentDraftId) => currentDraftId ?? nextDrafts[0]?.id ?? null);
				const errors = [skillsResult, draftsResult]
					.filter((result): result is PromiseRejectedResult => result.status === "rejected")
					.map((result) => result.reason instanceof Error ? result.reason.message : String(result.reason))
					.filter(Boolean);
				setErrorMessage(errors.length > 0 ? errors.join(" ") : null);
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		}

		setIsLoading(true);
		void loadSurfaceData();

		return () => {
			cancelled = true;
		};
	}, [initialCategory, initialSlug]);

	useEffect(() => {
		if (activeView !== "installed" || !selectedSkillKey) {
			setSelectedSkill(null);
			return;
		}

		const [category, name] = selectedSkillKey.split("/");
		if (!category || !name) {
			setSelectedSkill(null);
			return;
		}

		let cancelled = false;

		async function loadDetail() {
			try {
				const detail = await fetchSkillDetail(category, name);
				if (!cancelled) {
					setSelectedSkill(detail);
					setErrorMessage(null);
				}
			} catch (error) {
				if (!cancelled) {
					setErrorMessage(error instanceof Error ? error.message : String(error));
				}
			}
		}

		void loadDetail();
		return () => {
			cancelled = true;
		};
	}, [activeView, selectedSkillKey]);

	useEffect(() => {
		if (activeView !== "drafts" || !selectedDraftId) {
			setSelectedDraft(null);
			setDraftTargetSkill(null);
			return;
		}

		let cancelled = false;
		const draftId = selectedDraftId;

		async function loadDraftDetail() {
			try {
				const detail = await fetchSkillDraftDetail(draftId);
				if (cancelled) {
					return;
				}

				setSelectedDraft(detail);
				setSelectedDraftFilePath("SKILL.md");
				if (detail.action === "create") {
					setDraftTargetSkill(null);
				} else {
					try {
						const liveSkill = await fetchSkillBundleDetail(detail.category, detail.name);
						if (!cancelled) {
							setDraftTargetSkill(liveSkill);
						}
					} catch {
						if (!cancelled) {
							setDraftTargetSkill(null);
						}
					}
				}
				setErrorMessage(null);
			} catch (error) {
				if (!cancelled) {
					setErrorMessage(error instanceof Error ? error.message : String(error));
					setSelectedDraft(null);
					setDraftTargetSkill(null);
				}
			}
		}

		void loadDraftDetail();
		return () => {
			cancelled = true;
		};
	}, [activeView, selectedDraftId]);
	const draftComparisonPaths = useMemo(
		() => collectDraftComparisonPaths(selectedDraft, draftTargetSkill),
		[selectedDraft, draftTargetSkill],
	);

	useEffect(() => {
		if (draftComparisonPaths.length === 0) {
			setSelectedDraftFilePath("SKILL.md");
			return;
		}

		if (!draftComparisonPaths.includes(selectedDraftFilePath)) {
			setSelectedDraftFilePath(draftComparisonPaths[0]);
		}
	}, [draftComparisonPaths, selectedDraftFilePath]);

	// Load hub skills when switching to hub tab or changing filters
	useEffect(() => {
		if (activeView !== "hub") return;
		void loadHubSkills(hubPage, hubSource, hubQuery);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeView, hubPage, hubSource]);

	function handleSelectSkill(skill: HermesSkillSummary) {
		const nextKey = buildSkillKey(skill);
		setSelectedSkillKey(nextKey);
		setActiveView("installed");
		router.push(buildSkillRoute(skill));
	}

	async function handleToggleSkill() {
		if (!selectedSkill) {
			return;
		}

		setIsMutating(true);
		try {
			const nextSkill = await toggleSkill(
				selectedSkill.category,
				selectedSkill.name,
				selectedSkill.disabled,
			);
			setSelectedSkill(nextSkill);
			setSkills((current) =>
				current.map((skill) =>
					buildSkillKey(skill) === buildSkillKey(nextSkill)
						? nextSkill
						: skill,
				),
			);
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsMutating(false);
		}
	}

	async function handleDraftMutation(
		action: "approve" | "delete" | "reject",
		draftId: string,
	) {
		setIsMutating(true);
		try {
			if (action === "approve") {
				await approveSkillDraft(draftId);
			} else if (action === "reject") {
				await rejectSkillDraft(draftId);
			} else {
				await deleteSkillDraft(draftId);
			}

			await Promise.all([
				refreshInstalledSkills(),
				refreshSkillDrafts(),
			]);
			setSelectedDraftId((currentDraftId) => {
				if (currentDraftId !== draftId) {
					return currentDraftId;
				}
				return null;
			});
			if (selectedDraftId === draftId) {
				setSelectedDraft(null);
				setDraftTargetSkill(null);
			}
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsMutating(false);
		}
	}

	return (
		<ControlPlanePageShell
			description="Browse installed Hermes skills, inspect SKILL.md content, and review pending draft skill changes."
			title="Skills"
			actions={
				<div className="flex items-center gap-2">
					<Badge variant="neutral">
						{activeView === "installed"
								? `${filteredSkills.length} visible`
								: activeView === "hub"
									? `${hubTotal} available`
									: `${filteredDrafts.length} drafts`}
					</Badge>
					<Button variant="outline" onClick={() => void refreshAll()} disabled={isLoading}>
						Refresh
					</Button>
				</div>
			}
		>
			<div className="space-y-4">
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant={activeView === "installed" ? "default" : "outline"}
						onClick={() => setActiveView("installed")}
					>
						Installed skills
					</Button>
					<Button
						variant={activeView === "drafts" ? "default" : "outline"}
						onClick={() => setActiveView("drafts")}
					>
						Drafts
						{pendingDraftCount > 0 ? (
							<span className="ml-2 rounded-full bg-surface-overlay px-2 py-0.5 text-xs">
								{pendingDraftCount}
							</span>
						) : null}
					</Button>
						<Button
							variant={activeView === "hub" ? "default" : "outline"}
							onClick={() => setActiveView("hub")}
						>
							Hub
						</Button>
					</div>

				<div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
					<div className="space-y-4">
						{errorMessage ? (
							<Card>
								<CardContent className="pt-4 text-sm text-text-danger">
									{errorMessage}
								</CardContent>
							</Card>
						) : null}

						<Card>
							<CardHeader>
								<CardTitle>
								{activeView === "installed"
									? "Browse skills"
									: activeView === "hub"
										? "Skills Hub"
										: "Review drafts"}
							</CardTitle>
								<CardDescription>
									{activeView === "installed"
										? "Search across categories and open the canonical detail route."
										: activeView === "hub"
											? "Discover and install skills from GitHub, skills.sh, ClawHub, and LobeHub."
											: "Pending drafts are proposed by the Hermes skill companion and only become live after approval."}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="grid gap-3 sm:grid-cols-[1fr_auto]">
									<Input
										placeholder={
											activeView === "installed"
												? "Search skills, categories, or descriptions"
												: activeView === "hub"
													? "Search the skills hub..."
													: "Search drafts by target, rationale, or summary"
										}
										value={activeView === "hub" ? hubQuery : query}
										onChange={(event) => {
											if (activeView === "hub") {
												setHubQuery(event.target.value);
											} else {
												setQuery(event.target.value);
											}
										}}
										onKeyDown={activeView === "hub" ? (event) => {
											if (event.key === "Enter") {
												void loadHubSkills(1, hubSource, hubQuery);
											}
										} : undefined}
									/>
									{activeView === "installed" ? (
										<Button
											variant={showDisabled ? "default" : "outline"}
											onClick={() => setShowDisabled((current) => !current)}
										>
											{showDisabled ? "Showing disabled" : "Enabled only"}
										</Button>
									) : activeView === "hub" ? (
										<Button
											variant="default"
											onClick={() => void loadHubSkills(1, hubSource, hubQuery)}
											disabled={isHubLoading}
										>
											Search
										</Button>
									) : (
										<div className="flex items-center">
											<Badge variant="neutral">{pendingDraftCount} pending</Badge>
										</div>
									)}
								</div>

								<ScrollArea className="h-[calc(100vh-20rem)] pr-2">
									{isLoading ? (
										<div className="rounded-xl border border-border bg-surface-raised px-3 py-8 text-center text-sm text-text-subtle">
											Loading Hermes skill data...
										</div>
									) : activeView === "installed" ? (
										<FileTree
											className="bg-transparent"
											defaultExpanded={new Set(groupedSkills.map((group) => group.category))}
											onSelect={(path) => {
												const nextSkill = filteredSkills.find((skill) => buildSkillKey(skill) === path);
												if (nextSkill) {
													handleSelectSkill(nextSkill);
												}
											}}
											selectedPath={selectedSkillKey ?? undefined}
										>
											{groupedSkills.map((group) => (
												<FileTreeFolder key={group.category} name={group.category} path={group.category}>
													{group.skills.map((skill) => {
														const itemPath = buildSkillKey(skill);
														return (
															<FileTreeFile key={itemPath} name={skill.name} path={itemPath}>
																<FileTreeIcon>
																	<Lozenge variant={skill.disabled ? "neutral" : "success"}>
																		{skill.disabled ? "off" : "on"}
																	</Lozenge>
																</FileTreeIcon>
																<FileTreeName>
																	<span className={cn("truncate", selectedSkillKey === itemPath && "text-text-selected")}>
																		{skill.title}
																	</span>
																</FileTreeName>
															</FileTreeFile>
														);
													})}
												</FileTreeFolder>
											))}
										</FileTree>
									) : activeView === "hub" ? (
										<div className="space-y-3">
											{isHubLoading ? (
												<div className="rounded-xl border border-border bg-surface-raised px-3 py-8 text-center text-sm text-text-subtle">
													Searching the skills hub...
												</div>
											) : hubSkills.length === 0 ? (
												<div className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-text-subtle">
													No skills found. Try a different search term.
												</div>
											) : (
												<>
													{hubSkills.map((skill) => {
														const selected = hubSelectedSkill?.identifier === skill.identifier;
														return (
															<button
																key={skill.identifier ?? skill.name}
																className={cn(
																	"w-full rounded-xl border px-3 py-3 text-left transition-colors",
																	selected
																		? "border-accent bg-surface-raised"
																		: "border-border bg-surface hover:border-accent-subtle hover:bg-surface-raised",
																)}
																type="button"
																onClick={() => void handleHubSelectSkill(skill)}
															>
																<div className="flex items-start justify-between gap-3">
																	<div className="space-y-1">
																		<div className="font-medium">{skill.name}</div>
																		<div className="text-xs text-text-subtle line-clamp-2">
																			{skill.description ?? "No description available."}
																		</div>
																	</div>
																	<div className="flex flex-col items-end gap-1">
																		<Badge variant={
																			skill.trustLevel === "trusted" ? "success"
																				: skill.trustLevel === "builtin" ? "info"
																					: "neutral"
																		}>
																			{skill.trustLevel ?? "community"}
																		</Badge>
																		{skill.source ? (
																			<span className="text-xs text-text-subtlest">{skill.source}</span>
																		) : null}
																	</div>
																</div>
															</button>
														);
													})}
													{hubTotalPages > 1 ? (
														<div className="flex items-center justify-center gap-2 pt-2">
															<Button
																size="sm"
																variant="outline"
																disabled={hubPage <= 1}
																onClick={() => setHubPage((p) => Math.max(1, p - 1))}
															>
																Prev
															</Button>
															<span className="text-sm text-text-subtle">
																{hubPage} / {hubTotalPages}
															</span>
															<Button
																size="sm"
																variant="outline"
																disabled={hubPage >= hubTotalPages}
																onClick={() => setHubPage((p) => p + 1)}
															>
																Next
															</Button>
														</div>
													) : null}
												</>
											)}
										</div>
									) : (
										<div className="space-y-3">
											{filteredDrafts.length === 0 ? (
												<div className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-text-subtle">
													No Hermes skill drafts match the current filter.
												</div>
											) : filteredDrafts.map((draft) => {
												const selected = selectedDraftId === draft.id;
												return (
													<button
														key={draft.id}
														className={cn(
															"w-full rounded-xl border px-3 py-3 text-left transition-colors",
															selected
																? "border-accent bg-surface-raised"
																: "border-border bg-surface hover:border-accent-subtle hover:bg-surface-raised",
														)}
														type="button"
														onClick={() => {
															setSelectedDraftId(draft.id);
															setActiveView("drafts");
														}}
													>
														<div className="flex items-start justify-between gap-3">
															<div className="space-y-1">
																<div className="font-medium">{draft.category}/{draft.name}</div>
																<div className="text-xs text-text-subtle">
																	{draft.action} · {formatControlPlaneDateTime(draft.updatedAt)}
																</div>
															</div>
															<Badge variant={resolveDraftBadgeVariant(draft.status)}>
																{draft.status}
															</Badge>
														</div>
														<div className="mt-2 text-sm text-text-subtle">
															{buildDraftPreviewSummary(draft) || "No summary or rationale provided."}
														</div>
													</button>
												);
											})}
										</div>
									)}
								</ScrollArea>
							</CardContent>
						</Card>
					</div>

					<div className="space-y-4">
						{activeView === "installed" ? (
							<>
								<Card>
									<CardHeader>
										<div className="flex items-center justify-between gap-3">
											<div>
												<CardTitle>{selectedSkill ? selectedSkill.title : "Select a skill"}</CardTitle>
												<CardDescription>
													{selectedSkill ? selectedSkill.description ?? "No summary provided." : "No skill matches the current filter."}
												</CardDescription>
											</div>
											{selectedSkill ? (
												<div className="flex items-center gap-2">
													<Badge variant={selectedSkill.disabled ? "neutral" : "success"}>
														{selectedSkill.disabled ? "disabled" : "enabled"}
													</Badge>
													<Button variant="outline" onClick={() => void handleToggleSkill()} disabled={isMutating}>
														{selectedSkill.disabled ? "Enable" : "Disable"}
													</Button>
												</div>
											) : null}
										</div>
									</CardHeader>
									<CardContent className="space-y-4">
										{selectedSkill ? (
											<>
												<div className="grid gap-3 sm:grid-cols-2">
													<div className="rounded-lg border border-border bg-surface-raised px-3 py-2">
														<div className="text-xs uppercase tracking-wide text-text-subtlest">Category</div>
														<div className="text-sm">{selectedSkill.category}</div>
													</div>
													<div className="rounded-lg border border-border bg-surface-raised px-3 py-2">
														<div className="text-xs uppercase tracking-wide text-text-subtlest">Location</div>
														<div className="text-sm">{selectedSkill.path}</div>
													</div>
												</div>

												<div className="grid gap-2 sm:grid-cols-2">
													<div className="rounded-lg border border-border bg-surface-raised px-3 py-2">
														<div className="text-xs uppercase tracking-wide text-text-subtlest">Updated</div>
														<div className="text-sm">{formatControlPlaneDateTime(selectedSkill.updatedAt)}</div>
													</div>
													<div className="rounded-lg border border-border bg-surface-raised px-3 py-2">
														<div className="text-xs uppercase tracking-wide text-text-subtlest">Source dir</div>
														<div className="text-sm">{selectedSkill.rootDir}</div>
													</div>
												</div>

												<Separator />

												<Button variant="ghost" onClick={() => router.push(buildSkillRoute(selectedSkill))}>
													Open canonical route
												</Button>
											</>
										) : (
											<div className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-text-subtle">
												No skills match the active search filter.
											</div>
										)}
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Skill content</CardTitle>
										<CardDescription>Preview the skill body exactly as it exists on disk.</CardDescription>
									</CardHeader>
									<CardContent>
										<ScrollArea className="max-h-[20rem]">
											<pre className="whitespace-pre-wrap rounded-xl border border-border bg-surface-raised p-3 text-sm text-text-subtle">
												{selectedSkill ? selectedSkill.content : "Select a skill to inspect its content."}
											</pre>
										</ScrollArea>
									</CardContent>
								</Card>
							</>
						) : activeView === "hub" ? (
							<>
								<Card>
									<CardHeader>
										<div className="flex items-center justify-between gap-3">
											<div>
												<CardTitle>{hubSelectedSkill ? hubSelectedSkill.name : "Select a skill"}</CardTitle>
												<CardDescription>
													{hubSelectedSkill
														? hubSelectedSkill.description ?? "No description available."
														: "Browse or search the hub, then select a skill to preview."}
												</CardDescription>
											</div>
											{hubSelectedSkill ? (
												<div className="flex items-center gap-2">
													{hubSelectedSkill.trustLevel ? (
														<Badge variant={
															hubSelectedSkill.trustLevel === "trusted" ? "success"
																: hubSelectedSkill.trustLevel === "builtin" ? "info"
																	: "neutral"
														}>
															{hubSelectedSkill.trustLevel}
														</Badge>
													) : null}
													<Button
														onClick={() => void handleHubInstall()}
														disabled={isHubInstalling || !hubSelectedSkill.identifier}
													>
														{isHubInstalling ? "Installing..." : "Install"}
													</Button>
												</div>
											) : null}
										</div>
									</CardHeader>
									<CardContent className="space-y-4">
										{hubSelectedSkill ? (
											<>
												<div className="grid gap-3 sm:grid-cols-2">
													{hubSelectedSkill.source ? (
														<div className="rounded-lg border border-border bg-surface-raised px-3 py-2">
															<div className="text-xs uppercase tracking-wide text-text-subtlest">Source</div>
															<div className="text-sm">{hubSelectedSkill.source}</div>
														</div>
													) : null}
													{hubSelectedSkill.identifier ? (
														<div className="rounded-lg border border-border bg-surface-raised px-3 py-2">
															<div className="text-xs uppercase tracking-wide text-text-subtlest">Identifier</div>
															<div className="truncate text-sm">{hubSelectedSkill.identifier}</div>
														</div>
													) : null}
												</div>
												{hubSelectedSkill.tags.length > 0 ? (
													<div className="flex flex-wrap gap-1">
														{hubSelectedSkill.tags.map((tag) => (
															<Badge key={tag} variant="neutral">{tag}</Badge>
														))}
													</div>
												) : null}
											</>
										) : (
											<div className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-text-subtle">
												Select a skill from the hub to preview and install.
											</div>
										)}
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Skill preview</CardTitle>
										<CardDescription>SKILL.md content from the selected hub skill.</CardDescription>
									</CardHeader>
									<CardContent>
										<ScrollArea className="max-h-[20rem]">
											<pre className="whitespace-pre-wrap rounded-xl border border-border bg-surface-raised p-3 text-sm text-text-subtle">
												{hubInspectResult?.preview
													? hubInspectResult.preview
													: "Select a skill to preview its content."}
											</pre>
										</ScrollArea>
									</CardContent>
								</Card>
							</>
						) : (
							<>
								<Card>
									<CardHeader>
										<div className="flex items-center justify-between gap-3">
											<div>
												<CardTitle>
													{selectedDraft ? `${selectedDraft.category}/${selectedDraft.name}` : "Select a draft"}
												</CardTitle>
												<CardDescription>
													{selectedDraft
														? selectedDraft.rationale ?? "No rationale provided."
														: "Select a draft to inspect or review it."}
												</CardDescription>
											</div>
											{selectedDraft ? (
												<Badge variant={resolveDraftBadgeVariant(selectedDraft.status)}>
													{selectedDraft.status}
												</Badge>
											) : null}
										</div>
									</CardHeader>
									<CardContent className="space-y-4">
										{selectedDraft ? (
											<>
												<div className="grid gap-3 sm:grid-cols-2">
													<div className="rounded-lg border border-border bg-surface-raised px-3 py-2">
														<div className="text-xs uppercase tracking-wide text-text-subtlest">Action</div>
														<div className="text-sm">{selectedDraft.action}</div>
													</div>
													<div className="rounded-lg border border-border bg-surface-raised px-3 py-2">
														<div className="text-xs uppercase tracking-wide text-text-subtlest">Source thread</div>
														<div className="text-sm">{selectedDraft.sourceThreadId ?? "Unknown"}</div>
													</div>
												</div>
												<div className="grid gap-3 sm:grid-cols-2">
													<div className="rounded-lg border border-border bg-surface-raised px-3 py-2">
														<div className="text-xs uppercase tracking-wide text-text-subtlest">Created</div>
														<div className="text-sm">{formatControlPlaneDateTime(selectedDraft.createdAt)}</div>
													</div>
													<div className="rounded-lg border border-border bg-surface-raised px-3 py-2">
														<div className="text-xs uppercase tracking-wide text-text-subtlest">Updated</div>
														<div className="text-sm">{formatControlPlaneDateTime(selectedDraft.updatedAt)}</div>
													</div>
												</div>
												{selectedDraft.summary ? (
													<div className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-subtle">
														{selectedDraft.summary}
													</div>
												) : null}

												<div className="flex flex-wrap gap-2">
													<Button
														onClick={() => void handleDraftMutation("approve", selectedDraft.id)}
														disabled={isMutating || selectedDraft.status !== "pending"}
													>
														Approve
													</Button>
													<Button
														variant="outline"
														onClick={() => void handleDraftMutation("reject", selectedDraft.id)}
														disabled={isMutating || selectedDraft.status !== "pending"}
													>
														Reject
													</Button>
													<Button
														variant="ghost"
														onClick={() => void handleDraftMutation("delete", selectedDraft.id)}
														disabled={isMutating}
													>
														Delete
													</Button>
												</div>
											</>
										) : (
											<div className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-text-subtle">
												No skill draft is selected.
											</div>
										)}
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Draft preview</CardTitle>
										<CardDescription>
											{selectedDraft?.action === "create"
												? "New skill bundle proposed by the companion."
												: "Compare the proposed draft with the currently installed skill."}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										{selectedDraft ? (
											<>
												{draftComparisonPaths.length > 0 ? (
													<div className="space-y-2">
														<div className="text-sm font-medium">Bundle files</div>
														<div className="flex flex-wrap gap-2">
															{draftComparisonPaths.map((filePath) => (
																<Button
																	key={filePath}
																	size="sm"
																	variant={selectedDraftFilePath === filePath ? "default" : "outline"}
																	onClick={() => setSelectedDraftFilePath(filePath)}
																>
																	{filePath}
																</Button>
															))}
														</div>
													</div>
												) : null}
												<div className="grid gap-4 lg:grid-cols-2">
													<div className="space-y-2">
														<div className="text-sm font-medium">Live file</div>
														<ScrollArea className="max-h-[18rem] rounded-xl border border-border bg-surface-raised p-3">
															<pre className="whitespace-pre-wrap text-sm text-text-subtle">
																{findBundleFileContent(draftTargetSkill?.files, selectedDraftFilePath)
																	?? (selectedDraft.action === "create"
																		? "No live skill exists for this draft target."
																		: "This file does not exist in the live skill bundle.")}
															</pre>
														</ScrollArea>
													</div>
													<div className="space-y-2">
														<div className="text-sm font-medium">Draft file</div>
														<ScrollArea className="max-h-[18rem] rounded-xl border border-border bg-surface-raised p-3">
															<pre className="whitespace-pre-wrap text-sm text-text-subtle">
																{findDraftSkillFile(selectedDraft, selectedDraftFilePath)
																	?? "This file is not present in the draft bundle."}
															</pre>
														</ScrollArea>
													</div>
												</div>

												<div className="space-y-2">
													<div className="text-sm font-medium">Draft bundle files</div>
													<div className="flex flex-wrap gap-2">
														{selectedDraft.files.map((file) => (
															<Badge key={file.path} variant="neutral">
																{file.path}
															</Badge>
														))}
													</div>
												</div>
											</>
										) : (
											<div className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-text-subtle">
												Select a draft to inspect the proposed bundle files.
											</div>
										)}
									</CardContent>
								</Card>
							</>
						)}
					</div>
				</div>
			</div>
		</ControlPlanePageShell>
	);
}
