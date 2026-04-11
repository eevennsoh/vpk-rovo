"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lozenge } from "@/components/ui/lozenge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { RuntimeHealth, RuntimeStatusSnapshot } from "@/lib/rovo-runtime-types";

import {
	INITIAL_CONTROL_PLANE_SETTINGS,
	type ControlPlaneProviderRoutes,
	type ControlPlaneSettingsState,
} from "./lib/control-plane-data";
import { fetchRuntimeStatusSnapshot } from "./lib/control-plane-api";
import { ControlPlanePageShell } from "./control-plane-page-shell";
import { usePersistentState } from "./lib/use-persistent-state";
import { UserProfileCard } from "./user-profile-card";

const SETTINGS_STORAGE_KEY = "vpk-control-plane-settings";
const DEFAULT_SETTINGS_STATE = createSettingsState();

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

export function SettingsSurfacePage() {
	const [settings, setSettings] = usePersistentState(
		SETTINGS_STORAGE_KEY,
		DEFAULT_SETTINGS_STATE,
	);
	const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatusSnapshot | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);

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

	function updateRoute(surface: keyof ControlPlaneProviderRoutes, value: string) {
		setSettings((current) => ({
			...current,
			providerRoutes: {
				...current.providerRoutes,
				[surface]: value,
			},
		}));
	}

	async function refreshRuntimeStatus() {
		setIsRefreshing(true);
		try {
			const snapshot = await fetchRuntimeStatusSnapshot();
			setRuntimeStatus(snapshot);
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsRefreshing(false);
		}
	}

	useEffect(() => {
		void refreshRuntimeStatus();
	}, []);

	return (
		<ControlPlanePageShell
			description="Tune provider routing, inspect runtime reachability, and model advanced automation settings locally."
			title="Settings"
			actions={
				<div className="flex items-center gap-2">
					<Badge variant="neutral">{settings.advancedAutomation ? "automation on" : "automation off"}</Badge>
					<Button variant="outline" isLoading={isRefreshing} onClick={() => void refreshRuntimeStatus()}>
						Refresh status
					</Button>
				</div>
			}
		>
			<div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
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
							<CardDescription>Choose the default runtime for each workload family. Jobs now run through the shared RovoDev executor, with Hermes providing the backing capabilities.</CardDescription>
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
				</div>

				<div className="space-y-4">
					<UserProfileCard />

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

					<Card>
						<CardHeader>
							<CardTitle>Integration surface</CardTitle>
							<CardDescription>Hooks, bootstrap automation, and research work are reserved for the next phase.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="rounded-xl border border-border bg-surface-raised px-3 py-2">
								<div className="text-sm font-medium">Hooks</div>
								<div className="text-sm text-text-subtle">User-facing hook and plugin settings will live in this surface.</div>
							</div>
							<div className="rounded-xl border border-border bg-surface-raised px-3 py-2">
								<div className="text-sm font-medium">Bootstrap automation</div>
								<div className="text-sm text-text-subtle">Track startup scripts and repo bootstrap helpers here.</div>
							</div>
							<div className="rounded-xl border border-border bg-surface-raised px-3 py-2">
								<div className="text-sm font-medium">Research workbench</div>
								<div className="text-sm text-text-subtle">Batch runs and trajectory export remain a next-phase surface.</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Runtime payload</CardTitle>
							<CardDescription>Snapshot of the current `/api/status` response for quick debugging.</CardDescription>
						</CardHeader>
						<CardContent>
							<pre className="overflow-auto rounded-xl border border-border bg-surface-raised p-3 text-xs text-text-subtle">
								{JSON.stringify(
									{
										runtimeStatus,
										settings,
									},
									null,
									2,
								)}
							</pre>
						</CardContent>
					</Card>

					<Separator />
				</div>
			</div>
		</ControlPlanePageShell>
	);
}
