"use client";

import ToolApprovalPreview, {
	ToolApprovalDemoBatch,
	ToolApprovalDemoSubmitting,
} from "@/components/blocks/tool-approval/page";
import type { ReactElement } from "react";

export default function ToolApprovalDemo(): ReactElement {
	return <ToolApprovalPreview />;
}

export { ToolApprovalDemoBatch, ToolApprovalDemoSubmitting };
