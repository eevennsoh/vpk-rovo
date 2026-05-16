"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Lozenge,
	LozengeDropdownTrigger,
	type LozengeProps,
} from "@/components/ui/lozenge";
import { useWorkItemData } from "@/app/contexts/context-work-item-modal";
import { BOARD_COLUMNS } from "@/components/projects/agents/data/board-data";
import { cn } from "@/lib/utils";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import AutomationIcon from "@atlaskit/icon/core/automation";

interface SidebarStackProps {
	children: ReactNode;
}

type PhaseTone = "neutral" | "inProgress" | "done";

const STATUS_PHASES = BOARD_COLUMNS.map((column) => column.title);

const phaseToneVariants: Record<PhaseTone, LozengeProps["variant"]> = {
	neutral: "neutral",
	inProgress: "information",
	done: "success",
};

function getPhaseTone(index: number, phaseCount: number): PhaseTone {
	if (index === phaseCount - 1) {
		return "done";
	}

	if (index === 0) {
		return "neutral";
	}

	return "inProgress";
}

interface StatusPhaseLozengeProps {
	title: string;
	tone: PhaseTone;
}

function StatusPhaseLozenge({ title, tone }: Readonly<StatusPhaseLozengeProps>) {
	return (
		<Lozenge variant={phaseToneVariants[tone]}>
			{title}
		</Lozenge>
	);
}

export function SidebarStack({ children }: Readonly<SidebarStackProps>) {
	return <div className="flex min-w-0 flex-col gap-2">{children}</div>;
}

export function StatusHeader() {
	const workItem = useWorkItemData();
	const [selectedStatuses, setSelectedStatuses] = useState<Record<string, string>>({});
	const fallbackStatus = STATUS_PHASES[0] ?? "RFP Intake";
	const selectedStatus = selectedStatuses[workItem.code] ?? workItem.status ?? fallbackStatus;
	const selectedStatusIndex = STATUS_PHASES.indexOf(selectedStatus);
	const selectedStatusTone = getPhaseTone(
		selectedStatusIndex >= 0 ? selectedStatusIndex : 0,
		STATUS_PHASES.length,
	);

	const handlePhaseSelect = (phaseTitle: string) => {
		setSelectedStatuses((previousStatuses) => ({
			...previousStatuses,
			[workItem.code]: phaseTitle,
		}));
	};

	return (
		<div>
			<div className="flex items-center gap-2">
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<LozengeDropdownTrigger
								aria-label={`Change status. Current status: ${selectedStatus}`}
								size="spacious"
								variant={phaseToneVariants[selectedStatusTone]}
							/>
						}
					>
						{selectedStatus}
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="start"
						className="w-64 p-0"
						positionerClassName="z-[502]"
						sideOffset={8}
					>
						<DropdownMenuGroup className="p-0 py-2">
							{STATUS_PHASES.map((phaseTitle, index) => {
								const isSelected = phaseTitle === selectedStatus;

								return (
									<DropdownMenuItem
										aria-current={isSelected ? "true" : undefined}
										className={cn(
											"rounded-none border-l-2 border-l-transparent px-0 py-2.5 pl-2.5",
											isSelected && "border-l-border-selected bg-bg-neutral",
										)}
										key={phaseTitle}
										onSelect={() => handlePhaseSelect(phaseTitle)}
									>
										<StatusPhaseLozenge
											title={phaseTitle}
											tone={getPhaseTone(index, STATUS_PHASES.length)}
										/>
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
				<Button
					className="gap-2"
					variant="outline"
				>
					<AiAgentIcon label="" size="small" />
					Agents
				</Button>
				<Button aria-label="Automation" size="icon" variant="outline">
					<AutomationIcon label="" />
				</Button>
			</div>
		</div>
	);
}
