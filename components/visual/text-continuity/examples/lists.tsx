"use client";

/**
 * A list that ripples — row numbers morph as the rows settle into their new
 * order. Ported from torph's `lists.tsx` (https://github.com/lochie/torph, MIT).
 * Upstream's haptics calls are omitted; VPK does not take `web-haptics`.
 */

import { useEffect, useRef, useState } from "react";
import { Reorder, arc, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import TextContinuity from "..";
import { FOCUS_RING } from "./primitives";

const TRACKS = ["Ambient loops", "Field recordings", "Tape hiss"];

const RIPPLE = 0.025; // Seconds a row waits per row of distance from the one that moved
const SHUFFLE_EVERY = 2600;
const SHUFFLES = [
	[4, 0],
	[1, 3],
	[0, 2],
	[3, 1],
	[2, 4],
];

const SETTLE = { type: "spring", stiffness: 520, damping: 34 } as const;
// Slower than SETTLE: the idle row is being carried, not sprung into place.
const CARRY = { type: "spring", stiffness: 210, damping: 26 } as const;

const LIFT = 260; // ms the idle row is held up before it travels
const CARRIED = 700; // ms it stays up while travelling, so it sets down after it lands
const DIMMED = 0.4; // Opacity of the rows a lifted row is passing
const BOW = 16; // px the lifted row swings out — `path` can't reach it, see below

export function ReorderList() {
	const [order, setOrder] = useState(() => TRACKS.map((_, i) => i));
	const [pivot, setPivot] = useState(0);
	const [dragging, setDragging] = useState(-1);
	const [carried, setCarried] = useState(-1);
	const [taken, setTaken] = useState(false);
	const reduced = useReducedMotion();

	const orderRef = useRef(order);
	useEffect(() => {
		orderRef.current = order;
	}, [order]);

	// Idle, the list mimes a drag — lift, carry, drop — so the gesture reads
	// before anyone tries it.
	useEffect(() => {
		if (taken || reduced) return;
		let shuffle = 0;
		const timers: number[] = [];

		const id = window.setInterval(() => {
			const [from, to] = SHUFFLES[shuffle % SHUFFLES.length]!;
			shuffle += 1;
			const moved = orderRef.current[from! % orderRef.current.length]!;
			setCarried(moved);

			timers.push(
				window.setTimeout(() => {
					const slot = to! % TRACKS.length;
					setPivot(slot);
					setOrder((current) => {
						const next = current.slice();
						next.splice(slot, 0, next.splice(current.indexOf(moved), 1)[0]!);
						return next;
					});
				}, LIFT),
			);
			timers.push(window.setTimeout(() => setCarried(-1), LIFT + CARRIED));
		}, SHUFFLE_EVERY);

		return () => {
			window.clearInterval(id);
			timers.forEach(window.clearTimeout);
			setCarried(-1);
		};
	}, [taken, reduced]);

	const move = (id: number, step: number) => {
		const from = order.indexOf(id);
		const to = Math.min(Math.max(from + step, 0), order.length - 1);
		if (to === from) return;
		const next = order.slice();
		next.splice(to, 0, next.splice(from, 1)[0]!);
		setTaken(true);
		setOrder(next);
		setPivot(to);
	};

	return (
		<div className="flex w-full flex-col items-center gap-3.5 px-8 py-4">
			<Reorder.Group axis="y" as="ul" values={order} onReorder={(next: number[]) => {
				setPivot(dragging < 0 ? 0 : next.indexOf(dragging));
				setOrder(next);
			}} className="m-0 flex w-full list-none flex-col gap-1 p-0">
				{order.map((id, slot) => (
					<Reorder.Item
						key={id}
						value={id}
						// Opaque: a lifted row passes over the rows still catching up to it.
						className={cn(
							"relative flex h-10 cursor-grab touch-none select-none items-center gap-3 rounded-xl bg-surface-raised px-3.5 active:cursor-grabbing",
							FOCUS_RING,
						)}
						tabIndex={0}
						aria-label={`${TRACKS[id]}, position ${slot + 1}`}
						// Rows nearest the one that moved set off first, which is the ripple.
						// Under reduced motion every row lands instantly instead: the idle
						// timer is only half of it, since a drag or an Arrow key still
						// drives these transitions directly.
						transition={
							reduced
								? { duration: 0 }
								: {
										...(id === carried ? CARRY : SETTLE),
										delay: id === dragging || id === carried ? 0 : Math.abs(slot - pivot) * RIPPLE,
										path: arc({ strength: 2 }),
										opacity: { duration: 0.22, delay: 0 },
										scale: { type: "spring", stiffness: 420, damping: 30, delay: 0 },
										boxShadow: { duration: 0.22, delay: 0 },
										x: { duration: 0.55, ease: "easeInOut", times: [0, 0.5, 1], delay: LIFT / 1000 },
									}
						}
						animate={
							reduced
								? { scale: 1, opacity: 1, boxShadow: "0 0rem 0rem rgba(0, 0, 0, 0)", x: 0 }
								: {
										scale: id === carried ? 1.03 : 1,
										opacity: carried < 0 || id === carried ? 1 : DIMMED,
										boxShadow:
											id === carried ? "0 0.75rem 1.5rem rgba(0, 0, 0, 0.45)" : "0 0rem 0rem rgba(0, 0, 0, 0)",
										// `transition.path` only curves layout moves, and Reorder.Item drives
										// the row it is carrying off `x`/`y` instead — so bow that by hand.
										x: id === carried ? [0, BOW, 0] : 0,
									}
						}
						// Lifted, so a row still catching up passes underneath it.
						whileDrag={
							reduced ? undefined : { scale: 1.03, zIndex: 2, boxShadow: "0 0.75rem 1.5rem rgba(0, 0, 0, 0.45)" }
						}
						onDragStart={() => {
							setTaken(true);
							setDragging(id);
						}}
						onDragEnd={() => setDragging(-1)}
						onKeyDown={(event: React.KeyboardEvent) => {
							const step = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
							if (!step) return;
							event.preventDefault();
							move(id, step);
						}}
					>
						<TextContinuity className="text-sm font-bold tabular-nums text-text-brand">{`${slot + 1}`}</TextContinuity>
						<span className="flex-1 text-sm font-medium text-text">{TRACKS[id]}</span>
						<span
							aria-hidden
							className="h-2 w-3"
							style={{
								background: "repeating-linear-gradient(to bottom, var(--ds-icon-subtlest) 0 1px, transparent 1px 3px)",
							}}
						/>
					</Reorder.Item>
				))}
			</Reorder.Group>
		</div>
	);
}
