"use client";

import Image from "next/image";
import { token } from "@/lib/tokens";

interface ExampleCardProps {
	iconPath: string;
	title: string;
	description: string;
	onClick: () => void;
	onPreviewStart?: () => void;
	onPreviewEnd?: () => void;
}

export default function ExampleCard({
	iconPath,
	title,
	description,
	onClick,
	onPreviewStart,
	onPreviewEnd,
}: Readonly<ExampleCardProps>) {
	return (
		<button
			type="button"
			onClick={onClick}
			onMouseEnter={() => onPreviewStart?.()}
			onMouseLeave={() => onPreviewEnd?.()}
			onFocus={() => onPreviewStart?.()}
			onBlur={() => onPreviewEnd?.()}
			className="flex h-[146px] flex-col items-start gap-2 rounded-xl border border-border bg-surface p-4 text-left shadow-none transition-all duration-medium ease-out hover:-translate-y-1 hover:border-transparent hover:shadow-[var(--ds-shadow-overlay)] focus-visible:-translate-y-1 focus-visible:border-transparent focus-visible:shadow-[var(--ds-shadow-overlay)] focus-visible:outline-2 focus-visible:outline-border-focused"
		>
			<Image src={iconPath} alt="" width={32} height={32} />
			<div
				className="line-clamp-1 text-text-subtle"
				style={{
					font: token("font.body"),
					fontWeight: token("font.weight.medium"),
				}}
			>
				{title}
			</div>
			<div
				className="line-clamp-2 leading-[1.4] text-text-subtlest"
				style={{ font: token("font.body.small") }}
			>
				{description}
			</div>
		</button>
	);
}
