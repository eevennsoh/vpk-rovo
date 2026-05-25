import RovoPage from "@/components/projects/rovo/page";

interface RovoAppCatchAllPageProps {
	params: Promise<{ id?: string[] }>;
}

export function generateStaticParams() {
	return [{ id: [] }];
}

export default async function RovoAppCatchAllPage({
	params,
}: Readonly<RovoAppCatchAllPageProps>) {
	const { id } = await params;

	return <RovoPage initialThreadId={id?.[0] ?? null} />;
}
