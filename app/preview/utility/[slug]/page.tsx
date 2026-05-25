import { RenderPreviewCategoryPage } from "@/app/preview/_shared/render-preview-category-page";
import { getPreviewStaticParams } from "@/app/preview/_shared/preview-static-params";

interface PreviewUtilityPageProps {
	params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
	return getPreviewStaticParams("utility");
}

export default async function PreviewUtilityPage({ params }: PreviewUtilityPageProps) {
	const { slug } = await params;

	return <RenderPreviewCategoryPage slug={slug} category="utility" />;
}
