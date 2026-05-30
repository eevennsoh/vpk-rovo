import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
	Queue,
	QueueList,
	QueueItem,
	QueueItemContent,
	QueueItemDescription,
	QueueItemDragHandle,
	QueueItemIndicator,
	QueueItemActions,
	QueueItemAction,
	QueueItemAttachment,
	QueueItemFile,
	QueueSection,
	QueueSectionTrigger,
	QueueSectionLabel,
	QueueSectionContent,
} from "@/components/ui-custom/queue";
import { Button } from "@/components/ui/button";
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import DeleteIcon from "@atlaskit/icon/core/delete";
import EditIcon from "@atlaskit/icon/core/edit";

const queueDemoRootClassName = "w-full max-w-sm border-border border-b-0 rounded-b-none bg-surface-raised px-2 pt-2 pb-2 shadow-none";
const queueDemoListClassName = "mt-0 mb-0 w-full [&_[data-slot=scroll-area-viewport]>div]:max-h-28 [&_[data-slot=scroll-area-viewport]>div]:pr-0 [&_ul]:flex [&_ul]:w-full [&_ul]:flex-col [&_ul]:gap-1";
const queueDemoItemClassName = "h-8 w-full justify-center gap-0 bg-surface hover:bg-surface-hovered";
const queueDemoItemWithDescriptionClassName = "h-auto min-h-16 w-full justify-center gap-2 bg-surface py-2 hover:bg-surface-hovered";
const queueDemoRowClassName = "flex min-w-0 items-center gap-2";
const queueDemoContentClassName = "text-text-subtle";
const queueDemoCompletedContentClassName = "text-text-subtlest";
const queueDemoDescriptionClassName = "text-text-subtlest";
const queueDemoAttachmentClassName = "mt-0 ml-5 gap-1.5";
const queueDemoSectionTriggerClassName = "bg-surface text-text-subtle hover:bg-surface-hovered";
const queueDemoActionsClassName = "gap-0";
const queueDemoActionClassName = "text-icon-subtlest";
const queueDemoDragHandleClassName = "";

// — Default: todo list with collapsible sections —

export default function QueueDemo() {
	return (
		<Queue className={queueDemoRootClassName}>
			<QueueSection>
				<QueueSectionTrigger className={queueDemoSectionTriggerClassName}>
					<QueueSectionLabel
						label="Completed"
						count={3}
					/>
				</QueueSectionTrigger>
				<QueueSectionContent>
					<QueueList className={queueDemoListClassName}>
						<QueueItem className={queueDemoItemClassName}>
							<div className={queueDemoRowClassName}>
								<QueueItemDragHandle className={queueDemoDragHandleClassName} />
								<QueueItemIndicator completed />
								<QueueItemContent className={queueDemoCompletedContentClassName} completed>Install dependencies</QueueItemContent>
							</div>
						</QueueItem>
						<QueueItem className={queueDemoItemClassName}>
							<div className={queueDemoRowClassName}>
								<QueueItemDragHandle className={queueDemoDragHandleClassName} />
								<QueueItemIndicator completed />
								<QueueItemContent className={queueDemoCompletedContentClassName} completed>Set up database schema</QueueItemContent>
							</div>
						</QueueItem>
						<QueueItem className={queueDemoItemClassName}>
							<div className={queueDemoRowClassName}>
								<QueueItemDragHandle className={queueDemoDragHandleClassName} />
								<QueueItemIndicator completed />
								<QueueItemContent className={queueDemoCompletedContentClassName} completed>Configure authentication</QueueItemContent>
							</div>
						</QueueItem>
					</QueueList>
				</QueueSectionContent>
			</QueueSection>
			<QueueSection>
				<QueueSectionTrigger className={queueDemoSectionTriggerClassName}>
					<QueueSectionLabel
						label="Pending"
						count={2}
					/>
				</QueueSectionTrigger>
				<QueueSectionContent>
					<QueueList className={queueDemoListClassName}>
						<QueueItem className={queueDemoItemWithDescriptionClassName}>
							<div className={queueDemoRowClassName}>
								<QueueItemDragHandle className={queueDemoDragHandleClassName} />
								<QueueItemIndicator />
								<QueueItemContent className={queueDemoContentClassName}>Write API endpoints</QueueItemContent>
							</div>
							<QueueItemDescription className={queueDemoDescriptionClassName}>Create REST endpoints for user CRUD operations</QueueItemDescription>
						</QueueItem>
						<QueueItem className={queueDemoItemClassName}>
							<div className={queueDemoRowClassName}>
								<QueueItemDragHandle className={queueDemoDragHandleClassName} />
								<QueueItemIndicator />
								<QueueItemContent className={queueDemoContentClassName}>Add unit tests</QueueItemContent>
							</div>
						</QueueItem>
					</QueueList>
				</QueueSectionContent>
			</QueueSection>
		</Queue>
	);
}

