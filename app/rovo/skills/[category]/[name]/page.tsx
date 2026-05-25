import { RovoAppSurfaceShell } from "@/components/projects/rovo/components/rovo-app-surface-shell";
import { SkillsSurfacePage } from "@/components/projects/control-plane/skills-surface";

interface SkillDetailPageProps {
	params: Promise<{ category: string; name: string }>;
}

export default async function RovoAppSkillDetailPage({ params }: Readonly<SkillDetailPageProps>) {
	const { category, name } = await params;

	return (
		<RovoAppSurfaceShell>
			<SkillsSurfacePage initialCategory={category} initialSlug={name} />
		</RovoAppSurfaceShell>
	);
}
