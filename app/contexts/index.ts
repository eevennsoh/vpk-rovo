/**
 * Context Providers
 *
 * React contexts following the Vercel composition pattern with { state, actions, meta }.
 */

// Chat contexts
export { RovoChatProvider, useRovoChat, useRovoSelectedAgent } from "./context-rovo-chat";
export type {
	QueuedPromptItem,
	SendPromptOptions,
	StudioAgentPublishStatus,
	StudioSessionAgentEntry,
} from "./context-rovo-chat";

// Modal contexts
export {
	WorkItemModalProvider,
	useWorkItemModal,
	useWorkItemModalState,
	useWorkItemModalActions,
	useWorkItemData,
} from "./context-work-item-modal";
export type {
	WorkItemModalState,
	WorkItemModalActions,
	WorkItemData,
	WorkItemModalMeta,
	WorkItemModalContextValue,
} from "./context-work-item-modal";

// Other contexts
export { SidebarProvider, useSidebar } from "./context-sidebar";

// Creation mode context
export {
	CreationModeProvider,
	useCreationModeState,
	useCreationModeActions,
} from "./context-creation-mode";
export type { CreationMode } from "./context-creation-mode";
