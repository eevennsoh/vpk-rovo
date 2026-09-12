"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
	METADATA_CONTENT_COLLAPSE_DURATION_MS,
	METADATA_CONTENT_EXPAND_DURATION_MS,
} from "./context-panel-layout-motion";

interface PanelLayoutContextValue {
	/** Whether the right-hand metadata column is collapsed (hidden). */
	metadataCollapsed: boolean;
	/** Whether the left-column geometry is moving between expanded and collapsed layouts. */
	metadataLayoutAnimating: boolean;
	/** Toggle the metadata column and begin its layout transition. */
	toggleMetadata: () => void;
}

const PanelLayoutContext = createContext<PanelLayoutContextValue | null>(null);

/**
 * View-state owner for the experimental work item dialog's panel layout.
 *
 * Holds transient UI-only state (currently the metadata column collapse toggle)
 * shared between the breadcrumb-row toggle button in the `ModalHeader` and the
 * `ExperimentalWorkItemLayout` body. Kept separate from the session-data
 * controller so session state and view state stay in their own owners.
 */
interface PanelLayoutProviderProps {
	children: ReactNode;
	defaultMetadataCollapsed?: boolean;
}

export function PanelLayoutProvider({
	children,
	defaultMetadataCollapsed = false,
}: Readonly<PanelLayoutProviderProps>) {
	const [metadataCollapsed, setMetadataCollapsed] = useState(defaultMetadataCollapsed);
	const [metadataLayoutAnimating, setMetadataLayoutAnimating] = useState(false);
	const toggleMetadata = useCallback(() => {
		setMetadataLayoutAnimating(true);
		setMetadataCollapsed((collapsed) => !collapsed);
	}, []);

	useEffect(() => {
		if (!metadataLayoutAnimating) return;

		const timeout = window.setTimeout(
			() => setMetadataLayoutAnimating(false),
			metadataCollapsed ? METADATA_CONTENT_COLLAPSE_DURATION_MS : METADATA_CONTENT_EXPAND_DURATION_MS,
		);
		return () => window.clearTimeout(timeout);
	}, [metadataCollapsed, metadataLayoutAnimating]);
	const value = useMemo<PanelLayoutContextValue>(
		() => ({
			metadataCollapsed,
			metadataLayoutAnimating,
			toggleMetadata,
		}),
		[
			metadataCollapsed,
			metadataLayoutAnimating,
			toggleMetadata,
		],
	);

	return <PanelLayoutContext value={value}>{children}</PanelLayoutContext>;
}

export function usePanelLayout(): PanelLayoutContextValue {
	const context = use(PanelLayoutContext);
	if (context === null) {
		throw new Error("usePanelLayout must be used within a PanelLayoutProvider");
	}
	return context;
}
