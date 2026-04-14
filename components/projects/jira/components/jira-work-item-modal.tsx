"use client";

/**
 * JiraWorkItemModal - Compound Components Pattern
 *
 * This component uses composition to break a large modal
 * into smaller, reusable pieces.
 *
 * Benefits:
 * - Each component is small and focused
 * - State is managed via context (no prop drilling)
 * - Easy to customize by composing different pieces
 * - Better testability
 *
 * Usage:
 * ```tsx
 * <JiraWorkItemModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   workItemTitle="My Task"
 *   workItemCode="PROJ-123"
 * />
 * ```
 */

import { WorkItemModalProvider } from "@/app/contexts/context-work-item-modal";
import WorkItemModal from "./work-item-modal/index";

interface JiraWorkItemModalProps {
	isOpen: boolean;
	onClose: () => void;
	workItemTitle?: string;
	workItemCode?: string;
}

export default function JiraWorkItemModal({
	isOpen,
	onClose,
	workItemTitle = "Work item name",
	workItemCode = "CAID-118",
}: Readonly<JiraWorkItemModalProps>) {
	return (
		<WorkItemModalProvider
			isOpen={isOpen}
			onClose={onClose}
			workItem={{
				title: workItemTitle,
				code: workItemCode,
			}}
		>
			<WorkItemModal.Backdrop />
			<WorkItemModal.Container>
				<WorkItemModal.Header />
				<WorkItemModal.TwoColumnLayout>
					<WorkItemModal.LeftColumn>
						<WorkItemModal.Title />
						<WorkItemModal.Description />
						<WorkItemModal.ChildItems />
						<WorkItemModal.Attachments />
						<WorkItemModal.Activity />
					</WorkItemModal.LeftColumn>
					<WorkItemModal.RightColumn>
						<WorkItemModal.StatusHeader />
						<WorkItemModal.SidebarStack>
							<WorkItemModal.DetailsAccordion />
							<WorkItemModal.MoreFieldsAccordion />
							<WorkItemModal.AutomationAccordion />
						</WorkItemModal.SidebarStack>
					</WorkItemModal.RightColumn>
				</WorkItemModal.TwoColumnLayout>
			</WorkItemModal.Container>
		</WorkItemModalProvider>
	);
}
