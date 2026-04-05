import { token } from "@/lib/tokens";
import type { ComponentDetail } from "@/app/data/component-detail-types";
import type { ComponentCategory } from "@/app/data/component-manifest";
import { getAdsDisplayInfo } from "@/app/data/ads-equivalents";
import { DocHero } from "./components/doc-hero";
import { DocPreview } from "./components/doc-preview";
import { DocInstallation } from "./components/doc-installation";
import { DocUsage } from "./components/doc-usage";
import { DocPropsTable } from "./components/doc-props-table";
import { DocExamples } from "./components/doc-examples";

interface ComponentDocProps {
	component: {
		name: string;
		slug: string;
		importPath: string;
		category: ComponentCategory;
		detail?: ComponentDetail;
	};
}

export function ComponentDoc({ component }: Readonly<ComponentDocProps>) {
	const { name, slug, importPath, category, detail } = component;
	const adsInfo = getAdsDisplayInfo(slug);
	const adsLinks = detail?.adsLinks?.map(link => ({ href: link.url, label: link.label }));
	const contentContainerStyle = {
		maxWidth: 860,
		marginInline: "auto",
		paddingInline: token("space.300"),
	};
	const previewContainerStyle = {
		paddingInline: 24,
	};
	const articleStyle = {
		paddingBottom: token("space.600"),
	};
	const detailSections = (
		<>
			{/* 3. Installation — always shown */}
			<DocInstallation
				importPath={importPath}
				name={name}
				importStatement={detail?.importStatement}
			/>

			{/* 4. Usage — only if data exists */}
			{detail?.usage && <DocUsage usage={detail.usage} />}

			{/* 5. Examples — only if data exists */}
			{detail?.examples && detail.examples.length > 0 && (
				<DocExamples examples={detail.examples} category={category} />
			)}

			{/* 6. API Reference — only if props data exists */}
			{detail?.props && (
				<DocPropsTable
					componentName={name.replace(/\s+/g, "")}
					props={detail.props}
					subComponents={detail.subComponents}
				/>
			)}
		</>
	);

	return (
		<article style={articleStyle}>
			<div style={contentContainerStyle}>
				{/* 1. Hero — always shown */}
				<DocHero
					name={name}
					description={detail?.description}
					category={category}
					importPath={importPath}
					adsLinks={adsLinks}
					adsUrl={detail?.adsUrl}
					adsPackage={adsInfo?.displayText}
				/>
			</div>

		<div style={previewContainerStyle}>
			{/* 2. Preview — always shown (if demo exists) */}
			<DocPreview slug={slug} category={category} demoLayout={detail?.demoLayout} />
		</div>

			<div style={contentContainerStyle}>
				{detailSections}
			</div>
		</article>
	);
}
