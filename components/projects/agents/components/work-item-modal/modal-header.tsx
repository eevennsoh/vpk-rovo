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
import Heading from "@/components/blocks/shared-ui/heading";


import { useWorkItemModal } from "@/app/contexts/context-work-item-modal";
import AddIcon from "@atlaskit/icon/core/add";
import AppsIcon from "@atlaskit/icon/core/apps";
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
				height: "32px",
				minHeight: "32px",
				maxHeight: "32px",
				marginTop: token("space.300"),
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				paddingLeft: token("space.300"),
				paddingRight: token("space.300"),
				backgroundColor: token("elevation.surface.overlay"),
			}}
		>
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="#" className="gap-1.5 inline-flex items-center">
								<Image
									src="/avatar-project/rocket.svg"
									alt="Project"
									width={20}
									height={20}
									style={{
										width: "20px",
										height: "20px",
									borderRadius: token("radius.xsmall"),
								}}
							/>
							<span>Vitafleet Q4 launch</span>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage className="gap-1.5 inline-flex items-center">
							<TaskIcon label="Task" color={token("color.icon.brand")} />
							{workItem.title}
						</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<div className="flex items-center gap-2">
				<Button aria-label="No restrictions" size="icon" variant="secondary">
					<LockUnlockedIcon label="" />
				</Button>
				<Button className="gap-2" variant="secondary">
					<EyeOpenIcon label="" size="small" />
					1
				</Button>
				<Button aria-label="Share" size="icon" variant="secondary">
					<ShareIcon label="" />
				</Button>
				<Button aria-label="Actions" size="icon" variant="secondary">
					<ShowMoreHorizontalIcon label="" />
				</Button>
				<Button aria-label="Close" size="icon" variant="secondary" onClick={meta.onClose}>
					<CrossIcon label="" />
				</Button>
			</div>
		</div>
	);
}

export function ModalTitle() {
	const { meta } = useWorkItemModal();

	return (
		<div className="flex flex-col gap-2">
			<Heading size="large">{meta.workItem.title}</Heading>
			<div className="flex gap-2">
				<Button className="gap-2" variant="secondary">
					<AddIcon label="" size="small" />
					Add
				</Button>
				<Button className="gap-2" variant="secondary">
					<AppsIcon label="" size="small" />
					Apps
				</Button>
			</div>
		</div>
	);
}
