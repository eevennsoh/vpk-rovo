const fs = require("node:fs/promises")
const os = require("node:os")
const path = require("node:path")
const { execFile } = require("node:child_process")
const { promisify } = require("node:util")

const execFileAsync = promisify(execFile)

const BINARY_PATH = path.resolve(
	__dirname,
	"..",
	"..",
	"node_modules",
	".bin",
	process.platform === "win32" ? "agent-browser.cmd" : "agent-browser",
)

const MAX_OUTPUT_BYTES = 10 * 1024 * 1024
const SCREENSHOT_ROOT_DIR = path.join(os.tmpdir(), "vpk-browser-workspaces")

const DEFAULT_DEVICE_SCALE_FACTOR = 1
const DEFAULT_VIEWPORT = {
	width: 1280,
	height: 900,
}
const DEFAULT_SCREENCAST_QUALITY = 82
const DEFAULT_SCREENCAST_MAX_WIDTH = 1600
const DEFAULT_SCREENCAST_MAX_HEIGHT = 1200
const SCREENCAST_INTERVAL_MS = 200

let installPromise = null

function clampDeviceScaleFactor(value) {
	const parsed = Number.parseFloat(String(value))
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return DEFAULT_DEVICE_SCALE_FACTOR
	}

	return Math.min(Math.max(parsed, 1), 3)
}

function sanitizeSessionToken(value) {
	if (typeof value !== "string" || !value.trim()) {
		return "default"
	}

	return value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-")
}

function parseJsonOutput(stdout) {
	const trimmed = typeof stdout === "string" ? stdout.trim() : ""
	if (!trimmed) {
		return null
	}

	const jsonLine = trimmed
		.split(/\r?\n/u)
		.reverse()
		.find((line) => {
			const candidate = line.trim()
			return candidate.startsWith("{") || candidate.startsWith("[")
		})

	if (!jsonLine) {
		return null
	}

	try {
		return JSON.parse(jsonLine)
	} catch {
		return null
	}
}

function normalizeRefKey(ref) {
	if (typeof ref !== "string" || !ref) {
		return ref
	}

	return ref.startsWith("@") ? ref : `@${ref}`
}

function normalizeSnapshotText(snapshot) {
	if (typeof snapshot !== "string" || !snapshot) {
		return "Empty page"
	}

	return snapshot.replace(/\bref=(e\d+)\b/gu, "ref=@$1")
}

function getPngDimensions(buffer) {
	if (!Buffer.isBuffer(buffer) || buffer.length < 24) {
		return null
	}

	const pngSignature = "89504e470d0a1a0a"
	if (buffer.subarray(0, 8).toString("hex") !== pngSignature) {
		return null
	}

	return {
		width: buffer.readUInt32BE(16),
		height: buffer.readUInt32BE(20),
	}
}

function getJpegDimensions(buffer) {
	if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
		return null
	}

	if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
		return null
	}

	let offset = 2
	while (offset + 8 < buffer.length) {
		if (buffer[offset] !== 0xff) {
			offset += 1
			continue
		}

		const marker = buffer[offset + 1]
		offset += 2

		if (marker === 0xd8 || marker === 0xd9) {
			continue
		}

		if (offset + 2 > buffer.length) {
			break
		}

		const segmentLength = buffer.readUInt16BE(offset)
		if (segmentLength < 2 || offset + segmentLength > buffer.length) {
			break
		}

		const isStartOfFrame =
			(marker >= 0xc0 && marker <= 0xc3) ||
			(marker >= 0xc5 && marker <= 0xc7) ||
			(marker >= 0xc9 && marker <= 0xcb) ||
			(marker >= 0xcd && marker <= 0xcf)
		if (isStartOfFrame && segmentLength >= 7) {
			return {
				height: buffer.readUInt16BE(offset + 3),
				width: buffer.readUInt16BE(offset + 5),
			}
		}

		offset += segmentLength
	}

	return null
}

function getImageDimensions(buffer, format) {
	if (format === "jpeg") {
		return getJpegDimensions(buffer)
	}

	if (format === "png") {
		return getPngDimensions(buffer)
	}

	return null
}

