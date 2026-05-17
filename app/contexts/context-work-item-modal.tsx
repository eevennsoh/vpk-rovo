"use client";

import { createContext, use, useState, type ReactNode } from "react";

import type { TagColor } from "@/components/ui/tag";

/**
 * Work Item Modal State
 */
export interface WorkItemModalState {
	isDetailsOpen: boolean;
	isMoreFieldsOpen: boolean;
	isAutomationOpen: boolean;
}

/**
 * Work Item Modal Actions
 */
export interface WorkItemModalActions {
	toggleDetails: () => void;
	toggleMoreFields: () => void;
	toggleAutomation: () => void;
	setDetailsOpen: (open: boolean) => void;
	setMoreFieldsOpen: (open: boolean) => void;
	setAutomationOpen: (open: boolean) => void;
}

/**
 * Work Item Data
 */
export interface WorkItemPerson {
	name: string;
	avatarUrl?: string;
	role?: string;
}

export interface WorkItemChildItem {
	type?: string;
	key: string;
	summary: string;
	priority: "highest" | "high" | "medium" | "low" | "lowest";
	assignee?: string;
	assigneeAvatarUrl?: string;
	status: "done" | "inprogress" | "todo";
}

export interface WorkItemAttachment {
	id?: string;
	name: string;
	ext: string;
	date: string;
	displayName?: string;
	previewHtml?: string;
	previewSrc?: string;
	previewAlt?: string;
	thumbnailKind?: "document" | "file" | "audio" | "image" | "video";
	thumbnailColor?: string;
	thumbnailTone?: "success" | "warning" | "discovery" | "information" | "neutral";
	sourceLabel?: string;
	sourceProduct?: "confluence" | "loom";
	source?: "fixture" | "generated";
	approved?: boolean;
	previewKind?: "html-report" | "pdf-preview";
}

export interface WorkItemComment {
	id: string;
	author: WorkItemPerson;
	timestamp: string;
	content: string;
	replies?: WorkItemComment[];
}

export interface WorkItemRfpTeamMember {
	role: string;
	owner: string;
	need: string;
}

export interface WorkItemLabelTag {
	text: string;
	color?: TagColor;
}

export interface WorkItemRfpContext {
	customerName: string;
	opportunityName: string;
	seatCount: string;
	competitorProduct: string;
	salesGoal: string;
	procurementStage: string;
	responseDueDate: string;
	submissionPortal: string;
	buyerPriorities: string[];
	evaluationCriteria: string[];
	winThemes: string[];
	risks: string[];
	nextActions: string[];
	responseTeam: WorkItemRfpTeamMember[];
}

export interface WorkItemData {
	title: string;
	code: string;
	description?: string;
	assignee?: WorkItemPerson;
	reporter?: WorkItemPerson;
	priority?: "Highest" | "High" | "Medium" | "Low" | "Lowest";
	status?: string;
	startDate?: string;
	dueDate?: string;
	parent?: {
		code: string;
		title?: string;
	};
	labels?: string[];
	labelTags?: WorkItemLabelTag[];
	childItems?: WorkItemChildItem[];
	attachments?: WorkItemAttachment[];
	comments?: WorkItemComment[];
	approvers?: WorkItemPerson[];
	effortEstimate?: string;
	account?: string;
	dealSize?: string;
	rfpContext?: WorkItemRfpContext;
}

/**
 * Work Item Modal Meta
 */
export interface WorkItemModalMeta {
	isOpen: boolean;
	onClose: () => void;
	onAttachmentOpen?: (attachment: WorkItemAttachment) => void;
	highlightedAttachmentId?: string | null;
	highlightedAttachmentKey?: number;
	workItem: WorkItemData;
}

/**
 * Combined context value
 */
export interface WorkItemModalContextValue {
	state: WorkItemModalState;
	actions: WorkItemModalActions;
	meta: WorkItemModalMeta;
}

const WorkItemModalContext = createContext<WorkItemModalContextValue | null>(null);

