"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { token } from "@/lib/tokens";
import NotificationIcon from "@atlaskit/icon/core/notification";
import QuestionCircleIcon from "@atlaskit/icon/core/question-circle";
import SettingsIcon from "@atlaskit/icon/core/settings";
import ThemeIcon from "@atlaskit/icon/core/theme";

type Product = "admin" | "agents" | "home" | "jira" | "confluence" | "rovo" | "search";

interface RightNavigationProps {
	product: Product;
	windowWidth: number;
	hideRovoAction?: boolean;
	isChatOpen?: boolean;
	onToggleChat: () => void;
	onToggleTheme: () => void;
}

export function RightNavigation({
	product,
	windowWidth,
	hideRovoAction = false,
	isChatOpen = false,
	onToggleChat,
	onToggleTheme,
}: Readonly<RightNavigationProps>) {
	const containerStyle = {
		display: "flex",
		alignItems: "center",
		gap: token("space.050"),
		flexShrink: 0,
		justifyContent: "flex-end",
		marginLeft: "8px",
	};

	return (
		<div style={containerStyle}>
			{/* Rovo chat button - hidden when on Rovo page */}
			{product !== "rovo" && !hideRovoAction ? (
				<>
					{windowWidth >= 768 ? (
						<Button
							variant="outline"
							className="text-text-subtle"
							aria-pressed={isChatOpen}
							onClick={onToggleChat}
						>
							<Image src="/1p/rovo.svg" alt="" width={16} height={16} data-icon="inline-start" />
							Ask Rovo
						</Button>
					) : (
						<Button
							aria-label="Ask Rovo"
							size="icon"
							variant="outline"
							className="text-text-subtle"
							aria-pressed={isChatOpen}
							onClick={onToggleChat}
						>
							<Image src="/1p/rovo.svg" alt="" width={16} height={16} />
						</Button>
					)}
				</>
			) : null}

			{/* Notifications */}
			<Button aria-label="Notifications" size="icon" variant="ghost">
				<NotificationIcon label="" color={token("color.icon.subtle")} />
			</Button>

			{/* Help */}
			<Button aria-label="Help" size="icon" variant="ghost">
				<QuestionCircleIcon label="" color={token("color.icon.subtle")} />
			</Button>

			{/* Settings */}
			<Button aria-label="Settings" size="icon" variant="ghost">
				<SettingsIcon label="" color={token("color.icon.subtle")} />
			</Button>

			{/* Theme Toggle */}
			<Button aria-label="Toggle theme" size="icon" variant="ghost" onClick={onToggleTheme}>
				<ThemeIcon label="" color={token("color.icon.subtle")} />
			</Button>

			{/* Profile */}
			<div className="flex size-8 items-center justify-center">
				<Avatar size="sm">
					<AvatarImage src="/avatar-user/venn/venn.png" alt="Venn avatar" />
					<AvatarFallback>VN</AvatarFallback>
				</Avatar>
			</div>
		</div>
	);
}
