"use client";

import RetryIcon from "@atlaskit/icon/core/retry";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { token } from "@/lib/tokens";

import type { JiraCreateExample } from "../data/jira-create-board";
import type { JiraCreateInsertPosition } from "../lib/jira-create-insert";

export interface JiraCreateToolbarProps {
	example: JiraCreateExample;
	onAdd: (count: 1 | 2) => void;
	onExampleChange: (values: readonly string[]) => void;
	onPositionChange: (values: readonly string[]) => void;
	onReplay: () => void;
	position: JiraCreateInsertPosition;
}

export function JiraCreateToolbar({
	example,
	onAdd,
	onExampleChange,
	onPositionChange,
	onReplay,
	position,
}: Readonly<JiraCreateToolbarProps>) {
	return (
		<div
			className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2"
			style={{ paddingBlock: token("space.150"), paddingInline: token("space.150") }}
		>
			<Button onClick={() => onAdd(1)} size="compact" type="button" variant="outline">
				Add 1
			</Button>
			<Button onClick={() => onAdd(2)} size="compact" type="button" variant="outline">
				Add 2
			</Button>
			<ToggleGroup
				aria-label="Insert position"
				onValueChange={onPositionChange}
				size="sm"
				value={[position]}
				variant="outline"
			>
				<ToggleGroupItem value="top">Top</ToggleGroupItem>
				<ToggleGroupItem value="middle">Middle</ToggleGroupItem>
				<ToggleGroupItem value="bottom">Bottom</ToggleGroupItem>
			</ToggleGroup>
			<ToggleGroup
				aria-label="Create example"
				onValueChange={onExampleChange}
				size="sm"
				value={[example]}
				variant="outline"
			>
				<ToggleGroupItem value="work-item">Work item</ToggleGroupItem>
				<ToggleGroupItem value="work-item-sessions">Work item + sessions</ToggleGroupItem>
			</ToggleGroup>
			<Button
				aria-label="Restart create animation"
				onClick={onReplay}
				size="compact"
				type="button"
				variant="outline"
			>
				<Icon render={<RetryIcon label="" />} />
				Restart
			</Button>
		</div>
	);
}
