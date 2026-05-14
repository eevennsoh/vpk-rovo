import type { ToolApprovalPayload } from "@/lib/rovo-ui-messages";

export const SINGLE_TOOL_APPROVAL_DEMO: ToolApprovalPayload = {
	approvalId: "tool-approval-single-demo",
	items: [
		{
			id: "edit-1",
			toolCallId: "call-edit-release-notes",
			toolName: "find_and_replace_code",
			title: "Edit file",
			description: "Update the release notes draft with the latest sprint summary before the response continues.",
			targetPath: "docs/release-notes/q2-launch.md",
			riskLevel: "medium",
			permissionScenario: "workspace-write",
		},
	],
};

export const BATCH_TOOL_APPROVAL_DEMO: ToolApprovalPayload = {
	approvalId: "tool-approval-batch-demo",
	items: [
		{
			id: "edit-2",
			toolCallId: "call-edit-shell",
			toolName: "find_and_replace_code",
			title: "Edit file",
			description: "Patch the rovo-app shell so the approval surface can mount above the composer dock.",
			targetPath: "components/projects/rovo/components/rovo-app-shell.tsx",
			riskLevel: "medium",
			permissionScenario: "workspace-write",
		},
		{
			id: "delete-1",
			toolCallId: "call-delete-temp",
			toolName: "delete_file",
			title: "Delete file",
			description: "Remove an obsolete temporary artifact from the workspace after the refactor completes.",
			targetPath: "tmp/rovo-app-approval-draft.tsx",
			riskLevel: "high",
			permissionScenario: "workspace-write",
		},
		{
			id: "bash-1",
			toolCallId: "call-run-checks",
			toolName: "bash",
			title: "Run bash command",
			description: "Run validation so the agent can continue with a verified result.",
			commandPreview: "pnpm run lint && pnpm tsc --noEmit",
			riskLevel: "high",
			permissionScenario: "workspace-command",
		},
	],
};
