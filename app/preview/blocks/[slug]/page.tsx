import { RenderPreviewCategoryPage } from "@/app/preview/_shared/render-preview-category-page";
import { getPreviewStaticParams } from "@/app/preview/_shared/preview-static-params";

interface PreviewBlockPageProps {
	params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
	return getPreviewStaticParams("blocks");
}

export default async function PreviewBlockPage({ params }: PreviewBlockPageProps) {
	const { slug } = await params;

	return <RenderPreviewCategoryPage slug={slug} category="blocks" />;
}
