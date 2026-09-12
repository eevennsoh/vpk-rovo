"use client";

import BranchIcon from "@atlaskit/icon/core/branch";
import EditIcon from "@atlaskit/icon/core/edit";
import LightbulbIcon from "@atlaskit/icon/core/lightbulb";
import LocationIcon from "@atlaskit/icon/core/location";
import PageIcon from "@atlaskit/icon/core/page";
import PersonIcon from "@atlaskit/icon/core/person";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import { useState } from "react";
import { DEMO_PULL_REQUESTS } from "@/components/blocks/pull-request";
import {
	AnimatedCollapsibleContextBar,
	CollapsibleContextBar,
	ContextBar,
	ContextBarCreatePullRequest,
	ContextBarLead,
	ContextBarPill,
	ContextBarPromptFlyout,
	ContextBarPullRequest,
	ContextBarTag,
	ContextBarTagGroup,
	ContextBarTrigger,
} from "@/components/ui-custom/context-bar";
import { Icon } from "@/components/ui/icon";
import { token } from "@/lib/tokens";

export default function ContextBarDemo() {
	return <ContextBarDemoCollapsible />;
}

export function ContextBarDemoCollapsible() {
	return (
		<div className="w-full max-w-md p-8">
			<CollapsibleContextBar
				collapsedIcon={
					<EditIcon color={token("color.icon.subtle")} label="" size="small" />
				}
				collapsedLabel="Edit agent"
				dismissLabel="Close edit context"
				lead={<EditIcon color={token("color.icon.subtle")} label="" size="small" />}
				leadLabel="Edit:"
				triggerAriaLabel="Edit agent: Research assistant"
			>
				<ContextBarTag
					color="blue"
					elemBefore={
						<PersonIcon color={token("color.icon.brand")} label="" size="small" />
					}
					title="Research assistant"
				>
					Research assistant
				</ContextBarTag>
			</CollapsibleContextBar>
		</div>
	);
}

export function ContextBarDemoDismissible() {
	const [visible, setVisible] = useState(true);

	return (
		<div className="w-full max-w-md p-8">
			{visible ? (
				<ContextBar dismissLabel="Close context" onDismiss={() => setVisible(false)}>
					<ContextBarLead
						icon={<LocationIcon color={token("color.icon.subtle")} label="" size="small" />}
					>
						Context:
					</ContextBarLead>
					<ContextBarTag
						color="blue"
						elemBefore={<PageIcon color={token("color.icon.brand")} label="" size="small" />}
						title="Q3 launch plan"
					>
						Q3 launch plan
					</ContextBarTag>
				</ContextBar>
			) : (
				<button
					className="text-sm font-medium text-text-subtle underline"
					onClick={() => setVisible(true)}
					type="button"
				>
					Restore context bar
				</button>
			)}
		</div>
	);
}

export function ContextBarDemoTrigger() {
	return (
		<div className="w-full max-w-md p-8">
			<ContextBarTrigger
				aria-label="Edit agent: Research assistant"
				icon={<EditIcon color={token("color.icon.subtle")} label="" size="small" />}
			>
				Edit agent
			</ContextBarTrigger>
		</div>
	);
}

export function ContextBarDemoAnimated() {
	return (
		<div className="w-full max-w-md p-8">
			<AnimatedCollapsibleContextBar
				collapsedIcon={<EditIcon color={token("color.icon.subtle")} label="" size="small" />}
				collapsedLabel="Edit agent"
				defaultOpen={false}
				dismissLabel="Close edit context"
				lead={<EditIcon color={token("color.icon.subtle")} label="" size="small" />}
				leadLabel="Edit:"
				triggerAriaLabel="Edit agent: Research assistant"
			>
				<ContextBarTag
					color="blue"
					elemBefore={<PersonIcon color={token("color.icon.brand")} label="" size="small" />}
					title="Research assistant"
				>
					Research assistant
				</ContextBarTag>
			</AnimatedCollapsibleContextBar>
		</div>
	);
}

/**
 * Width-aware row of action pills. As many pills render inline as fit; the rest
 * collapse behind a trailing "…" overflow button that opens a dropdown menu.
 * Each item carries both a visible `content` (the pill) and a menu-friendly
 * `label` (+ optional `icon`) so the hidden items render as real menu items
 * rather than nested pill buttons inside the overflow surface.
 */
export function ContextBarDemoMultiPill() {
	const pills = [
		{
			id: "review",
			label: "Review +6 -3",
			content: (
				<ContextBarPill>
					Review{" "}
					<span className="inline-flex items-center gap-0.5">
						<span className="font-mono font-normal text-green-500">+6</span>
						<span className="font-mono font-normal text-red-500">-3</span>
					</span>
				</ContextBarPill>
			),
		},
		{
			id: "move",
			label: "Move to Local",
			icon: <Icon render={<LocationIcon label="" />} label="Move to Local" />,
			content: (
				<ContextBarPill
					icon={<LocationIcon color={token("color.icon.subtle")} label="" size="small" />}
				>
					Move to Local
				</ContextBarPill>
			),
		},
		{
			id: "create-prs",
			label: "Create PRs",
			icon: <Icon render={<PullRequestIcon label="" />} label="Create PRs" />,
			content: (
				<ContextBarPill
					icon={<PullRequestIcon color={token("color.icon.subtle")} label="" size="small" />}
				>
					Create PRs
				</ContextBarPill>
			),
		},
		{
			id: "run-tests",
			label: "Run tests",
			content: <ContextBarPill>Run tests</ContextBarPill>,
		},
		{
			id: "new-branch",
			label: "New branch",
			icon: <Icon render={<BranchIcon label="" />} label="New branch" />,
			content: (
				<ContextBarPill
					icon={<BranchIcon color={token("color.icon.subtle")} label="" size="small" />}
				>
					New branch
				</ContextBarPill>
			),
		},
		{
			id: "share",
			label: "Share link",
			content: <ContextBarPill>Share link</ContextBarPill>,
		},
	];

	return (
		<div className="w-full max-w-md p-8">
			<ContextBarTagGroup items={pills} overflowAriaLabel="Show more actions" />
		</div>
	);
}

