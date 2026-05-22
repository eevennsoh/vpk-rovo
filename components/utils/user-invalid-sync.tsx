"use client";

import { useEffect } from "react";

/**
 * UserInvalidSync mirrors the live `:user-invalid` CSS state onto the
 * `aria-invalid` attribute so screen readers stay in sync with the visual
 * error styling driven by the CSS pseudo-class.
 *
 * `:user-invalid` only matches *after* the user has interacted with a
 * required/constrained field (blur or submit), avoiding the "Invalid entry"
 * announcement when first tabbing into an untouched control.
 *
 * Mount this once at the root (in `app/providers.tsx`).
 */
export function UserInvalidSync() {
	useEffect(() => {
		const sync = (el: EventTarget | null) => {
			if (!(el instanceof Element) || !("matches" in el)) return;
			try {
				el.setAttribute(
					"aria-invalid",
					el.matches(":user-invalid") ? "true" : "false"
				);
			} catch {
				// :user-invalid not supported (older browser) — no-op.
			}
		};
		const onBlur = (e: FocusEvent) => sync(e.target);
		const onInput = (e: Event) => {
			const t = e.target;
			if (t instanceof Element && t.hasAttribute("aria-invalid")) sync(t);
		};
		document.addEventListener("blur", onBlur, true);
		document.addEventListener("input", onInput);
		return () => {
			document.removeEventListener("blur", onBlur, true);
			document.removeEventListener("input", onInput);
		};
	}, []);
	return null;
}
