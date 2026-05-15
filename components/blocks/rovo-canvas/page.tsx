"use client";

import { RovoCanvas } from "@/components/blocks/rovo-canvas/components/rovo-canvas";

export default function RovoCanvasPage(): React.ReactElement {
	return <RovoCanvas defaultOpen />;
}

export {
	RovoCanvas,
	RovoCanvasPlaceholder,
} from "@/components/blocks/rovo-canvas/components/rovo-canvas";
export type {
	RovoCanvasArtefactKind,
	RovoCanvasProps,
	RovoCanvasStatus,
	RovoCanvasToolbarMode,
	RovoCanvasVersion,
	RovoCanvasView,
	RovoCanvasViewIcon,
} from "@/components/blocks/rovo-canvas/components/rovo-canvas";
