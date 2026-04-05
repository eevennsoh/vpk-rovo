"use client";

import { CheckIcon, PlusIcon } from "@/components/ui/vpk-icons";
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, AvatarPresenceIndicator, AvatarStatusIndicator } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

const PRIMARY_AVATAR_SRC = "/avatar-user/venn/venn.png";
const BADGE_ICON_AVATAR_SRC = "/avatar-user/ali/color/asow-teamwork-blue.png";
const BADGE_AVATAR_SRC = "/avatar-user/olivia-yang/color/asow-service-yellow.png";
const GROUP_AVATAR_TWO_SRC = "/avatar-user/nova/color/asow-service-yellow.png";
const GROUP_AVATAR_THREE_SRC = "/avatar-user/maia-ma/color/asow-service-yellow.png";

export default function AvatarDemo() {
	return (
		<div className="flex items-center gap-2">
			<Avatar>
				<AvatarImage src={PRIMARY_AVATAR_SRC} alt="User" />
				<AvatarFallback>SC</AvatarFallback>
			</Avatar>
			<Avatar>
				<AvatarFallback>JD</AvatarFallback>
			</Avatar>
			<Avatar size="sm">
				<AvatarFallback>SM</AvatarFallback>
			</Avatar>
		</div>
	);
}

export function AvatarDemoBadgeWithIcon() {
	return (
		<>
			<div className="flex flex-wrap items-center gap-2">
				<Avatar size="sm">
					<AvatarImage
						src={BADGE_ICON_AVATAR_SRC}
						alt="Ali"
					/>
					<AvatarFallback>PP</AvatarFallback>
					<AvatarBadge>
						<PlusIcon />
					</AvatarBadge>
				</Avatar>
				<Avatar>
					<AvatarImage
						src={BADGE_ICON_AVATAR_SRC}
						alt="Ali"
					/>
					<AvatarFallback>PP</AvatarFallback>
					<AvatarBadge>
						<PlusIcon />
					</AvatarBadge>
				</Avatar>
				<Avatar size="lg">
					<AvatarImage
						src={BADGE_ICON_AVATAR_SRC}
						alt="Ali"
					/>
					<AvatarFallback>PP</AvatarFallback>
					<AvatarBadge>
						<PlusIcon />
					</AvatarBadge>
				</Avatar>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Avatar size="sm">
					<AvatarFallback>PP</AvatarFallback>
					<AvatarBadge>
						<CheckIcon />
					</AvatarBadge>
				</Avatar>
				<Avatar>
					<AvatarFallback>PP</AvatarFallback>
					<AvatarBadge>
						<CheckIcon />
					</AvatarBadge>
				</Avatar>
				<Avatar size="lg">
					<AvatarFallback>PP</AvatarFallback>
					<AvatarBadge>
						<CheckIcon />
					</AvatarBadge>
				</Avatar>
			</div>
		</>
	);
}

export function AvatarDemoBadge() {
	return (
		<>
			<div className="flex flex-wrap items-center gap-2">
				<Avatar size="sm">
					<AvatarImage
						src={BADGE_AVATAR_SRC}
						alt="Olivia Yang"
					/>
					<AvatarFallback>JZ</AvatarFallback>
					<AvatarBadge />
				</Avatar>
				<Avatar>
					<AvatarImage
						src={BADGE_AVATAR_SRC}
						alt="Olivia Yang"
					/>
					<AvatarFallback>JZ</AvatarFallback>
					<AvatarBadge />
				</Avatar>
				<Avatar size="lg">
					<AvatarImage
						src={BADGE_AVATAR_SRC}
						alt="Olivia Yang"
					/>
					<AvatarFallback>JZ</AvatarFallback>
					<AvatarBadge />
				</Avatar>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Avatar size="sm">
					<AvatarFallback>JZ</AvatarFallback>
					<AvatarBadge />
				</Avatar>
				<Avatar>
					<AvatarFallback>JZ</AvatarFallback>
					<AvatarBadge />
				</Avatar>
				<Avatar size="lg">
					<AvatarFallback>JZ</AvatarFallback>
					<AvatarBadge />
				</Avatar>
			</div>
		</>
	);
}

export function AvatarDemoDefault() {
	return (
		<Avatar>
			<AvatarImage src={PRIMARY_AVATAR_SRC} alt="User avatar" />
			<AvatarFallback>CN</AvatarFallback>
		</Avatar>
	);
}

