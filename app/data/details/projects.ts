import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PROJECT_DETAILS: Record<string, ComponentDetail> = {
	"admin": {
		description: "An Atlassian Administration surface with organization settings, users, billing, audit logs, Rovo settings, and security controls.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
	"confluence": {
		description: "A document editing interface inspired by Confluence with rich text editing, bubble menus, and collaboration features.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
	"contacts": {
		description: "A contacts management surface with searchable, sortable, status-filterable table and a sliding detail sheet for each entry.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
	"jira": {
		description: "A Kanban board interface with draggable cards, column management, and detailed work item modals.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
	"rovo-app": {
		description: "A Vercel-style AI chat workspace with persistent thread history, local attachments, artifact editing, and RovoDev-backed streaming.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
	"search": {
		description: "A search results page with AI-powered summary panel, source cards carousel, and filterable result cards.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
	"sidebar-chat": {
		description: "A sliding chat panel with message bubbles, greeting view, and integrated composer for conversational AI interfaces.",
	},
};
