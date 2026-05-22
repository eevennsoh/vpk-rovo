import { HomeContent } from "@/app/home-content";
import { getProjectComponentsWithUpdatedAt } from "@/lib/project-component-updated";
import { getWebsiteLastUpdatedAt } from "@/lib/website-last-updated";

export default function Home() {
	const lastUpdatedAt = getWebsiteLastUpdatedAt();
	const projectComponents = getProjectComponentsWithUpdatedAt();

	return (
		<HomeContent
			category="projects"
			lastUpdatedAt={lastUpdatedAt}
			projectComponents={projectComponents}
		/>
	);
}
