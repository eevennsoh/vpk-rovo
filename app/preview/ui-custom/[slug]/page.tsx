"use client";

import { RenderPreviewCategoryPage } from "@/app/preview/_shared/render-preview-category-page";

interface PreviewUiCustomPageProps {
	params: Promise<{ slug: string }>;
}

export default function PreviewUiCustomPage({ params }: PreviewUiCustomPageProps) {
	return <RenderPreviewCategoryPage params={params} category="ui-custom" />;
}
