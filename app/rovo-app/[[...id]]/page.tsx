"use client";

import { use } from "react";
import RovoPage from "@/components/projects/rovo/page";

interface RovoAppCatchAllPageProps {
	params: Promise<{ id?: string[] }>;
}

export default function RovoAppCatchAllPage({
	params,
}: Readonly<RovoAppCatchAllPageProps>) {
	const { id } = use(params);
	return <RovoPage initialThreadId={id?.[0] ?? null} />;
}
