"use client";

import dynamic from "next/dynamic";

const DevAgentationClient = dynamic(
	() =>
		import("@/components/utils/dev-agentation-client").then(
			(m) => m.DevAgentationClient
		),
	{ ssr: false }
);

export function DevAgentationMount() {
	if (process.env.NODE_ENV !== "development") {
		return null;
	}

	return <DevAgentationClient />;
}
