"use client";

import { useMemo, useState } from "react";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WebsiteCard } from "@/components/website/website-card";
import type { ComponentManifestEntry } from "@/app/data/component-manifest";
import { PROJECT_COMPONENTS } from "@/app/data/component-manifest";
import { HomeSectionHeading } from "@/app/home-section-heading";

type ProjectSortOption = "last-updated" | "name";

export type ProjectListEntry = ComponentManifestEntry & {
	updatedAt: string | null;
};

const PROJECT_SORT_LABELS: Record<ProjectSortOption, string> = {
	"last-updated": "Last updated",
	name: "Name",
};

interface HomeProjectsSectionProps {
	projectComponents?: ReadonlyArray<ProjectListEntry>;
}

export function HomeProjectsSection({
	projectComponents,
}: Readonly<HomeProjectsSectionProps>) {
	const [projectSort, setProjectSort] =
		useState<ProjectSortOption>("last-updated");

	const sortedProjectComponents = useMemo(() => {
		const source =
			projectComponents ??
			PROJECT_COMPONENTS.map((component) => ({
				...component,
				updatedAt: null,
			}));

		if (projectSort === "name") {
			return [...source].sort((left, right) => {
				return left.name.localeCompare(right.name);
			});
		}

		return [...source].sort((left, right) => {
			const timeDelta =
				Date.parse(right.updatedAt ?? "") - Date.parse(left.updatedAt ?? "");
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
			<HomeSectionHeading
				id="projects"
				title="Projects"
				count={PROJECT_COMPONENTS.length}
				actions={(
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									variant="outline"
									size="sm"
									className="w-fit gap-1.5"
								/>
							}
						>
							Sort: {PROJECT_SORT_LABELS[projectSort]}
							<ChevronDownIcon label="" size="small" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuGroup>
								<DropdownMenuRadioGroup
									value={projectSort}
									onValueChange={(value) => {
										setProjectSort(value as ProjectSortOption);
									}}
								>
									<DropdownMenuRadioItem value="last-updated">
										Last updated
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="name">
										Name
									</DropdownMenuRadioItem>
								</DropdownMenuRadioGroup>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			/>
			<ul className="grid grid-cols-1 list-none m-0 p-0">
				{sortedProjectComponents.map((component) => (
					<WebsiteCard
						key={component.slug}
						name={component.name}
						href={`/components/projects/${component.slug}`}
						fullWidth
					>
						<iframe
							src={`/preview/projects/${component.slug}?embedded=1`}
							title={component.name}
							className="h-full w-full border-0"
							loading="lazy"
						/>
					</WebsiteCard>
				))}
			</ul>
		</>
	);
}
