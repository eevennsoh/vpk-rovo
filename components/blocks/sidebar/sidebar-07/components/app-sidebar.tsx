"use client"

import * as React from "react"

import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { USER_DATA, TEAMS, NAV_MAIN_ITEMS, PROJECTS } from "../data/sidebar-data"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={TEAMS} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={NAV_MAIN_ITEMS} />
        <NavProjects projects={PROJECTS} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={USER_DATA} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
