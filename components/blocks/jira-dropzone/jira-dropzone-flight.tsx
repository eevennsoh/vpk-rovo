"use client";

import { useLayoutEffect, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { arc, motion, type Transition } from "motion/react";

import { AgentSessionCohortChip } from "@/components/blocks/agent-session/agent-session-cohort-chip";
import { sessionDragChipViewportStyle } from "@/components/blocks/jira-issue/agent-session-drag";

import { toJiraDropzoneCohort } from "./lib/jira-dropzone-cohort";
import type { FlightProfile, SessionFlight, ViewportPoint } from "./lib/jira-dropzone-types";

export function JiraDropzoneFlight({
	flyPath,
	flight,
	onLanded,
	profile,
	resolveLandingPoint,
}: Readonly<{
	flyPath: ReturnType<typeof arc>;
	flight: SessionFlight;
	onLanded: (key: SessionFlight["key"]) => void;
	profile: FlightProfile;
	resolveLandingPoint: () => ViewportPoint | null;
}>): ReactElement | null {
	const [landing, setLanding] = useState<ViewportPoint | null | undefined>(undefined);

	useLayoutEffect(() => {
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

	if (typeof document === "undefined" || landing === undefined || landing === null) {
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
			className="pointer-events-none left-0 top-0 z-[400] w-fit"
			data-jira-dropzone-flight=""
			data-jira-dropzone-flight-members={String(flight.members.length)}
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
					cohort={toJiraDropzoneCohort(flight.members)}
					elevated
				/>
			</div>
		</motion.div>,
		document.body,
	);
}
