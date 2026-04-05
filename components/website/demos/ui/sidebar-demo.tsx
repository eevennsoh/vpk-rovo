import HomeIcon from "@atlaskit/icon/core/home";
import SearchIcon from "@atlaskit/icon/core/search";
import SettingsIcon from "@atlaskit/icon/core/settings";
import { LayoutDashboardIcon } from "@/components/ui/vpk-icons";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function SidebarDemo() {
	return (
		<div className="flex w-32 flex-col gap-1 rounded-md border p-2">
			<span className="px-2 py-1 text-xs font-medium text-muted-foreground">Navigation</span>
			<Button variant="ghost" size="sm" className="justify-start">
				<LayoutDashboardIcon className="size-4" />
				Dashboard
			</Button>
			<Button variant="ghost" size="sm" className="justify-start">
				Settings
			</Button>
		</div>
	);
}

export function SidebarDemoCollapsed() {
	const items = [
		{ title: "Home", url: "#", icon: HomeIcon },
		{ title: "Search", url: "#", icon: SearchIcon },
		{ title: "Settings", url: "#", icon: SettingsIcon },
	];

	return (
		<SidebarProvider defaultOpen={false}>
			<Sidebar collapsible="icon">
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>Application</SidebarGroupLabel>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton tooltip={item.title}>
										<item.icon label="" />
										<span>{item.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroup>
				</SidebarContent>
			</Sidebar>
			<SidebarInset>
				<header className="flex items-center gap-2 border-b p-4">
					<SidebarTrigger />
					<span className="text-sm font-medium">Collapsed sidebar</span>
				</header>
				<div className="p-4">
					<p className="text-sm text-muted-foreground">Sidebar starts collapsed with icon mode.</p>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}

export function SidebarDemoDefault() {
	const items = [
		{ title: "Home", url: "#", icon: HomeIcon },
		{ title: "Search", url: "#", icon: SearchIcon },
		{ title: "Settings", url: "#", icon: SettingsIcon },
	];

	return (
		<SidebarProvider>
			<Sidebar>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>Application</SidebarGroupLabel>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton>
										<item.icon label="" />
										<span>{item.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroup>
				</SidebarContent>
			</Sidebar>
			<SidebarInset>
				<header className="flex items-center gap-2 border-b p-4">
					<SidebarTrigger />
					<span className="text-sm font-medium">Application</span>
				</header>
				<div className="p-4">
					<p className="text-sm text-muted-foreground">Main content area</p>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
