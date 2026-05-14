"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import AutomationIcon from "@atlaskit/icon/core/automation";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";


interface SidebarStackProps {
	children: ReactNode;
}

export function SidebarStack({ children }: Readonly<SidebarStackProps>) {
	return <div className="flex flex-col gap-2">{children}</div>;
}

export function StatusHeader() {
	return (
		<div className="pt-3 pb-2">
			<div className="flex items-center gap-2">
				<Button
					className="gap-2"
					variant="secondary"
				>
					Backlog
					<ChevronDownIcon label="" size="small" />
				</Button>
				<Button aria-label="Automation" size="icon" variant="secondary">
					<AutomationIcon label="" />
				</Button>
			</div>
		</div>
	);
}
