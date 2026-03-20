"use client";

import FutureChatPage from "@/components/projects/future-chat/page";
import { usePathname } from "next/navigation";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

export default function FutureChatDemo() {
	const pathname = usePathname();
	const embedded = useProjectDemoEmbedded() && !pathname.startsWith("/components/");

	return <FutureChatPage embedded={embedded} />;
}
