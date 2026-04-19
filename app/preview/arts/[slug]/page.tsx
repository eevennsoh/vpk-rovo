"use client";

import { RenderPreviewCategoryPage } from "@/app/preview/_shared/render-preview-category-page";

interface PreviewTemplatePageProps {
	params: Promise<{ slug: string }>;
}

export default function PreviewTemplatePage({ params }: PreviewTemplatePageProps) {
	return <RenderPreviewCategoryPage params={params} category="arts" />;
}
