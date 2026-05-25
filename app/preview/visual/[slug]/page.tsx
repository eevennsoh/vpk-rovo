import { RenderPreviewCategoryPage } from "@/app/preview/_shared/render-preview-category-page";
import { getPreviewStaticParams } from "@/app/preview/_shared/preview-static-params";

interface PreviewVisualPageProps {
	params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
	return getPreviewStaticParams("visual");
}

export default async function PreviewVisualPage({ params }: PreviewVisualPageProps) {
	const { slug } = await params;

	return <RenderPreviewCategoryPage slug={slug} category="visual" />;
}
