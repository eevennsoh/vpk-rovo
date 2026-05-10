import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";

import * as esbuild from "esbuild";
import React, { act } from "react";
import { parseHTML } from "linkedom";
import { createRoot } from "react-dom/client";

import {
	readStoredCitiesState,
	WEATHER_CITY_STORAGE_KEY,
} from "./city-storage.ts";

const require = createRequire(import.meta.url);
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));
let useCitiesModulePromise;

function createStorage(initialValues = {}) {
	const values = new Map(Object.entries(initialValues));
	const writes = [];

	return {
		getItem(key) {
			return values.get(key) ?? null;
		},
		setItem(key, value) {
			const stringValue = String(value);
			values.set(key, stringValue);
			writes.push({ key, value: stringValue });
		},
		getWrites() {
			return [...writes];
		},
		clearWrites() {
			writes.length = 0;
		},
	};
}

function installDom(storage) {
	const { window } = parseHTML(
		"<!doctype html><html><body><div id='app'></div></body></html>",
	);
	Object.defineProperty(window, "localStorage", {
		value: storage,
		configurable: true,
	});

	const previousGlobals = {
		window: globalThis.window,
		document: globalThis.document,
		HTMLElement: globalThis.HTMLElement,
		Node: globalThis.Node,
		navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator"),
		actEnvironment: globalThis.IS_REACT_ACT_ENVIRONMENT,
	};

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
	Object.defineProperty(globalThis, "navigator", {
		value: window.navigator,
		configurable: true,
		writable: true,
	});
	globalThis.IS_REACT_ACT_ENVIRONMENT = true;

	return () => {
		if (previousGlobals.window === undefined) {
			delete globalThis.window;
		} else {
			Object.defineProperty(globalThis, "window", {
				value: previousGlobals.window,
				configurable: true,
				writable: true,
			});
		}

		if (previousGlobals.document === undefined) {
			delete globalThis.document;
		} else {
			Object.defineProperty(globalThis, "document", {
				value: previousGlobals.document,
				configurable: true,
				writable: true,
			});
		}

		if (previousGlobals.HTMLElement === undefined) {
			delete globalThis.HTMLElement;
		} else {
			Object.defineProperty(globalThis, "HTMLElement", {
				value: previousGlobals.HTMLElement,
				configurable: true,
				writable: true,
			});
		}

		if (previousGlobals.Node === undefined) {
			delete globalThis.Node;
		} else {
			Object.defineProperty(globalThis, "Node", {
				value: previousGlobals.Node,
				configurable: true,
				writable: true,
			});
		}

		if (previousGlobals.navigator) {
			Object.defineProperty(globalThis, "navigator", previousGlobals.navigator);
		} else {
			delete globalThis.navigator;
		}

		if (previousGlobals.actEnvironment === undefined) {
			delete globalThis.IS_REACT_ACT_ENVIRONMENT;
		} else {
			globalThis.IS_REACT_ACT_ENVIRONMENT = previousGlobals.actEnvironment;
		}
	};
}

async function renderUseCities(initialStorage = {}) {
	const { useCities } = await loadUseCitiesModule();
	const storage = createStorage(initialStorage);
	const restoreDom = installDom(storage);
	let snapshot = null;

	function Probe() {
		snapshot = useCities();
		return null;
	}

	const root = createRoot(document.getElementById("app"));
	await act(async () => {
		root.render(React.createElement(Probe));
	});

	return {
		storage,
		getState() {
			return {
				cityIds: snapshot.cities.map((city) => city.id),
				selectedIndex: snapshot.selectedIndex,
				selectedId: snapshot.selected.id,
			};
		},
		async run(callback) {
			await act(async () => {
				callback(snapshot);
			});
		},
		async cleanup() {
			await act(async () => {
				root.unmount();
			});
			restoreDom();
		},
	};
}

