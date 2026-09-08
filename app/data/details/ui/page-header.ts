import type { ComponentDetail } from "@/app/data/component-detail-types"

export const PAGE_HEADER_DETAIL: ComponentDetail = {
	description:
		"A page-level header component with title, description, breadcrumbs, actions, and a bottom bar. Provides consistent page header layout across views.",
	usage: `import { PageHeader } from "@/components/ui/page-header";

<PageHeader title="Projects" description="Manage your projects." />
<PageHeader title="Issues" actions={<Button>Create</Button>} />`,
	props: [
		{
			name: "title",
			type: "React.ReactNode",
			description: "Primary page heading.",
		},
		{
			name: "description",
			type: "React.ReactNode",
			description: "Optional subtitle or description text.",
		},
		{
			name: "actions",
			type: "React.ReactNode",
			description: "Action buttons displayed at the end of the heading row.",
		},
		{
			name: "breadcrumbs",
			type: "React.ReactNode",
			description: "Breadcrumb navigation above the title.",
		},
		{
			name: "bottomBar",
			type: "React.ReactNode",
			description: "Search, filters, or other controls displayed below the heading row.",
		},
	],
	examples: [
		{
			title: "Default",
			description: "Use a default page header for a title underneath breadcrumbs.",
			demoSlug: "page-header-demo-default",
		},
		{
			title: "Complex",
			description: "Combine breadcrumbs, actions, and a bottom bar for richer page controls.",
			demoSlug: "page-header-demo-complex",
		},
	],
	adsUrl: "https://atlassian.design/components/page-header",
}
