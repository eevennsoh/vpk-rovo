"use client";

import ChatPanel from "@/components/projects/sidebar-chat/page";

export default function SidebarChatDemo() {
	return (
		<div className="flex h-full w-full items-center justify-center p-6">
			<div className="h-[800px] w-[400px]">
				<ChatPanel
					onClose={() => {}}
					enableSmartWidgets={true}
					sendPromptOptions={{
						smartGeneration: {
							enabled: true,
							surface: "sidebar",
						},
					}}
				/>
			</div>
		</div>
	);
}
