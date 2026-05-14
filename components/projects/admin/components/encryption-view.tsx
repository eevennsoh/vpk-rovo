"use client";

import { AdminPageShell, AdminViewHeader } from "./view-primitives";

export function EncryptionView() {
	return (
		<AdminPageShell>
			<AdminViewHeader
				title="Encryption"
				description="Manage encryption keys and data protection settings for your organization's content."
			/>
		</AdminPageShell>
	);
}
