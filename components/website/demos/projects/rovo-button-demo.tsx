"use client";

import RovoButtonProjectPage from "@/components/projects/rovo-button/page";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

export default function RovoButtonDemo() {
	const embedded = useProjectDemoEmbedded();

	return <RovoButtonProjectPage embedded={embedded} />;
}
