import StudioPage from "@/components/projects/studio/page";

interface StudioAppCatchAllPageProps {
	params: Promise<{ id?: string[] }>;
}

export function generateStaticParams() {
	return [{ id: [] }];
}

export default async function StudioAppCatchAllPage({
	params,
}: Readonly<StudioAppCatchAllPageProps>) {
	const { id } = await params;

	return <StudioPage initialThreadId={id?.[0] ?? null} />;
}
