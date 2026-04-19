import type { Metadata } from "next";
import { PreviewCategoryLayout, getCategoryPreviewMetadata, type PreviewLayoutProps } from "@/app/preview/_shared/preview-metadata";

export async function generateMetadata({ params }: PreviewLayoutProps): Promise<Metadata> {
	return getCategoryPreviewMetadata(params, "arts");
}

export default PreviewCategoryLayout;
