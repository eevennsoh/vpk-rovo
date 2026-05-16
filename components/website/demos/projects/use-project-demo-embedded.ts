"use client";

import { usePathname } from "next/navigation";

export function useProjectDemoEmbedded(): boolean {
	const pathname = usePathname();

	return pathname.startsWith("/components/");
}
