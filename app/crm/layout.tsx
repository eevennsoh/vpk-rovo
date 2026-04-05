import { ChatRouteProviders } from "@/app/chat-route-providers";

export default function CrmLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <ChatRouteProviders>{children}</ChatRouteProviders>;
}
