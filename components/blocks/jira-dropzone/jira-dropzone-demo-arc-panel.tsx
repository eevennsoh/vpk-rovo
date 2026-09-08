"use client";

import type { ReactElement } from "react";

import { GUI } from "@/components/utils/gui";

import {
	JIRA_DROPZONE_DEMO_ARC_DEFAULTS,
	JIRA_DROPZONE_DEMO_DURATION_OPTIONS,
	type JiraDropzoneDemoArc,
} from "./lib/jira-dropzone-demo-arc";
import type { JiraDropzoneArcDirection } from "./lib/jira-dropzone-types";

const DIRECTION_OPTIONS = [
	{ value: "automatic", label: "Auto" },
	{ value: "cw", label: "CW" },
	{ value: "ccw", label: "CCW" },
] as const satisfies readonly {
	value: JiraDropzoneArcDirection;
	label: string;
}[];

export function JiraDropzoneDemoArcPanel({
	arc,
	onArcChange,
	onPlay,
}: Readonly<{
	arc: JiraDropzoneDemoArc;
	onArcChange: (next: JiraDropzoneDemoArc) => void;
	onPlay: () => void;
}>): ReactElement {
	function patch<K extends keyof JiraDropzoneDemoArc>(
		key: K,
		value: JiraDropzoneDemoArc[K],
	) {
		onArcChange({ ...arc, [key]: value });
	}

	return (
		<div
			className="w-full rounded-lg border border-border bg-surface-raised p-4"
			data-jira-dropzone-arc-controls=""
		>
			<GUI.Panel
				onPlay={onPlay}
				playLabel="Replay drop"
				title="Motion arc"
				values={{
					direction: arc.direction,
					duration: arc.duration,
					peak: arc.peak,
					rotate: arc.rotate,
					strength: arc.strength,
				}}
			>
				<GUI.Control
					defaultValue={JIRA_DROPZONE_DEMO_ARC_DEFAULTS.strength}
					description="Bend height. 1 peaks at the distance between points; 0 is a straight line."
					id="jira-dropzone-arc-strength"
					label="Strength"
					max={2}
					min={0}
					onChange={(strength) => patch("strength", strength)}
					step={0.01}
					value={arc.strength}
					valueKeys="strength"
				/>
				<GUI.Control
					defaultValue={JIRA_DROPZONE_DEMO_ARC_DEFAULTS.peak}
					description="Where along the bend the arc is tallest. 0.5 is symmetric."
					id="jira-dropzone-arc-peak"
					label="Peak"
					max={1}
					min={0}
					onChange={(peak) => patch("peak", peak)}
					step={0.01}
					value={arc.peak}
					valueKeys="peak"
				/>
				<GUI.Control
					defaultValue={JIRA_DROPZONE_DEMO_ARC_DEFAULTS.rotate}
					description="How much the chip follows the arc tangent. 0 is off; 1 is full."
					id="jira-dropzone-arc-rotate"
					label="Rotate"
					max={1}
					min={0}
					onChange={(rotate) => patch("rotate", rotate)}
					step={0.01}
					value={arc.rotate}
					valueKeys="rotate"
				/>
				<GUI.SegmentedControl
					description="Which side the arc bulges. Auto lets Motion pick a stable screen-space side."
					id="jira-dropzone-arc-direction"
					label="Direction"
					onChange={(direction) => patch("direction", direction)}
					options={DIRECTION_OPTIONS}
					value={arc.direction}
					valueKeys="direction"
				/>
				<GUI.SegmentedControl
					description="Travel time from the VPK duration scale. slower is the production well recipe."
					id="jira-dropzone-arc-duration"
					label="Duration"
					onChange={(duration) => patch("duration", duration)}
					options={JIRA_DROPZONE_DEMO_DURATION_OPTIONS}
					value={arc.duration}
					valueKeys="duration"
				/>
			</GUI.Panel>
		</div>
	);
}
