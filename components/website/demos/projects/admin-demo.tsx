"use client";

import AdminProjectPage from "@/components/projects/admin/page";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

export default function AdminDemo() {
	const embedded = useProjectDemoEmbedded();

	return <AdminProjectPage embedded={embedded} />;
}
