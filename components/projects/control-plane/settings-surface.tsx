"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lozenge } from "@/components/ui/lozenge";
import { Switch } from "@/components/ui/switch";
import type {
	HermesJob,
	RuntimeHealth,
	RuntimeStatusSnapshot,
	WikiStatus,
} from "@/lib/rovo-runtime-types";

import {
	fetchJobs,
	fetchRuntimeStatusSnapshot,
	fetchWikiStatus,
	runJobAction,
} from "./lib/control-plane-api";
import {
	INITIAL_CONTROL_PLANE_SETTINGS,
	type ControlPlaneProviderRoutes,
	type ControlPlaneSettingsState,
} from "./lib/control-plane-data";
import { formatControlPlaneDateTime } from "./lib/control-plane-utils";
import { ControlPlanePageShell } from "./control-plane-page-shell";
import { usePersistentState } from "./lib/use-persistent-state";

const SETTINGS_STORAGE_KEY = "vpk-control-plane-settings";
const DEFAULT_SETTINGS_STATE = createSettingsState();
const WIKI_JOB_NAMES = ["wiki-nightly-ingest", "wiki-memory-sync", "wiki-digest-regen"] as const;
const WIKI_JOB_METADATA: Record<(typeof WIKI_JOB_NAMES)[number], { description: string; label: string }> = {
	"wiki-nightly-ingest": {
		description: "Turns queued raw captures into canonical wiki pages and updates the index.",
		label: "Nightly ingest",
	},
	"wiki-memory-sync": {
		description: "Processes queued durable-memory proposals and refreshes compiled context artifacts.",
		label: "Memory sync",
	},
	"wiki-digest-regen": {
		description: "Rebuilds the compiled wiki-backed memory context from canonical pages.",
		label: "Context regeneration",
	},
};

const PROVIDER_OPTIONS: Record<keyof ControlPlaneProviderRoutes, readonly string[]> = {
	browser: ["browser-extraction", "local-browser", "ai-gateway"],
	chat: ["rovodev-serve", "ai-gateway", "local-model"],
	jobs: ["embedded-hermes", "remote-hermes", "manual"],
	summarization: ["ai-gateway", "local-summary", "manual"],
	vision: ["ai-gateway", "browser-capture", "local-vision"],
	voice: ["local-realtime", "ai-gateway", "manual"],
};

function createSettingsState(): ControlPlaneSettingsState {
	return {
		...INITIAL_CONTROL_PLANE_SETTINGS,
		providerRoutes: { ...INITIAL_CONTROL_PLANE_SETTINGS.providerRoutes },
	};
}

function formatSurfaceHealth(health: RuntimeHealth): "neutral" | "danger" | "success" | "warning" {
	switch (health) {
		case "ok":
			return "success";
		case "degraded":
			return "warning";
		default:
			return "danger";
	}
}

