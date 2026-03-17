import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function collapseWhitespace(value: string | null | undefined): string {
	return (value ?? "").replace(/\s+/gu, " ").trim();
}

export function createId(prefix = "id"): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}

	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function sortByUpdatedAtDesc<T extends { updatedAt: string }>(
	items: ReadonlyArray<T>,
): T[] {
	return [...items].sort(
		(left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
	);
}
