"use client";

import { useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";

import { JiraLinkingDropFlights } from "./jira-linking-flight";
import { isJiraLinkingActive, type JiraLinkingTarget } from "./lifecycle";
import {
	useJiraLinkingAtlas,
	type JiraLinkingIdentity,
} from "./use-jira-linking-atlas";
import {
	useJiraLinkingFrame,
	type JiraLinkingRelease,
} from "./use-jira-linking-frame";

// Keeps the GLSL out of the host's initial bundle; it only loads once a subject
// actually approaches a target.
const JiraLinkingCanvas = dynamic(
	() => import("./jira-linking-canvas").then((module) => module.JiraLinkingCanvas),
	{ ssr: false },
);

/** Default portal stacking order: below a typical drag layer, above the page. */
const DEFAULT_Z_INDEX = 290;

export interface JiraLinkingProps {
	/**
	 * CSS selector for the travelling element, re-measured every frame. It is a
	 * selector rather than a ref because the element is usually a portal the host
	 * mounts and unmounts mid-gesture, so there is no stable node to hold.
	 *
	 * Resolved against the whole document, so it must be unique per instance.
	 * Two effects sharing one attribute both measure the first match and only one
	 * of them ever draws.
	 */
	sourceSelector: string;
	/** Where the source is being pulled, or null when nothing is targeted. */
	target: JiraLinkingTarget | null;
	/** 0-1 closeness of source to target. Drives the neck width and field alpha. */
	nearness: number;
	/**
	 * Subjects that melt together. Keep this referentially stable for the whole
	 * gesture — it is re-read every frame and the texture atlas is rebuilt when
	 * the array identity changes.
	 */
	identities: readonly JiraLinkingIdentity[] | null;
	/** Set on release to run the fuse, or to fly subjects into the target. Bump `id` to restart. */
	release: JiraLinkingRelease | null;
	/** Called once the fuse has collapsed, or once every drop flight has landed. */
	onFuseSettled?: () => void;
	/** Theme variable both blobs are tinted from. */
	surfaceVariable?: string;
	zIndex?: number;
}

/**
 * A metaball field that necks a travelling element into the thing it is being
 * linked to, then fuses the two together on release.
 *
 * The effect is purely decorative: it draws behind the real drag element and
 * never intercepts a pointer, so the host's drop path commits whether or not
 * this ever paints. That also makes reduced motion a clean unmount rather than a
 * degraded animation.
 */
export function JiraLinking(props: Readonly<JiraLinkingProps>) {
	const shouldReduceMotion = useReducedMotion();
	const active = isJiraLinkingActive({
		hasRelease: props.release !== null,
		nearness: props.nearness,
		shouldReduceMotion,
	});

	// Unmounted rather than hidden: no RAF loop, no WebGL context, no lazy chunk,
	// and no atlas work for a user who opted out of motion.
	if (!active) {
		return null;
	}

	// Chip flights replace the goo fuse: they don't need a GL context, and
	// mounting the field would keep its RAF loop alive behind them.
	if (props.release?.drop) {
		return (
			<JiraLinkingDropFlights
				drop={props.release.drop}
				key={props.release.id}
				onSettled={props.onFuseSettled}
				target={props.release.target}
			/>
		);
	}

	return <JiraLinkingField {...props} />;
}

function JiraLinkingField({
	identities,
	nearness,
	onFuseSettled,
	release,
	sourceSelector,
	surfaceVariable,
	target,
	zIndex = DEFAULT_Z_INDEX,
}: Readonly<JiraLinkingProps>) {
	const atlas = useJiraLinkingAtlas(identities);
	const { frame, velocity } = useJiraLinkingFrame({
		members: atlas.members,
		nearness,
		onFuseSettled,
		release,
		sourceSelector,
		surfaceVariable,
		target,
	});

	// `document` is read below for the portal target. The frame is null on the
	// server and on the hydration pass, so this already returns first — the
	// explicit guard states that contract instead of relying on it.
	if (!frame || typeof document === "undefined") {
		return null;
	}

	return createPortal(
		<div
			aria-hidden="true"
			className="pointer-events-none fixed inset-0"
			data-slot="jira-linking"
			style={{ zIndex }}
		>
			<JiraLinkingCanvas
				atlas={atlas.atlas}
				atlasCells={atlas.atlasCells}
				frame={frame}
				velocity={velocity}
			/>
		</div>,
		document.body,
	);
}
