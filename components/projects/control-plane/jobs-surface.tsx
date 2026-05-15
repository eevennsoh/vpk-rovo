"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Lozenge } from "@/components/ui/lozenge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { HermesJob } from "@/lib/rovo-runtime-types";
import { createId, sortByUpdatedAtDesc } from "@/lib/utils";

import type { ControlPlaneJob } from "./lib/control-plane-data";
import { formatControlPlaneDateTime, summarizeJobs } from "./lib/control-plane-utils";
import { createJob, deleteJob, fetchJobs, runJobAction, updateJob } from "./lib/control-plane-api";
import { ControlPlanePageShell } from "./control-plane-page-shell";

function createBlankJob(): ControlPlaneJob {
	return {
		artifactTarget: null,
		enabled: true,
		id: createId("job"),
		lastError: null,
		lastRunAt: null,
		linkedThreadId: null,
		name: "New job",
		nextRunAt: null,
		notes: "",
		postResultToThread: false,
		schedule: "every 1h",
		status: "scheduled",
		surface: "rovo",
		target: "",
		updatedAt: new Date().toISOString(),
	};
}

function toControlPlaneJob(job: HermesJob): ControlPlaneJob {
	const status: ControlPlaneJob["status"] =
		job.status === "running" || job.status === "paused" || job.status === "failed"
			? job.status
			: "scheduled";
	return {
		artifactTarget: job.artifactTarget,
		enabled: !job.paused,
		id: job.id,
		lastError: job.lastError,
		lastRunAt: job.lastRunAt,
		linkedThreadId: job.linkedThreadId,
		name: job.name,
		nextRunAt: job.nextRunAt,
		notes: job.description ?? "",
		postResultToThread: job.postResultToThread,
		schedule: job.schedule ?? "manual",
		status,
		surface: "rovo",
		target:
			typeof job.raw.prompt === "string" && job.raw.prompt.trim()
				? job.raw.prompt
				: typeof job.raw.target === "string" && job.raw.target.trim()
					? job.raw.target
					: "No target configured",
		updatedAt:
			typeof job.raw.updatedAt === "string" && job.raw.updatedAt.trim()
				? job.raw.updatedAt
				: typeof job.raw.updated_at === "string" && job.raw.updated_at.trim()
					? job.raw.updated_at
				: new Date().toISOString(),
	};
}

function toHermesJobPayload(job: ControlPlaneJob): Record<string, unknown> {
	return {
		artifactTarget: job.artifactTarget?.trim() || null,
		linkedThreadId: job.linkedThreadId?.trim() || null,
		name: job.name.trim() || "Untitled job",
		postResultToThread: Boolean(job.postResultToThread),
		prompt: job.target.trim() || "",
		schedule: job.schedule.trim() || "manual",
		deliver: "local",
		surface: job.surface ?? "rovo",
	};
}

function getJobStatusTone(status: ControlPlaneJob["status"]): "neutral" | "success" | "warning" | "danger" {
	switch (status) {
		case "running":
			return "warning";
		case "paused":
			return "neutral";
		case "failed":
			return "danger";
		default:
			return "success";
	}
}

function formatJobDate(value: string | null | undefined): string {
	return formatControlPlaneDateTime(value);
}

