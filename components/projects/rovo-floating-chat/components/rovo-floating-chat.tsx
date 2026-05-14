"use client";

import { motion } from "motion/react";
import { token } from "@/lib/tokens";
import { useRovoChat } from "@/app/contexts";
import type { ChatSurfaceSwitchHandler } from "@/components/projects/shared/components/chat-surface-switcher";
import ChatPanel from "@/components/projects/sidebar-chat/page";
import FloatingChatHeader from "./floating-chat-header";

interface RovoFloatingChatProps {
	onSurfaceSwitch?: ChatSurfaceSwitchHandler;
}

export default function RovoFloatingChat({
	onSurfaceSwitch,
}: Readonly<RovoFloatingChatProps>) {
	const { closeChat, resetChat } = useRovoChat();

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 8 }}
			transition={{ duration: 0.2, ease: [0, 0.4, 0, 1] }}
			className="fixed right-6 bottom-6 z-[510] flex max-h-[min(720px,calc(100dvh-96px))] w-[400px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-2xl bg-surface-overlay"
			style={{
				boxShadow: token("elevation.shadow.overlay"),
				willChange: "transform, opacity",
			}}
		>
			<FloatingChatHeader
				onClose={closeChat}
				onNewChat={resetChat}
				onSurfaceSwitch={onSurfaceSwitch}
			/>
			<ChatPanel
				onClose={closeChat}
				hideHeader
				abortOnUnmount={false}
				containerClassName="min-h-0 flex-1"
				containerStyle={{
					backgroundColor: "transparent",
					borderRadius: 0,
					borderWidth: 0,
				}}
				onSurfaceSwitch={onSurfaceSwitch}
			/>
		</motion.div>
	);
}
