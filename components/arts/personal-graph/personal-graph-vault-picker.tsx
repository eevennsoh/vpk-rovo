"use client";

import { useCallback } from "react";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import { Button } from "@/components/ui/button";
import { useVaultSettings } from "./hooks/use-vault-settings";

interface PersonalGraphVaultPickerProps {
	onVaultChanged: () => void;
}

export function PersonalGraphVaultPicker({
	onVaultChanged,
}: Readonly<PersonalGraphVaultPickerProps>) {
	const { isLoading, isSelecting, selectFolder } = useVaultSettings();

	const handleChooseVault = useCallback(async () => {
		const nextSettings = await selectFolder();
		if (nextSettings?.status === "ready") {
			onVaultChanged();
		}
	}, [onVaultChanged, selectFolder]);

	return (
		<div className="flex min-w-0 items-center gap-2">
			<Button
				aria-label="Choose Personal Graph vault folder"
				disabled={isSelecting}
				isLoading={isSelecting}
				onClick={handleChooseVault}
				className="h-10 rounded-full border-transparent bg-bg-neutral-bold px-4 text-sm font-medium text-text-inverse shadow-none hover:bg-bg-neutral-bold-hovered disabled:border-transparent disabled:bg-bg-disabled disabled:text-text-disabled"
				size="sm"
				variant="outline"
			>
				<span className="hidden sm:inline">{isLoading ? "Vault" : "Choose vault"}</span>
				{isSelecting ? null : <ChevronDownIcon label="" />}
			</Button>
		</div>
	);
}
