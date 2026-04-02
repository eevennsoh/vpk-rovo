"use client";

import type { ComponentProps } from "react";

import Image from "next/image";

import { VisualIdentityTile } from "@/components/projects/shared/components/visual-identity-tile";
import type { ResolvedCardIdentity } from "@/components/projects/shared/lib/visual-identity";
import { Tile } from "@/components/ui/tile";
import { AtlassianLogo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

type CardIdentityTileSize = "small" | "medium" | "large";

interface CardIdentityTileProps
	extends Omit<ComponentProps<typeof Tile>, "children" | "label" | "size"> {
	identity: ResolvedCardIdentity;
	label: string;
	size?: CardIdentityTileSize;
	decorative?: boolean;
}

function renderLogoTileChild(
	identity: Extract<ResolvedCardIdentity, { kind: "external-logo" | "atlassian-logo" }>,
	label: string,
) {
	if (identity.kind === "external-logo") {
		return (
			<span className="inline-flex size-full items-center justify-center">
				<Image
					src={identity.logoSrc}
					alt={label}
					width={16}
					height={16}
					className="size-4 object-contain"
				/>
			</span>
		);
	}

	return (
		<span className="inline-flex size-full items-center justify-center">
			<AtlassianLogo
				name={identity.logoName}
				label={label}
				size="xxsmall"
			/>
		</span>
	);
}

export function CardIdentityTile({
	identity,
	label,
	size = "medium",
	decorative = false,
	className,
	...props
}: Readonly<CardIdentityTileProps>) {
	if (identity.kind === "icon-tile") {
		return (
			<VisualIdentityTile
				aria-hidden={decorative ? true : undefined}
				className={className}
				label={label}
				size={size}
				visualIdentity={{
					iconName: identity.iconName,
					tileVariant: identity.tileVariant,
				}}
				{...props}
			/>
		);
	}

	return (
		<Tile
			aria-hidden={decorative ? true : undefined}
			className={cn("text-icon-subtle", className)}
			hasBorder
			isInset={false}
			label={label}
			size={size}
			variant="transparent"
			{...props}
		>
			{renderLogoTileChild(identity, label)}
		</Tile>
	);
}
