"use client"

import type { VpkIconComponent } from "@/components/ui/vpk-icons"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
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
import {
	FolderIcon,
	MoreHorizontal,
	ShareIcon,
	Trash2Icon,
} from "@/components/ui/vpk-icons"

interface NavDocumentsProps {
	items: ReadonlyArray<{
		name: string
		url: string
		icon: VpkIconComponent
	}>
}

export function NavDocuments({ items }: Readonly<NavDocumentsProps>) {
	const { isMobile } = useSidebar()

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>Documents</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => {
					const Icon = item.icon
					return (
						<SidebarMenuItem key={item.name}>
							<SidebarMenuButton render={<a href={item.url} />}>
								<Icon />
								<span>{item.name}</span>
							</SidebarMenuButton>
							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<SidebarMenuAction
											showOnHover
											className="aria-expanded:bg-muted"
										/>
									}
								>
									<MoreHorizontal />
									<span className="sr-only">More</span>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									className="w-24"
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
									<DropdownMenuSeparator />
									<DropdownMenuItem variant="destructive">
										<Trash2Icon />
										<span>Delete</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					)
				})}
				<SidebarMenuItem>
					<SidebarMenuButton className="text-sidebar-foreground/70">
						<MoreHorizontal className="text-sidebar-foreground/70" />
						<span>More</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	)
}
