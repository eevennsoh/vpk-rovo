"use client";

import { useRouter } from "next/navigation";
import FullscreenEnterIcon from "@atlaskit/icon/core/fullscreen-enter";
import LinkExternalIcon from "@atlaskit/icon/core/link-external";
import PanelRightIcon from "@atlaskit/icon/core/panel-right";
import SmartLinkEmbedIcon from "@atlaskit/icon/core/smart-link-embed";

import {
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useRovoChat } from "@/app/contexts";
import { cn } from "@/lib/utils";

export type CurrentSurface = "sidebar" | "floating";

interface ChatSurfaceSwitcherItemsProps {
	currentSurface: CurrentSurface;
}

const currentItemClass =
	"bg-bg-selected data-[highlighted]:bg-bg-selected-hovered [&>span>span]:font-medium [&>span]:text-text-selected [&_svg]:text-icon-selected";

export function ChatSurfaceSwitcherItems({
	currentSurface,
}: Readonly<ChatSurfaceSwitcherItemsProps>) {
	const router = useRouter();
	const { switchSurface, closeChat } = useRovoChat();

	const handleSelectFullscreen = () => {
		closeChat();
		router.push("/rovo");
	};

	return (
		<DropdownMenuGroup>
			<DropdownMenuLabel>Switch to</DropdownMenuLabel>
			<DropdownMenuItem
				elemBefore={<PanelRightIcon label="" />}
				className={cn(currentSurface === "sidebar" && currentItemClass)}
				onClick={() => switchSurface("sidebar")}
			>
				Side panel
			</DropdownMenuItem>
			<DropdownMenuItem
				elemBefore={<SmartLinkEmbedIcon label="" />}
				className={cn(currentSurface === "floating" && currentItemClass)}
				onClick={() => switchSurface("floating")}
			>
				Floating
			</DropdownMenuItem>
			<DropdownMenuItem
				elemBefore={<FullscreenEnterIcon label="" />}
				elemAfter={
					<span className="opacity-0 group-data-[highlighted]/dropdown-menu-item:opacity-100">
						<LinkExternalIcon label="" />
					</span>
				}
				onClick={handleSelectFullscreen}
			>
				Full screen
			</DropdownMenuItem>
		</DropdownMenuGroup>
	);
}
