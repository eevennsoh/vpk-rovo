"use client"

import type { VpkIconComponent } from "@/components/ui/vpk-icons"
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavSecondaryProps
	extends React.ComponentPropsWithoutRef<typeof SidebarGroup> {
	items: ReadonlyArray<{
		title: string
		url: string
		icon: VpkIconComponent
	}>
}

export function NavSecondary({
	items,
	...props
}: Readonly<NavSecondaryProps>) {
	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => {
						const Icon = item.icon
						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton render={<a href={item.url} />}>
									<Icon />
									<span>{item.title}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						)
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}