export function JobsSurfacePage() {
	const [jobs, setJobs] = useState<ControlPlaneJob[]>([]);
	const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
	const [draft, setDraft] = useState<ControlPlaneJob>(createBlankJob);
	const [isCreatingNew, setIsCreatingNew] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isMutating, setIsMutating] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const sortedJobs = useMemo(() => sortByUpdatedAtDesc(jobs), [jobs]);
	const selectedJob = useMemo(
		() => jobs.find((job) => job.id === selectedJobId) ?? null,
		[jobs, selectedJobId],
	);
	const summary = useMemo(() => summarizeJobs(sortedJobs), [sortedJobs]);
	const usage = useMemo(() => {
		const activeJobs = summary.running + summary.scheduled;
		const totalJobs = Math.max(summary.total, 1);
		return Math.round((activeJobs / totalJobs) * 100);
	}, [summary]);
	const refreshJobs = useCallback(async () => {
		const liveJobs = await fetchJobs();
		const mappedJobs = liveJobs.map(toControlPlaneJob);
		setJobs(mappedJobs);
		setSelectedJobId((current) => current ?? mappedJobs[0]?.id ?? null);
		setErrorMessage(null);
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function loadJobs() {
			setIsLoading(true);
			try {
				const liveJobs = await fetchJobs();
				if (cancelled) {
					return;
				}
				const mappedJobs = liveJobs.map(toControlPlaneJob);
				setJobs(mappedJobs);
				setSelectedJobId((current) => current ?? mappedJobs[0]?.id ?? null);
				setDraft(mappedJobs[0] ? { ...mappedJobs[0] } : createBlankJob());
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

		void loadJobs();

		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!selectedJob && sortedJobs.length > 0 && !isCreatingNew) {
			setSelectedJobId(sortedJobs[0]?.id ?? null);
			setDraft(sortedJobs[0] ? { ...sortedJobs[0] } : createBlankJob());
			return;
		}

		if (
			selectedJob
			&& !isCreatingNew
			&& (
				draft.id !== selectedJob.id
				|| draft.updatedAt !== selectedJob.updatedAt
			)
		) {
			setDraft({ ...selectedJob });
		}
	}, [draft.id, draft.updatedAt, isCreatingNew, selectedJob, sortedJobs]);

	const pollJobUntilSettled = useCallback(async (jobId: string) => {
		for (let attempt = 0; attempt < 10; attempt += 1) {
			await new Promise((resolve) => {
				window.setTimeout(resolve, 1000);
			});
			try {
				const liveJobs = await fetchJobs();
				const mappedJobs = liveJobs.map(toControlPlaneJob);
				setJobs(mappedJobs);
				setErrorMessage(null);
				const refreshedJob = mappedJobs.find((job) => job.id === jobId);
				if (!refreshedJob || refreshedJob.status !== "running") {
					break;
				}
			} catch (error) {
				setErrorMessage(error instanceof Error ? error.message : String(error));
				break;
			}
		}
	}, []);

	function handleSelectJob(job: ControlPlaneJob) {
		setSelectedJobId(job.id);
		setIsCreatingNew(false);
		setDraft({ ...job });
	}

	function handleCreateJob() {
		const nextJob = createBlankJob();
		setSelectedJobId(nextJob.id);
		setIsCreatingNew(true);
		setDraft(nextJob);
	}

	async function handleSaveJob() {
		setIsMutating(true);
		try {
			const savedJob = isCreatingNew
				? await createJob(toHermesJobPayload(draft))
				: await updateJob(draft.id, toHermesJobPayload(draft));
			const mappedJob = toControlPlaneJob(savedJob);
			setJobs((current) => {
				const exists = current.some((job) => job.id === mappedJob.id);
				return sortByUpdatedAtDesc(
					exists
						? current.map((job) => (job.id === mappedJob.id ? mappedJob : job))
						: [mappedJob, ...current],
				);
			});
			setSelectedJobId(mappedJob.id);
			setDraft(mappedJob);
			setIsCreatingNew(false);
			setErrorMessage(null);
			void refreshJobs();
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsMutating(false);
		}
	}

	async function handleRunNow(jobId: string) {
		setIsMutating(true);
		try {
			const nextJob = toControlPlaneJob(await runJobAction(jobId, "run"));
			setJobs((current) =>
				sortByUpdatedAtDesc(current.map((job) => (job.id === nextJob.id ? nextJob : job))),
			);
			if (selectedJobId === nextJob.id) {
				setDraft(nextJob);
			}
			setErrorMessage(null);
			void pollJobUntilSettled(jobId);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsMutating(false);
		}
	}

	async function handleTogglePause(job: ControlPlaneJob) {
		setIsMutating(true);
		try {
			const nextJob = toControlPlaneJob(
				await runJobAction(job.id, job.status === "paused" ? "resume" : "pause"),
			);
			setJobs((current) =>
				sortByUpdatedAtDesc(current.map((item) => (item.id === nextJob.id ? nextJob : item))),
			);
			if (selectedJobId === nextJob.id) {
				setDraft(nextJob);
			}
			setErrorMessage(null);
			void refreshJobs();
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsMutating(false);
		}
	}

	async function handleDeleteJob(jobId: string) {
		setIsMutating(true);
		try {
			await deleteJob(jobId);
			const remainingJobs = sortedJobs.filter((job) => job.id !== jobId);
			setJobs((current) => current.filter((job) => job.id !== jobId));
			if (selectedJobId === jobId) {
				setSelectedJobId(remainingJobs[0]?.id ?? null);
				setIsCreatingNew(false);
				setDraft(remainingJobs[0] ? { ...remainingJobs[0] } : createBlankJob());
			}
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsMutating(false);
		}
	}

	const selectedCount = sortedJobs.filter((job) => job.id === selectedJobId).length;

	return (
		<ControlPlanePageShell
			description="Manage Hermes-backed jobs and scheduled work through the local VPK backend."
			title="Jobs"
			showHeader={false}
			actions={
				<Button variant="outline" onClick={handleCreateJob}>
					New job
				</Button>
			}
		>
			<div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
				<div className="space-y-4">
					{errorMessage ? (
						<Card>
							<CardContent className="pt-4 text-sm text-text-danger">
								{errorMessage}
							</CardContent>
						</Card>
					) : null}

					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Active work</CardDescription>
								<CardTitle>{summary.running + summary.scheduled}</CardTitle>
							</CardHeader>
							<CardContent>
								<Progress value={usage} />
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Paused</CardDescription>
								<CardTitle>{summary.paused}</CardTitle>
							</CardHeader>
							<CardContent className="text-sm text-text-subtle">
								Paused jobs remain defined but do not execute.
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Failures</CardDescription>
								<CardTitle>{summary.failed}</CardTitle>
							</CardHeader>
							<CardContent className="text-sm text-text-subtle">
								Last error messages are preserved from Hermes job responses.
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Selected</CardDescription>
								<CardTitle>{selectedCount}</CardTitle>
							</CardHeader>
							<CardContent className="text-sm text-text-subtle">
								{selectedJob ? selectedJob.name : "Pick a job to edit."}
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Job queue</CardTitle>
							<CardDescription>Run now, pause, or inspect the live Hermes job list.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{isLoading ? (
								<div className="rounded-xl border border-border bg-surface-raised px-3 py-8 text-center text-sm text-text-subtle">
									Loading Hermes jobs...
								</div>
							) : sortedJobs.length === 0 ? (
								<div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-sm text-text-subtle">
									No jobs are configured yet.
								</div>
							) : (
								sortedJobs.map((job) => {
									const isActive = job.id === selectedJobId;

									return (
										<div
											key={job.id}
											onClick={() => handleSelectJob(job)}
											className={`w-full cursor-pointer rounded-xl border px-3 py-3 text-left transition-colors ${isActive ? "border-border-selected bg-bg-selected" : "border-border bg-surface-raised hover:bg-bg-neutral-subtle-hovered"}`}
										>
											<div className="flex flex-wrap items-center justify-between gap-2">
												<div className="min-w-0">
													<div className="truncate text-sm font-medium">{job.name}</div>
													<div className="truncate text-xs text-text-subtlest">{job.target}</div>
												</div>
												<div className="flex items-center gap-2">
													<Lozenge variant={getJobStatusTone(job.status)}>{job.status}</Lozenge>
													<Badge variant={job.enabled ? "success" : "neutral"}>{job.enabled ? "enabled" : "disabled"}</Badge>
												</div>
											</div>
											<div className="mt-3 grid gap-2 text-xs text-text-subtle sm:grid-cols-3">
												<span>Schedule: {job.schedule}</span>
												<span>Last run: {formatJobDate(job.lastRunAt)}</span>
												<span>Next run: {formatJobDate(job.nextRunAt)}</span>
											</div>
											<div className="mt-3 flex flex-wrap items-center gap-2">
												<Button
													size="sm"
													variant="outline"
													onClick={(event) => {
														event.stopPropagation();
														void handleRunNow(job.id);
													}}
													disabled={isMutating}
												>
													Run now
												</Button>
												<Button
													size="sm"
													variant="ghost"
													onClick={(event) => {
														event.stopPropagation();
														void handleTogglePause(job);
													}}
													disabled={isMutating}
												>
													{job.status === "paused" ? "Resume" : "Pause"}
												</Button>
												<Button
													size="sm"
													variant="ghost"
													onClick={(event) => {
														event.stopPropagation();
														void handleDeleteJob(job.id);
													}}
													disabled={isMutating}
												>
													Delete
												</Button>
											</div>
										</div>
									);
								})
							)}
						</CardContent>
					</Card>
				</div>

				<Card className="h-fit">
					<CardHeader>
						<div className="flex items-center justify-between gap-3">
							<div>
								<CardTitle>{isCreatingNew ? "Create job" : "Edit job"}</CardTitle>
								<CardDescription>
									Save the definition directly through the Hermes-backed routes.
								</CardDescription>
							</div>
							<Button variant="outline" onClick={() => void handleSaveJob()} disabled={isMutating}>
								Save job
							</Button>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4">
							<div className="space-y-1.5">
								<div className="text-sm font-medium">Name</div>
								<Input
									value={draft.name}
									onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
								/>
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-1.5">
									<div className="text-sm font-medium">Schedule</div>
									<Input
										value={draft.schedule}
										onChange={(event) => setDraft((current) => ({ ...current, schedule: event.target.value }))}
									/>
								</div>
								<div className="space-y-1.5">
									<div className="text-sm font-medium">Surface</div>
									<Input
										value={draft.surface ?? "rovo"}
										onChange={(event) =>
											setDraft((current) => ({
												...current,
												surface: event.target.value as ControlPlaneJob["surface"],
											}))
										}
									/>
								</div>
							</div>
							<div className="space-y-1.5">
								<div className="text-sm font-medium">Target</div>
								<Textarea
									value={draft.target}
									onChange={(event) => setDraft((current) => ({ ...current, target: event.target.value }))}
								/>
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-1.5">
									<div className="text-sm font-medium">Linked thread</div>
									<Input
										value={draft.linkedThreadId ?? ""}
										onChange={(event) =>
											setDraft((current) => ({ ...current, linkedThreadId: event.target.value }))
										}
									/>
								</div>
								<div className="space-y-1.5">
									<div className="text-sm font-medium">Artifact target</div>
									<Input
										value={draft.artifactTarget ?? ""}
										onChange={(event) =>
											setDraft((current) => ({ ...current, artifactTarget: event.target.value }))
										}
									/>
								</div>
							</div>
							<div className="space-y-1.5">
								<div className="text-sm font-medium">Notes</div>
								<Textarea
									value={draft.notes ?? ""}
									onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
								/>
							</div>
						</div>

						<Separator />

						<div className="grid gap-3 sm:grid-cols-2">
							<label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm">
								<span>Enabled</span>
								<input
									checked={draft.enabled}
									onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.checked }))}
									type="checkbox"
								/>
							</label>
							<label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm">
								<span>Post result to thread</span>
								<input
									checked={Boolean(draft.postResultToThread)}
									onChange={(event) =>
										setDraft((current) => ({ ...current, postResultToThread: event.target.checked }))
									}
									type="checkbox"
								/>
							</label>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<div className="rounded-lg border border-border bg-surface-raised px-3 py-2">
								<div className="text-xs uppercase tracking-wide text-text-subtlest">Last run</div>
								<div className="text-sm">{formatControlPlaneDateTime(draft.lastRunAt)}</div>
							</div>
							<div className="rounded-lg border border-border bg-surface-raised px-3 py-2">
								<div className="text-xs uppercase tracking-wide text-text-subtlest">Next run</div>
								<div className="text-sm">{formatControlPlaneDateTime(draft.nextRunAt)}</div>
							</div>
						</div>

						{draft.lastError ? (
							<div className="rounded-lg border border-border-danger bg-bg-danger-subtler px-3 py-2 text-sm text-text-danger-bolder">
								{draft.lastError}
							</div>
						) : null}
					</CardContent>
				</Card>
			</div>
		</ControlPlanePageShell>
	);
}
