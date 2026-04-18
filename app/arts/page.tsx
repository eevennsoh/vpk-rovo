import { HomeContent } from "@/app/home-content";
import { getWebsiteLastUpdatedAt } from "@/lib/website-last-updated";

export default function ArtsPage() {
	const lastUpdatedAt = getWebsiteLastUpdatedAt();

	return (
		<HomeContent
			category="arts"
			lastUpdatedAt={lastUpdatedAt}
		/>
	);
}
