export type AdminViewKind =
	| "audit-log"
	| "billing"
	| "dashboard"
	| "encryption"
	| "placeholder"
	| "projects"
	| "rovo-settings"
	| "settings"
	| "spaces"
	| "teams"
	| "users";

export interface AdminViewResolution {
	kind: AdminViewKind;
	title: string;
}

const ADMIN_VIEW_KIND_BY_ITEM: Record<string, AdminViewKind> = {
	"AI settings": "rovo-settings",
	"API keys": "placeholder",
	"API token activity": "placeholder",
	"Analytics": "placeholder",
	"Application tunnels": "placeholder",
	"App URLs": "placeholder",
	"App access settings": "placeholder",
	"App updates": "placeholder",
	"Atlassian apps": "placeholder",
	"Audit log": "audit-log",
	"Authentication policies": "placeholder",
	"Backups": "placeholder",
	"Billing": "billing",
	"Bobby R Easels": "spaces",
	"Classification": "placeholder",
	"Connected sources": "placeholder",
	"Connectors": "placeholder",
	"Contacts": "placeholder",
	"Cursor codes": "spaces",
	"Data classification": "placeholder",
	"Data protection policies": "placeholder",
	"Data residency": "placeholder",
	"Data security policies": "placeholder",
	"Data transfer": "placeholder",
	"Data use": "placeholder",
	"Domains": "placeholder",
	"Emails": "placeholder",
	"Encryption": "encryption",
	"External users": "placeholder",
	"Freeze windows": "placeholder",
	"Groups": "placeholder",
	"HIPAA": "placeholder",
	"HIPAA compliance": "placeholder",
	"IP allowlists": "placeholder",
	"Identity providers": "placeholder",
	"Koality chewy": "spaces",
	"Link fixing": "placeholder",
	"Login page": "placeholder",
	"Managed accounts": "placeholder",
	"Migration plans": "placeholder",
	"Mobile app policies": "placeholder",
	"Mobile policies": "placeholder",
	"Moon unit 5000": "spaces",
	"Overview": "dashboard",
	"Peak twins": "spaces",
	"Platform experiences": "placeholder",
	"Platform usage": "placeholder",
	"Portfolio insights": "placeholder",
	"Profile": "settings",
	"Projects": "projects",
	"Release tracks": "placeholder",
	"Rovo MCP server": "placeholder",
	"Rovo access": "placeholder",
	"Rovo insights": "placeholder",
	"Rovo settings": "rovo-settings",
	"Sandboxes": "placeholder",
	"Security guide": "placeholder",
	"Service accounts": "placeholder",
	"Shadow IT apps": "placeholder",
	"Shadow IT controls": "placeholder",
	"Sites": "spaces",
	"Spaces": "spaces",
	"System health": "placeholder",
	"Teams": "teams",
	"User counts": "placeholder",
	"User requests": "placeholder",
	"Users": "users",
	"View all sites": "spaces",
};

export function resolveAdminView(selectedItem: string): AdminViewResolution {
	return {
		kind: ADMIN_VIEW_KIND_BY_ITEM[selectedItem] ?? "placeholder",
		title: selectedItem,
	};
}
