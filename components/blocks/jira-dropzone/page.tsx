"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { BoardColumnAddButton } from "@/components/blocks/jira-kanban/experimental/components/create-work-item-drop-zone";
import {
	ExclusiveCreateWellProximityProvider,
	useExclusiveCreateWellProximity,
} from "@/components/blocks/jira-kanban/experimental/components/create-work-item-exclusive-proximity-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import {
	JiraDropzoneDemoArcPanel,
	JIRA_DROPZONE_DEMO_ARC_DEFAULTS,
	toFlightProfileOverride,
	type JiraDropzoneDemoArc,
} from "./jira-dropzone-demo-arc-panel";
import { JiraDropzoneDemoChip } from "./jira-dropzone-demo-chip";
import {
	JiraDropzone,
	JiraDropzoneField,
	sessionReceiptId,
	useJiraDropzoneReceive,
	type JiraDropzoneDragState,
	type JiraDropzoneMember,
	type ViewportPoint,
} from "./index";
import { useJiraDropzoneDemoDrag } from "./use-jira-dropzone-demo-drag";

const DEMO_MEMBERS: readonly [JiraDropzoneMember, ...JiraDropzoneMember[]] = [
	{ id: "demo-rovo", name: "Rovo", vpkLogo: "rovo" },
	{ id: "demo-claude", name: "Claude" },
	{ id: "demo-cursor", name: "Cursor" },
	{ id: "demo-codex", name: "Codex" },
];

const DEMO_COLUMNS = ["To Do", "In Progress"] as const;

export default function JiraDropzonePage() {
	const [arc, setArc] = useState<JiraDropzoneDemoArc>(JIRA_DROPZONE_DEMO_ARC_DEFAULTS);
	const profile = useMemo(() => toFlightProfileOverride(arc), [arc]);

	return (
		<JiraDropzoneField profile={profile}>
			<JiraDropzoneDemoStage arc={arc} onArcChange={setArc} />
		</JiraDropzoneField>
	);
}

