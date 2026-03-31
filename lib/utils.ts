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

export function compareByNameNatural(
	left: { name: string },
	right: { name: string },
): number {
	return left.name.localeCompare(right.name, undefined, {
		numeric: true,
		sensitivity: "base",
	});
}

export function sortByUpdatedAtDesc<T extends { updatedAt: string }>(
	items: ReadonlyArray<T>,
): T[] {
	return [...items].sort(
		(left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
	);
}

export function sleep(ms: number): Promise<void> {
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function toNonEmptyString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : null;
}

export function trimTitleText(text: string): string {
	return text.trim().replace(/^["']|["']$/g, "").replace(/\.+$/, "").trim();
}
