function isObjectRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function normalizeImageEntries(images) {
	if (!Array.isArray(images)) {
		return [];
	}

	return images
		.filter((entry) => isObjectRecord(entry))
		.map((entry) => ({
			url: typeof entry.url === "string" ? entry.url.trim() : "",
			...(getNonEmptyString(entry.mimeType) ? { mimeType: getNonEmptyString(entry.mimeType) } : {}),
		}))
		.filter((entry) => entry.url.length > 0);
}

function withCanonicalPreviewBody(type, payload) {
	if (!isObjectRecord(payload) || isObjectRecord(payload.body)) {
		return payload;
	}

	if (type === "genui-preview" && isObjectRecord(payload.spec)) {
		return {
			...payload,
			body: {
				kind: "json-render",
				spec: payload.spec,
			},
		};
	}

	if (type === "audio-preview" && getNonEmptyString(payload.audioUrl)) {
		return {
			...payload,
			body: {
				kind: "audio",
				audioUrl: payload.audioUrl.trim(),
				...(getNonEmptyString(payload.mimeType) ? { mimeType: getNonEmptyString(payload.mimeType) } : {}),
				...(getNonEmptyString(payload.transcript) ? { transcript: getNonEmptyString(payload.transcript) } : {}),
			},
		};
	}

	if (type === "image-preview") {
		const images = normalizeImageEntries(payload.images);
		if (images.length === 0) {
			return payload;
		}

		return {
			...payload,
			body: {
				kind: "image",
				images,
				...(getNonEmptyString(payload.prompt) ? { prompt: getNonEmptyString(payload.prompt) } : {}),
			},
		};
	}

	if (
		type === "video-preview" &&
		isObjectRecord(payload.composition) &&
		typeof payload.composition.fps === "number" &&
		typeof payload.composition.durationInFrames === "number"
	) {
		return {
			...payload,
			body: {
				kind: "video",
				composition: payload.composition,
				tracks: Array.isArray(payload.tracks) ? payload.tracks : [],
				clips: Array.isArray(payload.clips) ? payload.clips : [],
				...(isObjectRecord(payload.audio) ? { audio: payload.audio } : {}),
			},
		};
	}

	return payload;
}

module.exports = {
	withCanonicalPreviewBody,
};
