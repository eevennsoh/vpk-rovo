import { RenderPreviewCategoryPage } from "@/app/preview/_shared/render-preview-category-page";
import { getPreviewStaticParams } from "@/app/preview/_shared/preview-static-params";

interface PreviewUiCustomPageProps {
	params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
	return getPreviewStaticParams("ui-custom");
}

export default async function PreviewUiCustomPage({ params }: PreviewUiCustomPageProps) {
	const { slug } = await params;

	return <RenderPreviewCategoryPage slug={slug} category="ui-custom" />;
}
