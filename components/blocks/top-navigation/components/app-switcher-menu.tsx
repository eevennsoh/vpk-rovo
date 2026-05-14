"use client";

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import { HomeIcon, RovoIcon } from "@/components/ui/logo";

interface AppSwitcherMenuProps {
	onNavigate: (path: string) => void;
}

const appSwitcherItems = [
	{ path: "/", label: "Home", icon: HomeIcon },
	{ path: "/rovo", label: "Rovo", icon: RovoIcon },
] as const;

export function AppSwitcherMenu({ onNavigate }: Readonly<AppSwitcherMenuProps>) {
	return (
		<div
			style={{
				backgroundColor: token("elevation.surface.overlay"),
				borderRadius: token("radius.small"),
				boxShadow: token("elevation.shadow.overlay"),
				overflow: "hidden",
				minWidth: "320px",
				maxWidth: "320px",
			}}
		>
			<div className="space-y-0.5 p-2">
				{appSwitcherItems.map((item) => {
					const ItemIcon = item.icon;
					return (
						<Button
							key={item.path}
							type="button"
							variant="ghost"
							className="h-auto w-full justify-start gap-2 rounded-md px-3 py-2 text-sm font-normal text-text hover:bg-bg-neutral-subtle-hovered"
							onClick={() => onNavigate(item.path)}
						>
							<ItemIcon />
							<span>{item.label}</span>
						</Button>
					);
				})}
			</div>
		</div>
	);
}
