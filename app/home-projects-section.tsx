import { PROJECT_COMPONENTS } from "@/app/data/component-manifest";
import {
	HomeCatalogSection,
	type HomeCatalogListEntry,
} from "@/app/home-catalog-section";

interface HomeProjectsSectionProps {
	projectComponents?: ReadonlyArray<HomeCatalogListEntry>;
}

export function HomeProjectsSection({
	projectComponents,
}: Readonly<HomeProjectsSectionProps>) {
	return (
		<HomeCatalogSection
			id="projects"
			title="Projects"
			components={PROJECT_COMPONENTS}
			componentEntries={projectComponents}
			componentHrefPrefix="/components/projects"
			previewHrefPrefix="/preview/projects"
			emptyStateTitle="No projects yet"
			emptyStateDescription="Add a project entry to start building out this showcase."
		/>
	);
}

export type ProjectListEntry = HomeCatalogListEntry;
