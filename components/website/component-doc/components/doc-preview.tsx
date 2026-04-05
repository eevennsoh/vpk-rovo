"use client";

import { createElement, Suspense, use } from "react";
import { token } from "@/lib/tokens";
import type { DemoLayout } from "@/app/data/component-detail-types";
import {
	loadDemoComponent,
	type DemoCategory,
} from "@/components/website/demo-registry-loader";
import { Button } from "@/components/ui/button";
import { DocSection } from "./doc-section";
import { DemoPreviewShell } from "./demo-preview-shell";
import FullscreenEnterIcon from "@atlaskit/icon/core/fullscreen-enter";

interface DocPreviewProps {
	slug: string;
	category: DemoCategory;
	demoLayout?: DemoLayout;
}

function PreviewSkeleton() {
	return (
		<div
			style={{
				display: "flex",
				width: "100%",
				alignItems: "center",
				justifyContent: "center",
				minHeight: 120,
			}}
		>
			<div
				style={{
					width: 80,
					height: 80,
					borderRadius: 8,
					backgroundColor: token("color.background.neutral"),
					animation: "pulse 2s ease-in-out infinite",
				}}
			/>
		</div>
	);
}

function ResolvedDocPreview({
	slug,
	category,
	demoLayout,
}: Readonly<DocPreviewProps>) {
	const Demo = use(loadDemoComponent(slug, category));

	if (!Demo) {
		return null;
	}

	const fullViewAction = (
		<Button variant="link" size="sm" nativeButton={false} render={<a href={`/preview/${category}/${slug}`} />}>
			<FullscreenEnterIcon label="" />
			Fullscreen
		</Button>
	);

	const isFullPage = (category === "projects" || category === "blocks") && demoLayout?.previewHeight !== "default";
	const fitContent = demoLayout?.previewHeight === "fit";

	return (
		<DocSection id="preview" title="Preview" action={fullViewAction}>
			<DemoPreviewShell fullPage={isFullPage} fitContent={fitContent}>
				<Suspense fallback={<PreviewSkeleton />}>
					{createElement(Demo)}
				</Suspense>
			</DemoPreviewShell>
		</DocSection>
	);
}

export function DocPreview(props: Readonly<DocPreviewProps>) {
	return (
		<Suspense fallback={<PreviewSkeleton />}>
			<ResolvedDocPreview {...props} />
		</Suspense>
	);
}
