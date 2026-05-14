"use client";

import { useServerInsertedHTML } from "next/navigation";

type PreHydrationScriptProps = {
	children: string;
	id: string;
};

export function PreHydrationScript({ children, id }: PreHydrationScriptProps) {
	useServerInsertedHTML(() => (
		<script
			id={id}
			dangerouslySetInnerHTML={{ __html: children }}
		/>
	));

	return null;
}
