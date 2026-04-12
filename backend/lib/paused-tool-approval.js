const { clipText, getNonEmptyString, parseMaybeJson } = require("./shared-utils");

function normalizeToolName(value) {
	return getNonEmptyString(value)?.toLowerCase() ?? null;
}

function parseToolArgs(value) {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		return value;
	}

	const parsed = parseMaybeJson(value);
	return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
}

function getTargetPath(args) {
	if (!args || typeof args !== "object") {
		return null;
	}

	return (
		getNonEmptyString(args.file_path) ||
		getNonEmptyString(args.path) ||
		getNonEmptyString(args.old_path) ||
		getNonEmptyString(args.source_path) ||
		null
	);
}

function getCommandPreview(args) {
	if (!args || typeof args !== "object") {
		return null;
	}

	return (
		clipText(args.command, 220) ||
		clipText(args.cmd, 220) ||
		clipText(args.script, 220) ||
		null
	);
}

function getPartPermissionScenario(part, permissions) {
	const directScenario =
		getNonEmptyString(part?.permissionScenario) ||
		getNonEmptyString(part?.permission_scenario) ||
		null;
	if (directScenario) {
		return directScenario;
	}

	const toolCallId = getNonEmptyString(part?.tool_call_id);
	if (
		!toolCallId ||
		!permissions ||
		typeof permissions !== "object" ||
		Array.isArray(permissions)
	) {
		return null;
	}

	return getNonEmptyString(permissions[toolCallId]) || null;
}

function describePausedTool({ toolName, args }) {
	const normalizedToolName = normalizeToolName(toolName);
	const targetPath = getTargetPath(args);
	const commandPreview = getCommandPreview(args);

	switch (normalizedToolName) {
		case "create_file":
			return {
				title: "Create file",
				description: targetPath
					? `Create \`${targetPath}\` in the workspace.`
					: "Create a new file in the workspace.",
				targetPath,
				commandPreview: null,
				riskLevel: "medium",
			};
		case "find_and_replace_code":
			return {
				title: "Edit file",
				description: targetPath
					? `Modify code in \`${targetPath}\`.`
					: "Modify code in the workspace.",
				targetPath,
				commandPreview: null,
				riskLevel: "medium",
			};
		case "move_file":
			return {
				title: "Move file",
				description: targetPath
					? `Move or rename \`${targetPath}\`.`
					: "Move or rename a file in the workspace.",
				targetPath,
				commandPreview: null,
				riskLevel: "medium",
			};
		case "delete_file":
			return {
				title: "Delete file",
				description: targetPath
					? `Delete \`${targetPath}\` from the workspace.`
					: "Delete a file from the workspace.",
				targetPath,
				commandPreview: null,
				riskLevel: "high",
			};
		case "bash":
			return {
				title: "Run bash command",
				description: commandPreview
					? "Run a shell command in the workspace."
					: "Run bash in the workspace.",
				targetPath: null,
				commandPreview,
				riskLevel: "high",
			};
		case "powershell":
			return {
				title: "Run PowerShell command",
				description: commandPreview
					? "Run a PowerShell command in the workspace."
					: "Run PowerShell in the workspace.",
				targetPath: null,
				commandPreview,
				riskLevel: "high",
			};
		default:
			return {
				title: getNonEmptyString(toolName) || "Run tool",
				description: targetPath
					? `Run \`${getNonEmptyString(toolName) || "tool"}\` against \`${targetPath}\`.`
					: `Run \`${getNonEmptyString(toolName) || "tool"}\`.`,
				targetPath,
				commandPreview,
				riskLevel: "medium",
			};
	}
}

function buildPausedToolApprovalItem(part, index = 0, { permissions } = {}) {
	if (!part || typeof part !== "object") {
		return null;
	}

	const toolCallId = getNonEmptyString(part.tool_call_id);
	const toolName = getNonEmptyString(part.tool_name);
	if (!toolCallId || !toolName) {
		return null;
	}

	const permissionScenario = getPartPermissionScenario(part, permissions);
	if (!permissionScenario) {
		return null;
	}

	const args = parseToolArgs(part.args);
	let description = describePausedTool({ toolName, args });
	if (
		permissionScenario === "dangerous_command" &&
		typeof part?.dangerousCommandLabel === "string" &&
		part.dangerousCommandLabel.trim()
	) {
		description = {
			...description,
			title: "Review dangerous command",
			description: description.commandPreview
				? `Run a shell command flagged as ${part.dangerousCommandLabel.trim()}.`
				: `Run a shell command flagged as ${part.dangerousCommandLabel.trim()}.`,
			riskLevel: "high",
		};
	}

	return {
		id: `${toolCallId}-${index + 1}`,
		toolCallId,
		toolName,
		title: description.title,
		description: description.description,
		targetPath: description.targetPath,
		commandPreview: description.commandPreview,
		riskLevel: description.riskLevel,
		permissionScenario,
	};
}

