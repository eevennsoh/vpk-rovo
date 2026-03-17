import { useEffect, useRef } from "react";

/**
 * Returns a ref that always contains the latest value.
 * Useful for reading the latest state/callback in event handlers
 * without adding it to dependency arrays.
 *
 * Replaces the common pattern of `useRef` + `useEffect` for sync.
 */
export function useLatestRef<T>(value: T): React.RefObject<T> {
	const ref = useRef(value);
	useEffect(() => {
		ref.current = value;
	});
	return ref;
}
