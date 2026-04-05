import { useState } from "react";
import {
	Queue,
	QueueList,
	QueueItem,
	QueueItemContent,
	QueueItemDescription,
	QueueItemIndicator,
	QueueItemActions,
	QueueItemAction,
	QueueItemAttachment,
	QueueItemFile,
	QueueSection,
	QueueSectionTrigger,
	QueueSectionLabel,
	QueueSectionContent,
} from "@/components/ui-ai/queue";
import { Button } from "@/components/ui/button";
import DeleteIcon from "@atlaskit/icon/core/delete";
import { CheckIcon, CircleIcon, CopyIcon, PencilIcon, TrashIcon } from "@/components/ui/vpk-icons";

// — Default: todo list with collapsible sections —

export default function QueueDemo() {
	return (
		<Queue className="w-full max-w-sm">
			<QueueSection>
				<QueueSectionTrigger>
					<QueueSectionLabel label="Completed" count={3} icon={<CheckIcon className="size-3.5 text-muted-foreground" />} />
				</QueueSectionTrigger>
				<QueueSectionContent>
					<QueueList>
						<QueueItem>
							<div className="flex items-center gap-2">
								<QueueItemIndicator completed />
								<QueueItemContent completed>Install dependencies</QueueItemContent>
							</div>
						</QueueItem>
						<QueueItem>
							<div className="flex items-center gap-2">
								<QueueItemIndicator completed />
								<QueueItemContent completed>Set up database schema</QueueItemContent>
							</div>
						</QueueItem>
						<QueueItem>
							<div className="flex items-center gap-2">
								<QueueItemIndicator completed />
								<QueueItemContent completed>Configure authentication</QueueItemContent>
							</div>
						</QueueItem>
					</QueueList>
				</QueueSectionContent>
			</QueueSection>
			<QueueSection>
				<QueueSectionTrigger>
					<QueueSectionLabel label="Pending" count={2} icon={<CircleIcon className="size-3.5 text-muted-foreground" />} />
				</QueueSectionTrigger>
				<QueueSectionContent>
					<QueueList>
						<QueueItem>
							<div className="flex items-center gap-2">
								<QueueItemIndicator />
								<QueueItemContent>Write API endpoints</QueueItemContent>
							</div>
							<QueueItemDescription>Create REST endpoints for user CRUD operations</QueueItemDescription>
						</QueueItem>
						<QueueItem>
							<div className="flex items-center gap-2">
								<QueueItemIndicator />
								<QueueItemContent>Add unit tests</QueueItemContent>
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
		<Queue className="w-full max-w-sm">
			<QueueList>
				<QueueItem>
					<div className="flex items-center gap-2">
						<QueueItemIndicator />
						<QueueItemContent>Review pull request #42</QueueItemContent>
						<QueueItemActions>
							<QueueItemAction aria-label="Edit">
								<PencilIcon className="size-3.5" />
							</QueueItemAction>
							<QueueItemAction aria-label="Copy">
								<CopyIcon className="size-3.5" />
							</QueueItemAction>
							<QueueItemAction aria-label="Delete">
								<TrashIcon className="size-3.5" />
							</QueueItemAction>
						</QueueItemActions>
					</div>
				</QueueItem>
				<QueueItem>
					<div className="flex items-center gap-2">
						<QueueItemIndicator />
						<QueueItemContent>Update documentation</QueueItemContent>
						<QueueItemActions>
							<QueueItemAction aria-label="Edit">
								<PencilIcon className="size-3.5" />
							</QueueItemAction>
							<QueueItemAction aria-label="Copy">
								<CopyIcon className="size-3.5" />
							</QueueItemAction>
							<QueueItemAction aria-label="Delete">
								<TrashIcon className="size-3.5" />
							</QueueItemAction>
						</QueueItemActions>
					</div>
				</QueueItem>
				<QueueItem>
					<div className="flex items-center gap-2">
						<QueueItemIndicator completed />
						<QueueItemContent completed>Fix CI pipeline</QueueItemContent>
						<QueueItemActions>
							<QueueItemAction aria-label="Edit">
								<PencilIcon className="size-3.5" />
							</QueueItemAction>
							<QueueItemAction aria-label="Copy">
								<CopyIcon className="size-3.5" />
							</QueueItemAction>
							<QueueItemAction aria-label="Delete">
								<TrashIcon className="size-3.5" />
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
		<Queue className="w-full max-w-sm">
			<QueueList>
				<QueueItem>
					<div className="flex items-center gap-2">
						<QueueItemIndicator />
						<QueueItemContent>Process uploaded documents</QueueItemContent>
					</div>
					<QueueItemAttachment>
						<QueueItemFile>report-q4.pdf</QueueItemFile>
						<QueueItemFile>summary.docx</QueueItemFile>
					</QueueItemAttachment>
				</QueueItem>
				<QueueItem>
					<div className="flex items-center gap-2">
						<QueueItemIndicator completed />
						<QueueItemContent completed>Analyze dataset</QueueItemContent>
					</div>
					<QueueItemAttachment>
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
		<Queue className="w-full max-w-sm">
			<QueueList>
				<QueueItem>
					<div className="flex items-center gap-2">
						<QueueItemIndicator completed />
						<QueueItemContent completed>Install deps</QueueItemContent>
					</div>
				</QueueItem>
				<QueueItem>
					<div className="flex items-center gap-2">
						<QueueItemIndicator />
						<QueueItemContent>Run tests</QueueItemContent>
					</div>
				</QueueItem>
				<QueueItem>
					<div className="flex items-center gap-2">
						<QueueItemIndicator />
						<QueueItemContent>Deploy to staging</QueueItemContent>
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
			<Queue className="border-border border-b-0 rounded-b-none bg-surface-raised px-2 pt-2 pb-2 shadow-none">
				<QueueList className="w-full [&_[data-slot=scroll-area-viewport]>div]:max-h-28 [&_[data-slot=scroll-area-viewport]>div]:pr-0 [&_ul]:w-full">
					{prompts.map((prompt) => (
						<QueueItem key={prompt.id} className="h-8 w-full justify-center gap-0 bg-surface hover:bg-surface-hovered">
							<div className="flex items-center gap-2">
								<QueueItemIndicator />
								<QueueItemContent className="text-text-subtle">{prompt.text}</QueueItemContent>
								<QueueItemActions>
									<Button
										aria-label="Remove queued message"
										onClick={() => handleRemove(prompt.id)}
										size="icon-sm"
										variant="ghost"
										className="size-7 cursor-pointer rounded-full text-icon-subtle opacity-0 transition-opacity group-hover:opacity-100"
									>
										<DeleteIcon label="" size="small" />
									</Button>
								</QueueItemActions>
							</div>
						</QueueItem>
					))}
				</QueueList>
			</Queue>
			<p className="text-center text-xs text-muted-foreground">Hover an item and click the delete icon to remove it</p>
		</div>
	);
}
