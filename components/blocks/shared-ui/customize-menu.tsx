"use client";

import { token } from "@/lib/tokens";
import { Switch as Toggle } from "@/components/ui/switch";
import { MenuItemButton, CircleIcon } from "./components/menu-item-button";
import { REASONING_OPTIONS, FILTER_BY_APPS_ICON, SELECTED_CHECK_ICON } from "./data/customize-menu-data";
import GlobeIcon from "@atlaskit/icon/core/globe";
import OfficeBuildingIcon from "@atlaskit/icon/core/office-building";

export interface CustomizeMenuProps {
	selectedReasoning: string;
	onReasoningChange: (reasoning: string) => void;
	showReasoning?: boolean;
	showSources?: boolean;
	webResultsEnabled: boolean;
	onWebResultsChange: (enabled: boolean) => void;
	companyKnowledgeEnabled: boolean;
	onCompanyKnowledgeChange: (enabled: boolean) => void;
	onClose: () => void;
}

export default function CustomizeMenu({
	selectedReasoning,
	onReasoningChange,
	showReasoning = true,
	showSources = true,
	webResultsEnabled,
	onWebResultsChange,
	companyKnowledgeEnabled,
	onCompanyKnowledgeChange,
	onClose,
}: Readonly<CustomizeMenuProps>) {
	return (
		<>
			{showReasoning ? (
				<ReasoningSection selectedReasoning={selectedReasoning} onReasoningChange={onReasoningChange} onClose={onClose} />
			) : null}
			{showSources ? (
				<SourcesSection
					webResultsEnabled={webResultsEnabled}
					onWebResultsChange={onWebResultsChange}
					companyKnowledgeEnabled={companyKnowledgeEnabled}
					onCompanyKnowledgeChange={onCompanyKnowledgeChange}
					onClose={onClose}
				/>
			) : null}
		</>
	);
}

interface ReasoningSectionProps {
	selectedReasoning: string;
	onReasoningChange: (reasoning: string) => void;
	onClose: () => void;
}

function ReasoningSection({ selectedReasoning, onReasoningChange, onClose }: Readonly<ReasoningSectionProps>) {
	return (
		<div>
			<div style={{ padding: `${token("space.050")} ${token("space.200")} 0` }}>
				<h3 style={{ font: token("font.heading.xxsmall") }} className="text-text-subtle">
					Reasoning
				</h3>
			</div>
			<div
				style={{
					borderRadius: "12px",
					marginTop: token("space.100"),
				}}
			>
				{REASONING_OPTIONS.map((option) => (
					<MenuItemButton
						key={option.id}
						elemBefore={<CircleIcon>{option.icon}</CircleIcon>}
						elemAfter={selectedReasoning === option.id ? SELECTED_CHECK_ICON : null}
						description={option.description}
						onClick={() => {
							onReasoningChange(option.id);
							onClose();
						}}
					>
						{option.label}
					</MenuItemButton>
				))}
			</div>
		</div>
	);
}

interface SourcesSectionProps {
	webResultsEnabled: boolean;
	onWebResultsChange: (enabled: boolean) => void;
	companyKnowledgeEnabled: boolean;
	onCompanyKnowledgeChange: (enabled: boolean) => void;
	onClose: () => void;
}

function SourcesSection({ webResultsEnabled, onWebResultsChange, companyKnowledgeEnabled, onCompanyKnowledgeChange, onClose }: Readonly<SourcesSectionProps>) {
	return (
		<div>
			<div style={{ padding: `${token("space.150")} ${token("space.200")} 0` }}>
				<h3 style={{ font: token("font.heading.xxsmall") }} className="text-text-subtle">
					Sources
				</h3>
			</div>
			<div
				style={{
					borderRadius: "12px",
					marginTop: token("space.100"),
				}}
			>
				<SourceToggleRow icon={<GlobeIcon label="Web results" />} label="Include web results" checked={webResultsEnabled} onCheckedChange={() => onWebResultsChange(!webResultsEnabled)} />

				<SourceToggleRow
					icon={<OfficeBuildingIcon label="Company knowledge" />}
					label="Search company knowledge"
					checked={companyKnowledgeEnabled}
					onCheckedChange={() => onCompanyKnowledgeChange(!companyKnowledgeEnabled)}
				/>

				<div
					style={{
						height: "16px",
						display: "flex",
						alignItems: "center",
						padding: `0 ${token("space.200")}`,
					}}
				>
					<div
						style={{
							height: "1px",
							width: "100%",
							backgroundColor: token("color.border"),
						}}
					/>
				</div>

				<MenuItemButton elemBefore={<CircleIcon>{FILTER_BY_APPS_ICON}</CircleIcon>} onClick={onClose}>
					Filter by apps
				</MenuItemButton>
			</div>
		</div>
	);
}

interface SourceToggleRowProps {
	icon: React.ReactNode;
	label: string;
	checked: boolean;
	onCheckedChange: () => void;
}

function SourceToggleRow({ icon, label, checked, onCheckedChange }: Readonly<SourceToggleRowProps>) {
	return (
		<div
			role="button"
			tabIndex={0}
			onClick={onCheckedChange}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onCheckedChange();
				}
			}}
			className="flex w-full cursor-default items-center justify-between gap-3 rounded-md px-4 select-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground outline-hidden"
			style={{ height: "52px" }}
		>
			<div style={{ display: "flex", alignItems: "center", gap: token("space.150"), flex: 1, minWidth: 0 }}>
				<CircleIcon isSelected={checked}>{icon}</CircleIcon>
				<span style={{ font: token("font.body") }}>{label}</span>
			</div>
			<Toggle checked={checked} onCheckedChange={onCheckedChange} label={label} onClick={(e) => e.stopPropagation()} />
		</div>
	);
}
