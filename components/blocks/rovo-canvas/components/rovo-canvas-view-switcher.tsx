"use client";

import type { ComponentType, ReactNode } from "react";
import AngleBracketsIcon from "@atlaskit/icon/core/angle-brackets";
import AppsIcon from "@atlaskit/icon/core/apps";
import FileIcon from "@atlaskit/icon/core/file";
import ListChecklistIcon from "@atlaskit/icon/core/list-checklist";
import PersonAvatarIcon from "@atlaskit/icon/core/person-avatar";
import ScreenIcon from "@atlaskit/icon/core/screen";

import { Icon as VpkIcon } from "@/components/ui/icon";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export type RovoCanvasViewIcon = ComponentType<{
	label: string;
}>;

export type RovoCanvasToolbarMode = "preview" | "source" | "none";

export interface RovoCanvasView {
	id: string;
	label: string;
	icon?: RovoCanvasViewIcon;
	toolbar?: RovoCanvasToolbarMode;
	copyText?: string;
	content?: ReactNode;
}

interface RovoCanvasViewSwitcherProps {
	views: ReadonlyArray<RovoCanvasView>;
}

function getFallbackIcon(viewId: string): RovoCanvasViewIcon {
	if (viewId === "preview") {
		return ScreenIcon;
	}

	if (viewId === "html" || viewId === "code") {
		return AngleBracketsIcon;
	}

	if (viewId.includes("surface")) {
		return AppsIcon;
	}

	if (viewId.includes("rule") || viewId.includes("setup")) {
		return ListChecklistIcon;
	}

	if (viewId.includes("agent")) {
		return PersonAvatarIcon;
	}

	return FileIcon;
}

export function RovoCanvasViewSwitcher({
	views,
}: Readonly<RovoCanvasViewSwitcherProps>): React.ReactElement {
	return (
		<TabsList
			aria-label="Canvas view"
			className="h-8 rounded-md border border-border bg-surface p-0.5"
		>
			{views.map((view) => {
				const IconComponent = view.icon ?? getFallbackIcon(view.id);

				return (
					<TabsTrigger
						key={view.id}
						value={view.id}
						aria-label={view.label}
						className="size-7 flex-none px-0"
					>
						<VpkIcon render={<IconComponent label="" />} className="size-4" />
					</TabsTrigger>
				);
			})}
		</TabsList>
	);
}
