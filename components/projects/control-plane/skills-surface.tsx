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
} from "@/components/ui-ai/file-tree";
import type { HermesSkillDetail, HermesSkillSummary } from "@/lib/rovo-runtime-types";
import { cn } from "@/lib/utils";

import { fetchSkillDetail, fetchSkills, toggleSkill } from "./lib/control-plane-api";
import { ControlPlanePageShell } from "./control-plane-page-shell";
import { formatControlPlaneDateTime } from "./lib/control-plane-utils";

interface SkillsSurfacePageProps {
	initialCategory?: string | null;
	initialSlug?: string | null;
}

function buildSkillKey(skill: { category: string; name: string }): string {
	return `${skill.category}/${skill.name}`;
}

function buildSkillRoute(skill: { category: string; name: string }): string {
	return `/rovo-app/skills/${encodeURIComponent(skill.category)}/${encodeURIComponent(skill.name)}`;
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

export function SkillsSurfacePage({
	initialCategory = null,
	initialSlug = null,
}: Readonly<SkillsSurfacePageProps>) {
	const router = useRouter();
	const [skills, setSkills] = useState<HermesSkillSummary[]>([]);
	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const [selectedSkill, setSelectedSkill] = useState<HermesSkillDetail | null>(null);
	const [query, setQuery] = useState("");
	const [showDisabled, setShowDisabled] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isMutating, setIsMutating] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

	async function refreshSkills() {
		setIsLoading(true);
		try {
			const nextSkills = await fetchSkills();
			setSkills(nextSkills);
			if (!selectedKey && nextSkills[0]) {
				setSelectedKey(buildSkillKey(nextSkills[0]));
			}
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		let cancelled = false;

		async function loadSkills() {
			try {
				const nextSkills = await fetchSkills();
				if (cancelled) {
					return;
				}
				setSkills(nextSkills);
				const routeKey =
					initialCategory && initialSlug
						? `${decodeURIComponent(initialCategory)}/${decodeURIComponent(initialSlug)}`
						: null;
				const nextSelectedKey = routeKey && nextSkills.some((skill) => buildSkillKey(skill) === routeKey)
					? routeKey
					: nextSkills[0]
						? buildSkillKey(nextSkills[0])
						: null;
				setSelectedKey(nextSelectedKey);
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

		setIsLoading(true);
		void loadSkills();

		return () => {
			cancelled = true;
		};
	}, [initialCategory, initialSlug]);

	useEffect(() => {
		if (!selectedKey) {
			setSelectedSkill(null);
			return;
		}

		const [category, name] = selectedKey.split("/");
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
	}, [selectedKey]);

	function handleSelectSkill(skill: HermesSkillSummary) {
		const nextKey = buildSkillKey(skill);
		setSelectedKey(nextKey);
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

	return (
		<ControlPlanePageShell
			description="Browse installed Hermes skills, inspect SKILL.md content, and toggle skill enablement."
			title="Skills"
			actions={
				<div className="flex items-center gap-2">
					<Badge variant="neutral">{filteredSkills.length} visible</Badge>
					<Button variant="outline" onClick={() => void refreshSkills()} disabled={isLoading}>
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

					<Card>
						<CardHeader>
							<CardTitle>Browse skills</CardTitle>
							<CardDescription>Search across categories and open the canonical detail route.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="grid gap-3 sm:grid-cols-[1fr_auto]">
								<Input
									placeholder="Search skills, categories, or descriptions"
									value={query}
									onChange={(event) => setQuery(event.target.value)}
								/>
								<Button
									variant={showDisabled ? "default" : "outline"}
									onClick={() => setShowDisabled((current) => !current)}
								>
									{showDisabled ? "Showing disabled" : "Enabled only"}
								</Button>
							</div>

							<ScrollArea className="h-[calc(100vh-20rem)] pr-2">
								<FileTree
									className="bg-transparent"
									defaultExpanded={new Set(groupedSkills.map((group) => group.category))}
									onSelect={(path) => {
										const nextSkill = filteredSkills.find((skill) => buildSkillKey(skill) === path);
										if (nextSkill) {
											handleSelectSkill(nextSkill);
										}
									}}
									selectedPath={selectedKey ?? undefined}
								>
									{isLoading ? (
										<div className="rounded-xl border border-border bg-surface-raised px-3 py-8 text-center text-sm text-text-subtle">
											Loading Hermes skills...
										</div>
									) : groupedSkills.map((group) => (
										<FileTreeFolder key={group.category} name={group.category} path={group.category}>
											{group.skills.map((skill) => {
												const path = buildSkillKey(skill);
												return (
													<FileTreeFile key={path} name={skill.name} path={path}>
														<FileTreeIcon>
															<Lozenge variant={skill.disabled ? "neutral" : "success"}>
																{skill.disabled ? "off" : "on"}
															</Lozenge>
														</FileTreeIcon>
														<FileTreeName>
															<span className={cn("truncate", selectedKey === path && "text-text-selected")}>
																{skill.title}
															</span>
														</FileTreeName>
													</FileTreeFile>
												);
											})}
										</FileTreeFolder>
									))}
								</FileTree>
							</ScrollArea>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-4">
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
				</div>
			</div>
		</ControlPlanePageShell>
	);
}
