"use client";

import { RovoChatProvider } from "@/app/contexts";
import { SidebarProvider } from "@/app/contexts/context-sidebar";
import AppLayout from "@/components/projects/page";
import ConfluenceView from "@/components/projects/confluence/page";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

export default function ConfluenceDemo() {
	const embedded = useProjectDemoEmbedded();

	return (
		<SidebarProvider>
			<RovoChatProvider>
				<AppLayout product="confluence" embedded={embedded}>
					<ConfluenceView embedded={embedded} />
				</AppLayout>
			</RovoChatProvider>
		</SidebarProvider>
	);
}
