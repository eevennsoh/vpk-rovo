"use client";

import { useEffect, useState } from "react";

function getProjectDemoLocationSnapshot(): string {
	if (typeof window === "undefined") {
		return "";
	}

	return `${window.location.pathname}${window.location.search}`;
}

function resolveProjectDemoEmbedded(locationSnapshot: string): boolean {
	const [pathname = "", search = ""] = locationSnapshot.split("?");
	const searchParams = new URLSearchParams(search);

	return pathname.startsWith("/components/") || searchParams.get("embedded") === "1";
}

export function useProjectDemoEmbedded(): boolean {
	const [locationSnapshot, setLocationSnapshot] = useState("");

	useEffect(() => {
		const updateLocationSnapshot = () => {
			setLocationSnapshot(getProjectDemoLocationSnapshot());
		};

		updateLocationSnapshot();
		window.addEventListener("popstate", updateLocationSnapshot);
		return () => window.removeEventListener("popstate", updateLocationSnapshot);
	}, []);

	return resolveProjectDemoEmbedded(locationSnapshot);
}