// — With actions: hover-revealed action buttons on items —

export function QueueDemoWithActions() {
	return (
		<Queue className={queueDemoRootClassName}>
			<QueueList className={queueDemoListClassName}>
				<QueueItem className={queueDemoItemClassName}>
					<div className={queueDemoRowClassName}>
						<QueueItemDragHandle className={queueDemoDragHandleClassName} />
						<QueueItemIndicator />
						<QueueItemContent className={queueDemoContentClassName}>Review pull request #42</QueueItemContent>
						<QueueItemActions className={queueDemoActionsClassName}>
							<QueueItemAction aria-label="Edit" className={queueDemoActionClassName}>
								<Icon aria-hidden render={<EditIcon label="" size="small" />} />
							</QueueItemAction>
							<QueueItemAction aria-label="Send immediately" className={queueDemoActionClassName}>
								<Icon aria-hidden render={<ArrowUpIcon label="" size="small" />} />
							</QueueItemAction>
							<QueueItemAction aria-label="Delete" className={queueDemoActionClassName}>
								<Icon aria-hidden render={<DeleteIcon label="" size="small" />} />
							</QueueItemAction>
						</QueueItemActions>
					</div>
				</QueueItem>
				<QueueItem className={queueDemoItemClassName}>
					<div className={queueDemoRowClassName}>
						<QueueItemDragHandle className={queueDemoDragHandleClassName} />
						<QueueItemIndicator />
						<QueueItemContent className={queueDemoContentClassName}>Update documentation</QueueItemContent>
						<QueueItemActions className={queueDemoActionsClassName}>
							<QueueItemAction aria-label="Edit" className={queueDemoActionClassName}>
								<Icon aria-hidden render={<EditIcon label="" size="small" />} />
							</QueueItemAction>
							<QueueItemAction aria-label="Send immediately" className={queueDemoActionClassName}>
								<Icon aria-hidden render={<ArrowUpIcon label="" size="small" />} />
							</QueueItemAction>
							<QueueItemAction aria-label="Delete" className={queueDemoActionClassName}>
								<Icon aria-hidden render={<DeleteIcon label="" size="small" />} />
							</QueueItemAction>
						</QueueItemActions>
					</div>
				</QueueItem>
				<QueueItem className={queueDemoItemClassName}>
					<div className={queueDemoRowClassName}>
						<QueueItemDragHandle className={queueDemoDragHandleClassName} />
						<QueueItemIndicator completed />
						<QueueItemContent className={queueDemoCompletedContentClassName} completed>Fix CI pipeline</QueueItemContent>
						<QueueItemActions className={queueDemoActionsClassName}>
							<QueueItemAction aria-label="Edit" className={queueDemoActionClassName}>
								<Icon aria-hidden render={<EditIcon label="" size="small" />} />
							</QueueItemAction>
							<QueueItemAction aria-label="Send immediately" className={queueDemoActionClassName}>
								<Icon aria-hidden render={<ArrowUpIcon label="" size="small" />} />
							</QueueItemAction>
							<QueueItemAction aria-label="Delete" className={queueDemoActionClassName}>
								<Icon aria-hidden render={<DeleteIcon label="" size="small" />} />
							</QueueItemAction>
						</QueueItemActions>
					</div>
				</QueueItem>
			</QueueList>
		</Queue>
	);
}

// — With attachments: items with file badges —

