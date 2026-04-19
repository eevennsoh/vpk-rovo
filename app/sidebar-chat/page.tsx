"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function SidebarChatContent() {
	const Demo = use(loadDemoComponent("sidebar-chat", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function SidebarChatPage() {
	return (
		<Suspense>
			<SidebarChatContent />
		</Suspense>
	);
}
