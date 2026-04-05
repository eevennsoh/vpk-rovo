"use client"

import * as React from "react"

import { NavFavorites } from "./nav-favorites"
import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavWorkspaces } from "./nav-workspaces"
import { TeamSwitcher } from "./team-switcher"
import {
	TEAMS,
	NAV_MAIN_ITEMS,
	NAV_SECONDARY_ITEMS,
	FAVORITES,
	WORKSPACES,
} from "../data/sidebar-data"
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar"

export function SidebarLeft({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar className="border-r-0" {...props}>
			<SidebarHeader>
				<TeamSwitcher teams={TEAMS} />
				<NavMain items={NAV_MAIN_ITEMS} />
			</SidebarHeader>
			<SidebarContent>
				<NavFavorites favorites={FAVORITES} />
				<NavWorkspaces workspaces={WORKSPACES} />
				<NavSecondary items={NAV_SECONDARY_ITEMS} className="mt-auto" />
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	)
}
