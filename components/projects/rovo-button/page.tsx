"use client";

import { AnimatePresence } from "motion/react";
import AppLayout from "@/components/projects/page";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import { useRovoChat } from "@/app/contexts";

interface RovoButtonProjectPageProps {
	embedded?: boolean;
}

export default function RovoButtonProjectPage({
	embedded = false,
}: Readonly<RovoButtonProjectPageProps>) {
	const { chatSurface } = useRovoChat();

	return (
		<AppLayout product="home" embedded={embedded} hideFloatingRovo>
			<div className="relative h-full w-full">
				{chatSurface === null ? <FloatingRovoButton product="home" forceVisible /> : null}
				<AnimatePresence>
					{chatSurface === "floating" ? <RovoFloatingChat key="floating-chat" /> : null}
				</AnimatePresence>
			</div>
		</AppLayout>
	);
}
