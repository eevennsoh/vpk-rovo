"use client";

import MakeView from "@/components/projects/make/page";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

export default function MakeDemo() {
	const embedded = useProjectDemoEmbedded();

	return <MakeView embedded={embedded} />;
}
