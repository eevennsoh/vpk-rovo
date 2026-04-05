import { PreviewFrameGuard } from "@/app/preview/preview-frame-guard";

export default function PreviewLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<PreviewFrameGuard />
			{children}
		</>
	);
}
