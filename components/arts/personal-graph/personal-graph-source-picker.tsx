"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PixelVaultIcon } from "./personal-graph-pixel-icons";

interface PersonalGraphSourcePickerProps {
	isBusy?: boolean;
	onPickTwg: () => void;
	onPickVault: () => void;
}

export function PersonalGraphSourcePicker({
	isBusy = false,
	onPickTwg,
	onPickVault,
}: Readonly<PersonalGraphSourcePickerProps>) {
	return (
		<div className="flex flex-wrap items-center justify-center gap-2">
			<Button
				aria-label="Choose Personal Graph vault folder"
				className="rounded-full border-border bg-bg-neutral-subtle px-4 text-text shadow-none hover:bg-bg-neutral-subtle-hovered disabled:border-transparent disabled:bg-bg-disabled disabled:text-text-disabled [&_svg]:text-icon-subtle"
				disabled={isBusy}
				onClick={onPickVault}
				size="sm"
				variant="outline"
			>
				<PixelVaultIcon />
				Choose vault folder
			</Button>
			<Button
				aria-label="Connect Team Work Graph"
				className="rounded-full border-border bg-bg-neutral-subtle px-4 text-text shadow-none hover:bg-bg-neutral-subtle-hovered disabled:border-transparent disabled:bg-bg-disabled disabled:text-text-disabled"
				disabled={isBusy}
				isLoading={isBusy}
				onClick={onPickTwg}
				size="sm"
				variant="outline"
			>
				<Image
					alt=""
					aria-hidden
					className="size-4 shrink-0"
					data-icon="inline-start"
					height={16}
					src="/icons/twg.svg"
					width={16}
				/>
				Connect Team Work Graph
			</Button>
		</div>
	);
}
