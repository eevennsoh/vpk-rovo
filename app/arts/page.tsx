import { token } from "@/lib/tokens";
import { WebsiteSidebarNav } from "@/components/website/website-sidebar-nav";
import { WebsiteHeader } from "@/components/website/website-header";
import { CategoryTabs } from "@/components/website/category-tabs";
import { CATEGORY_TAB_OPTIONS } from "@/app/data/category-tabs";
import { WEBSITE_STATIC_PAGES, WEBSITE_NAV_SECTIONS } from "@/app/data/website-sidebar-nav";
import { HomeArtsSection } from "@/app/home-arts-section";
import { getArtComponentsWithUpdatedAt } from "@/lib/project-component-updated";
import { getWebsiteLastUpdatedAt } from "@/lib/website-last-updated";

export default function ArtsPage() {
	const lastUpdatedAt = getWebsiteLastUpdatedAt();
	const artComponents = getArtComponentsWithUpdatedAt();

	return (
		<>
			<WebsiteSidebarNav staticPages={WEBSITE_STATIC_PAGES} sections={WEBSITE_NAV_SECTIONS} logoText="VPK" />

			<div
				className="website-main-content"
				style={{
					minHeight: "100vh",
					backgroundColor: token("elevation.surface"),
				}}
			>
				<WebsiteHeader
					packageName="@vpk"
					lastUpdatedAt={lastUpdatedAt}
					leftContent={<CategoryTabs activeCategory="arts" options={CATEGORY_TAB_OPTIONS} />}
				/>

				<div>
					<HomeArtsSection artComponents={artComponents} />
				</div>
			</div>
		</>
	);
}