export function AvatarDemoGroupWithCount() {
	return (
		<>
			<AvatarGroup>
				<Avatar size="sm">
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Team member" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar size="sm">
					<AvatarImage
						src={GROUP_AVATAR_TWO_SRC}
						alt="Nova"
					/>
					<AvatarFallback>LR</AvatarFallback>
				</Avatar>
				<Avatar size="sm">
					<AvatarImage
						src={GROUP_AVATAR_THREE_SRC}
						alt="Maia Ma"
					/>
					<AvatarFallback>ER</AvatarFallback>
				</Avatar>
				<AvatarGroupCount>+3</AvatarGroupCount>
			</AvatarGroup>
			<AvatarGroup>
				<Avatar>
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Team member" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarImage
						src={GROUP_AVATAR_TWO_SRC}
						alt="Nova"
					/>
					<AvatarFallback>LR</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarImage
						src={GROUP_AVATAR_THREE_SRC}
						alt="Maia Ma"
					/>
					<AvatarFallback>ER</AvatarFallback>
				</Avatar>
				<AvatarGroupCount>+3</AvatarGroupCount>
			</AvatarGroup>
			<AvatarGroup>
				<Avatar size="lg">
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Team member" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar size="lg">
					<AvatarImage
						src={GROUP_AVATAR_TWO_SRC}
						alt="Nova"
					/>
					<AvatarFallback>LR</AvatarFallback>
				</Avatar>
				<Avatar size="lg">
					<AvatarImage
						src={GROUP_AVATAR_THREE_SRC}
						alt="Maia Ma"
					/>
					<AvatarFallback>ER</AvatarFallback>
				</Avatar>
				<AvatarGroupCount>+3</AvatarGroupCount>
			</AvatarGroup>
		</>
	);
}

export function AvatarDemoGroupWithIconCount() {
	return (
		<>
			<AvatarGroup>
				<Avatar size="sm">
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Team member" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar size="sm">
					<AvatarImage
						src={GROUP_AVATAR_TWO_SRC}
						alt="Nova"
					/>
					<AvatarFallback>LR</AvatarFallback>
				</Avatar>
				<Avatar size="sm">
					<AvatarImage
						src={GROUP_AVATAR_THREE_SRC}
						alt="Maia Ma"
					/>
					<AvatarFallback>ER</AvatarFallback>
				</Avatar>
				<AvatarGroupCount>
					<PlusIcon />
				</AvatarGroupCount>
			</AvatarGroup>
			<AvatarGroup>
				<Avatar>
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Team member" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarImage
						src={GROUP_AVATAR_TWO_SRC}
						alt="Nova"
					/>
					<AvatarFallback>LR</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarImage
						src={GROUP_AVATAR_THREE_SRC}
						alt="Maia Ma"
					/>
					<AvatarFallback>ER</AvatarFallback>
				</Avatar>
				<AvatarGroupCount>
					<PlusIcon />
				</AvatarGroupCount>
			</AvatarGroup>
			<AvatarGroup>
				<Avatar size="lg">
					<AvatarImage
						src={PRIMARY_AVATAR_SRC}
						alt="Team member"
						className="grayscale"
					/>
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar size="lg">
					<AvatarImage
						src={GROUP_AVATAR_TWO_SRC}
						alt="Nova"
						className="grayscale"
					/>
					<AvatarFallback>LR</AvatarFallback>
				</Avatar>
				<Avatar size="lg">
					<AvatarImage
						src={GROUP_AVATAR_THREE_SRC}
						alt="Maia Ma"
						className="grayscale"
					/>
					<AvatarFallback>ER</AvatarFallback>
				</Avatar>
				<AvatarGroupCount>
					<PlusIcon />
				</AvatarGroupCount>
			</AvatarGroup>
		</>
	);
}

