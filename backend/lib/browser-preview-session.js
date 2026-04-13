const jpeg = require("jpeg-js")
const wrtc = require("@roamhq/wrtc")

const { RTCPeerConnection } = wrtc
const { RTCVideoSource, rgbaToI420 } = wrtc.nonstandard

function waitForIceGatheringComplete(peerConnection) {
	if (peerConnection.iceGatheringState === "complete") {
		return Promise.resolve()
	}

	return new Promise((resolve) => {
		function handleStateChange() {
			if (peerConnection.iceGatheringState !== "complete") {
				return
			}

			peerConnection.removeEventListener(
				"icegatheringstatechange",
				handleStateChange,
			)
			resolve()
		}

		peerConnection.addEventListener(
			"icegatheringstatechange",
			handleStateChange,
		)
	})
}

class BrowserPreviewSession {
	constructor({
		sessionId,
		offerSdp,
		onControlMessage,
		onClose,
	} = {}) {
		this._sessionId = sessionId
		this._onControlMessage = onControlMessage
		this._onClose = onClose
		this._peerConnection = new RTCPeerConnection({
			iceServers: [],
		})
		this._videoSource = new RTCVideoSource({ isScreencast: true })
		this._videoTrack = this._videoSource.createTrack()
		this._controlChannel = null
		this._lastStateMessage = null
		this._lastOverlayMessage = null
		this._isClosed = false

		this._peerConnection.addTrack(this._videoTrack)
		this._peerConnection.addEventListener("datachannel", (event) => {
			this._attachDataChannel(event.channel)
		})
		this._peerConnection.addEventListener("connectionstatechange", () => {
			const state = this._peerConnection.connectionState
			if (state === "failed" || state === "closed") {
				void this.close()
			}
		})

		this._acceptOfferPromise = this._acceptOffer(offerSdp)
	}

	async _acceptOffer(offerSdp) {
		await this._peerConnection.setRemoteDescription({
			type: "offer",
			sdp: offerSdp,
		})
		const answer = await this._peerConnection.createAnswer()
		await this._peerConnection.setLocalDescription(answer)
		await waitForIceGatheringComplete(this._peerConnection)
		return {
			sessionId: this._sessionId,
			answerSdp: this._peerConnection.localDescription?.sdp ?? "",
		}
	}

	_attachDataChannel(dataChannel) {
		this._controlChannel = dataChannel
		dataChannel.addEventListener("open", () => {
			if (this._lastStateMessage) {
				this.send(this._lastStateMessage)
			}
			if (this._lastOverlayMessage) {
				this.send(this._lastOverlayMessage)
			}
		})
		dataChannel.addEventListener("message", (event) => {
			try {
				const parsed = JSON.parse(String(event.data))
				this._onControlMessage?.(parsed, this)
			} catch {
				this.send({
					type: "preview-error",
					message: "Invalid preview control message.",
				})
			}
		})
		dataChannel.addEventListener("close", () => {
			void this.close()
		})
	}

	async ready() {
		return this._acceptOfferPromise
	}

	send(message) {
		this._lastStateMessage =
			message?.type === "preview-state" ? message : this._lastStateMessage
		this._lastOverlayMessage =
			message?.type === "preview-overlay" ? message : this._lastOverlayMessage
		if (!this._controlChannel || this._controlChannel.readyState !== "open") {
			return
		}

		this._controlChannel.send(JSON.stringify(message))
	}

	pushFrame(frame) {
		if (this._isClosed || (!frame?.buffer && !frame?.data)) {
			return
		}

		const frameBuffer = Buffer.isBuffer(frame.buffer)
			? frame.buffer
			: Buffer.from(frame.data, "base64")
		const decoded = jpeg.decode(frameBuffer, {
			useTArray: true,
		})
		const rgbaFrame = {
			width: decoded.width,
			height: decoded.height,
			data: decoded.data,
		}
		const i420Frame = {
			width: decoded.width,
			height: decoded.height,
			data: new Uint8Array(Math.trunc(decoded.width * decoded.height * 1.5)),
		}

		rgbaToI420(rgbaFrame, i420Frame)
		this._videoSource.onFrame(i420Frame)
	}

	async close() {
		if (this._isClosed) {
			return
		}

		this._isClosed = true
		try {
			this._videoTrack.stop()
		} catch {}
		try {
			this._controlChannel?.close()
		} catch {}
		try {
			this._peerConnection.close()
		} catch {}
		await this._onClose?.(this)
	}
}

module.exports = {
	BrowserPreviewSession,
	waitForIceGatheringComplete,
}