export function ContextBarDemoCreatePullRequest() {
	const item = DEMO_PULL_REQUESTS[0];
	if (!item) {
		return null;
	}

	const branch = item.branch ?? "main";
	const repository = item.repository ?? "storefront";

	return (
		<div className="w-full max-w-xl p-8">
			<ContextBarCreatePullRequest
				additions={item.additions}
				branch={branch}
				deletions={item.deletions}
				onCreate={() => undefined}
				onCreateDraft={() => undefined}
				onCreateManually={() => undefined}
				onDismiss={() => undefined}
				repository={repository}
			/>
		</div>
	);
}

const FAILED_CI_CHECKS = [
	{ id: "lint-types", name: "Lint and typecheck", status: "failed", details: "Failed after 42s · deliveryAddress may be null" },
	{ id: "unit-tests", name: "Unit tests", status: "passed", details: "418 tests in 2m 46s" },
	{ id: "browser-tests", name: "Guest checkout browser tests", status: "queued", details: "Waiting for CI" },
] as const;

const PASSED_CI_CHECKS = [
	{ id: "lint-types", name: "Lint and typecheck", status: "passed", details: "Passed in 1m 18s" },
	{ id: "unit-tests", name: "Unit tests", status: "passed", details: "418 tests in 2m 46s" },
	{ id: "browser-tests", name: "Guest checkout browser tests", status: "passed", details: "Passed in 3m 12s" },
] as const;

const PULL_REQUEST_STATE_PERMUTATIONS = [
	{ id: "open-failed", ciStatus: "failed", checks: FAILED_CI_CHECKS, status: "Open", summary: "1 failed, 1 passed, 1 queued" },
	{ id: "open-passed", ciStatus: "passed", checks: PASSED_CI_CHECKS, status: "Open", summary: "3 CI checks passed" },
	{ id: "merged-passed", ciStatus: "passed", checks: PASSED_CI_CHECKS, status: "Merged", summary: "3 CI checks passed" },
] as const;

function ContextBarDemoPullRequestPermutation({
	item,
	permutation,
}: Readonly<{
	item: (typeof DEMO_PULL_REQUESTS)[number];
	permutation: (typeof PULL_REQUEST_STATE_PERMUTATIONS)[number];
}>) {
	const [autoFixEnabled, setAutoFixEnabled] = useState(false);
	const [autoMergeEnabled, setAutoMergeEnabled] = useState(true);
	const canMutatePullRequest = permutation.status === "Open";

	return (
		<ContextBarPullRequest
			additions={item.additions}
			author={item.author}
			branch={item.branch ?? "main"}
			ci={{
				autoFixEnabled,
				autoMergeEnabled,
				checks: permutation.checks,
				onAutoFixChange: canMutatePullRequest ? setAutoFixEnabled : undefined,
				onAutoMergeChange: canMutatePullRequest ? setAutoMergeEnabled : undefined,
				status: permutation.ciStatus,
				summary: permutation.summary,
			}}
			deletions={item.deletions}
			filesChanged={item.filesChanged}
			href={`https://github.com/${item.repository}/pull/${item.number}`}
			number={item.number}
			onDismiss={() => undefined}
			repository={item.repository}
			showRepository={false}
			showStatusLozenge
			status={permutation.status}
			targetBranch={item.targetBranch}
			title={item.title}
		/>
	);
}

export function ContextBarDemoPullRequest() {
	const item = DEMO_PULL_REQUESTS[0];
	if (!item) {
		return null;
	}

	return (
		<div className="flex w-full max-w-xl flex-col gap-5 p-8" data-pr-permutations>
			{PULL_REQUEST_STATE_PERMUTATIONS.map((permutation) => (
				<ContextBarDemoPullRequestPermutation
					item={item}
					key={permutation.id}
					permutation={permutation}
				/>
			))}
		</div>
	);
}

/**
 * One context-bar pill in the dock; hover or click stacks the remaining prompts
 * straight up as the same pills. The extras sit above the trigger, so the
 * demo is padded from the top rather than wrapping a full composer.
 */
export function ContextBarDemoPromptFlyout() {
	const prompts = [
		"Is this epic going to hit its target date?",
		"Which stream is furthest behind?",
		"What is left before the adapter can be deleted?",
	];
	const [selected, setSelected] = useState<string | null>(null);

	return (
		<div className="flex min-h-[28rem] w-full max-w-md items-end p-8">
			<div className="w-full">
				<ContextBarPromptFlyout
					icon={
						<LightbulbIcon color={token("color.icon.subtle")} label="" size="small" />
					}
					items={prompts.map((prompt, index) => ({
						id: `prompt-${index}`,
						label: prompt,
						onSelect: () => setSelected(prompt),
					}))}
				/>
				{selected ? (
					<p className="mt-3 text-sm text-text-subtle">Asked: {selected}</p>
				) : null}
			</div>
		</div>
	);
}