async function loadUseCitiesModule() {
	if (!useCitiesModulePromise) {
		useCitiesModulePromise = esbuild
			.build({
				stdin: {
					contents: `
						export { useCities } from "./components/arts/awake/use-cities.ts";
					`,
					loader: "ts",
					resolveDir: process.cwd(),
					sourcefile: "use-cities-test-harness.ts",
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

	return useCitiesModulePromise;
}

test("readStoredCitiesState falls back to the legacy key when v2 storage is missing", () => {
	const legacyState = {
		cityIds: ["tokyo", "london"],
		selectedIndex: 1,
	};

	assert.deepEqual(
		readStoredCitiesState(
			createStorage({
				"vpk:weather:cities": JSON.stringify(legacyState),
			}),
		),
		legacyState,
	);
});

test("readStoredCitiesState prefers the current v2 key over legacy storage", () => {
	const legacyState = {
		cityIds: ["tokyo", "london"],
		selectedIndex: 1,
	};
	const currentState = {
		cityIds: ["sydney", "kuala-lumpur"],
		selectedIndex: 0,
	};

	assert.deepEqual(
		readStoredCitiesState(
			createStorage({
				"vpk:weather:cities": JSON.stringify(legacyState),
				[WEATHER_CITY_STORAGE_KEY]: JSON.stringify(currentState),
			}),
		),
		currentState,
	);
});

test("useCities keeps focus on the next city when removing the selected city", async (t) => {
	const harness = await renderUseCities({
		[WEATHER_CITY_STORAGE_KEY]: JSON.stringify({
			cityIds: ["sydney", "tokyo", "new-york"],
			selectedIndex: 1,
		}),
	});
	t.after(async () => {
		await harness.cleanup();
	});

	assert.deepEqual(harness.getState(), {
		cityIds: ["sydney", "tokyo", "new-york"],
		selectedIndex: 1,
		selectedId: "tokyo",
	});

	await harness.run((cities) => {
		cities.removeCity("tokyo");
	});

	assert.deepEqual(harness.getState(), {
		cityIds: ["sydney", "new-york"],
		selectedIndex: 1,
		selectedId: "new-york",
	});
	assert.deepEqual(
		JSON.parse(harness.storage.getItem(WEATHER_CITY_STORAGE_KEY)),
		{
			cityIds: ["sydney", "new-york"],
			selectedIndex: 1,
		},
	);
});

test("useCities shifts focus left when removing a city before the current selection", async (t) => {
	const harness = await renderUseCities({
		[WEATHER_CITY_STORAGE_KEY]: JSON.stringify({
			cityIds: ["sydney", "tokyo", "new-york"],
			selectedIndex: 2,
		}),
	});
	t.after(async () => {
		await harness.cleanup();
	});

	assert.deepEqual(harness.getState(), {
		cityIds: ["sydney", "tokyo", "new-york"],
		selectedIndex: 2,
		selectedId: "new-york",
	});

	await harness.run((cities) => {
		cities.removeCity("tokyo");
	});

	assert.deepEqual(harness.getState(), {
		cityIds: ["sydney", "new-york"],
		selectedIndex: 1,
		selectedId: "new-york",
	});
	assert.deepEqual(
		JSON.parse(harness.storage.getItem(WEATHER_CITY_STORAGE_KEY)),
		{
			cityIds: ["sydney", "new-york"],
			selectedIndex: 1,
		},
	);
});

test("useCities coalesces rapid selection previews into one persisted write", async (t) => {
	const harness = await renderUseCities({
		[WEATHER_CITY_STORAGE_KEY]: JSON.stringify({
			cityIds: ["sydney", "tokyo", "new-york"],
			selectedIndex: 0,
		}),
	});
	t.after(async () => {
		await harness.cleanup();
	});

	harness.storage.clearWrites();

	await harness.run((cities) => {
		cities.setSelectedIndex(1);
	});
	await harness.run((cities) => {
		cities.setSelectedIndex(2);
	});
	await harness.run((cities) => {
		cities.setSelectedIndex(1);
	});

	assert.equal(
		harness.storage.getWrites().length,
		0,
		"selection previews should not synchronously hit localStorage",
	);

	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 200));
	});

	assert.deepEqual(
		harness.storage.getWrites().map(({ value }) => JSON.parse(value)),
		[
			{
				cityIds: ["sydney", "tokyo", "new-york"],
				selectedIndex: 1,
			},
		],
	);
});