function JiraDropzoneDemoStage({
	arc,
	onArcChange,
}: Readonly<{
	arc: JiraDropzoneDemoArc;
	onArcChange: (next: JiraDropzoneDemoArc) => void;
}>) {
	const receive = useJiraDropzoneReceive();
	const launchRef = useRef<HTMLDivElement>(null);
	const stageRef = useRef<HTMLDivElement>(null);
	const generationRef = useRef(0);
	const [staggeredDrop, setStaggeredDrop] = useState(true);
	const [staggeredBounce, setStaggeredBounce] = useState(false);

	const commitReceive = useCallback((
		title: string,
		from: ViewportPoint,
		source: readonly [JiraDropzoneMember, ...JiraDropzoneMember[]],
	) => {
		generationRef.current += 1;
		const generation = generationRef.current;
		const members = source.map((member) => ({
			...member,
			id: `${member.id}-${generation}`,
		})) as [JiraDropzoneMember, ...JiraDropzoneMember[]];
		receive({
			bounce: staggeredBounce ? "each" : "once",
			drop: staggeredDrop ? "stagger" : "cohort",
			from,
			id: sessionReceiptId({
				cohortKey: members.map((member) => member.id).sort().join("|"),
				from,
				title,
			}),
			members,
			title,
		});
	}, [receive, staggeredBounce, staggeredDrop]);

	const demoDrag = useJiraDropzoneDemoDrag(stageRef, commitReceive);

	function fire(count: 1 | 4, title: string) {
		const rect = launchRef.current?.getBoundingClientRect();
		const from = rect
			? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
			: { x: 24, y: 24 };
		commitReceive(title, from, DEMO_MEMBERS.slice(0, count) as [
			JiraDropzoneMember,
			...JiraDropzoneMember[],
		]);
	}

	return (
		<div
			className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 rounded-lg bg-surface p-6"
			data-jira-dropzone-arc-direction={arc.direction}
			data-jira-dropzone-arc-peak={String(arc.peak)}
			data-jira-dropzone-arc-rotate={String(arc.rotate)}
			data-jira-dropzone-arc-strength={String(arc.strength)}
			data-jira-dropzone-bounce={staggeredBounce ? "each" : "once"}
			data-jira-dropzone-demo-dragging={demoDrag.dragging || undefined}
			data-jira-dropzone-drop={staggeredDrop ? "stagger" : "cohort"}
			ref={stageRef}
		>
			<div className="flex flex-wrap items-center justify-center gap-2" ref={launchRef}>
				<Button onClick={() => fire(1, "To Do")} variant="outline">
					Drop one session
				</Button>
				<Button onClick={() => fire(4, "To Do")} variant="outline">
					Drop four sessions
				</Button>
				<Button onClick={() => fire(1, "In Progress")} variant="outline">
					Drop into In Progress
				</Button>
			</div>
			<div className="flex flex-wrap items-center justify-center gap-2">
				<DemoFlagSwitch
					checked={staggeredDrop}
					id="jira-dropzone-staggered-drop"
					label="Staggered drop"
					onCheckedChange={setStaggeredDrop}
				/>
				<DemoFlagSwitch
					checked={staggeredBounce}
					id="jira-dropzone-staggered-bounce"
					label="Staggered bounce"
					onCheckedChange={setStaggeredBounce}
				/>
			</div>
			<JiraDropzoneDemoArcPanel
				arc={arc}
				onArcChange={onArcChange}
				onPlay={() => fire(1, "To Do")}
			/>
			<div className="flex flex-wrap items-center justify-center gap-2">
				{DEMO_MEMBERS.map((member) => (
					<JiraDropzoneDemoChip
						key={member.id}
						members={[member]}
						onDragCancel={demoDrag.onDragCancel}
						onDragEnd={demoDrag.onDragEnd}
						onDragMove={demoDrag.onDragMove}
						onDragStart={demoDrag.onDragStart}
					/>
				))}
				<JiraDropzoneDemoChip
					members={DEMO_MEMBERS}
					onDragCancel={demoDrag.onDragCancel}
					onDragEnd={demoDrag.onDragEnd}
					onDragMove={demoDrag.onDragMove}
					onDragStart={demoDrag.onDragStart}
				/>
			</div>
			<ExclusiveCreateWellProximityProvider>
				<div className="grid w-full grid-cols-2 gap-4">
					{DEMO_COLUMNS.map((title) => (
						<DemoColumn
							drag={demoDrag.dragFor(title)}
							key={title}
							title={title}
						/>
					))}
				</div>
			</ExclusiveCreateWellProximityProvider>
		</div>
	);
}

function DemoFlagSwitch({
	checked,
	id,
	label,
	onCheckedChange,
}: Readonly<{
	checked: boolean;
	id: string;
	label: string;
	onCheckedChange: (checked: boolean) => void;
}>) {
	return (
		<div className="flex items-center gap-2">
			<Switch
				checked={checked}
				id={id}
				label={label}
				onCheckedChange={onCheckedChange}
				size="sm"
			/>
			<Label htmlFor={id}>{label}</Label>
		</div>
	);
}

function DemoColumn({
	drag,
	title,
}: Readonly<{
	drag: JiraDropzoneDragState;
	title: string;
}>) {
	const targetRef = useRef<HTMLDivElement>(null);
	const isExclusiveWinner = useExclusiveCreateWellProximity(title, targetRef);

	return (
		<div className="flex flex-col gap-2">
			<p className="text-sm text-text-subtle">{title}</p>
			<JiraDropzone
				drag={drag}
				exclusiveWinner={isExclusiveWinner}
				label="Create new work item"
				measuredRef={targetRef}
				renderResting={() => <BoardColumnAddButton reveal="always" title={title} />}
				title={title}
			/>
		</div>
	);
}
