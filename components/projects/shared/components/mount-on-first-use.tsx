"use client";

import { Activity, useState, type ReactNode } from "react";

/** Defer an unused surface without discarding its drafts or exit animation later. */
export function MountOnFirstUse({
	active,
	children,
}: Readonly<{ active: boolean; children: ReactNode }>) {
	const [hasBeenActive, setHasBeenActive] = useState(active);
	if (active && !hasBeenActive) {
		setHasBeenActive(true);
	}
	return active || hasBeenActive ? children : null;
}

/** Opt-in warm views retain state while Activity cleans up hidden effects. */
export function RetainedView({
	active,
	retain,
	children,
}: Readonly<{ active: boolean; retain: boolean; children: ReactNode }>) {
	return retain ? (
		<MountOnFirstUse active={active}>
			<Activity mode={active ? "visible" : "hidden"}>{children}</Activity>
		</MountOnFirstUse>
	) : active ? children : null;
}
