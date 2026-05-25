import { RenderPreviewCategoryPage } from "@/app/preview/_shared/render-preview-category-page";
import { getPreviewStaticParams } from "@/app/preview/_shared/preview-static-params";

interface PreviewUiAudioPageProps {
	params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
	return getPreviewStaticParams("ui-audio");
}

export default async function PreviewUiAudioPage({ params }: PreviewUiAudioPageProps) {
	const { slug } = await params;

	return <RenderPreviewCategoryPage slug={slug} category="ui-audio" />;
}
