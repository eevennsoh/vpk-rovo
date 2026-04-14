"use client";

import { RovoChatProvider } from "@/app/contexts";
import { SidebarProvider } from "@/app/contexts/context-sidebar";
import AppLayout from "@/components/projects/page";
import SearchResultsView from "@/components/projects/search/page";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

export default function SearchDemo() {
	const embedded = useProjectDemoEmbedded();

	return (
		<SidebarProvider>
			<RovoChatProvider>
				<AppLayout product="search" embedded={embedded}>
					<SearchResultsView />
				</AppLayout>
			</RovoChatProvider>
		</SidebarProvider>
	);
}