function formatJobTone(status: HermesJob["status"]): "neutral" | "danger" | "success" | "warning" {
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

function formatCountLabel(count: number, singular: string, plural: string): string {
	return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

function formatStatusValue(value: string | null | undefined, fallback: string): string {
	return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

export function SettingsSurfacePage() {
	const router = useRouter();
	const [settings, setSettings] = usePersistentState(
		SETTINGS_STORAGE_KEY,
		DEFAULT_SETTINGS_STATE,
	);
	const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatusSnapshot | null>(null);
	const [jobs, setJobs] = useState<HermesJob[]>([]);
	const [wikiStatus, setWikiStatus] = useState<WikiStatus | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [jobActionKey, setJobActionKey] = useState<string | null>(null);

	const runtimeCards = useMemo(() => {
		if (!runtimeStatus) {
			return [
				{
					detail: "Runtime status has not loaded yet.",
					label: "RovoDev",
					tone: "warning" as const,
					value: "loading",
				},
				{
					detail: "Runtime status has not loaded yet.",
					label: "Hermes",
					tone: "warning" as const,
					value: "loading",
				},
			];
		}

		return [
			{
				detail: runtimeStatus.surfaces.rovodev.message ?? "No status message.",
				label: "RovoDev",
				tone: formatSurfaceHealth(runtimeStatus.surfaces.rovodev.health),
				value: runtimeStatus.surfaces.rovodev.status,
			},
			{
				detail: runtimeStatus.surfaces.hermes.message ?? "No status message.",
				label: "Hermes",
				tone: formatSurfaceHealth(runtimeStatus.surfaces.hermes.health),
				value: runtimeStatus.surfaces.hermes.status,
			},
		];
	}, [runtimeStatus]);

	const wikiJobs = useMemo(() => {
		return WIKI_JOB_NAMES.map((jobName) => ({
			job: jobs.find((candidate) => candidate.name === jobName) ?? null,
			name: jobName,
			...WIKI_JOB_METADATA[jobName],
		}));
	}, [jobs]);

	const memorySummary = useMemo(() => {
		if (!wikiStatus?.compiledContexts) {
			return [];
		}

		return [
			{
				description: "User preferences and identity compiled from `profiles/self.md`.",
				document: wikiStatus.compiledContexts.profile,
				label: "Profile context",
			},
			{
				description: "Work memory compiled from `work/context.md`.",
				document: wikiStatus.compiledContexts.work,
				label: "Work context",
			},
		];
	}, [wikiStatus]);

	function updateRoute(surface: keyof ControlPlaneProviderRoutes, value: string) {
		setSettings((current) => ({
			...current,
			providerRoutes: {
				...current.providerRoutes,
				[surface]: value,
			},
		}));
	}

	async function refreshJobsOnly() {
		const nextJobs = await fetchJobs();
		setJobs(nextJobs);
	}

	async function refreshSurfaceData() {
		setIsRefreshing(true);
		try {
			const [runtimeResult, jobsResult, wikiResult] = await Promise.allSettled([
				fetchRuntimeStatusSnapshot(),
				fetchJobs(),
				fetchWikiStatus(),
			]);
			const errors: string[] = [];

			if (runtimeResult.status === "fulfilled") {
				setRuntimeStatus(runtimeResult.value);
			} else {
				errors.push(runtimeResult.reason instanceof Error ? runtimeResult.reason.message : String(runtimeResult.reason));
			}

			if (jobsResult.status === "fulfilled") {
				setJobs(jobsResult.value);
			} else {
				errors.push(jobsResult.reason instanceof Error ? jobsResult.reason.message : String(jobsResult.reason));
			}

			if (wikiResult.status === "fulfilled") {
				setWikiStatus(wikiResult.value);
			} else {
				errors.push(wikiResult.reason instanceof Error ? wikiResult.reason.message : String(wikiResult.reason));
			}

			setErrorMessage(errors.length > 0 ? errors.join(" ") : null);
		} finally {
			setIsRefreshing(false);
		}
	}

	async function handleJobAction(jobId: string, action: "pause" | "resume" | "run") {
		const actionKey = `${jobId}:${action}`;
		setJobActionKey(actionKey);
		try {
			await runJobAction(jobId, action);
			await refreshJobsOnly();
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setJobActionKey(null);
		}
	}

	useEffect(() => {
		void refreshSurfaceData();
	}, []);

	return (
		<ControlPlanePageShell
			description="Tune provider routing, inspect Hermes runtime reachability, and manage the live wiki mirror from one surface."
			title="Settings"
			actions={
				<div className="flex items-center gap-2">
					<Badge variant="neutral">
						{wikiStatus?.proposalCounts?.queued ?? 0} queued proposals
					</Badge>
					<Button variant="outline" isLoading={isRefreshing} onClick={() => void refreshSurfaceData()}>
						Refresh status
					</Button>
				</div>
			}
		>
			<div className="grid gap-4 xl:grid-cols-[1.04fr_0.96fr]">
				<div className="space-y-4">
					{errorMessage ? (
						<Card>
							<CardContent className="pt-4 text-sm text-text-danger">
								{errorMessage}
							</CardContent>
						</Card>
					) : null}

					<div className="grid gap-3 md:grid-cols-2">
						{runtimeCards.map((card) => (
							<Card key={card.label}>
								<CardHeader className="pb-2">
									<CardDescription>{card.label}</CardDescription>
									<CardTitle className="flex items-center gap-2">
										{card.value}
										<Lozenge variant={card.tone}>{card.value}</Lozenge>
									</CardTitle>
								</CardHeader>
								<CardContent className="text-sm text-text-subtle">
									{card.detail}
								</CardContent>
							</Card>
						))}
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Provider routing</CardTitle>
							<CardDescription>
								Choose the default runtime for each workload family. Jobs run through the shared
								RovoDev executor, with Hermes providing the backing capabilities.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{(Object.keys(PROVIDER_OPTIONS) as Array<keyof ControlPlaneProviderRoutes>).map((surface) => (
								<div key={surface} className="space-y-2">
									<div className="flex items-center justify-between gap-3">
										<div className="text-sm font-medium capitalize">{surface}</div>
										<Badge variant="neutral">{settings.providerRoutes[surface]}</Badge>
									</div>
									<div className="flex flex-wrap gap-2">
										{PROVIDER_OPTIONS[surface].map((option) => (
											<Button
												key={option}
												size="sm"
												variant={settings.providerRoutes[surface] === option ? "default" : "outline"}
												onClick={() => updateRoute(surface, option)}
											>
												{option}
											</Button>
										))}
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Runtime options</CardTitle>
							<CardDescription>These flags remain local while the control plane grows.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm">
								<span>Advanced automation</span>
								<Switch
									checked={settings.advancedAutomation}
									onCheckedChange={(checked) => setSettings((current) => ({ ...current, advancedAutomation: checked }))}
								/>
							</label>
							<label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm">
								<span>Runtime mirroring</span>
								<Switch
									checked={settings.runtimeMirroring}
									onCheckedChange={(checked) => setSettings((current) => ({ ...current, runtimeMirroring: checked }))}
								/>
							</label>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-4">
					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between gap-3">
								<div className="space-y-1">
									<CardTitle>Compiled memory</CardTitle>
									<CardDescription>Wiki-backed memory compiled for Hermes prompt injection.</CardDescription>
								</div>
								<Lozenge variant={wikiStatus?.hasCompiledContextArtifacts ? "success" : "warning"}>
									{wikiStatus?.hasCompiledContextArtifacts ? "Compiled" : "Missing"}
								</Lozenge>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{memorySummary.length === 0 ? (
								<div className="rounded-xl border border-border bg-surface-raised px-3 py-4 text-sm text-text-subtle">
									Loading compiled memory state...
								</div>
							) : (
								memorySummary.map(({ document, label, description }) => (
									<div key={label} className="rounded-xl border border-border bg-surface-raised px-3 py-3">
										<div className="flex items-center justify-between gap-3">
											<div>
												<div className="text-sm font-medium">{label}</div>
												<div className="text-sm text-text-subtle">{description}</div>
											</div>
											<Badge variant="neutral">
												{document?.exists ? "ready" : "missing"}
											</Badge>
										</div>
										<div className="mt-3 grid gap-2 sm:grid-cols-2">
											<div className="rounded-lg border border-border bg-background px-3 py-2">
												<div className="text-xs uppercase tracking-wide text-text-subtle">Size</div>
												<div className="mt-1 text-sm font-medium">{(document?.charCount ?? 0).toLocaleString()} chars</div>
											</div>
											<div className="rounded-lg border border-border bg-background px-3 py-2">
												<div className="text-xs uppercase tracking-wide text-text-subtle">Updated</div>
												<div className="mt-1 text-sm font-medium">
													{formatControlPlaneDateTime(document?.updatedAt)}
												</div>
											</div>
										</div>
									</div>
								))
							)}

							<Button variant="outline" onClick={() => router.push("/rovo-app/memories")}>
								Open memories
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle>Wiki mirror</CardTitle>
							<CardDescription>
								Operational snapshot of the generated wiki rooted at <span className="font-mono text-xs">{wikiStatus?.wikiDir || "/Users/esoh/llm-wiki"}</span>.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="rounded-xl border border-border bg-surface-raised px-3 py-3">
								<div className="text-xs uppercase tracking-wide text-text-subtle">Wiki root</div>
								<div className="mt-1 break-all font-mono text-sm">
									{wikiStatus?.wikiDir || "/Users/esoh/llm-wiki"}
								</div>
							</div>

							<div className="grid gap-3 sm:grid-cols-2">
								<div className="rounded-xl border border-border bg-surface-raised px-3 py-3">
									<div className="flex items-center justify-between gap-2">
										<div className="text-sm font-medium">Canonical pages</div>
										<Badge variant="neutral">
											{wikiStatus ? formatCountLabel(wikiStatus.totalCanonicalPages, "page", "pages") : "Loading"}
										</Badge>
									</div>
									<div className="mt-3 space-y-2 text-sm text-text-subtle">
										{Object.entries(wikiStatus?.canonicalCounts ?? {}).map(([section, count]) => (
											<div key={section} className="flex items-center justify-between gap-2">
												<span className="capitalize">{section}</span>
												<span>{count.toLocaleString()}</span>
											</div>
										))}
									</div>
								</div>

								<div className="rounded-xl border border-border bg-surface-raised px-3 py-3">
									<div className="flex items-center justify-between gap-2">
										<div className="text-sm font-medium">Raw captures</div>
										<Badge variant="neutral">
											{wikiStatus ? formatCountLabel(wikiStatus.totalRawCaptures, "capture", "captures") : "Loading"}
										</Badge>
									</div>
									<div className="mt-3 space-y-2 text-sm text-text-subtle">
										{Object.entries(wikiStatus?.rawCounts ?? {}).map(([section, count]) => (
											<div key={section} className="flex items-center justify-between gap-2">
												<span className="capitalize">{section}</span>
												<span>{count.toLocaleString()}</span>
											</div>
										))}
									</div>
								</div>
							</div>

							<div className="rounded-xl border border-border bg-surface-raised px-3 py-3">
								<div className="text-sm font-medium">Key files</div>
								<div className="mt-3 space-y-2 text-sm text-text-subtle">
									{[
										["SCHEMA.md", wikiStatus?.files.schema.updatedAt, wikiStatus?.files.schema.exists],
										["index.md", wikiStatus?.files.index.updatedAt, wikiStatus?.files.index.exists],
										["log.md", wikiStatus?.files.log.updatedAt, wikiStatus?.files.log.exists],
									].map(([label, updatedAt, exists]) => (
										<div key={String(label)} className="flex items-center justify-between gap-3">
											<span>{label}</span>
											<span className="text-right">
												{exists ? formatControlPlaneDateTime(String(updatedAt)) : "Missing"}
											</span>
										</div>
									))}
								</div>
							</div>

						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between gap-3">
								<div className="space-y-1">
									<CardTitle>Wiki jobs</CardTitle>
									<CardDescription>
										Provisioned Hermes jobs that keep canonical wiki memory and compiled context artifacts in sync.
									</CardDescription>
								</div>
								<Badge variant="neutral">
									{formatCountLabel(wikiJobs.filter(({ job }) => job !== null).length, "job", "jobs")}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{wikiJobs.map(({ job, label, description, name }) => (
								<div key={name} className="rounded-xl border border-border bg-surface-raised px-3 py-3">
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div className="space-y-1">
											<div className="flex items-center gap-2">
												<div className="text-sm font-medium">{label}</div>
												<Lozenge variant={job ? formatJobTone(job.status) : "danger"}>
													{job ? formatStatusValue(job.status, "scheduled") : "missing"}
												</Lozenge>
											</div>
											<div className="text-sm text-text-subtle">{description}</div>
										</div>

										{job ? (
											<div className="flex items-center gap-2">
												<Button
													size="xs"
													variant="outline"
													isLoading={jobActionKey === `${job.id}:run`}
													onClick={() => void handleJobAction(job.id, "run")}
												>
													Run now
												</Button>
												<Button
													size="xs"
													variant="outline"
													isLoading={jobActionKey === `${job.id}:${job.status === "paused" ? "resume" : "pause"}`}
													onClick={() => void handleJobAction(job.id, job.status === "paused" ? "resume" : "pause")}
												>
													{job.status === "paused" ? "Resume" : "Pause"}
												</Button>
											</div>
										) : null}
									</div>

									<div className="mt-3 grid gap-2 sm:grid-cols-2">
										<div className="rounded-lg border border-border bg-background px-3 py-2">
											<div className="text-xs uppercase tracking-wide text-text-subtle">Schedule</div>
											<div className="mt-1 text-sm font-medium">
												{job?.schedule?.trim() ? job.schedule : "Not configured"}
											</div>
										</div>
										<div className="rounded-lg border border-border bg-background px-3 py-2">
											<div className="text-xs uppercase tracking-wide text-text-subtle">Last run</div>
											<div className="mt-1 text-sm font-medium">
												{job ? formatControlPlaneDateTime(job.lastRunAt) : "Not provisioned"}
											</div>
										</div>
									</div>
								</div>
							))}

							<Button variant="outline" onClick={() => router.push("/rovo-app/jobs")}>
								Open jobs
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</ControlPlanePageShell>
	);
}
