import { ART_COMPONENTS } from "@/app/data/component-manifest";
import { HomeCatalogSection } from "@/app/home-catalog-section";

export function HomeArtsSection() {
	return (
		<HomeCatalogSection
			id="arts"
			title="Arts"
			components={ART_COMPONENTS}
			componentHrefPrefix="/components/arts"
			previewHrefPrefix="/preview/arts"
			emptyStateTitle="No art pieces yet"
			emptyStateDescription="This space is ready for your first art study, concept, or experiment."
		/>
	);
}
