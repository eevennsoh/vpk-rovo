"use client";

import StudioPage from "@/components/projects/studio/page";
import { usePathname } from "next/navigation";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

export default function StudioDemo() {
	const pathname = usePathname() ?? "";
	const embedded = useProjectDemoEmbedded() && !pathname.startsWith("/components/");

	return <StudioPage embedded={embedded} />;
}
