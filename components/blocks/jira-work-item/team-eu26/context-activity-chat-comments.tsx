"use client";

import {
	createContext,
	use,
	useCallback,
	useMemo,
	useState,
	type ReactNode,
} from "react";

import type { ActivityChatCommentContext } from "@/components/blocks/jira-activity/lib/jira-activity-comment-text";

export type ActivityChatComment = ActivityChatCommentContext;

type ActivityChatCommentsContextValue = {
	comments: readonly ActivityChatComment[];
	/** Increments on each successful add so the sticky activity composer can focus. */
	focusRequestKey: number;
	addComment: (comment: ActivityChatComment) => void;
	removeAll: () => void;
};

const ActivityChatCommentsContext = createContext<ActivityChatCommentsContextValue | null>(null);

/**
 * Holds activity comments attached to the sticky work-item activity composer as
 * a one-turn pill — the same `CommentsComposerChip` / multi-comment count path
 * Code Review uses for inline review comments.
 */
export function ActivityChatCommentsProvider({
	children,
}: Readonly<{ children: ReactNode }>) {
	const [comments, setComments] = useState<readonly ActivityChatComment[]>([]);
	const [focusRequestKey, setFocusRequestKey] = useState(0);

	const addComment = useCallback((comment: ActivityChatComment) => {
		setComments((current) => {
			if (current.some((existing) => existing.id === comment.id)) {
				return current;
			}
			return [...current, comment];
		});
		setFocusRequestKey((current) => current + 1);
	}, []);

	const removeAll = useCallback(() => {
		setComments([]);
	}, []);

	const value = useMemo(
		() => ({ comments, focusRequestKey, addComment, removeAll }),
		[addComment, comments, focusRequestKey, removeAll],
	);

	return (
		<ActivityChatCommentsContext value={value}>
			{children}
		</ActivityChatCommentsContext>
	);
}

export function useActivityChatComments(): ActivityChatCommentsContextValue {
	const context = use(ActivityChatCommentsContext);
	if (context === null) {
		throw new Error("useActivityChatComments must be used within ActivityChatCommentsProvider");
	}
	return context;
}
