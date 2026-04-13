export interface BrowserPreviewOverlayActivity {
	kind: string;
	label: string;
}

export interface BrowserPreviewOverlayState {
	cursor: {
		x: number;
		y: number;
		visible: boolean;
	};
	activity: BrowserPreviewOverlayActivity | null;
	updatedAt: number;
}

export interface BrowserPreviewRenderGeometry {
	sourceWidth: number;
	sourceHeight: number;
	renderedWidth: number;
	renderedHeight: number;
	offsetLeft: number;
	offsetTop?: number;
}
