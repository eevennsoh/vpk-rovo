"use client"

import {
	FolderIcon,
	MoreHorizontalIcon,
	ShareIcon,
	type VpkIconComponent,
} from "@/components/ui/vpk-icons"

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar"

interface NavDocumentsProps {
	items: readonly {
		name: string
		url: string
		icon: VpkIconComponent
	}[]
}

export function NavDocuments({ items }: Readonly<NavDocumentsProps>) {
	const { isMobile } = useSidebar()

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>Documents</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<SidebarMenuItem key={item.name}>
						<SidebarMenuButton render={<a href={item.url} />}>
							<item.icon />
							<span>{item.name}</span>
						</SidebarMenuButton>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<SidebarMenuAction
										showOnHover
										className="rounded-sm data-[state=open]:bg-accent"
									/>
								}
							>
								<MoreHorizontalIcon />
								<span className="sr-only">More</span>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								className="w-24 rounded-lg"
								side={isMobile ? "bottom" : "right"}
								align={isMobile ? "end" : "start"}
							>
								<DropdownMenuItem>
									<FolderIcon />
									<span>Open</span>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<ShareIcon />
									<span>Share</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				))}
				<SidebarMenuItem>
					<SidebarMenuButton className="text-sidebar-foreground/70">
						<MoreHorizontalIcon className="text-sidebar-foreground/70" />
						<span>More</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	)
}
