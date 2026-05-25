import { getAllComponents } from "@/app/data/component-manifest";
import type { PreviewCategory } from "./preview-types";

export function getPreviewStaticParams(category: PreviewCategory): Array<{ slug: string }> {
	return getAllComponents()
		.filter((component) => component.category === category)
		.map((component) => ({ slug: component.slug }));
}