async function ensureAgentBrowserInstalled() {
	if (!installPromise) {
		installPromise = execFileAsync(BINARY_PATH, ["install"], {
			env: process.env,
			maxBuffer: MAX_OUTPUT_BYTES,
		}).catch((error) => {
			installPromise = null
			const stderr =
				typeof error?.stderr === "string" && error.stderr.trim()
					? error.stderr.trim()
					: null
			const stdout =
				typeof error?.stdout === "string" && error.stdout.trim()
					? error.stdout.trim()
					: null
			throw new Error(stderr || stdout || error?.message || "agent-browser install failed.")
		})
	}

	return installPromise
}

class AgentBrowserRuntime {
	constructor({
		sessionId,
		viewport = DEFAULT_VIEWPORT,
		deviceScaleFactor = DEFAULT_DEVICE_SCALE_FACTOR,
	} = {}) {
		const sessionToken = sanitizeSessionToken(sessionId)

		this._sessionId = sessionId
		this._sessionName = `browser-workspace-${sessionToken}`
		this._viewport = {
			width: viewport.width,
			height: viewport.height,
		}
		this._deviceScaleFactor = clampDeviceScaleFactor(deviceScaleFactor)
		this._isBrowserReady = false
		this._screencastInterval = null
		this._screencastCapturePromise = null
		this._screenshotDir = path.join(SCREENSHOT_ROOT_DIR, sessionToken)
		this._pngScreenshotPath = path.join(this._screenshotDir, "latest.png")
		this._jpegScreenshotPath = path.join(this._screenshotDir, "live.jpg")
	}

	async _runCommand(args, { json = false, includeSession = true } = {}) {
		const commandArgs = []
		if (json) {
			commandArgs.push("--json")
		}
		if (includeSession) {
			commandArgs.push("--session", this._sessionName)
		}
		commandArgs.push(...args.map((value) => String(value)))

		try {
			const { stdout } = await execFileAsync(BINARY_PATH, commandArgs, {
				env: process.env,
				maxBuffer: MAX_OUTPUT_BYTES,
			})
			return stdout.trim()
		} catch (error) {
			const stderr =
				typeof error?.stderr === "string" && error.stderr.trim()
					? error.stderr.trim()
					: null
			const stdout =
				typeof error?.stdout === "string" && error.stdout.trim()
					? error.stdout.trim()
					: null
			throw new Error(
				stderr ||
					stdout ||
					error?.message ||
					`agent-browser ${args[0] || "command"} failed.`,
			)
		}
	}

	async _runJsonCommand(args) {
		const stdout = await this._runCommand(args, { json: true })
		const payload = parseJsonOutput(stdout)
		if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
			throw new Error(
				`agent-browser ${args[0] || "command"} returned invalid JSON output.`,
			)
		}
		if (payload.success === false) {
			throw new Error(
				typeof payload.error === "string" && payload.error
					? payload.error
					: `agent-browser ${args[0] || "command"} failed.`,
			)
		}

