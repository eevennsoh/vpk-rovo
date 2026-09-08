"use client";

import { useCallback, useMemo, useRef, useState, type ReactElement, type RefObject } from "react";
import { arc, motion, useMotionValueEvent, useReducedMotion } from "motion/react";
import AddIcon from "@atlaskit/icon/core/add";

import { Icon } from "@/components/ui/icon";
import { useMagneticProximity } from "@/components/ui-custom/hooks/use-magnetic-proximity";
import type { MagneticPointerRelation } from "@/components/ui-custom/hooks/magnetic-proximity-model";
import { cn } from "@/lib/utils";

import { JiraDropzoneFlight } from "./jira-dropzone-flight";
import { useJiraDropzoneChannel } from "./jira-dropzone-field";
import {
	JIRA_DROPZONE_HOVER_AREA_PX,
	JIRA_DROPZONE_WELL_ENTER,
	JIRA_DROPZONE_WELL_ENTER_REDUCED,
	JIRA_DROPZONE_WELL_ENTER_SCALE,
	resolveJiraDropzoneArcOptions,
	resolveJiraDropzoneLandingPoint,
} from "./lib/jira-dropzone-motion";
import {
	resolveJiraDropzoneBounce,
	resolveJiraDropzoneCopy,
	resolveJiraDropzoneDrop,
	resolveJiraDropzonePhase,
	resolveJiraDropzoneSurface,
	shouldImpulseDropzoneChrome,
} from "./lib/jira-dropzone-receipts";
import type {
	FlightProfile,
	JiraDropzoneChannel,
	JiraDropzoneDragState,
	SessionFlight,
	ViewportPoint,
} from "./lib/jira-dropzone-types";
import { useJiraDropzoneCollapseHold } from "./use-jira-dropzone-collapse-hold";

export const JIRA_DROPZONE_WELL_CHROME_CLASS = "rounded-lg border border-dashed";

export function JiraDropzone({
	drag,
	exclusiveWinner = true,
	label,
	measuredRef,
	renderResting,
	title,
}: Readonly<{
	drag: JiraDropzoneDragState;
	exclusiveWinner?: boolean;
	label: string;
	measuredRef?: RefObject<HTMLDivElement | null>;
	renderResting: () => ReactElement;
	title: string;
}>): ReactElement {
	const localRef = useRef<HTMLDivElement>(null);
	const targetRef = measuredRef ?? localRef;
	const { channel, onLanded, profile, receiving } = useJiraDropzoneChannel(title);
	const magnet = useMagneticProximity(targetRef, {
		hoverArea: JIRA_DROPZONE_HOVER_AREA_PX,
	});
	const [rawProximity, setRawProximity] = useState<MagneticPointerRelation>("outside");
	useMotionValueEvent(magnet.proximity, "change", setRawProximity);
	const proximity = exclusiveWinner ? rawProximity : "outside";
	const phase = resolveJiraDropzonePhase({
		drag,
		proximate: proximity !== "outside",
		receiving,
	});
	const holdingOpen = useJiraDropzoneCollapseHold(phase);
	const surface = resolveJiraDropzoneSurface(phase, holdingOpen);
	const copy = resolveJiraDropzoneCopy(phase);
	const flyPath = useMemo(
		() => arc(resolveJiraDropzoneArcOptions(profile)),
		[profile.arcDirection, profile.arcPeak, profile.arcRotate, profile.arcStrength],
	);
	const resolveLandingPoint = useCallback((): ViewportPoint | null => {
		const rect = targetRef.current?.getBoundingClientRect();
		return rect ? resolveJiraDropzoneLandingPoint(rect) : null;
	}, [targetRef]);

	if (surface === "resting") {
		return (
			<div className="w-full" ref={targetRef}>
				{renderResting()}
			</div>
		);
	}

	const expanded = receiving || proximity !== "outside";
	const selected = phase === "armed" || phase === "receiving";
	const pinMagnet = receiving || !exclusiveWinner;
	const impact = profile.impact;
	const impacts = channel?.impacts ?? 0;
	const drop = resolveJiraDropzoneDrop(channel?.lastReceipt);
	const bouncePlayback = resolveJiraDropzoneBounce(channel?.lastReceipt);
	const bounce = impact && shouldImpulseDropzoneChrome({
		impacts,
		receiving,
	}) ? impact : null;

	return (
		<JiraDropzoneOpenSurface
			bounce={bounce}
			bouncePlayback={bouncePlayback}
			channel={channel}
			copy={copy}
			drop={drop}
			expanded={expanded}
			exclusiveWinner={exclusiveWinner}
			flyPath={flyPath}
			label={label}
			magnet={magnet}
			onLanded={onLanded}
			phase={phase}
			pinMagnet={pinMagnet}
			profile={profile}
			proximity={proximity}
			receiving={receiving}
			resolveLandingPoint={resolveLandingPoint}
			selected={selected}
			targetRef={targetRef}
			title={title}
		/>
	);
}

