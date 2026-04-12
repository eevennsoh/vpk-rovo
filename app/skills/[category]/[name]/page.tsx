import { redirect } from "next/navigation";

interface SkillDetailPageProps {
	params: Promise<{ category: string; name: string }>;
}

export default async function SkillDetailPage({ params }: SkillDetailPageProps) {
	const { category, name } = await params;
	redirect(`/rovo-app/skills/${encodeURIComponent(category)}/${encodeURIComponent(name)}`);
}
