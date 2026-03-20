"use client";

import { useMemo, useState, type ReactNode } from "react";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import { token } from "@/lib/tokens";
import { WebsiteSidebarNav } from "@/components/website/website-sidebar-nav";
import { WebsiteHeader } from "@/components/website/website-header";
import { WebsiteGrid } from "@/components/website/website-grid";
import { WebsiteCard } from "@/components/website/website-card";
import { WebsitePreview } from "@/components/website/website-preview";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CategoryTabs, type WebsiteCategoryTab } from "@/components/website/category-tabs";
import { AUDIO_COMPONENTS, AI_COMPONENTS, UI_COMPONENTS, BLOCK_COMPONENTS, PROJECT_COMPONENTS, UTILITY_COMPONENTS, VISUAL_COMPONENTS, type ComponentEntry } from "./data/components";
import { WEBSITE_STATIC_PAGES, WEBSITE_NAV_SECTIONS } from "./data/website-sidebar-nav";

export type HomeCategory = WebsiteCategoryTab;
type ProjectSortOption = "last-updated" | "name";
type ProjectListEntry = ComponentEntry & { updatedAt: string | null };
const PROJECT_SORT_LABELS: Record<ProjectSortOption, string> = {
	"last-updated": "Last updated",
	name: "Name",
};

interface HomeContentProps {
	category: HomeCategory;
	lastUpdatedAt?: string | null;
	projectComponents?: ReadonlyArray<ProjectListEntry>;
}

export function HomeContent({ category, lastUpdatedAt, projectComponents }: Readonly<HomeContentProps>) {
	const [projectSort, setProjectSort] = useState<ProjectSortOption>("last-updated");
	const sortedProjectComponents = useMemo(() => {
		const source = projectComponents ?? PROJECT_COMPONENTS.map((component) => ({ ...component, updatedAt: null }));

		if (projectSort === "name") {
			return [...source].sort((left, right) => left.name.localeCompare(right.name));
		}

		return [...source].sort((left, right) => {
			const timeDelta = Date.parse(right.updatedAt ?? "") - Date.parse(left.updatedAt ?? "");
			if (Number.isFinite(timeDelta) && timeDelta !== 0) {
				return timeDelta;
			}

			if (right.updatedAt && !left.updatedAt) {
				return 1;
			}

			if (left.updatedAt && !right.updatedAt) {
				return -1;
			}

			return left.name.localeCompare(right.name);
		});
	}, [projectComponents, projectSort]);

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
							<SectionHeading id="ui" title="UI" count={UI_COMPONENTS.length} />
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
							<SectionHeading id="ai-elements" title="UI — AI" count={AI_COMPONENTS.length} />
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
							<SectionHeading id="audio-elements" title="UI — Audio" count={AUDIO_COMPONENTS.length} />
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
							<SectionHeading id="blocks" title="Blocks" count={BLOCK_COMPONENTS.length} />
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
						<>
							<SectionHeading
								id="projects"
								title="Projects"
								count={PROJECT_COMPONENTS.length}
								actions={(
									<DropdownMenu>
										<DropdownMenuTrigger
											render={<Button variant="outline" size="sm" className="w-fit gap-1.5" />}
										>
											Sort: {PROJECT_SORT_LABELS[projectSort]}
											<ChevronDownIcon label="" size="small" />
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuGroup>
												<DropdownMenuRadioGroup
													value={projectSort}
													onValueChange={(value) => setProjectSort(value as ProjectSortOption)}
												>
													<DropdownMenuRadioItem value="last-updated">Last updated</DropdownMenuRadioItem>
													<DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
												</DropdownMenuRadioGroup>
											</DropdownMenuGroup>
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							/>
							<ul className="grid grid-cols-1 list-none m-0 p-0">
								{sortedProjectComponents.map((comp) => (
									<WebsiteCard key={comp.slug} name={comp.name} href={`/components/projects/${comp.slug}`} fullWidth>
										<iframe
											src={`/preview/projects/${comp.slug}?embedded=1`}
											title={comp.name}
											className="h-full w-full border-0"
											loading="lazy"
										/>
									</WebsiteCard>
								))}
							</ul>
						</>
					)}

					{category === "utility" && (
						<>
							<SectionHeading id="utility" title="Utils" count={UTILITY_COMPONENTS.length} />
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
							<SectionHeading id="visual" title="Visual" count={VISUAL_COMPONENTS.length} />
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

interface SectionHeadingProps {
	id: string;
	title: string;
	count: number;
	actions?: ReactNode;
}

function SectionHeading({ id, title, count, actions }: Readonly<SectionHeadingProps>) {
	return (
		<div
			id={id}
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: token("space.200"),
				paddingBlock: token("space.300"),
				paddingInline: token("space.300"),
				borderBottom: `1px solid ${token("color.border")}`,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					gap: token("space.100"),
				}}
			>
				<span
					style={{
						fontSize: "20px",
						fontWeight: 600,
						color: token("color.text"),
					}}
				>
					{title}
				</span>
				<span
					style={{
						fontSize: "14px",
						fontWeight: 500,
						color: token("color.text.subtlest"),
					}}
				>
					{count}
				</span>
			</div>
			{actions}
		</div>
	);
}
