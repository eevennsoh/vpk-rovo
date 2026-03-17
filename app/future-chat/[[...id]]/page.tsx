"use client";

import { use } from "react";
import FutureChatPage from "@/components/projects/future-chat/page";

interface FutureChatCatchAllPageProps {
	params: Promise<{ id?: string[] }>;
}

export default function FutureChatCatchAllPage({
	params,
}: Readonly<FutureChatCatchAllPageProps>) {
	const { id } = use(params);
	return <FutureChatPage initialThreadId={id?.[0] ?? null} />;
}
