"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import {
	DatabaseIcon,
	SearchIcon,
	SettingsIcon,
	TreePineIcon,
} from "@/components/ui/vpk-icons";
import ScorecardIcon from "@atlaskit/icon/core/scorecard";
import { cn } from "@/lib/utils";

import { CONTROL_PLANE_SURFACES } from "./lib/control-plane-data";

function getSurfaceIcon(label: string) {
	switch (label) {
		case "Tasks":
			return <ScorecardIcon label="" />;
		case "Memories":
			return <DatabaseIcon />;
		case "Skills":
			return <TreePineIcon />;
		case "Wiki":
			return <SearchIcon />;
		case "Settings":
			return <SettingsIcon />;
		default:
			return <DatabaseIcon />;
	}
}

export function ControlPlaneSurfaceNav() {
	const pathname = usePathname() ?? "";

	return (
		<nav aria-label="Control plane surfaces" className="flex flex-wrap gap-2">
			{CONTROL_PLANE_SURFACES.map((surface) => {
				const isActive =
					pathname === surface.href || pathname.startsWith(`${surface.href}/`);

				return (
					<Link
						className={cn(
							"inline-flex items-center gap-2 rounded-full border px-3 py-2 text-left text-sm transition-colors",
							isActive
								? "border-border-selected bg-bg-selected text-text-selected hover:bg-bg-selected-hovered"
								: "border-border bg-surface-raised text-text-subtle hover:bg-bg-neutral-subtle-hovered",
						)}
						key={surface.href}
						href={surface.href}
					>
						<Icon aria-hidden className="shrink-0" render={getSurfaceIcon(surface.label)} />
						<span className="min-w-0">
							<span className="block font-medium">{surface.label}</span>
							<span className="block text-xs text-text-subtlest">{surface.description}</span>
						</span>
					</Link>
				);
			})}
		</nav>
	);
}
