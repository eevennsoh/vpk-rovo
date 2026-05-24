import { RenderPreviewCategoryPage } from "@/app/preview/_shared/render-preview-category-page";
import { getPreviewStaticParams } from "@/app/preview/_shared/preview-static-params";

interface PreviewUiPageProps {
	params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
	return getPreviewStaticParams("ui");
}

export default async function PreviewUiPage({ params }: PreviewUiPageProps) {
	const { slug } = await params;

	return <RenderPreviewCategoryPage slug={slug} category="ui" />;
}
