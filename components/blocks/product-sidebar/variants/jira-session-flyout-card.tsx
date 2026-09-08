"use client";

import { useId, type ReactNode } from "react";

import { SmartLink, type SmartLinkItem } from "@/components/blocks/smart-link";
import { cn } from "@/lib/utils";

/**
 * Shared 320px overlay chrome for Jira session hover cards: title + meta header,
 * optional trailing lozenge, optional top-bordered body, Artifacts Smart Links,
 * and optional footer. Hover surfaces get overlay background + shadow from the
 * parent flyout — no extra outer border.
 */
export function JiraSessionFlyoutCard({
	"aria-labelledby": ariaLabelledBy,
	artifacts,
	body,
	bodyClassName = "gap-3",
	footer,
	footerClassName = "gap-3",
	meta,
	title,
	titleId,
	trailing,
}: Readonly<{
	"aria-labelledby"?: string;
	artifacts?: readonly SmartLinkItem[];
	body?: ReactNode;
	bodyClassName?: string;
	footer?: ReactNode;
	footerClassName?: string;
	meta: ReactNode;
	title: string;
	titleId: string;
	trailing?: ReactNode;
}>) {
	const artifactsId = useId();
	const artifactItems = artifacts ?? [];
	const hasArtifacts = artifactItems.length > 0;
	const hasBodyRegion = Boolean(body) || hasArtifacts;
	const labelledBy = [ariaLabelledBy ?? titleId, hasArtifacts ? artifactsId : undefined]
		.filter(Boolean)
		.join(" ");

	return (
		<section
			aria-labelledby={labelledBy}
			className="flex w-[320px] max-w-[calc(100vw-48px)] flex-col gap-3 pt-3 text-text"
		>
			<div className="flex items-start gap-3 px-3">
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<h2 className="min-w-0 text-sm leading-5 font-normal text-text" id={titleId} title={title}>
						{title}
					</h2>
					{meta}
				</div>
				{trailing ?? null}
			</div>
			{hasBodyRegion || footer ? (
				<div className="flex flex-col">
					{hasBodyRegion ? (
						<div className={cn("flex flex-col border-t border-border-disabled p-3", bodyClassName)}>
							{body ?? null}
							{hasArtifacts ? (
								<div className="flex flex-col gap-2">
									<h3 className="text-xs leading-4 font-medium text-text" id={artifactsId}>
										Artifacts
									</h3>
									<ul className="flex flex-col gap-1">
										{artifactItems.map((item) => (
											<li className="flex min-w-0" key={item.id}>
												<SmartLink
													className="max-w-full"
													item={item}
													showStatus={item.variant === "pull-request"}
													side="right"
												/>
											</li>
										))}
									</ul>
								</div>
							) : null}
						</div>
					) : null}
					{footer ? (
						<div className={cn("flex flex-col border-t border-border-disabled p-3", footerClassName)}>
							{footer}
						</div>
					) : null}
				</div>
			) : null}
		</section>
	);
}
