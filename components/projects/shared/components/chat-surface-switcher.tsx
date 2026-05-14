"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import FullscreenEnterIcon from "@atlaskit/icon/core/fullscreen-enter";
import LinkExternalIcon from "@atlaskit/icon/core/link-external";
import PanelRightIcon from "@atlaskit/icon/core/panel-right";
import SmartLinkEmbedIcon from "@atlaskit/icon/core/smart-link-embed";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRovoChat } from "@/app/contexts";
import { cn } from "@/lib/utils";

export type CurrentSurface = "sidebar" | "floating" | "fullscreen";

interface ChatSurfaceSwitcherProps {
	currentSurface: CurrentSurface;
}

const currentItemClass =
	"bg-bg-selected data-[highlighted]:bg-bg-selected-hovered [&>span>span]:font-medium [&>span]:text-text-selected [&_svg]:text-icon-selected";

export default function ChatSurfaceSwitcher({
	currentSurface,
}: Readonly<ChatSurfaceSwitcherProps>) {
	const router = useRouter();
	const { switchSurface, closeChat } = useRovoChat();

	const handleSelectSidebar = () => {
		if (currentSurface === "fullscreen") {
			router.back();
		}
		switchSurface("sidebar");
	};

	const handleSelectFloating = () => {
		if (currentSurface === "fullscreen") {
			router.back();
		}
		switchSurface("floating");
	};

	const handleSelectFullscreen = () => {
		closeChat();
		router.push("/rovo");
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<button
						type="button"
						aria-label="Switch chat surface"
						className="flex items-center gap-2 rounded-sm px-1 py-0.5 outline-none hover:bg-bg-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-border-focused"
					/>
				}
			>
				<Image src="/1p/rovo.svg" alt="" width={16} height={16} aria-hidden />
				<span className="text-sm font-semibold text-text">Rovo</span>
				<ChevronDownIcon label="" size="small" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" sideOffset={6} className="min-w-[200px]">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Switch to</DropdownMenuLabel>
					<DropdownMenuItem
						elemBefore={<PanelRightIcon label="" />}
						className={cn(currentSurface === "sidebar" && currentItemClass)}
						onClick={handleSelectSidebar}
					>
						Side panel
					</DropdownMenuItem>
					<DropdownMenuItem
						elemBefore={<SmartLinkEmbedIcon label="" />}
						className={cn(currentSurface === "floating" && currentItemClass)}
						onClick={handleSelectFloating}
					>
						Floating
					</DropdownMenuItem>
					<DropdownMenuItem
						elemBefore={<FullscreenEnterIcon label="" />}
						elemAfter={
							currentSurface === "fullscreen" ? null : (
								<span className="opacity-0 group-data-[highlighted]/dropdown-menu-item:opacity-100">
									<LinkExternalIcon label="" />
								</span>
							)
						}
						className={cn(currentSurface === "fullscreen" && currentItemClass)}
						onClick={handleSelectFullscreen}
					>
						Full screen
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