export function AvatarDemoGroup() {
	return (
		<>
			<AvatarGroup>
				<Avatar size="sm">
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Team member" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar size="sm">
					<AvatarImage
						src={GROUP_AVATAR_TWO_SRC}
						alt="Nova"
					/>
					<AvatarFallback>LR</AvatarFallback>
				</Avatar>
				<Avatar size="sm">
					<AvatarImage
						src={GROUP_AVATAR_THREE_SRC}
						alt="Maia Ma"
					/>
					<AvatarFallback>ER</AvatarFallback>
				</Avatar>
			</AvatarGroup>
			<AvatarGroup>
				<Avatar>
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Team member" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarImage
						src={GROUP_AVATAR_TWO_SRC}
						alt="Nova"
					/>
					<AvatarFallback>LR</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarImage
						src={GROUP_AVATAR_THREE_SRC}
						alt="Maia Ma"
					/>
					<AvatarFallback>ER</AvatarFallback>
				</Avatar>
			</AvatarGroup>
			<AvatarGroup>
				<Avatar size="lg">
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Team member" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar size="lg">
					<AvatarImage
						src={GROUP_AVATAR_TWO_SRC}
						alt="Nova"
					/>
					<AvatarFallback>LR</AvatarFallback>
				</Avatar>
				<Avatar size="lg">
					<AvatarImage
						src={GROUP_AVATAR_THREE_SRC}
						alt="Maia Ma"
					/>
					<AvatarFallback>ER</AvatarFallback>
				</Avatar>
			</AvatarGroup>
		</>
	);
}

export function AvatarDemoInEmpty() {
	return (
		<Empty className="w-full flex-none border">
			<EmptyHeader>
				<EmptyMedia>
					<AvatarGroup>
						<Avatar size="lg">
							<AvatarImage
								src={PRIMARY_AVATAR_SRC}
								alt="Team member"
								className="grayscale"
							/>
							<AvatarFallback>CN</AvatarFallback>
						</Avatar>
						<Avatar size="lg">
							<AvatarImage
								src={GROUP_AVATAR_TWO_SRC}
								alt="Nova"
								className="grayscale"
							/>
							<AvatarFallback>LR</AvatarFallback>
						</Avatar>
						<Avatar size="lg">
							<AvatarImage
								src={GROUP_AVATAR_THREE_SRC}
								alt="Maia Ma"
								className="grayscale"
							/>
							<AvatarFallback>ER</AvatarFallback>
						</Avatar>
						<AvatarGroupCount>
							<PlusIcon />
						</AvatarGroupCount>
					</AvatarGroup>
				</EmptyMedia>
				<EmptyTitle>No Team Members</EmptyTitle>
				<EmptyDescription>
					Invite your team to collaborate on this project.
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button>
					<PlusIcon />
					Invite Members
				</Button>
			</EmptyContent>
		</Empty>
	);
}

export function AvatarDemoSizes() {
	return (
		<>
			<div className="flex flex-wrap items-center gap-2">
				<Avatar size="sm">
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="User avatar" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="User avatar" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar size="lg">
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="User avatar" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Avatar size="sm">
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar size="lg">
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
			</div>
		</>
	);
}

export function AvatarDemoShapes() {
	return (
		<div className="flex flex-wrap items-center gap-4">
			<div className="flex flex-col items-center gap-1">
				<Avatar>
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Circle" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<span className="text-xs text-text-subtle">Circle</span>
			</div>
			<div className="flex flex-col items-center gap-1">
				<Avatar shape="square">
					<AvatarImage src="/avatar-project/group.svg" alt="Square" />
					<AvatarFallback>SQ</AvatarFallback>
				</Avatar>
				<span className="text-xs text-text-subtle">Square</span>
			</div>
			<div className="flex flex-col items-center gap-1">
				<Avatar shape="hexagon">
					<AvatarImage src="/avatar-agent/dev-agents/code-planner.svg" alt="Hexagon" />
					<AvatarFallback>HX</AvatarFallback>
				</Avatar>
				<span className="text-xs text-text-subtle">Hexagon</span>
			</div>
		</div>
	);
}

