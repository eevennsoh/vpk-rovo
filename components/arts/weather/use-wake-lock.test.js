import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import {
	detectWakeLockSupport,
	WAKE_LOCK_STORAGE_KEY,
} from "./use-wake-lock.ts";

const originalGlobals = {
	navigator: globalThis.navigator,
	window: globalThis.window,
	document: globalThis.document,
};

function setNavigator(value) {
	if (value === undefined) {
		delete globalThis.navigator;
	} else {
		Object.defineProperty(globalThis, "navigator", {
			value,
			configurable: true,
			writable: true,
		});
	}
}

beforeEach(() => {
	// Each test sets navigator/window itself; ensure a clean slate.
	setNavigator(undefined);
	delete globalThis.window;
	delete globalThis.document;
});

afterEach(() => {
	if (originalGlobals.navigator !== undefined) {
		setNavigator(originalGlobals.navigator);
	} else {
		setNavigator(undefined);
	}
	if (originalGlobals.window !== undefined) {
		globalThis.window = originalGlobals.window;
	} else {
		delete globalThis.window;
	}
	if (originalGlobals.document !== undefined) {
		globalThis.document = originalGlobals.document;
	} else {
		delete globalThis.document;
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
