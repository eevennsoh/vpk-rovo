"use client";

import { RovoChatProvider } from "@/app/contexts";
import { SidebarProvider } from "@/app/contexts/context-sidebar";
import AppLayout from "@/components/projects/page";
import ContactsView from "@/components/projects/contacts/page";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

export default function ContactsDemo() {
	const embedded = useProjectDemoEmbedded();

	return (
		<SidebarProvider>
			<RovoChatProvider>
				<AppLayout product="home" embedded={embedded}>
					<ContactsView />
				</AppLayout>
			</RovoChatProvider>
		</SidebarProvider>
	);
}
