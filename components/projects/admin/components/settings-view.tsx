"use client";

import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	AdminCard,
	AdminCardHeader,
	AdminPageShell,
	AdminToggleRow,
	AdminViewHeader,
} from "./view-primitives";

interface SettingsViewProps {
	title?: string;
}

export function SettingsView({ title = "Settings" }: Readonly<SettingsViewProps>) {
	return (
		<AdminPageShell>
			<AdminViewHeader
				title={title}
				description="Manage your account settings and preferences."
			/>

			<AdminCard>
				<AdminCardHeader title="Profile" />
				<CardContent>
					<FieldGroup>
						<ProfileField label="Full name" defaultValue="John Doe" />
						<ProfileField label="Email" defaultValue="john.doe@company.com" />
						<ProfileField label="Department" defaultValue="Engineering" />
					</FieldGroup>
				</CardContent>
			</AdminCard>

			<AdminCard>
				<AdminCardHeader title="Notifications" />
				<AdminToggleRow label="Email notifications" defaultChecked />
				<AdminToggleRow label="Push notifications" defaultChecked />
				<AdminToggleRow label="Project updates" />
			</AdminCard>

			<AdminCard>
				<AdminCardHeader title="Appearance" />
				<AdminToggleRow label="Dark mode" />
				<AdminToggleRow label="Compact layout" />
			</AdminCard>

			<div className="flex flex-wrap gap-2">
				<Button variant="outline">Reset to defaults</Button>
				<Button>Save changes</Button>
			</div>
		</AdminPageShell>
	);
}

function ProfileField({
	label,
	defaultValue,
}: Readonly<{
	label: string;
	defaultValue: string;
}>) {
	return (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<Input defaultValue={defaultValue} />
		</Field>
	);
}
