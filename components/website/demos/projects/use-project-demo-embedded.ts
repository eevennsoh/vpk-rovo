"use client";

import { usePathname, useSearchParams } from "next/navigation";

export function useProjectDemoEmbedded(): boolean {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	return pathname.startsWith("/components/") || searchParams.get("embedded") === "1";
}
