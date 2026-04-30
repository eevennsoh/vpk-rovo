import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ComponentsLayout from "@/app/components/layout";
import { VISUAL_COMPONENTS, findComponent } from "@/app/data/components";
import { ComponentDoc } from "@/components/website/component-doc/page";
import { getComponentPageTitle } from "@/lib/project-page-title";

interface PageProps {
	params: Promise<{
		slug: string;
	}>;
}

export function generateStaticParams() {
	return VISUAL_COMPONENTS.map((component) => ({ slug: component.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const component = findComponent("visual", slug);
	if (!component) return {};
	return { title: getComponentPageTitle(component.name, component.category) };
}

export default async function VisualComponentAliasPage({ params }: PageProps) {
	const { slug } = await params;
	const component = findComponent("visual", slug);

	if (!component) {
		notFound();
	}

	return (
		<ComponentsLayout>
			<ComponentDoc component={component} />
		</ComponentsLayout>
	);
}
