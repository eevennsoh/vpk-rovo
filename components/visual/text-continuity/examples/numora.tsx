"use client";

/**
 * A field somebody types in — the one place place-value matching is the *wrong*
 * default. Typing `1` in front of `20` should insert a digit, not renumber the
 * column, so `cursorIndex` switches this morph from place matching to caret
 * matching.
 *
 * Upstream (torph's `numora.tsx`) drives this with the `numora` numeric-input
 * package. VPK does not take that dependency, so the formatting and caret
 * mapping are implemented here directly; the behaviour being demonstrated —
 * a formatted value morphing around a moving caret — is the same.
 */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import TextContinuity from "..";
import { caretAfterFormat, formatAmount, toRaw, valueCharsBefore } from "../lib";

/** The value the demo types out on its own before handing over. */
const SCRIPT = "1234567.89";

const TYPE_MS = 220;
const HOLD = 1800; // Beat on the formatted total before it clears and starts over

export function NumoraField() {
	const [raw, setRaw] = useState("");
	const [caret, setCaret] = useState<number>();
	const [typed, setTyped] = useState(0);
	const [taken, setTaken] = useState(false);
	const reduced = useReducedMotion();

	const inputRef = useRef<HTMLInputElement>(null);
	// The caret has to be restored after React writes the reformatted value back.
	const pendingCaret = useRef<number | null>(null);

	const formatted = formatAmount(raw);

	// Autoplay: type the script out a character at a time, then hold and reset.
	useEffect(() => {
		if (taken || reduced) return;
		const done = typed >= SCRIPT.length;
		const timer = window.setTimeout(() => setTyped(done ? 0 : typed + 1), done ? HOLD : TYPE_MS);
		return () => window.clearTimeout(timer);
	}, [typed, taken, reduced]);

	useEffect(() => {
		if (taken) return;
		const next = reduced ? SCRIPT : SCRIPT.slice(0, typed);
		setRaw(next);
		setCaret(caretAfterFormat(formatAmount(next), next.length));
	}, [typed, taken, reduced]);

	// Restore the caret the reformat moved, in the same commit as the new value.
	useEffect(() => {
		const input = inputRef.current;
		const next = pendingCaret.current;
		if (!input || next === null) return;
		pendingCaret.current = null;
		input.setSelectionRange(next, next);
	}, [formatted]);

	const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const typedValue = event.target.value;
		const typedCaret = event.target.selectionStart ?? typedValue.length;
		const count = valueCharsBefore(typedValue, typedCaret);

		const nextRaw = toRaw(typedValue);
		const nextCaret = caretAfterFormat(formatAmount(nextRaw), Math.min(count, nextRaw.length));

		setTaken(true);
		setRaw(nextRaw);
		setCaret(nextCaret);
		pendingCaret.current = nextCaret;
	};

	return (
		<label className="flex w-full max-w-72 cursor-text flex-col items-center gap-4">
			<span className="sr-only">Amount</span>

			{/*
			 * A rendering of the field's own value; reading it back would announce the
			 * amount twice. `aria-hidden` has to sit on a real wrapper — neither this
			 * wrapper component nor torph's binding forwards DOM props to the morph
			 * host, and a hyphenated JSX attribute is not type-checked, so passing it
			 * to `TextContinuity` would silently do nothing.
			 */}
			<span aria-hidden className="text-4xl font-bold tabular-nums text-text">
				<TextContinuity cursorIndex={caret} style={{ opacity: raw ? 1 : 0.5 }}>
					{formatted || "0"}
				</TextContinuity>
			</span>

			<input
				ref={inputRef}
				className="w-full rounded-lg border border-border bg-input px-3 py-2 text-center text-base tabular-nums text-text outline-none focus-visible:border-border-focused focus-visible:ring-2 focus-visible:ring-border-focused"
				value={formatted}
				inputMode="decimal"
				aria-label="Amount"
				onChange={onChange}
				onPointerDown={() => setTaken(true)}
				onFocus={() => setTaken(true)}
			/>
		</label>
	);
}
