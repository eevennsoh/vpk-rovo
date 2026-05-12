"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function ContactsContent() {
	const Demo = use(loadDemoComponent("contacts", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function ContactsPage() {
	return (
		<Suspense>
			<ContactsContent />
		</Suspense>
	);
}
