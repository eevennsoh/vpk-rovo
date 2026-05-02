"use client";

import { useCallback } from "react";
import FolderClosedIcon from "@atlaskit/icon/core/folder-closed";
import { Button } from "@/components/ui/button";
import { useVaultSettings } from "./hooks/use-vault-settings";

interface PersonalGraphVaultPickerProps {
	onVaultChanged: () => void;
}

export function PersonalGraphVaultPicker({
	onVaultChanged,
}: Readonly<PersonalGraphVaultPickerProps>) {
	const { isSelecting, selectFolder } = useVaultSettings();

	const handleChooseVault = useCallback(async () => {
		const nextSettings = await selectFolder();
		if (nextSettings?.status === "ready") {
			onVaultChanged();
		}
	}, [onVaultChanged, selectFolder]);

	return (
		<Button
			aria-label="Choose Personal Graph vault folder"
			className="size-10 rounded-full border-border bg-bg-neutral-subtle text-text shadow-none hover:bg-bg-neutral-subtle-hovered disabled:border-transparent disabled:bg-bg-disabled disabled:text-text-disabled"
			disabled={isSelecting}
			isLoading={isSelecting}
			onClick={handleChooseVault}
			size="icon"
			variant="outline"
		>
			<FolderClosedIcon label="" />
		</Button>
	);
}
