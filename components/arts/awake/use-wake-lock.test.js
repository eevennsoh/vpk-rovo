import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, beforeEach, test } from "node:test";

import * as esbuild from "esbuild";
import React, { act } from "react";
import { parseHTML } from "linkedom";
import { createRoot } from "react-dom/client";

import {
	detectWakeLockSupport,
	WAKE_LOCK_STORAGE_KEY,
	WAKE_LOCK_VISIBLE_TAB_MESSAGE,
} from "./use-wake-lock.ts";

const require = createRequire(import.meta.url);
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));
let useWakeLockModulePromise;

const originalGlobals = {
	window: globalThis.window,
	document: globalThis.document,
	HTMLElement: globalThis.HTMLElement,
	Node: globalThis.Node,
	Event: globalThis.Event,
	navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator"),
	actEnvironment: globalThis.IS_REACT_ACT_ENVIRONMENT,
};

function setNavigator(value) {
	if (value === undefined) {
		delete globalThis.navigator;
		return;
	}
	Object.defineProperty(globalThis, "navigator", {
		value,
		configurable: true,
		writable: true,
	});
}

function createStorage(initialValues = {}) {
	const values = new Map(Object.entries(initialValues));

	return {
		getItem(key) {
			return values.get(key) ?? null;
		},
		setItem(key, value) {
			values.set(key, String(value));
		},
		removeItem(key) {
			values.delete(key);
		},
	};
}

function createWakeLockController({
	deferRequestNumbers = [],
} = {}) {
	const requestCalls = [];
	const sentinels = [];
	const deferredRequestNumberSet = new Set(deferRequestNumbers);
	const pendingRequestResolvers = [];

	return {
		requestCalls,
		getLatestSentinel() {
			return sentinels.at(-1) ?? null;
		},
		resolveNextPendingRequest() {
			const resolve = pendingRequestResolvers.shift();
			resolve?.();
		},
		wakeLock: {
			async request(type) {
				requestCalls.push(type);
				const releaseListeners = new Set();
				const sentinel = {
					released: false,
					async release() {
						if (sentinel.released) return;
						sentinel.released = true;
						for (const listener of releaseListeners) {
							listener();
						}
					},
					addEventListener(eventType, listener) {
						if (eventType === "release") {
							releaseListeners.add(listener);
						}
					},
					removeEventListener(eventType, listener) {
						if (eventType === "release") {
							releaseListeners.delete(listener);
						}
					},
				};
				sentinels.push(sentinel);
				if (deferredRequestNumberSet.has(requestCalls.length)) {
					return new Promise((resolve) => {
						pendingRequestResolvers.push(() => resolve(sentinel));
					});
				}
				return sentinel;
			},
		},
	};
}

function installDom({
	storage = createStorage(),
	wakeLockController,
	initialVisibility = "visible",
	initialTitle = "Awake",
} = {}) {
	const { window } = parseHTML(
		"<!doctype html><html><head><title>Awake</title></head><body><div id='app'></div></body></html>",
	);
	let visibilityState = initialVisibility;
	const navigatorWithWakeLock = Object.create(window.navigator);
	navigatorWithWakeLock.wakeLock = wakeLockController?.wakeLock;

	Object.defineProperty(window.document, "visibilityState", {
		get() {
			return visibilityState;
		},
		configurable: true,
	});
	Object.defineProperty(window, "localStorage", {
		value: storage,
		configurable: true,
	});
	window.document.title = initialTitle;

	Object.defineProperty(globalThis, "window", {
		value: window,
		configurable: true,
		writable: true,
	});
	Object.defineProperty(globalThis, "document", {
		value: window.document,
		configurable: true,
		writable: true,
	});
	Object.defineProperty(globalThis, "HTMLElement", {
		value: window.HTMLElement,
		configurable: true,
		writable: true,
	});
	Object.defineProperty(globalThis, "Node", {
		value: window.Node,
		configurable: true,
		writable: true,
	});
	Object.defineProperty(globalThis, "Event", {
		value: window.Event,
		configurable: true,
		writable: true,
	});
	Object.defineProperty(globalThis, "navigator", {
		value: navigatorWithWakeLock,
		configurable: true,
		writable: true,
	});
	globalThis.IS_REACT_ACT_ENVIRONMENT = true;

	return {
		setVisibility(nextVisibility) {
			visibilityState = nextVisibility;
			window.document.dispatchEvent(new window.Event("visibilitychange"));
			if (nextVisibility === "hidden") {
				const sentinel = wakeLockController?.getLatestSentinel?.();
				if (sentinel && !sentinel.released) {
					void sentinel.release();
				}
			}
		},
		getTitle() {
			return window.document.title;
		},
		restore() {
			if (originalGlobals.window === undefined) {
				delete globalThis.window;
			} else {
				Object.defineProperty(globalThis, "window", {
					value: originalGlobals.window,
					configurable: true,
					writable: true,
				});
			}
			if (originalGlobals.document === undefined) {
				delete globalThis.document;
			} else {
				Object.defineProperty(globalThis, "document", {
					value: originalGlobals.document,
					configurable: true,
					writable: true,
				});
			}
			if (originalGlobals.HTMLElement === undefined) {
				delete globalThis.HTMLElement;
			} else {
				Object.defineProperty(globalThis, "HTMLElement", {
					value: originalGlobals.HTMLElement,
					configurable: true,
					writable: true,
				});
			}
			if (originalGlobals.Node === undefined) {
				delete globalThis.Node;
			} else {
				Object.defineProperty(globalThis, "Node", {
					value: originalGlobals.Node,
					configurable: true,
					writable: true,
				});
			}
			if (originalGlobals.Event === undefined) {
				delete globalThis.Event;
			} else {
				Object.defineProperty(globalThis, "Event", {
					value: originalGlobals.Event,
					configurable: true,
					writable: true,
				});
			}
			if (originalGlobals.navigator) {
				Object.defineProperty(globalThis, "navigator", originalGlobals.navigator);
			} else {
				delete globalThis.navigator;
			}
			if (originalGlobals.actEnvironment === undefined) {
				delete globalThis.IS_REACT_ACT_ENVIRONMENT;
			} else {
				globalThis.IS_REACT_ACT_ENVIRONMENT = originalGlobals.actEnvironment;
			}
		},
	};
}

