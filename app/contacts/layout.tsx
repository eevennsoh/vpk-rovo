import { ChatRouteProviders } from "@/app/chat-route-providers";

export default function ContactsLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <ChatRouteProviders>{children}</ChatRouteProviders>;
}