type JiraDropzoneOpenSurfaceProps = Readonly<{
	bounce: FlightProfile["impact"];
	bouncePlayback: ReturnType<typeof resolveJiraDropzoneBounce>;
	channel: JiraDropzoneChannel | undefined;
	copy: ReturnType<typeof resolveJiraDropzoneCopy>;
	drop: ReturnType<typeof resolveJiraDropzoneDrop>;
	expanded: boolean;
	exclusiveWinner: boolean;
	flyPath: ReturnType<typeof arc>;
	label: string;
	magnet: ReturnType<typeof useMagneticProximity>;
	onLanded: (key: SessionFlight["key"]) => void;
	phase: ReturnType<typeof resolveJiraDropzonePhase>;
	pinMagnet: boolean;
	profile: FlightProfile;
	proximity: MagneticPointerRelation;
	receiving: boolean;
	resolveLandingPoint: () => ViewportPoint | null;
	selected: boolean;
	targetRef: RefObject<HTMLDivElement | null>;
	title: string;
}>;

function JiraDropzoneOpenSurface({
	bounce,
	bouncePlayback,
	channel,
	copy,
	drop,
	expanded,
	exclusiveWinner,
	flyPath,
	label,
	magnet,
	onLanded,
	phase,
	pinMagnet,
	profile,
	proximity,
	receiving,
	resolveLandingPoint,
	selected,
	targetRef,
	title,
}: JiraDropzoneOpenSurfaceProps): ReactElement {
	const impacts = channel?.impacts ?? 0;

	return (
		<>
			<JiraDropzoneWell
				bounce={bounce}
				bouncePlayback={bouncePlayback}
				copy={copy}
				drop={drop}
				expanded={expanded}
				exclusiveWinner={exclusiveWinner}
				impacts={impacts}
				label={label}
				magnet={magnet}
				phase={phase}
				pinMagnet={pinMagnet}
				proximity={proximity}
				receiving={receiving}
				selected={selected}
				targetRef={targetRef}
				title={title}
			/>
			{channel ? channel.flights.map((flight) => (
				<JiraDropzoneFlight
					flyPath={flyPath}
					flight={flight}
					key={flight.key}
					onLanded={onLanded}
					profile={profile}
					resolveLandingPoint={resolveLandingPoint}
				/>
			)) : null}
		</>
	);
}

type JiraDropzoneWellProps = Pick<
	JiraDropzoneOpenSurfaceProps,
	| "bouncePlayback"
	| "copy"
	| "drop"
	| "expanded"
	| "exclusiveWinner"
	| "label"
	| "magnet"
	| "phase"
	| "pinMagnet"
	| "proximity"
	| "receiving"
	| "selected"
	| "targetRef"
	| "title"
> & {
	bounce: FlightProfile["impact"];
	impacts: number;
};