interface WorkItemModalProviderProps {
	children: ReactNode;
	isOpen: boolean;
	onClose: () => void;
	onAttachmentOpen?: (attachment: WorkItemAttachment) => void;
	highlightedAttachmentId?: string | null;
	highlightedAttachmentKey?: number;
	workItem: WorkItemData;
	/** Initial state for accordions */
	initialDetailsOpen?: boolean;
	initialMoreFieldsOpen?: boolean;
	initialAutomationOpen?: boolean;
}

/**
 * Provider component that manages WorkItemModal state following the composition pattern.
 *
 * Usage:
 * ```tsx
 * <WorkItemModalProvider isOpen={isOpen} onClose={handleClose} workItem={workItem}>
 *   <WorkItemModal.Backdrop />
 *   <WorkItemModal.Container>
 *     <WorkItemModal.Header />
 *     <WorkItemModal.TwoColumnLayout>
 *       <WorkItemModal.LeftColumn>
 *         <WorkItemModal.Title />
 *         <WorkItemModal.Description />
 *         <WorkItemModal.ChildItems />
 *         <WorkItemModal.Attachments />
 *         <WorkItemModal.Activity />
 *       </WorkItemModal.LeftColumn>
 *       <WorkItemModal.RightColumn>
 *         <WorkItemModal.StatusHeader />
 *         <WorkItemModal.DetailsAccordion />
 *         <WorkItemModal.MoreFieldsAccordion />
 *         <WorkItemModal.AutomationAccordion />
 *       </WorkItemModal.RightColumn>
 *     </WorkItemModal.TwoColumnLayout>
 *   </WorkItemModal.Container>
 * </WorkItemModalProvider>
 * ```
 */
export function WorkItemModalProvider({
	children,
	isOpen,
	onClose,
	onAttachmentOpen,
	highlightedAttachmentId = null,
	highlightedAttachmentKey,
	workItem,
	initialDetailsOpen = true,
	initialMoreFieldsOpen = false,
	initialAutomationOpen = false,
}: WorkItemModalProviderProps) {
	const [isDetailsOpen, setIsDetailsOpen] = useState(initialDetailsOpen);
	const [isMoreFieldsOpen, setIsMoreFieldsOpen] = useState(initialMoreFieldsOpen);
	const [isAutomationOpen, setIsAutomationOpen] = useState(initialAutomationOpen);

	const state: WorkItemModalState = {
		isDetailsOpen,
		isMoreFieldsOpen,
		isAutomationOpen,
	};

	const actions: WorkItemModalActions = {
		toggleDetails: () => setIsDetailsOpen((prev) => !prev),
		toggleMoreFields: () => setIsMoreFieldsOpen((prev) => !prev),
		toggleAutomation: () => setIsAutomationOpen((prev) => !prev),
		setDetailsOpen: setIsDetailsOpen,
		setMoreFieldsOpen: setIsMoreFieldsOpen,
		setAutomationOpen: setIsAutomationOpen,
	};

	const meta: WorkItemModalMeta = {
		isOpen,
		onClose,
		onAttachmentOpen,
		highlightedAttachmentId,
		highlightedAttachmentKey,
		workItem,
	};

	// Don't render children if modal is closed
	if (!isOpen) return null;

	return (
		<WorkItemModalContext value={{ state, actions, meta }}>
			{children}
		</WorkItemModalContext>
	);
}

/**
 * Hook to access WorkItemModal context.
 * Must be used within a WorkItemModalProvider.
 */
export function useWorkItemModal(): WorkItemModalContextValue {
	const context = use(WorkItemModalContext);
	if (context === null) {
		throw new Error("useWorkItemModal must be used within a WorkItemModalProvider");
	}
	return context;
}

/**
 * Hook to access only the state
 */
export function useWorkItemModalState(): WorkItemModalState {
	return useWorkItemModal().state;
}

/**
 * Hook to access only the actions
 */
export function useWorkItemModalActions(): WorkItemModalActions {
	return useWorkItemModal().actions;
}

/**
 * Hook to access the work item data
 */
export function useWorkItemData(): WorkItemData {
	return useWorkItemModal().meta.workItem;
}
