"use client";

import { use, type ReactNode } from "react";
import { ThreadMessageContext } from "./thread-message-context";

interface ThreadMessageWidgetProps {
	/**
	 * Controls which position this widget slot occupies relative to message content.
	 *
	 * - `"before-content"`: renders only when the widget type is `"plan"` (plan widgets appear before content).
	 * - `"after-content"`: renders only when the widget type is NOT `"plan"`.
	 *
	 * Use two `<ThreadMessage.Widget>` instances to support plan widget ordering.
	 * For consumers that don't need plan widget support, a single instance with
	 * `position="after-content"` (or omitting position) is sufficient.
	 */
	position?: "before-content" | "after-content";
}

export function ThreadMessageWidget({
	position = "after-content",
}: Readonly<ThreadMessageWidgetProps>): ReactNode {
	const {
		renderedWidget,
		shouldRenderPlanWidgetFirst,
	} = use(ThreadMessageContext)!;

	if (position === "before-content" && !shouldRenderPlanWidgetFirst) {
		return null;
	}

	if (position === "after-content" && shouldRenderPlanWidgetFirst) {
		return null;
	}

	if (!renderedWidget) {
		return null;
	}

	return renderedWidget;
}
