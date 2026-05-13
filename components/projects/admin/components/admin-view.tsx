"use client";

import { resolveAdminView } from "../lib/admin-view-routing";
import { AuditLogView } from "./audit-log-view";
import { BillingView } from "./billing-view";
import { DashboardView } from "./dashboard-view";
import { EncryptionView } from "./encryption-view";
import { PlaceholderView } from "./placeholder-view";
import { ProjectsView } from "./projects-view";
import { RovoSettingsView } from "./rovo-settings-view";
import { SettingsView } from "./settings-view";
import { SpacesView } from "./spaces-view";
import { TeamsView } from "./teams-view";
import { UsersView } from "./users-view";

interface AdminViewProps {
	selectedItem: string;
}

export function AdminView({ selectedItem }: Readonly<AdminViewProps>) {
	const resolution = resolveAdminView(selectedItem);

	switch (resolution.kind) {
		case "audit-log":
			return <AuditLogView />;
		case "billing":
			return <BillingView />;
		case "dashboard":
			return <DashboardView />;
		case "encryption":
			return <EncryptionView />;
		case "projects":
			return <ProjectsView />;
		case "rovo-settings":
			return <RovoSettingsView />;
		case "settings":
			return <SettingsView title={resolution.title} />;
		case "spaces":
			return <SpacesView />;
		case "teams":
			return <TeamsView />;
		case "users":
			return <UsersView />;
		case "placeholder":
			return <PlaceholderView title={resolution.title} />;
	}
}
