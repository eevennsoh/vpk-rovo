"use client";

import ChatPanel from "@/components/projects/sidebar-chat/page";

interface RovoCanvasRightRailProps {
	onClose: () => void;
}

export function RovoCanvasRightRail({
	onClose,
}: Readonly<RovoCanvasRightRailProps>): React.ReactElement {
	return (
		<ChatPanel
			onClose={onClose}
			enableSmartWidgets
			abortOnUnmount={false}
			sendPromptOptions={{
				smartGeneration: {
					enabled: true,
					surface: "sidebar",
				},
			}}
		/>
	);
}
