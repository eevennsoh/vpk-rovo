"use client";

import { AdminPageShell, AdminViewHeader } from "./view-primitives";

export function TeamsView() {
	return (
		<AdminPageShell>
			<AdminViewHeader
				title="Teams"
				description="Create and manage teams to help people collaborate across products."
			/>
		</AdminPageShell>
	);
}
