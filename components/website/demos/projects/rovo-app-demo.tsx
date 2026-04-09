"use client";

import RovoAppPage from "@/components/projects/rovo-app/page";
import { usePathname } from "next/navigation";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

export default function RovoAppDemo() {
	const pathname = usePathname() ?? "";
	const embedded = useProjectDemoEmbedded() && !pathname.startsWith("/components/");

	return <RovoAppPage embedded={embedded} />;
}
