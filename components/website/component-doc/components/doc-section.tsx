"use client";

import type { ReactNode } from "react";
import LinkIcon from "@atlaskit/icon/core/link";
import { token } from "@/lib/tokens";

interface DocSectionProps {
	id: string;
	title: string;
	action?: ReactNode;
	children: ReactNode;
}

export function copyAnchorLink(id: string) {
	const url = `${window.location.origin}${window.location.pathname}#${id}`;
	navigator.clipboard.writeText(url);
	window.location.hash = id;
}

export function AnchorLinkButton({ id, label }: Readonly<{ id: string; label: string }>) {
	return (
		<button
			type="button"
			onClick={() => copyAnchorLink(id)}
			className="opacity-0 group-hover:opacity-100 text-text-subtlest hover:text-text-subtle transition-opacity cursor-pointer"
			aria-label={`Copy link to ${label}`}
		>
			<LinkIcon label="" size="small" />
		</button>
	);
}

export function DocSection({ id, title, action, children }: Readonly<DocSectionProps>) {
	return (
		<section
			id={id}
			className="flex flex-col gap-4 border-b border-border last:border-b-0"
			style={{
				paddingBlock: token("space.400"),
			}}
		>
			<div
				className="group"
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<div className="flex items-center gap-1">
					<h2
						style={{
							fontSize: "16px",
							fontWeight: 600,
							color: token("color.text"),
						}}
					>
						{title}
					</h2>
					<AnchorLinkButton id={id} label={title} />
				</div>
				{action}
			</div>
			{children}
		</section>
	);
}
