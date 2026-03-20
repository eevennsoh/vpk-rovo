"use client";

import BugIcon from "@atlaskit/icon/core/bug";
import PageIcon from "@atlaskit/icon/core/page";
import GoalIcon from "@atlaskit/icon/core/goal";
import { IconTile } from "@/components/ui/icon-tile";
import { ObjectTile } from "@/components/ui/object-tile";
import { Lozenge } from "@/components/ui/lozenge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PRIMARY_AVATAR_SRC = "/avatar-user/venn/venn.png";

export default function ObjectTileDemo() {
	return (
		<div className="flex max-w-md flex-col gap-2">
			<ObjectTile
				icon={<IconTile icon={<BugIcon label="" />} label="Bug" variant="blue" size="small" />}
				title="PROJ-123: Add user authentication"
				description="Implement OAuth2 login flow"
			/>
			<ObjectTile
				icon={<IconTile icon={<PageIcon label="" />} label="Page" variant="teal" size="small" />}
				title="Architecture Decision Record"
				description="API gateway design choices"
			/>
		</div>
	);
}

export function ObjectTileDemoDefault() {
	return (
		<ObjectTile
			icon={<IconTile icon={<BugIcon label="" />} label="Bug" variant="blue" size="small" />}
			title="PROJ-123: Add user authentication"
		/>
	);
}

export function ObjectTileDemoDescription() {
	return (
		<ObjectTile
			icon={<IconTile icon={<PageIcon label="" />} label="Page" variant="teal" size="small" />}
			title="Architecture Decision Record"
			description="API gateway design choices and implementation notes"
		/>
	);
}

export function ObjectTileDemoMeta() {
	return (
		<ObjectTile
			icon={<IconTile icon={<BugIcon label="" />} label="Bug" variant="blue" size="small" />}
			title="PROJ-456: Fix search indexing"
			description="Search results are not updating after edits"
			meta={<Lozenge variant="information">In progress</Lozenge>}
		/>
	);
}

export function ObjectTileDemoLink() {
	return (
		<ObjectTile
			icon={<IconTile icon={<GoalIcon label="" />} label="Goal" variant="green" size="small" />}
			title="Q4 OKR: Improve performance"
			description="Reduce p99 latency to under 200ms"
			href="#"
		/>
	);
}

export function ObjectTileDemoList() {
	return (
		<div className="flex max-w-md flex-col gap-2">
			<ObjectTile
				icon={<IconTile icon={<BugIcon label="" />} label="Bug" variant="blue" size="small" />}
				title="PROJ-123: Add user authentication"
				meta={<Lozenge variant="information">In progress</Lozenge>}
				href="#"
			/>
			<ObjectTile
				icon={<IconTile icon={<BugIcon label="" />} label="Bug" variant="green" size="small" />}
				title="PROJ-124: Update dashboard layout"
				meta={<Lozenge variant="success">Done</Lozenge>}
				href="#"
			/>
			<ObjectTile
				icon={<IconTile icon={<BugIcon label="" />} label="Bug" variant="red" size="small" />}
				title="PROJ-125: Fix production error"
				meta={<Lozenge variant="danger">Critical</Lozenge>}
				href="#"
			/>
		</div>
	);
}

export function ObjectTileDemoWithAvatar() {
	return (
		<ObjectTile
			icon={
				<Avatar size="sm">
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Venn" />
					<AvatarFallback>SC</AvatarFallback>
				</Avatar>
			}
			title="Sarah Chen"
			description="Engineering Lead"
			href="#"
		/>
	);
}