function JiraDropzoneWell({
	bounce,
	bouncePlayback,
	copy,
	drop,
	expanded,
	exclusiveWinner,
	impacts,
	label,
	magnet,
	phase,
	pinMagnet,
	proximity,
	receiving,
	selected,
	targetRef,
	title,
}: JiraDropzoneWellProps): ReactElement {
	const shouldReduceMotion = useReducedMotion();
	// Exit is the existing collapse-hold height shrink; this pop-in only runs when
	// the open well mounts at drag start.
	return (
		<motion.div
			animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
			className="w-full will-change-[opacity,transform]"
			initial={shouldReduceMotion
				? false
				: { opacity: 0, scale: JIRA_DROPZONE_WELL_ENTER_SCALE }}
			style={{
				x: pinMagnet ? 0 : magnet.x,
				y: pinMagnet ? 0 : magnet.y,
			}}
			transition={shouldReduceMotion
				? JIRA_DROPZONE_WELL_ENTER_REDUCED
				: JIRA_DROPZONE_WELL_ENTER}
		>
			<div
				aria-label={`${label} in ${title}${selected ? ", selected drop target" : ""}`}
				className="relative w-full overflow-visible"
				data-armed={selected || undefined}
				data-board-agent-session-column-title={title}
				data-board-agent-session-create-work-item-drop-zone={title}
				data-board-agent-session-drop-zone="create"
				data-exclusive-winner={exclusiveWinner || undefined}
				data-jira-dropzone-collapsing={phase === "resting" || undefined}
				data-jira-dropzone-copy={copy}
				data-jira-dropzone-bounce={bouncePlayback}
				data-jira-dropzone-drop={drop}
				data-jira-dropzone-impacts={String(impacts)}
				data-proximity={proximity}
				data-receiving={receiving || undefined}
				ref={targetRef}
				role="img"
			>
				<JiraDropzoneWellChrome
					bounce={bounce}
					copy={copy}
					expanded={expanded}
					impacts={impacts}
					label={label}
					magnet={magnet}
					phase={phase}
					pinMagnet={pinMagnet}
					selected={selected}
				/>
			</div>
		</motion.div>
	);
}

type JiraDropzoneWellChromeProps = Pick<
	JiraDropzoneWellProps,
	| "bounce"
	| "copy"
	| "expanded"
	| "impacts"
	| "label"
	| "magnet"
	| "phase"
	| "pinMagnet"
	| "selected"
>;

function JiraDropzoneWellChrome({
	bounce,
	copy,
	expanded,
	impacts,
	label,
	magnet,
	phase,
	pinMagnet,
	selected,
}: JiraDropzoneWellChromeProps): ReactElement {
	return (
		<motion.div
			animate={{ x: 0, y: 0 }}
			className={cn(
				"flex w-full select-none items-center justify-center px-3 text-center will-change-transform",
				expanded ? "h-16 text-sm leading-5" : "h-6 text-xs leading-4",
				phase === "resting" ? "h-6 text-xs leading-4" : null,
				JIRA_DROPZONE_WELL_CHROME_CLASS,
				"transition-[height,background-color] duration-normal ease-out-practical motion-reduce:transition-none [transition-property:height,background-color,border-color]",
				selected
					? "border-border-selected bg-bg-selected text-text-selected"
					: "border-border bg-surface text-text-subtlest",
			)}
			initial={bounce
				? { x: bounce.impulseXPx, y: bounce.impulseYPx }
				: { x: 0, y: 0 }}
			key={impacts}
			transition={bounce
				? { damping: bounce.damping, stiffness: bounce.stiffness, type: "spring" }
				: { duration: 0 }}
		>
			<JiraDropzoneWellCopy
				copy={copy}
				label={label}
				magnet={magnet}
				pinMagnet={pinMagnet}
			/>
		</motion.div>
	);
}

function JiraDropzoneWellCopy({
	copy,
	label,
	magnet,
	pinMagnet,
}: Pick<JiraDropzoneWellProps, "copy" | "label" | "magnet" | "pinMagnet">): ReactElement {
	return copy === "label" ? (
		<motion.span
			className="inline-block will-change-transform"
			style={{
				x: pinMagnet ? 0 : magnet.labelX,
				y: pinMagnet ? 0 : magnet.labelY,
			}}
		>
			{label}
		</motion.span>
	) : (
		<Icon
			className="text-icon-subtlest"
			render={<AddIcon label="" size="small" />}
		/>
	);
}