async function loadUseWakeLockModule() {
	if (!useWakeLockModulePromise) {
		useWakeLockModulePromise = esbuild
			.build({
				stdin: {
					contents: `
						export { useWakeLock } from "./components/arts/awake/use-wake-lock.ts";
					`,
					loader: "ts",
					resolveDir: process.cwd(),
					sourcefile: "use-wake-lock-test-harness.ts",
				},
				bundle: true,
				external: ["react"],
				format: "cjs",
				platform: "node",
				target: "node24",
				tsconfig: path.join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) => {
				return loadCjsModuleFromText(result.outputFiles[0].text);
			});
	}

	return useWakeLockModulePromise;
}

async function renderUseWakeLock({
	storageValues = {},
	initialVisibility = "visible",
	initialTitle = "Awake",
	wakeLockController = createWakeLockController(),
} = {}) {
	const { useWakeLock } = await loadUseWakeLockModule();
	const dom = installDom({
		storage: createStorage(storageValues),
		wakeLockController,
		initialVisibility,
		initialTitle,
	});
	let snapshot = null;

	function Probe() {
		snapshot = useWakeLock();
		return null;
	}

	const root = createRoot(document.getElementById("app"));
	await act(async () => {
		root.render(React.createElement(Probe));
	});

	return {
		dom,
		wakeLockController,
		getState() {
			return {
				isSupported: snapshot.isSupported,
				isActive: snapshot.isActive,
				isEnabled: snapshot.isEnabled,
				status: snapshot.status,
				statusMessage: snapshot.statusMessage,
				error: snapshot.error,
			};
		},
		async run(callback) {
			await act(async () => {
				await callback(snapshot);
			});
		},
		async cleanup() {
			await act(async () => {
				root.unmount();
			});
			dom.restore();
		},
	};
}

beforeEach(() => {
	setNavigator(undefined);
	delete globalThis.window;
	delete globalThis.document;
});

afterEach(() => {
	if (originalGlobals.navigator) {
		Object.defineProperty(globalThis, "navigator", originalGlobals.navigator);
	} else {
		delete globalThis.navigator;
	}
	if (originalGlobals.window === undefined) {
		delete globalThis.window;
	} else {
		Object.defineProperty(globalThis, "window", {
			value: originalGlobals.window,
			configurable: true,
			writable: true,
		});
	}
	if (originalGlobals.document === undefined) {
		delete globalThis.document;
	} else {
		Object.defineProperty(globalThis, "document", {
			value: originalGlobals.document,
			configurable: true,
			writable: true,
		});
	}
	if (originalGlobals.actEnvironment === undefined) {
		delete globalThis.IS_REACT_ACT_ENVIRONMENT;
	} else {
		globalThis.IS_REACT_ACT_ENVIRONMENT = originalGlobals.actEnvironment;
	}
});

test("WAKE_LOCK_STORAGE_KEY is namespaced under vpk:weather", () => {
	assert.equal(WAKE_LOCK_STORAGE_KEY, "vpk:weather:wake-lock");
});

