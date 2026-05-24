import { RenderPreviewCategoryPage } from "@/app/preview/_shared/render-preview-category-page";
import { getPreviewStaticParams } from "@/app/preview/_shared/preview-static-params";

interface PreviewTemplatePageProps {
	params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
	return getPreviewStaticParams("projects");
}

export default async function PreviewTemplatePage({ params }: PreviewTemplatePageProps) {
	const { slug } = await params;

	return <RenderPreviewCategoryPage slug={slug} category="projects" />;
}
