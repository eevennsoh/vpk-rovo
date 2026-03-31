import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Apple",
	description: "A page about Apple — history, products, and innovation",
	openGraph: {
		title: "Apple — VPK",
		description: "A page about Apple — history, products, and innovation",
	},
};

export default function AppleLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
