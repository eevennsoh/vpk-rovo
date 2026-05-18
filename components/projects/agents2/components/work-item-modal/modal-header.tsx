"use client";

import Image from "next/image";
import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Icon } from "@/components/ui/icon";
import { Tile } from "@/components/ui/tile";
import Heading from "@/components/blocks/shared-ui/heading";

import { useWorkItemModal } from "@/app/contexts/context-work-item-modal";
import AddIcon from "@atlaskit/icon/core/add";
import AiGenerativeTextSummaryIcon from "@atlaskit/icon/core/ai-generative-text-summary";
import CrossIcon from "@atlaskit/icon/core/cross";
import EyeOpenIcon from "@atlaskit/icon/core/eye-open";
import LockUnlockedIcon from "@atlaskit/icon/core/lock-unlocked";
import ShareIcon from "@atlaskit/icon/core/share";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import TaskIcon from "@atlaskit/icon/core/task";

export function ModalHeader() {
	const { meta } = useWorkItemModal();
	const { workItem } = meta;

	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: "minmax(0, 1fr) max-content",
				columnGap: token("space.200"),
				alignItems: "center",
				minWidth: 0,
				paddingBlock: token("space.300"),
				paddingInline: token("space.300"),
				backgroundColor: token("elevation.surface.overlay"),
			}}
		>
			<Breadcrumb className="min-w-0 overflow-hidden">
				<BreadcrumbList className="min-w-0 flex-nowrap overflow-hidden">
					<BreadcrumbItem className="min-w-0 max-w-[240px] shrink">
						<BreadcrumbLink
							className="[&_[data-slot=breadcrumb-label-text]]:truncate"
							href="#"
							before={
								<Tile
									aria-hidden
									isInset={false}
									label="Project"
									className="size-3"
									size="xsmall"
									variant="transparent"
								>
									<Image
										alt=""
										height={12}
										src="/avatar-project/rocket.svg"
										width={12}
									/>
								</Tile>
							}
						>
							{workItem.parent?.title ?? "Enterprise RFP Response"}
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator className="shrink-0" />
					<BreadcrumbItem className="min-w-0 flex-1">
						<BreadcrumbPage
							className="inline-flex min-w-0 items-center [&_[data-slot=breadcrumb-label-text]]:truncate"
							before={
								<Icon
									aria-hidden
									className="text-icon-brand"
									render={<TaskIcon label="" size="small" />}
								/>
							}
						>
							{workItem.title}
						</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<div className="flex shrink-0 items-center gap-2">
				<Button aria-label="No restrictions" size="icon" variant="outline">
					<LockUnlockedIcon label="" />
				</Button>
				<Button className="gap-2" variant="outline">
					<EyeOpenIcon label="" />
					1
				</Button>
				<Button aria-label="Share" size="icon" variant="outline">
					<ShareIcon label="" />
				</Button>
				<Button aria-label="Actions" size="icon" variant="outline">
					<ShowMoreHorizontalIcon label="" />
				</Button>
				<Button aria-label="Close" size="icon" variant="outline" onClick={meta.onClose}>
					<CrossIcon label="" />
				</Button>
			</div>
		</div>
	);
}

export function ModalTitle() {
	const { meta } = useWorkItemModal();

	return (
		<div className="grid gap-2">
			<Heading size="large" style={{ paddingBlock: token("space.025") }}>
				{meta.workItem.title}
			</Heading>
			<div className="flex flex-wrap gap-2">
				<Button aria-label="Add" size="icon" variant="outline">
					<AddIcon label="" />
				</Button>
				<Button aria-label="AI summary" size="icon" variant="outline">
					<AiGenerativeTextSummaryIcon label="" />
				</Button>
			</div>
		</div>
	);
}
