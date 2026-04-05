import Link from "next/link";
import { fetchBackend } from "@/app/api/_utils/backend-url";
import type { AgentRun } from "@/lib/make-run-types";
import { RunWorkspace } from "@/components/projects/make/components/run-workspace";

interface RunResponse {
	run?: AgentRun;
	error?: string;
}

interface RunPageProps {
	params: Promise<{ runId: string }>;
}

function getStringValue(value: unknown): string | null {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseApiError(payload: unknown, fallbackMessage: string): string {
	if (!payload || typeof payload !== "object") {
		return fallbackMessage;
	}

	const record = payload as {
		error?: unknown;
		details?: unknown;
		message?: unknown;
	};

	return (
		getStringValue(record.error) ??
		getStringValue(record.details) ??
		getStringValue(record.message) ??
		fallbackMessage
	);
}

function parseFetchFailure(error: unknown, fallbackMessage: string): string {
	if (!(error instanceof Error) || !error.message.trim()) {
		return fallbackMessage;
	}

	const trimmedMessage = error.message.trim();
	if (trimmedMessage.toLowerCase().includes("fetch failed")) {
		return "Unable to reach the Make run service. Check that the frontend and backend dev servers are running.";
	}

	return trimmedMessage;
}

function resolveInitialNowMs(run: AgentRun): number | undefined {
	const updatedAtMs = Date.parse(run.updatedAt);
	if (Number.isFinite(updatedAtMs)) {
		return updatedAtMs;
	}

	const createdAtMs = Date.parse(run.createdAt);
	if (Number.isFinite(createdAtMs)) {
		return createdAtMs;
	}

	return undefined;
}

export const dynamic = "force-dynamic";

export default async function MakeRunPage({ params }: Readonly<RunPageProps>) {
	const { runId } = await params;
	const encodedRunId = encodeURIComponent(runId);

	let resolvedRun: AgentRun | null = null;
	let errorMessage: string | null = null;

	try {
		const response = (
			await fetchBackend(`/api/make/runs/${encodedRunId}`, {
				method: "GET",
				cache: "no-store",
			})
		).response;
		if (!response.ok) {
			const errorPayload = (await response.json().catch(() => null)) as unknown;
			errorMessage = parseApiError(errorPayload, "Failed to load run data.");
		} else {
			const payload = (await response.json()) as RunResponse;
			resolvedRun = payload.run ?? null;
		}
	} catch (error) {
		errorMessage = parseFetchFailure(error, "Failed to load run data.");
	}

	if (!resolvedRun) {
		return (
			<div className="mx-auto flex min-h-svh w-full max-w-[960px] flex-col gap-4 px-4 py-10">
				<div className="rounded-xl border border-border bg-surface p-6">
					<h1 className="text-lg font-semibold text-text">Run workspace unavailable</h1>
					<p className="mt-2 text-sm text-text-subtle">
						{errorMessage ?? "No run data found."}
					</p>
					<div className="mt-5">
							<Link
								href="/make/artifacts"
								className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm text-text hover:bg-bg-neutral-subtle-hovered"
							>
							Back to Make
						</Link>
					</div>
				</div>
			</div>
		);
	}

	const initialNowMs = resolveInitialNowMs(resolvedRun);

	return (
		<div className="bg-surface">
			<RunWorkspace
				runId={runId}
				initialRun={resolvedRun}
				initialNowMs={initialNowMs}
			/>
		</div>
	);
}
