"use client";

import { use } from "react";
import RovoAppPage from "@/components/projects/rovo-app/page";

interface RovoAppCatchAllPageProps {
	params: Promise<{ id?: string[] }>;
}

export default function RovoAppCatchAllPage({
	params,
}: Readonly<RovoAppCatchAllPageProps>) {
	const { id } = use(params);
	return <RovoAppPage initialThreadId={id?.[0] ?? null} />;
}
