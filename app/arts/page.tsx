import { HomeContent } from "@/app/home-content";
import { getArtComponentsWithUpdatedAt } from "@/lib/project-component-updated";
import { getWebsiteLastUpdatedAt } from "@/lib/website-last-updated";

export default function ArtsPage() {
	const lastUpdatedAt = getWebsiteLastUpdatedAt();
	const artComponents = getArtComponentsWithUpdatedAt();

	return (
		<HomeContent
			category="arts"
			lastUpdatedAt={lastUpdatedAt}
			artComponents={artComponents}
		/>
	);
}
