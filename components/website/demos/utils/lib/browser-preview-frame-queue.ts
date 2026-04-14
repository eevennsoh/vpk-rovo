export type BrowserPreviewFramePayload = Blob | string

export interface BrowserPreviewFrameQueueState {
	inflightFrame: BrowserPreviewFramePayload | null
	pendingFrame: BrowserPreviewFramePayload | null
}

export function createBrowserPreviewFrameQueueState(): BrowserPreviewFrameQueueState {
	return {
		inflightFrame: null,
		pendingFrame: null,
	}
}

export function enqueueBrowserPreviewFrame(
	state: BrowserPreviewFrameQueueState,
	frame: BrowserPreviewFramePayload,
) {
	if (!state.inflightFrame) {
		return {
			nextState: {
				inflightFrame: frame,
				pendingFrame: null,
			},
			frameToLoad: frame,
		}
	}

	if (state.inflightFrame === frame || state.pendingFrame === frame) {
		return {
			nextState: state,
			frameToLoad: null,
		}
	}

	return {
		nextState: {
			inflightFrame: state.inflightFrame,
			pendingFrame: frame,
		},
		frameToLoad: null,
	}
}

export function completeBrowserPreviewFrameLoad(
	state: BrowserPreviewFrameQueueState,
) {
	if (!state.pendingFrame) {
		return {
			nextState: createBrowserPreviewFrameQueueState(),
			frameToLoad: null,
		}
	}

	return {
		nextState: {
			inflightFrame: state.pendingFrame,
			pendingFrame: null,
		},
		frameToLoad: state.pendingFrame,
	}
}