function buildPausedToolApprovalPayload({
	approvalId,
	threadId = null,
	parts,
	permissions,
	createdAt = new Date().toISOString(),
} = {}) {
	const normalizedApprovalId = getNonEmptyString(approvalId);
	if (!normalizedApprovalId || !Array.isArray(parts)) {
		return null;
	}

	const items = parts
		.map((part, index) => buildPausedToolApprovalItem(part, index, { permissions }))
		.filter(Boolean);
	if (items.length === 0) {
		return null;
	}

	return {
		approvalId: normalizedApprovalId,
		threadId: getNonEmptyString(threadId) || undefined,
		createdAt,
		items,
	};
}

function normalizeToolApprovalSubmission(value) {
	if (!value || typeof value !== "object") {
		return null;
	}

	const approvalId = getNonEmptyString(value.approvalId);
	if (!approvalId) {
		return null;
	}

	const decisions = Array.isArray(value.decisions)
		? value.decisions
			.map((decision) => {
				if (!decision || typeof decision !== "object") {
					return null;
				}

				const toolCallId = getNonEmptyString(decision.toolCallId);
				if (!toolCallId || typeof decision.approved !== "boolean") {
					return null;
				}

				return {
					toolCallId,
					approved: decision.approved,
					denyMessage: getNonEmptyString(decision.denyMessage) || undefined,
				};
			})
			.filter(Boolean)
		: [];
	if (decisions.length === 0) {
		return null;
	}

	return {
		approvalId,
		decisions,
	};
}

function buildDefaultDenyMessage(part) {
	const toolName = getNonEmptyString(part?.tool_name) || "Tool";
	const args = parseToolArgs(part?.args);
	const targetPath = getTargetPath(args);
	const commandPreview = getCommandPreview(args);

	switch (normalizeToolName(toolName)) {
		case "create_file":
			return targetPath
				? `Creating ${targetPath} was not approved.`
				: "File creation was not approved.";
		case "find_and_replace_code":
			return targetPath
				? `Editing ${targetPath} was not approved.`
				: "Code editing was not approved.";
		case "move_file":
			return targetPath
				? `Moving ${targetPath} was not approved.`
				: "File move was not approved.";
		case "delete_file":
			return targetPath
				? `Deleting ${targetPath} was not approved.`
				: "File deletion was not approved.";
		case "bash":
			return commandPreview
				? `Bash command was not approved: ${commandPreview}`
				: "Bash command execution was not approved.";
		case "powershell":
			return commandPreview
				? `PowerShell command was not approved: ${commandPreview}`
				: "PowerShell command execution was not approved.";
		default:
			return `${toolName} was not approved.`;
	}
}

function buildToolApprovalResumeDecisions(
	submission,
	parts,
	{ autoApproveToolCallIds = [] } = {},
) {
	if (!submission || !Array.isArray(parts)) {
		throw new Error("Tool approval resume decisions require a submission and paused parts.");
	}

	const decisionsByToolCallId = new Map(
		submission.decisions.map((decision) => [decision.toolCallId, decision]),
	);
	const autoApproveToolCallIdSet = new Set(
		Array.isArray(autoApproveToolCallIds) ? autoApproveToolCallIds : [],
	);

	return parts.map((part) => {
		const toolCallId = getNonEmptyString(part?.tool_call_id);
		if (!toolCallId) {
			throw new Error("Paused tool approval part is missing tool_call_id.");
		}

		const decision = decisionsByToolCallId.get(toolCallId);
		if (!decision) {
			if (autoApproveToolCallIdSet.has(toolCallId)) {
				return {
					tool_call_id: toolCallId,
					deny_message: null,
				};
			}
			throw new Error(`Missing approval decision for paused tool ${toolCallId}.`);
		}

		return {
			tool_call_id: toolCallId,
			deny_message: decision.approved
				? null
				: decision.denyMessage || buildDefaultDenyMessage(part),
		};
	});
}

module.exports = {
	buildPausedToolApprovalPayload,
	buildToolApprovalResumeDecisions,
	getPartPermissionScenario,
	normalizeToolApprovalSubmission,
};
