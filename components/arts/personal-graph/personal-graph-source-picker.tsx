"use client";

import { Button } from "@/components/ui/button";
import { Shimmer } from "@/components/ui-custom/shimmer";
import { TWGLoader } from "@/components/ui-custom/twg-loader";
import { useState } from "react";
import { PixelVaultIcon } from "./personal-graph-pixel-icons";

const TWG_LABEL = "Connect Team Work Graph";

// TWG dot palette (blue -> purple -> orange) reused as the hover shimmer sweep.
const TWG_SHIMMER_GRADIENT = ["#1868db", "#bf63f3", "#fca700"] as const;

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
	const [isTwgHovered, setIsTwgHovered] = useState(false);
	const showTwgShimmer = isTwgHovered && !isBusy;

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
				aria-label={TWG_LABEL}
				className="rounded-full border-border bg-bg-neutral-subtle px-4 text-text shadow-none hover:bg-bg-neutral-subtle-hovered disabled:border-transparent disabled:bg-bg-disabled disabled:text-text-disabled"
				disabled={isBusy}
				isLoading={isBusy}
				onClick={onPickTwg}
				onMouseEnter={() => setIsTwgHovered(true)}
				onMouseLeave={() => setIsTwgHovered(false)}
				size="sm"
				variant="outline"
			>
				<TWGLoader
					className="shrink-0"
					label=""
					size="small"
				/>
				{showTwgShimmer ? (
					<Shimmer
						as="span"
						baseColor="var(--color-text)"
						baseGradientColor={TWG_SHIMMER_GRADIENT}
						duration={1.4}
						rotateYDistance={0}
						scaleDistance={1}
						spread={2}
						transition={{ ease: "easeInOut", repeatDelay: 0.1 }}
						wave
						xDistance={0}
						yDistance={0}
						zDistance={0}
					>
						{TWG_LABEL}
					</Shimmer>
				) : (
					<span>{TWG_LABEL}</span>
				)}
			</Button>
		</div>
	);
}