export function AvatarDemoAllSizes() {
	return (
		<div className="flex flex-wrap items-end gap-3">
			<div className="flex flex-col items-center gap-1">
				<Avatar size="xs">
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="xs" />
					<AvatarFallback>XS</AvatarFallback>
				</Avatar>
				<span className="text-xs text-text-subtle">xs</span>
			</div>
			<div className="flex flex-col items-center gap-1">
				<Avatar size="sm">
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="sm" />
					<AvatarFallback>SM</AvatarFallback>
				</Avatar>
				<span className="text-xs text-text-subtle">sm</span>
			</div>
			<div className="flex flex-col items-center gap-1">
				<Avatar size="default">
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="default" />
					<AvatarFallback>DF</AvatarFallback>
				</Avatar>
				<span className="text-xs text-text-subtle">default</span>
			</div>
			<div className="flex flex-col items-center gap-1">
				<Avatar size="lg">
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="lg" />
					<AvatarFallback>LG</AvatarFallback>
				</Avatar>
				<span className="text-xs text-text-subtle">lg</span>
			</div>
			<div className="flex flex-col items-center gap-1">
				<Avatar size="xl">
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="xl" />
					<AvatarFallback>XL</AvatarFallback>
				</Avatar>
				<span className="text-xs text-text-subtle">xl</span>
			</div>
			<div className="flex flex-col items-center gap-1">
				<Avatar size="2xl">
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="2xl" />
					<AvatarFallback>2X</AvatarFallback>
				</Avatar>
				<span className="text-xs text-text-subtle">2xl</span>
			</div>
		</div>
	);
}

export function AvatarDemoPresence() {
	return (
		<div className="flex flex-wrap items-center gap-4">
			<div className="flex flex-col items-center gap-1">
				<Avatar>
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Online" />
					<AvatarFallback>CN</AvatarFallback>
					<AvatarPresenceIndicator presence="online" />
				</Avatar>
				<span className="text-xs text-text-subtle">Online</span>
			</div>
			<div className="flex flex-col items-center gap-1">
				<Avatar>
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Busy" />
					<AvatarFallback>CN</AvatarFallback>
					<AvatarPresenceIndicator presence="busy" />
				</Avatar>
				<span className="text-xs text-text-subtle">Busy</span>
			</div>
			<div className="flex flex-col items-center gap-1">
				<Avatar>
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Focus" />
					<AvatarFallback>CN</AvatarFallback>
					<AvatarPresenceIndicator presence="focus" />
				</Avatar>
				<span className="text-xs text-text-subtle">Focus</span>
			</div>
			<div className="flex flex-col items-center gap-1">
				<Avatar>
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Offline" />
					<AvatarFallback>CN</AvatarFallback>
					<AvatarPresenceIndicator presence="offline" />
				</Avatar>
				<span className="text-xs text-text-subtle">Offline</span>
			</div>
		</div>
	);
}

export function AvatarDemoStatus() {
	return (
		<div className="flex flex-wrap items-center gap-4">
			<div className="flex flex-col items-center gap-1">
				<Avatar>
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Approved" />
					<AvatarFallback>CN</AvatarFallback>
					<AvatarStatusIndicator status="approved" />
				</Avatar>
				<span className="text-xs text-text-subtle">Approved</span>
			</div>
			<div className="flex flex-col items-center gap-1">
				<Avatar>
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Declined" />
					<AvatarFallback>CN</AvatarFallback>
					<AvatarStatusIndicator status="declined" />
				</Avatar>
				<span className="text-xs text-text-subtle">Declined</span>
			</div>
			<div className="flex flex-col items-center gap-1">
				<Avatar>
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Locked" />
					<AvatarFallback>CN</AvatarFallback>
					<AvatarStatusIndicator status="locked" />
				</Avatar>
				<span className="text-xs text-text-subtle">Locked</span>
			</div>
		</div>
	);
}

export function AvatarDemoDisabled() {
	return (
		<div className="flex flex-wrap items-center gap-4">
			<div className="flex flex-col items-center gap-1">
				<Avatar disabled>
					<AvatarImage src={PRIMARY_AVATAR_SRC} alt="Disabled circle" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<span className="text-xs text-text-subtle">Circle</span>
			</div>
			<div className="flex flex-col items-center gap-1">
				<Avatar disabled shape="square">
					<AvatarImage src="/avatar-project/group.svg" alt="Disabled square" />
					<AvatarFallback>SQ</AvatarFallback>
				</Avatar>
				<span className="text-xs text-text-subtle">Square</span>
			</div>
			<div className="flex flex-col items-center gap-1">
				<Avatar disabled shape="hexagon">
					<AvatarImage src="/avatar-agent/dev-agents/code-planner.svg" alt="Disabled hexagon" />
					<AvatarFallback>HX</AvatarFallback>
				</Avatar>
				<span className="text-xs text-text-subtle">Hexagon</span>
			</div>
		</div>
	);
}
