"use client";

import { Suspense, createElement, use } from "react";
import {
	loadDemoComponent,
	type DemoCategory,
} from "@/components/website/demo-registry-loader";
import { getCategoryDisplayName } from "@/lib/project-page-title";
import type { PreviewCategory } from "./preview-types";

interface PreviewCategoryPageProps {
	params: Promise<{ slug: string }>;
	category: PreviewCategory;
}

function ResolvedPreviewCategoryPage({
	slug,
	category,
}: Readonly<{
	slug: string;
	category: DemoCategory;
}>) {
	const Demo = use(loadDemoComponent(slug, category));

	if (!Demo) {
		return (
			<div className="flex h-screen w-screen items-center justify-center text-text-subtlest text-sm">
				{getCategoryDisplayName(category)} component not found: {slug}
			</div>
		);
	}

	return createElement(Demo);
}

function PreviewCategoryLoadingFallback({
	category,
}: Readonly<{
	category: PreviewCategory;
}>) {
	return (
		<div className="flex h-screen w-screen items-center justify-center text-text-subtlest text-sm">
			Loading {getCategoryDisplayName(category)} preview…
		</div>
	);
}

export function RenderPreviewCategoryPage({
	params,
	category,
}: Readonly<PreviewCategoryPageProps>) {
	const { slug } = use(params);

	return (
		<Suspense fallback={<PreviewCategoryLoadingFallback category={category} />}>
			<ResolvedPreviewCategoryPage slug={slug} category={category} />
		</Suspense>
	);
}
