import { token } from "@/lib/tokens";
import { WebsiteSidebarNav } from "@/components/website/website-sidebar-nav";
import { WebsiteHeader } from "@/components/website/website-header";
import { WebsiteGrid } from "@/components/website/website-grid";
import { WebsiteCard } from "@/components/website/website-card";
import { WebsitePreview } from "@/components/website/website-preview";
import { CategoryTabs, type WebsiteCategoryTab } from "@/components/website/category-tabs";
import {
	AUDIO_COMPONENTS,
	AI_COMPONENTS,
	UI_COMPONENTS,
	BLOCK_COMPONENTS,
	UTILITY_COMPONENTS,
	VISUAL_COMPONENTS,
} from "./data/component-manifest";
import { WEBSITE_STATIC_PAGES, WEBSITE_NAV_SECTIONS } from "./data/website-sidebar-nav";
import {
	HomeProjectsSection,
	type ProjectListEntry,
} from "@/app/home-projects-section";
import { HomeSectionHeading } from "@/app/home-section-heading";

export type HomeCategory = WebsiteCategoryTab;

interface HomeContentProps {
	category: HomeCategory;
	lastUpdatedAt?: string | null;
	projectComponents?: ReadonlyArray<ProjectListEntry>;
}

export function HomeContent({ category, lastUpdatedAt, projectComponents }: Readonly<HomeContentProps>) {
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
					leftContent={<CategoryTabs activeCategory={category} />}
				/>

				<main>
					{category === "ui" && (
						<>
							<HomeSectionHeading
								id="ui"
								title="UI"
								count={UI_COMPONENTS.length}
							/>
							<WebsiteGrid>
								{UI_COMPONENTS.map((comp) => (
									<WebsiteCard key={comp.slug} name={comp.name} href={`/components/ui/${comp.slug}`}>
										<WebsitePreview slug={comp.slug} name={comp.name} importPath={comp.importPath} category="ui" />
									</WebsiteCard>
								))}
							</WebsiteGrid>
						</>
					)}

					{category === "ui-ai" && (
						<>
							<HomeSectionHeading
								id="ai-elements"
								title="UI — AI"
								count={AI_COMPONENTS.length}
							/>
							<WebsiteGrid>
								{AI_COMPONENTS.map((comp) => (
									<WebsiteCard key={comp.slug} name={comp.name} href={`/components/ui-ai/${comp.slug}`}>
										<WebsitePreview slug={comp.slug} name={comp.name} importPath={comp.importPath} category="ui-ai" />
									</WebsiteCard>
								))}
							</WebsiteGrid>
						</>
					)}

					{category === "ui-audio" && (
						<>
							<HomeSectionHeading
								id="audio-elements"
								title="UI — Audio"
								count={AUDIO_COMPONENTS.length}
							/>
							<WebsiteGrid>
								{AUDIO_COMPONENTS.map((comp) => (
									<WebsiteCard key={comp.slug} name={comp.name} href={`/components/ui-audio/${comp.slug}`}>
										<WebsitePreview slug={comp.slug} name={comp.name} importPath={comp.importPath} category="ui-audio" />
									</WebsiteCard>
								))}
							</WebsiteGrid>
						</>
					)}

					{category === "blocks" && (
						<>
							<HomeSectionHeading
								id="blocks"
								title="Blocks"
								count={BLOCK_COMPONENTS.length}
							/>
							<ul className="grid grid-cols-1 list-none m-0 p-0">
								{BLOCK_COMPONENTS.map((comp) => (
									<WebsiteCard key={comp.slug} name={comp.name} href={`/components/blocks/${comp.slug}`} fullWidth>
										<iframe
											src={`/preview/blocks/${comp.slug}`}
											title={comp.name}
											className="h-full w-full border-0"
											loading="lazy"
										/>
									</WebsiteCard>
								))}
							</ul>
						</>
					)}

					{category === "projects" && (
						<HomeProjectsSection projectComponents={projectComponents} />
					)}

					{category === "utility" && (
						<>
							<HomeSectionHeading
								id="utility"
								title="Utils"
								count={UTILITY_COMPONENTS.length}
							/>
							<ul className="grid grid-cols-1 list-none m-0 p-0">
								{UTILITY_COMPONENTS.map((comp) => (
									<WebsiteCard key={comp.slug} name={comp.name} href={`/components/utility/${comp.slug}`} fullWidth>
										<iframe
											src={`/preview/utility/${comp.slug}`}
											title={comp.name}
											className="h-full w-full border-0"
											loading="lazy"
										/>
									</WebsiteCard>
								))}
							</ul>
						</>
					)}

					{category === "visual" && (
						<>
							<HomeSectionHeading
								id="visual"
								title="Visual"
								count={VISUAL_COMPONENTS.length}
							/>
							<WebsiteGrid>
								{VISUAL_COMPONENTS.map((comp) => (
									<WebsiteCard key={comp.slug} name={comp.name} href={`/components/visual/${comp.slug}`}>
										<WebsitePreview slug={comp.slug} name={comp.name} importPath={comp.importPath} category="visual" />
									</WebsiteCard>
								))}
							</WebsiteGrid>
						</>
					)}
				</main>
			</div>
		</>
	);
}
