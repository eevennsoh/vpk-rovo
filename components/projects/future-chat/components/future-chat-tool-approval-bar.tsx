"use client";

import { ToolApproval, type ToolApprovalProps } from "@/components/blocks/tool-approval";
import type { ReactElement } from "react";

export function FutureChatToolApprovalBar(props: Readonly<ToolApprovalProps>): ReactElement {
	return <ToolApproval {...props} />;
}