		return payload.data ?? null
	}

	async _ensureInstalled() {
		await ensureAgentBrowserInstalled()
	}

	async _applyViewport() {
		await this._runCommand([
			"set",
			"viewport",
			this._viewport.width,
			this._viewport.height,
			this._deviceScaleFactor,
		])
	}

	async _ensureBrowser() {
		if (this._isBrowserReady) {
			return
		}

		await this._ensureInstalled()
		await this._runCommand(["open", "about:blank"])
		await this._applyViewport()
		this._isBrowserReady = true
	}

	async _readState() {
		await this._ensureBrowser()
		const data = await this._runJsonCommand(["tab"])
		const tabs = Array.isArray(data?.tabs)
			? data.tabs
					.filter((tab) => typeof tab?.index === "number")
					.map((tab) => ({
						active: tab.active === true,
						index: tab.index,
						title: typeof tab.title === "string" ? tab.title : "",
						type: typeof tab.type === "string" ? tab.type : "page",
						url: typeof tab.url === "string" && tab.url ? tab.url : "about:blank",
					}))
			: []
		const activeTab = tabs.find((tab) => tab.active) ?? tabs[0]

		return {
			activeTabIndex: activeTab?.index ?? 0,
			tabs,
			title: activeTab?.title ?? "",
			url: activeTab?.url ?? "about:blank",
		}
	}

	async _captureScreenshotBuffer({
		format = "png",
		quality = DEFAULT_SCREENCAST_QUALITY,
	} = {}) {
		await this._ensureBrowser()
		await fs.mkdir(this._screenshotDir, { recursive: true })

		const filePath =
			format === "jpeg" ? this._jpegScreenshotPath : this._pngScreenshotPath
		const args = ["screenshot", filePath]
		if (format === "jpeg") {
			args.push("--screenshot-format", "jpeg", "--screenshot-quality", quality)
		}

		await this._runCommand(args)
		return fs.readFile(filePath)
	}

	_getScreencastFallbackMetadata() {
		return {
			deviceWidth: Math.min(
				Math.round(this._viewport.width * this._deviceScaleFactor),
				DEFAULT_SCREENCAST_MAX_WIDTH,
			),
			deviceHeight: Math.min(
				Math.round(this._viewport.height * this._deviceScaleFactor),
				DEFAULT_SCREENCAST_MAX_HEIGHT,
			),
			pageScaleFactor: this._deviceScaleFactor,
		}
	}

	async _captureScreencastFrameBuffer() {
		return this._captureScreenshotBuffer({
			format: "jpeg",
			quality: DEFAULT_SCREENCAST_QUALITY,
		})
	}

	async initialize(defaultUrl) {
		await this._ensureBrowser()

		if (defaultUrl && defaultUrl !== "about:blank") {
			await this.navigate(defaultUrl)
		}
	}

	async getState() {
		return this._readState()
	}

	async navigate(url) {
		await this._ensureBrowser()
		await this._runCommand(["open", url])
	}

	async setViewport(width, height, deviceScaleFactor = this._deviceScaleFactor) {
		await this._ensureBrowser()
		this._viewport = {
			width,
			height,
		}
		this._deviceScaleFactor = clampDeviceScaleFactor(deviceScaleFactor)
		await this._applyViewport()
	}

	async back() {
		await this._ensureBrowser()
		await this._runCommand(["back"])
	}

	async forward() {
		await this._ensureBrowser()
		await this._runCommand(["forward"])
	}

	async reload() {
		await this._ensureBrowser()
		await this._runCommand(["reload"])
	}

	async click(x, y) {
		await this._ensureBrowser()
		await this._runCommand(["mouse", "move", x, y])
		await this._runCommand(["mouse", "down", "left"])
		await this._runCommand(["mouse", "up", "left"])
	}

	async clickRef(ref) {
		await this._ensureBrowser()
		await this._runCommand(["click", ref])
	}

	async hoverRef(ref) {
		await this._ensureBrowser()
		await this._runCommand(["hover", ref])
	}

	async fillRef(ref, text) {
		await this._ensureBrowser()
		await this._runCommand(["fill", ref, text])
	}

	async typeRef(ref, text) {
		await this._ensureBrowser()
		await this._runCommand(["type", ref, text])
	}

	async selectRef(ref, values) {
		await this._ensureBrowser()
		await this._runCommand(["select", ref, ...values])
	}

	async wheel(x, y, deltaX, deltaY) {
		await this._ensureBrowser()
		await this._runCommand(["mouse", "move", x, y])
		await this._runCommand(["mouse", "wheel", deltaY, deltaX])
	}

	async scroll(direction, pixels) {
		await this._ensureBrowser()
		await this._runCommand(["scroll", direction, pixels])
	}

	async press(key) {
		await this._ensureBrowser()
		await this._runCommand(["press", key])
	}

	async keyEvent(eventType, key, code, text) {
		await this._ensureBrowser()
		const value =
			typeof key === "string" && key
				? key
				: typeof text === "string" && text
					? text
					: typeof code === "string" && code
						? code
						: null
		if (!value) {
			return
		}

		await this._runCommand([eventType === "keyUp" ? "keyup" : "keydown", value])
	}

	async insertText(text) {
		await this._ensureBrowser()
		await this._runCommand(["keyboard", "inserttext", text])
	}

	async createTab(url) {
		await this._ensureBrowser()
		const args = ["tab", "new"]
		if (url && url !== "about:blank") {
			args.push(url)
		}
		await this._runCommand(args)
		await this._applyViewport()
	}

	async activateTab(tabIndex) {
		await this._ensureBrowser()
		await this._runCommand(["tab", tabIndex])
		await this._applyViewport()
	}

	async closeTab(tabIndex) {
		const state = await this._readState()
		const resolvedIndex =
			typeof tabIndex === "number" ? tabIndex : state.activeTabIndex
		if (resolvedIndex < 0 || resolvedIndex >= state.tabs.length) {
			throw new Error(`Invalid tab index: ${resolvedIndex}`)
		}
		if (state.tabs.length === 1) {
			throw new Error('Cannot close the last tab. Use "close" to close the browser.')
		}

		await this._runCommand(["tab", "close", resolvedIndex])
		await this._applyViewport()
	}

	async screenshotBuffer() {
		return this._captureScreenshotBuffer({ format: "png" })
	}

	async snapshot(options = {}) {
		await this._ensureBrowser()
		const data = await this._runJsonCommand([
			"snapshot",
			...(options.interactive ? ["-i"] : []),
		])
		const refs = Object.entries(data?.refs || {}).reduce((accumulator, [ref, entry]) => {
			accumulator[normalizeRefKey(ref)] = {
				role: entry?.role,
				name: entry?.name,
			}
			return accumulator
		}, {})

		return {
			snapshot: normalizeSnapshotText(data?.snapshot),
			refs: Object.keys(refs).length > 0 ? refs : undefined,
		}
	}

	isScreencasting() {
		return this._screencastInterval !== null || this._screencastCapturePromise !== null
	}

	async startScreencast(callback) {
		if (this._screencastInterval) {
			return
		}
		await this._ensureBrowser()

		const emitFrame = async () => {
			if (this._screencastCapturePromise) {
				return this._screencastCapturePromise
			}

			this._screencastCapturePromise = (async () => {
				const buffer = await this._captureScreencastFrameBuffer()
				const fallbackMetadata = this._getScreencastFallbackMetadata()
				const dimensions =
					getImageDimensions(buffer, "jpeg") || fallbackMetadata
				callback({
					data: buffer.toString("base64"),
					metadata: {
						deviceWidth: dimensions.width ?? fallbackMetadata.deviceWidth,
						deviceHeight: dimensions.height ?? fallbackMetadata.deviceHeight,
						pageScaleFactor: fallbackMetadata.pageScaleFactor,
					},
				})
			})().finally(() => {
				this._screencastCapturePromise = null
			})

			return this._screencastCapturePromise
		}

		await emitFrame()
		this._screencastInterval = setInterval(() => {
			void emitFrame().catch(() => {})
		}, SCREENCAST_INTERVAL_MS)
		this._screencastInterval.unref?.()
	}

	async stopScreencast() {
		if (this._screencastInterval) {
			clearInterval(this._screencastInterval)
			this._screencastInterval = null
		}

		await this._screencastCapturePromise?.catch(() => {})
	}

	async close() {
		await this.stopScreencast()
		if (!this._isBrowserReady) {
			return
		}

		this._isBrowserReady = false
		await this._runCommand(["close"]).catch(() => {})
	}
}

module.exports = {
	AgentBrowserRuntime,
	DEFAULT_DEVICE_SCALE_FACTOR,
	DEFAULT_VIEWPORT,
	DEFAULT_SCREENCAST_QUALITY,
	DEFAULT_SCREENCAST_MAX_WIDTH,
	DEFAULT_SCREENCAST_MAX_HEIGHT,
}
