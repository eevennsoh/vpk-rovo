"use client";

import { useState } from "react";
import Image from "next/image";
import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import { LOGO_COMPONENTS, type FilterItem } from "../data/filter-data";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

interface FilterListItemProps {
	item: FilterItem;
	isSelected: boolean;
	onClick: () => void;
}

/**
 * Individual filter list item component with selection, hover, and interaction states
 */
export default function FilterListItem({ item, isSelected, onClick }: Readonly<FilterListItemProps>) {
	const [isHovered, setIsHovered] = useState(false);
	const Icon = item.icon;

	const isImagePath = typeof Icon === "string";
	const isLogoComponent = Icon && LOGO_COMPONENTS.some((LogoComponent) => Icon === LogoComponent);

	function handleMoreClick(e: React.MouseEvent): void {
		e.stopPropagation();
	}

	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={isSelected}
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				padding: `${token("space.100")} ${token("space.150")}`,
				cursor: "pointer",
				backgroundColor: isSelected ? token("color.background.selected") : "transparent",
				borderLeft: isSelected ? `3px solid ${token("color.border.brand")}` : "3px solid transparent",
				transition: "background-color 0.15s",
				border: "none",
				borderLeftStyle: "solid",
				borderLeftWidth: "3px",
				borderLeftColor: isSelected ? token("color.border.brand") : "transparent",
				width: "100%",
				textAlign: "left",
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div style={{ display: "flex", alignItems: "center", gap: token("space.100"), flex: 1, minWidth: 0 }}>
				{Icon ? (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: "24px",
							height: "24px",
							flexShrink: 0,
							color: isSelected ? token("color.icon.selected") : "currentColor",
						}}
					>
						{isImagePath ? (
							<Image src={Icon} alt={item.name} width={24} height={24} style={{ objectFit: "contain" }} />
						) : isLogoComponent ? (
							<Icon label={item.name} size="small" />
						) : (
							<Icon label={item.name} color="currentColor" />
						)}
					</div>
				) : null}
				<div
					style={{
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
						flex: 1,
					}}
				>
					<span className={`text-sm font-medium ${isSelected ? "text-text-accent-blue" : "text-text"}`}>
						{item.name}
					</span>
				</div>
			</div>

			{item.count ? (
				<div style={{ flexShrink: 0, marginLeft: token("space.100") }}>
					{isHovered && !isSelected ? (
						<Button
							aria-label="More options"
							size="icon-sm"
							variant="ghost"
							onClick={handleMoreClick}
						>
							<ShowMoreHorizontalIcon label="" size="small" />
						</Button>
					) : (
						<span className={`text-xs ${isSelected ? "text-text-accent-blue" : "text-text-subtlest"}`}>
							{item.count}
						</span>
					)}
				</div>
			) : null}

			{item.actionLabel ? (
				<div style={{ flexShrink: 0, marginLeft: token("space.100") }}>
					<span className="text-sm font-medium text-link">
						{item.actionLabel}
					</span>
				</div>
			) : null}
		</button>
	);
}