test("detectWakeLockSupport returns false when navigator is undefined (SSR)", () => {
	setNavigator(undefined);
	assert.equal(detectWakeLockSupport(), false);
});

test("detectWakeLockSupport returns false when navigator.wakeLock is missing", () => {
	setNavigator({});
	assert.equal(detectWakeLockSupport(), false);
});

test("detectWakeLockSupport returns false when wakeLock.request is not a function", () => {
	setNavigator({ wakeLock: {} });
	assert.equal(detectWakeLockSupport(), false);
});

test("detectWakeLockSupport returns true when navigator.wakeLock.request is a function", () => {
	setNavigator({
		wakeLock: {
			request: () => Promise.resolve({ released: false, release: async () => {} }),
		},
	});
	assert.equal(detectWakeLockSupport(), true);
});

test("useWakeLock enables immediately when wake lock support is available", async () => {
	const harness = await renderUseWakeLock();
	try {
		await harness.run(async (wakeLock) => {
			await wakeLock.enable();
		});

		assert.deepEqual(harness.getState(), {
			isSupported: true,
			isActive: true,
			isEnabled: true,
			status: "active",
			statusMessage: null,
			error: null,
		});
		assert.deepEqual(harness.wakeLockController.requestCalls, ["screen"]);
	} finally {
		await harness.cleanup();
	}
});

test("useWakeLock marks hidden tabs as waiting for visibility and re-acquires on return", async () => {
	const harness = await renderUseWakeLock({
		initialTitle: "Awake",
	});
	try {
		await harness.run(async (wakeLock) => {
			await wakeLock.enable();
		});
		assert.equal(harness.dom.getTitle(), "Awake");

		await harness.run(async () => {
			harness.dom.setVisibility("hidden");
			await Promise.resolve();
		});

		assert.deepEqual(harness.getState(), {
			isSupported: true,
			isActive: false,
			isEnabled: true,
			status: "waiting-for-visible",
			statusMessage: WAKE_LOCK_VISIBLE_TAB_MESSAGE,
			error: null,
		});
		assert.equal(harness.dom.getTitle(), "⚠ Keep this page active");

		await harness.run(async () => {
			harness.dom.setVisibility("visible");
			await Promise.resolve();
		});

		assert.deepEqual(harness.getState(), {
			isSupported: true,
			isActive: true,
			isEnabled: true,
			status: "active",
			statusMessage: null,
			error: null,
		});
		assert.equal(harness.dom.getTitle(), "Awake");
		assert.deepEqual(harness.wakeLockController.requestCalls, ["screen", "screen"]);
	} finally {
		await harness.cleanup();
	}
});

test("useWakeLock keeps the waiting message visible until a delayed re-acquire completes", async () => {
	const wakeLockController = createWakeLockController({
		deferRequestNumbers: [2],
	});
	const harness = await renderUseWakeLock({
		wakeLockController,
		initialTitle: "Awake",
	});
	try {
		await harness.run(async (wakeLock) => {
			await wakeLock.enable();
		});

		await harness.run(async () => {
			harness.dom.setVisibility("hidden");
			await Promise.resolve();
		});

		await harness.run(async () => {
			harness.dom.setVisibility("visible");
			await Promise.resolve();
		});

		assert.deepEqual(harness.getState(), {
			isSupported: true,
			isActive: false,
			isEnabled: true,
			status: "waiting-for-visible",
			statusMessage: WAKE_LOCK_VISIBLE_TAB_MESSAGE,
			error: null,
		});
		assert.equal(harness.dom.getTitle(), "⚠ Keep this page active");

		await harness.run(async () => {
			harness.wakeLockController.resolveNextPendingRequest();
			await Promise.resolve();
		});

		assert.deepEqual(harness.getState(), {
			isSupported: true,
			isActive: true,
			isEnabled: true,
			status: "active",
			statusMessage: null,
			error: null,
		});
		assert.equal(harness.dom.getTitle(), "Awake");
	} finally {
		await harness.cleanup();
	}
});

test("useWakeLock uses the title cue when the tab goes hidden", async () => {
	const harness = await renderUseWakeLock({
		initialTitle: "Awake",
	});
	try {
		await harness.run(async (wakeLock) => {
			await wakeLock.enable();
		});

		await harness.run(async () => {
			harness.dom.setVisibility("hidden");
			await Promise.resolve();
		});

		assert.equal(harness.dom.getTitle(), "⚠ Keep this page active");
		assert.deepEqual(harness.getState(), {
			isSupported: true,
			isActive: false,
			isEnabled: true,
			status: "waiting-for-visible",
			statusMessage: WAKE_LOCK_VISIBLE_TAB_MESSAGE,
			error: null,
		});
	} finally {
		await harness.cleanup();
	}
});
