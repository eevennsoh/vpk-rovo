import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AUDIO_COMPONENTS, AI_COMPONENTS, UI_COMPONENTS, BLOCK_COMPONENTS, PROJECT_COMPONENTS, ART_COMPONENTS, UTILITY_COMPONENTS, VISUAL_COMPONENTS, findComponent } from "@/app/data/components";
import { ComponentDoc } from "@/components/website/component-doc/page";
import { getComponentPageTitle } from "@/lib/project-page-title";

interface PageProps {
	params: Promise<{
		category: string;
		slug: string;
	}>;
}

function getComponentRedirectTarget(category: string, slug: string): string | null {
	if (category === "projects" && slug === "rovo-app") {
		return "/components/projects/rovo";
	}

	return null;
}

function resolveComponentSlug(category: string, slug: string): { category: string; slug: string } {
	if (category === "projects" && slug === "rovo-app") {
		return { category: "projects", slug: "rovo" };
	}

	return { category, slug };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { category, slug } = await params;
	const resolved = resolveComponentSlug(category, slug);
	const component = findComponent(resolved.category, resolved.slug);
	if (!component) return {};
	return { title: getComponentPageTitle(component.name, component.category) };
}

export function generateStaticParams() {
	const params: { category: string; slug: string }[] = [];

	for (const comp of AUDIO_COMPONENTS) {
		params.push({ category: "ui-audio", slug: comp.slug });
	}

	for (const comp of AI_COMPONENTS) {
		params.push({ category: "ui-ai", slug: comp.slug });
	}

	for (const comp of UI_COMPONENTS) {
		params.push({ category: "ui", slug: comp.slug });
	}

	for (const comp of BLOCK_COMPONENTS) {
		params.push({ category: "blocks", slug: comp.slug });
	}

	for (const comp of PROJECT_COMPONENTS) {
		params.push({ category: "projects", slug: comp.slug });
	}

	for (const comp of ART_COMPONENTS) {
		params.push({ category: "arts", slug: comp.slug });
	}

	for (const comp of UTILITY_COMPONENTS) {
		params.push({ category: "utility", slug: comp.slug });
	}

	for (const comp of VISUAL_COMPONENTS) {
		params.push({ category: "visual", slug: comp.slug });
	}

	return params;
}

export default async function ComponentDetailPage({ params }: PageProps) {
	const { category, slug } = await params;
	const redirectTarget = getComponentRedirectTarget(category, slug);

	if (redirectTarget) {
		redirect(redirectTarget);
	}

	if (category !== "ui-audio" && category !== "ui-ai" && category !== "ui" && category !== "blocks" && category !== "projects" && category !== "arts" && category !== "utility" && category !== "visual") {
		notFound();
	}

	const component = findComponent(category, slug);

	if (!component) {
		notFound();
	}

	return <ComponentDoc component={component} />;
}
