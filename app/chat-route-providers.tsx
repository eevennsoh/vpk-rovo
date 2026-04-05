"use client";

import type { ReactNode } from "react";
import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";

export function ChatRouteProviders({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return <RovoChatProvider>{children}</RovoChatProvider>;
}
