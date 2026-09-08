"use client";

import { useCallback, useRef, useState, type RefObject } from "react";

import { resolveArmedCreateTitleFromRoot } from "./lib/jira-dropzone-demo-drag";
import type {
	JiraDropzoneDragState,
	JiraDropzoneMember,
	ViewportPoint,
} from "./lib/jira-dropzone-types";

export interface JiraDropzoneDemoDragSession {
	readonly armedTitle: string | null;
	readonly members: readonly [JiraDropzoneMember, ...JiraDropzoneMember[]];
}

export function useJiraDropzoneDemoDrag(
	stageRef: RefObject<HTMLElement | null>,
	onReceive: (
		title: string,
		from: ViewportPoint,
		members: readonly [JiraDropzoneMember, ...JiraDropzoneMember[]],
	) => void,
) {
	const [session, setSession] = useState<JiraDropzoneDemoDragSession | null>(null);
	const sessionRef = useRef<JiraDropzoneDemoDragSession | null>(null);

	const replaceSession = useCallback((next: JiraDropzoneDemoDragSession | null) => {
		sessionRef.current = next;
		setSession(next);
	}, []);

	const onDragStart = useCallback((
		members: readonly [JiraDropzoneMember, ...JiraDropzoneMember[]],
	) => {
		replaceSession({ armedTitle: null, members });
	}, [replaceSession]);

	const onDragMove = useCallback((pointer: ViewportPoint) => {
		const current = sessionRef.current;
		if (!current) {
			return;
		}
		const armedTitle = resolveArmedCreateTitleFromRoot(pointer, stageRef.current);
		if (armedTitle === current.armedTitle) {
			return;
		}
		replaceSession({ ...current, armedTitle });
	}, [replaceSession, stageRef]);

	const onDragEnd = useCallback((pointer: ViewportPoint) => {
		const current = sessionRef.current;
		const armedTitle = resolveArmedCreateTitleFromRoot(pointer, stageRef.current);
		if (current && armedTitle) {
			onReceive(armedTitle, pointer, current.members);
		}
		replaceSession(null);
	}, [onReceive, replaceSession, stageRef]);

	const onDragCancel = useCallback(() => {
		replaceSession(null);
	}, [replaceSession]);

	const dragFor = useCallback((title: string): JiraDropzoneDragState => {
		if (!session) {
			return "idle";
		}
		return session.armedTitle === title ? "armed" : "active";
	}, [session]);

	return {
		dragFor,
		dragging: session !== null,
		onDragCancel,
		onDragEnd,
		onDragMove,
		onDragStart,
	};
}
