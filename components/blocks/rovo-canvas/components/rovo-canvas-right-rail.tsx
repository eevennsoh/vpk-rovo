"use client";

import ChatPanel from "@/components/projects/sidebar-chat/page";

interface RovoCanvasRightRailProps {
	artifactTitle: string;
	onClose: () => void;
}

export function RovoCanvasRightRail({
	artifactTitle,
	onClose,
}: Readonly<RovoCanvasRightRailProps>): React.ReactElement {
	return (
		<ChatPanel
			onClose={onClose}
			headerVariant="minimal"
			enableSmartWidgets
			abortOnUnmount={false}
			chatContextBar={{
				iconName: "artifact",
				label: artifactTitle,
				signature: `rovo-canvas-artifact:${artifactTitle}`,
				variant: "edit",
			}}
			sendPromptOptions={{
				smartGeneration: {
					enabled: true,
					surface: "sidebar",
				},
			}}
		/>
	);
}
