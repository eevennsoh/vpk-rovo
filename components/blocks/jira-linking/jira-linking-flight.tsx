"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { arc, motion, type Transition } from "motion/react";

import { AgentSessionCohortChip } from "@/components/blocks/agent-session/agent-session-cohort-chip";
import { sessionDragChipViewportStyle } from "@/components/blocks/jira-issue/agent-session-drag";

import { toJiraLinkingCohort } from "./drop-cohort";
import {
	flightsFromLinkingDrop,
	JIRA_LINKING_FULL_DROP_PROFILE,
	resolveJiraLinkingArcOptions,
	type JiraLinkingDrop,
	type JiraLinkingDropProfile,
	type JiraLinkingFlight,
	type JiraLinkingFlightKey,
	type JiraLinkingPoint,
} from "./drop";
import type { JiraLinkingTarget } from "./lifecycle";

export function JiraLinkingDropFlights({
	drop,
	onSettled,
	target,
}: Readonly<{
	drop: JiraLinkingDrop;
	onSettled?: () => void;
	target: JiraLinkingTarget | null;
}>): ReactElement | null {
	const profile = JIRA_LINKING_FULL_DROP_PROFILE;
	const flights = useMemo(
		() => flightsFromLinkingDrop(drop, profile),
		[drop, profile],
	);
	const flyPath = useMemo(
		() => arc(resolveJiraLinkingArcOptions(profile)),
		[profile],
	);
	const landing = target?.anchor ?? null;
	const resolveLandingPoint = useCallback(
		(): JiraLinkingPoint | null => landing,
		[landing],
	);
	const landedRef = useRef(new Set<JiraLinkingFlightKey>());
	const settledRef = useRef(false);

	useLayoutEffect(() => {
		landedRef.current = new Set();
		settledRef.current = false;
	}, [flights]);

	const onLanded = useCallback((key: JiraLinkingFlightKey) => {
		if (landedRef.current.has(key)) {
			return;
		}
		landedRef.current.add(key);
		if (landedRef.current.size < flights.length || settledRef.current) {
			return;
		}
		settledRef.current = true;
		onSettled?.();
	}, [flights.length, onSettled]);

	if (flights.length === 0) {
		return null;
	}

	return (
		<>
			{flights.map((flight) => (
				<JiraLinkingFlight
					flyPath={flyPath}
					flight={flight}
					key={flight.key}
					onLanded={onLanded}
					profile={profile}
					resolveLandingPoint={resolveLandingPoint}
				/>
			))}
		</>
	);
}

function JiraLinkingFlight({
	flyPath,
	flight,
	onLanded,
	profile,
	resolveLandingPoint,
}: Readonly<{
	flyPath: ReturnType<typeof arc>;
	flight: JiraLinkingFlight;
	onLanded: (key: JiraLinkingFlightKey) => void;
	profile: JiraLinkingDropProfile;
	resolveLandingPoint: () => JiraLinkingPoint | null;
}>): ReactElement | null {
	const [landing, setLanding] = useState<JiraLinkingPoint | null | undefined>(undefined);
	const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

	useLayoutEffect(() => {
		setPortalRoot(document.body);
		let cancelled = false;
		const tryMeasure = (): boolean => {
			const point = resolveLandingPoint();
			if (!point || cancelled) {
				return false;
			}
			setLanding(point);
			return true;
		};
		if (tryMeasure()) {
			return () => {
				cancelled = true;
			};
		}
		const frame = window.requestAnimationFrame(() => {
			if (cancelled) {
				return;
			}
			if (!tryMeasure()) {
				onLanded(flight.key);
				setLanding(null);
			}
		});
		return () => {
			cancelled = true;
			window.cancelAnimationFrame(frame);
		};
	}, [flight.key, onLanded, resolveLandingPoint]);

	if (portalRoot === null || landing === undefined || landing === null) {
		return null;
	}

	const delay = flight.delayMs / 1000;
	const duration = profile.durationMs / 1000;
	const transition: Transition = profile.travel === "arc"
		? {
			delay,
			duration,
			ease: profile.ease,
			path: flyPath,
		}
		: {
			delay,
			duration,
			ease: profile.ease,
		};

	return createPortal(
		<motion.div
			animate={{ opacity: 1, x: landing.x, y: landing.y }}
			aria-hidden
			className="pointer-events-none left-0 top-0 z-[400] w-fit will-change-transform"
			data-jira-linking-flight=""
			data-jira-linking-flight-members={String(flight.members.length)}
			initial={{
				opacity: profile.travel === "none" ? 0 : 1,
				x: flight.from.x,
				y: flight.from.y,
			}}
			onAnimationComplete={() => {
				onLanded(flight.key);
			}}
			style={sessionDragChipViewportStyle(true)}
			transition={transition}
		>
			<div className="pointer-events-none flex w-fit max-w-full -translate-x-1/2 -translate-y-1/2 items-center justify-start">
				<AgentSessionCohortChip
					cohort={toJiraLinkingCohort(flight.members)}
					elevated
				/>
			</div>
		</motion.div>,
		portalRoot,
	);
}
