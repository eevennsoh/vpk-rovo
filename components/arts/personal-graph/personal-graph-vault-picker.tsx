"use client";

import { useCallback } from "react";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import { Button } from "@/components/ui/button";
import { useVaultSettings } from "./hooks/use-vault-settings";

interface PersonalGraphVaultPickerProps {
	onVaultChanged: () => void;
}

function getFolderName(pathname: string | null) {
	if (!pathname) {
		return "No vault";
	}

	const segments = pathname.split("/").filter(Boolean);
	return segments.at(-1) ?? pathname;
}

export function PersonalGraphVaultPicker({
	onVaultChanged,
}: Readonly<PersonalGraphVaultPickerProps>) {
	const { error, isLoading, isSelecting, selectFolder, settings } = useVaultSettings();
	const folderName = getFolderName(settings?.root ?? null);
	const statusTitle = settings?.root
		? `${settings.root}${settings.source === "env" ? " (from env fallback)" : ""}`
		: settings?.message ?? "Choose a Personal Graph vault folder";

	const handleChooseVault = useCallback(async () => {
		const nextSettings = await selectFolder();
		if (nextSettings?.status === "ready") {
			onVaultChanged();
		}
	}, [onVaultChanged, selectFolder]);

	return (
		<div className="flex min-w-0 items-center gap-2">
			<p
				className="hidden max-w-[180px] truncate text-xs text-neutral-600 lg:block"
				title={statusTitle}
			>
				{error ? error.message : folderName}
			</p>
			<Button
				aria-label="Choose Personal Graph vault folder"
				disabled={isSelecting}
				isLoading={isSelecting}
				onClick={handleChooseVault}
				className="h-10 rounded-full border-neutral-950 bg-neutral-950 px-4 text-sm font-medium text-white shadow-none hover:bg-neutral-800 disabled:border-neutral-950/5 disabled:bg-white/10 disabled:text-neutral-400"
				size="sm"
				variant="outline"
			>
				<span className="hidden sm:inline">{isLoading ? "Vault" : "Choose vault"}</span>
				{isSelecting ? null : <ChevronDownIcon label="" />}
			</Button>
		</div>
	);
}