export function QueueDemoWithAttachments() {
	return (
		<Queue className={queueDemoRootClassName}>
			<QueueList className={queueDemoListClassName}>
				<QueueItem className={queueDemoItemWithDescriptionClassName}>
					<div className={queueDemoRowClassName}>
						<QueueItemDragHandle className={queueDemoDragHandleClassName} />
						<QueueItemIndicator />
						<QueueItemContent className={queueDemoContentClassName}>Process uploaded documents</QueueItemContent>
					</div>
					<QueueItemAttachment className={queueDemoAttachmentClassName}>
						<QueueItemFile>report-q4.pdf</QueueItemFile>
						<QueueItemFile>summary.docx</QueueItemFile>
					</QueueItemAttachment>
				</QueueItem>
				<QueueItem className={queueDemoItemWithDescriptionClassName}>
					<div className={queueDemoRowClassName}>
						<QueueItemDragHandle className={queueDemoDragHandleClassName} />
						<QueueItemIndicator completed />
						<QueueItemContent className={queueDemoCompletedContentClassName} completed>Analyze dataset</QueueItemContent>
					</div>
					<QueueItemAttachment className={queueDemoAttachmentClassName}>
						<QueueItemFile>data.csv</QueueItemFile>
					</QueueItemAttachment>
				</QueueItem>
			</QueueList>
		</Queue>
	);
}

// — Minimal: simple flat list without sections —

export function QueueDemoMinimal() {
	return (
		<Queue className={queueDemoRootClassName}>
			<QueueList className={queueDemoListClassName}>
				<QueueItem className={queueDemoItemClassName}>
					<div className={queueDemoRowClassName}>
						<QueueItemDragHandle className={queueDemoDragHandleClassName} />
						<QueueItemIndicator completed />
						<QueueItemContent className={queueDemoCompletedContentClassName} completed>Install deps</QueueItemContent>
					</div>
				</QueueItem>
				<QueueItem className={queueDemoItemClassName}>
					<div className={queueDemoRowClassName}>
						<QueueItemDragHandle className={queueDemoDragHandleClassName} />
						<QueueItemIndicator />
						<QueueItemContent className={queueDemoContentClassName}>Run tests</QueueItemContent>
					</div>
				</QueueItem>
				<QueueItem className={queueDemoItemClassName}>
					<div className={queueDemoRowClassName}>
						<QueueItemDragHandle className={queueDemoDragHandleClassName} />
						<QueueItemIndicator />
						<QueueItemContent className={queueDemoContentClassName}>Deploy to staging</QueueItemContent>
					</div>
				</QueueItem>
			</QueueList>
		</Queue>
	);
}

// — Prompt queue: chat-style removable prompt queue —

const initialPrompts = [
	{ id: "1", text: "Summarize the latest sprint retro notes" },
	{ id: "2", text: "Draft a follow-up message for the design review" },
	{ id: "3", text: "Find all open blockers in the current sprint" },
];

export function QueueDemoPromptQueue() {
	const [prompts, setPrompts] = useState(initialPrompts);

	const handleRemove = (id: string) => {
		setPrompts((prev) => prev.filter((p) => p.id !== id));
	};

	const handleReset = () => {
		setPrompts(initialPrompts);
	};

	if (prompts.length === 0) {
		return (
			<div className="flex w-full max-w-sm flex-col items-center gap-3">
				<p className="text-sm text-muted-foreground">Queue empty</p>
				<Button variant="outline" size="sm" onClick={handleReset}>
					Reset queue
				</Button>
			</div>
		);
	}

	return (
		<div className="flex w-full max-w-sm flex-col gap-2">
			<Queue className={queueDemoRootClassName}>
				<QueueList className={queueDemoListClassName}>
					{prompts.map((prompt) => (
						<QueueItem key={prompt.id} className={queueDemoItemClassName}>
							<div className={queueDemoRowClassName}>
								<QueueItemDragHandle className={queueDemoDragHandleClassName} />
								<QueueItemIndicator />
								<QueueItemContent className={queueDemoContentClassName}>{prompt.text}</QueueItemContent>
								<QueueItemActions>
									<QueueItemAction
										aria-label="Remove queued message"
										className={queueDemoActionClassName}
										onClick={() => handleRemove(prompt.id)}
									>
										<Icon aria-hidden render={<DeleteIcon label="" size="small" />} />
									</QueueItemAction>
								</QueueItemActions>
							</div>
						</QueueItem>
					))}
				</QueueList>
			</Queue>
		</div>
	);
}
