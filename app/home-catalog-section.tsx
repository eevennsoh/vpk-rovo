"use client";

import { useMemo, useState } from "react";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import { HomeSectionHeading } from "@/app/home-section-heading";
import type { ComponentManifestEntry } from "@/app/data/component-manifest";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { WebsiteCard } from "@/components/website/website-card";

type HomeCatalogSortOption = "last-updated" | "name";

export interface HomeCatalogListEntry extends ComponentManifestEntry {
	updatedAt: string | null;
}

const HOME_CATALOG_SORT_LABELS: Record<HomeCatalogSortOption, string> = {
	"last-updated": "Last updated",
	name: "Name",
};

interface HomeCatalogSectionProps {
	id: string;
	title: string;
	components: ReadonlyArray<ComponentManifestEntry>;
	componentEntries?: ReadonlyArray<HomeCatalogListEntry>;
	componentHrefPrefix: string;
	previewHrefPrefix: string;
	emptyStateTitle: string;
	emptyStateDescription: string;
}

export function HomeCatalogSection({
	id,
	title,
	components,
	componentEntries,
	componentHrefPrefix,
	previewHrefPrefix,
	emptyStateTitle,
	emptyStateDescription,
}: Readonly<HomeCatalogSectionProps>) {
	const [catalogSort, setCatalogSort] =
		useState<HomeCatalogSortOption>("last-updated");

	const sortedComponentEntries = useMemo(() => {
		const source =
			componentEntries ??
			components.map((component) => ({
				...component,
				updatedAt: null,
			}));

		if (catalogSort === "name") {
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
	}, [catalogSort, componentEntries, components]);

	const sectionActions = sortedComponentEntries.length > 1 ? (
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
				Sort: {HOME_CATALOG_SORT_LABELS[catalogSort]}
				<ChevronDownIcon label="" size="small" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					<DropdownMenuRadioGroup
						value={catalogSort}
						onValueChange={(value) => {
							setCatalogSort(value as HomeCatalogSortOption);
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
	) : null;

	return (
		<>
			<HomeSectionHeading
				id={id}
				title={title}
				count={components.length}
				actions={sectionActions}
			/>
			<ul className="grid grid-cols-1 list-none m-0 p-0">
				{sortedComponentEntries.length > 0 ? (
					sortedComponentEntries.map((component) => (
						<WebsiteCard
							key={component.slug}
							name={component.name}
							href={`${componentHrefPrefix}/${component.slug}`}
							fullWidth
						>
							<iframe
								src={`${previewHrefPrefix}/${component.slug}?embedded=1`}
								title={component.name}
								className="h-full w-full border-0"
								loading="lazy"
							/>
						</WebsiteCard>
					))
				) : (
					<WebsiteCard name={`${title} coming soon`} fullWidth>
						<div className="flex h-full items-center justify-center bg-bg-neutral p-8">
							<div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-border bg-surface">
								<Empty width="wide">
									<EmptyHeader>
										<EmptyTitle>{emptyStateTitle}</EmptyTitle>
										<EmptyDescription>
											{emptyStateDescription}
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							</div>
						</div>
					</WebsiteCard>
				)}
			</ul>
		</>
	);
}
