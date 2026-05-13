import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
	title: "Administration",
	description: "Administration settings and configuration",
};

export default function AdminLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return children;
}
