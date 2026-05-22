import { token } from "@/lib/tokens";
import { WebsiteSidebarNav } from "@/components/website/website-sidebar-nav";
import { WebsiteHeader } from "@/components/website/website-header";
import { CategoryTabs } from "@/components/website/category-tabs";
import { CATEGORY_TAB_OPTIONS } from "@/app/data/category-tabs";
import { WEBSITE_STATIC_PAGES, WEBSITE_NAV_SECTIONS } from "@/app/data/website-sidebar-nav";
import { getWebsiteLastUpdatedAt } from "@/lib/website-last-updated";

export default async function ComponentsLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const lastUpdatedAt = getWebsiteLastUpdatedAt();

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
					leftContent={<CategoryTabs options={CATEGORY_TAB_OPTIONS} />}
				/>

				<div>{children}</div>
			</div>
		</>
	);
}
