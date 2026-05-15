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
import {
	buildRovoAppThreadPath,
	ROVO_APP_ROOT_PATH,
} from "@/components/projects/rovo/lib/rovo-app-thread-route-sync";
import { cn } from "@/lib/utils";

export type CurrentSurface = "sidebar" | "floating";
export type ChatSurfaceSwitchHandler = (surface: CurrentSurface) => void;

interface ChatSurfaceSwitcherItemsProps {
	currentSurface: CurrentSurface;
	onSurfaceSwitch?: ChatSurfaceSwitchHandler;
}

const currentItemClass =
	"bg-bg-selected data-[highlighted]:bg-bg-selected-hovered [&>span>span]:font-medium [&>span]:text-text-selected [&_svg]:text-icon-selected";

export function ChatSurfaceSwitcherItems({
	currentSurface,
	onSurfaceSwitch,
}: Readonly<ChatSurfaceSwitcherItemsProps>) {
	const router = useRouter();
	const { activeThreadId, switchSurface, closeChat } = useRovoChat();

	const handleSelectSurface = (surface: CurrentSurface) => {
		onSurfaceSwitch?.(surface);
		switchSurface(surface);
	};

	const handleSelectFullscreen = () => {
		closeChat();
		router.push(activeThreadId ? buildRovoAppThreadPath(activeThreadId) : ROVO_APP_ROOT_PATH);
	};

	return (
		<DropdownMenuGroup>
			<DropdownMenuLabel>Switch to</DropdownMenuLabel>
			<DropdownMenuItem
				elemBefore={<PanelRightIcon label="" />}
				className={cn(currentSurface === "sidebar" && currentItemClass)}
				onSelect={() => handleSelectSurface("sidebar")}
			>
				Side panel
			</DropdownMenuItem>
			<DropdownMenuItem
				elemBefore={<SmartLinkEmbedIcon label="" />}
				className={cn(currentSurface === "floating" && currentItemClass)}
				onSelect={() => handleSelectSurface("floating")}
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
				onSelect={handleSelectFullscreen}
			>
				Full screen
			</DropdownMenuItem>
		</DropdownMenuGroup>
	);
}
