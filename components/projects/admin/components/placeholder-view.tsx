"use client";

import { token } from "@/lib/tokens";
import { CardContent } from "@/components/ui/card";
import { AdminCard, AdminPageShell, AdminViewHeader } from "./view-primitives";

interface PlaceholderViewProps {
	title: string;
}

export function PlaceholderView({ title }: Readonly<PlaceholderViewProps>) {
	return (
		<AdminPageShell>
			<AdminViewHeader
				title={title}
				description={`Manage ${title.toLowerCase()} settings for your organization.`}
			/>
			<AdminCard className="mt-2">
				<CardContent className="flex flex-col items-center gap-2 py-12 text-center">
					<div className="text-text-subtle" style={{ font: token("font.heading.small") }}>
						Coming soon
					</div>
					<p className="max-w-[640px] text-sm text-text-subtlest">
						This section is under development. Check back later for updates.
					</p>
				</CardContent>
			</AdminCard>
		</AdminPageShell>
	);
}
