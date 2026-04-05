import { ChatRouteProviders } from "@/app/chat-route-providers";
import { PreviewFrameGuard } from "@/app/preview/preview-frame-guard";

export default function PreviewLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<PreviewFrameGuard />
			<ChatRouteProviders>{children}</ChatRouteProviders>
		</>
	);
}
