"use client";

import React from "react";
import { token } from "@/lib/tokens";

interface ShareMenuItemProps {
	label: string;
	onClick: () => void;
}

function ShareMenuItem({ label, onClick }: Readonly<ShareMenuItemProps>) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="w-full rounded-md border-none bg-transparent p-2 text-left text-sm hover:bg-bg-neutral-hovered"
			style={{ cursor: "pointer" }}
		>
			{label}
		</button>
	);
}

interface ShareDropdownMenuProps {
	menuRef: React.RefObject<HTMLDivElement | null>;
	buttonRect: DOMRect;
	onClose: () => void;
}

export default function ShareDropdownMenu({
	menuRef,
	buttonRect,
	onClose,
}: Readonly<ShareDropdownMenuProps>) {
	const handleShareWithTeam = () => {
		// Handle share with team action
		onClose();
	};

	const handleCopyLink = () => {
		// Handle copy link action
		onClose();
	};

	const handleShareViaEmail = () => {
		// Handle share via email action
		onClose();
	};

	return (
		<div
			ref={menuRef}
			style={{
				position: "fixed",
				top: `${buttonRect.bottom + 4}px`,
				left: `${buttonRect.left - 138}px`,
				backgroundColor: token("elevation.surface.overlay"),
				borderRadius: token("radius.medium"),
				boxShadow: token("elevation.shadow.overlay"),
				zIndex: 2000,
				width: "170px",
				padding: token("space.075"),
			}}
		>
			<ShareMenuItem label="Share with team" onClick={handleShareWithTeam} />
			<ShareMenuItem label="Copy link" onClick={handleCopyLink} />
			<ShareMenuItem label="Share via email" onClick={handleShareViaEmail} />
		</div>
	);
}
