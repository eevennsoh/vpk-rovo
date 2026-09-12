"use client";

// Cursor gravity: the inverse of the orb's own `gravity` field.
//
// `gravity` bends the orb's dots toward the pointer. This bends the
// *pointer* toward the orb: as it passes near, the native cursor is
// swapped for a drawn replica whose tip stays pinned to the true pointer
// position while its body leans, stretches and blurs toward the nearest
// orb. Let go and it snaps back to the ordinary system cursor.
//
// This is a page-level singleton, not per-orb: one replica, one rAF, one
// listener, shared by every orb that opts in. Orbs register themselves as
// gravity wells and the replica leans toward whichever is nearest,
// handing over smoothly when that changes.
//
// Written clean-room from observable behaviour. The arrow is our own
// vector path rather than a raster of any platform's cursor artwork, so
// it themes correctly and is not limited to one OS.

/** Tuning for the pointer deformation. All distances are CSS px. */
export interface CursorGravityTuning {
	/** Distance outside the orb's edge at which the pull begins. */
	reach: number;
	/** How far the replica trails toward the orb. The tip never moves. */
	tail: number;
	/** How far the body leans toward the orb. The tip stays pinned. */
	bend: number;
	/** 1 bends evenly from the tip out; higher bends the far end hardest. */
	taper: number;
	/** How late the pull builds — higher stays undeformed until close. */
	curve: number;
	/** Lag of the deformation: 0 instant, 1 heavy. */
	inertia: number;
	/** How slowly the pull swings to a new nearest orb: 0 flips, 1 glides. */
	handover: number;
	/**
	 * Extra bend and trail when the orb sits behind the tip, where the
	 * pull shortens the body — evens it against the pull from the front.
	 */
	squash: number;
	/** Progressive blur along the trail: crisp at the tip, this soft at the end. */
	blur: number;
	/** Enter/leave envelope in milliseconds. */
	fadeMs: number;
}

export const CURSOR_GRAVITY_DEFAULTS: Readonly<CursorGravityTuning> =
	Object.freeze({
		reach: 160,
		tail: 11,
		bend: 19,
		taper: 1.95,
		curve: 2.8,
		inertia: 0.3,
		handover: 0.6,
		squash: 1.2,
		blur: 1,
		fadeMs: 180,
	});

/** How many ghost copies compose the trail. */
const TRAIL_STEPS = 7;
/** How many horizontal strips the bend is built from. */
const BEND_STRIPS = 22;

/**
 * Our own pointer, not a platform raster: a classic arrow with the tip at
 * the origin so the hotspot is exactly (0, 0) before the safety margin.
 */
const ARROW_PATH =
	"M0 0 L0 16.6 L4.1 12.7 L6.7 18.8 L9.3 17.7 L6.8 11.7 L12.0 11.7 Z";
const ARROW_W = 13;
const ARROW_H = 20;
/** Margin so the outline stroke is never clipped by the sprite bounds. */
const ARROW_MARGIN = 1.5;

interface Well {
	el: Element;
	reach: number;
}

const wells = new Set<Well>();

let tuning: CursorGravityTuning = { ...CURSOR_GRAVITY_DEFAULTS };
let overlay: HTMLCanvasElement | null = null;
let sprite: HTMLCanvasElement | null = null;
let bent: HTMLCanvasElement | null = null;
let raf = 0;
let listening = false;
/** Set once the effect has failed; it never re-arms itself after that. */
let disabled = false;
let disabledReason = "";

let pointerX = Number.NaN;
let pointerY = Number.NaN;
let targetX = Number.NaN;
let targetY = Number.NaN;
let tailNow = 0;
let bendNow = 0;
let envelope = 0;
let lastMs = 0;
let cursorHidden = false;
let dpr = 1;

/** Replace the tuning wholesale, or pass null to restore the defaults. */
export function setCursorGravityTuning(
	next: Partial<CursorGravityTuning> | null,
): void {
	tuning = next
		? { ...CURSOR_GRAVITY_DEFAULTS, ...next }
		: { ...CURSOR_GRAVITY_DEFAULTS };
}

export function getCursorGravityStatus(): {
	wells: number;
	active: boolean;
	blockedBy: string;
} {
	return {
		wells: wells.size,
		active: envelope > 0.01,
		blockedBy: disabled ? disabledReason : "",
	};
}

/** Coarse pointers have nothing to deform, and reduced motion opts out. */
function supported(): boolean {
	if (disabled) return false;
	if (typeof window === "undefined" || typeof matchMedia === "undefined")
		return false;
	if (!matchMedia("(pointer: fine)").matches) return false;
	if (matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
	return true;
}

function buildSprite(): HTMLCanvasElement {
	const w = Math.ceil((ARROW_W + ARROW_MARGIN * 2) * dpr);
	const h = Math.ceil((ARROW_H + ARROW_MARGIN * 2) * dpr);
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	const ctx = c.getContext("2d");
	if (!ctx) throw new Error("2d context unavailable for the cursor sprite");
	ctx.setTransform(dpr, 0, 0, dpr, ARROW_MARGIN * dpr, ARROW_MARGIN * dpr);
	const path = new Path2D(ARROW_PATH);
	// Platform convention: dark arrow, light outline — legible either way.
	ctx.lineJoin = "round";
	ctx.lineWidth = 1.4;
	ctx.strokeStyle = "#FFFFFF";
	ctx.stroke(path);
	ctx.fillStyle = "#101214";
	ctx.fill(path);
	return c;
}

function ensureNodes(): void {
	dpr = Math.min(2, window.devicePixelRatio || 1);
	if (!sprite) sprite = buildSprite();
	if (!bent) bent = document.createElement("canvas");
	if (overlay) return;
	// A hot-reloaded module leaves its overlay behind with `cursor: none`
	// still applied and no loop driving it. Clear any orphan before ours.
	for (const stale of document.querySelectorAll("[data-thinking-orb-cursor]"))
		stale.remove();
	document.documentElement.style.removeProperty("cursor");
	cursorHidden = false;
	const c = document.createElement("canvas");
	c.setAttribute("aria-hidden", "true");
	c.dataset.thinkingOrbCursor = "";
	Object.assign(c.style, {
		position: "fixed",
		left: "0",
		top: "0",
		pointerEvents: "none",
		zIndex: "2147483647",
		display: "none",
	});
	document.body.appendChild(c);
	overlay = c;
}

/** Hard stop: restore the real cursor and forget every scratch surface. */
function teardown(): void {
	if (raf) cancelAnimationFrame(raf);
	raf = 0;
	showNativeCursor();
	overlay?.remove();
	overlay = null;
	sprite = null;
	bent = null;
	envelope = 0;
	tailNow = 0;
	bendNow = 0;
	targetX = Number.NaN;
	targetY = Number.NaN;
}

function hideNativeCursor(): void {
	if (cursorHidden) return;
	document.documentElement.style.setProperty("cursor", "none", "important");
	cursorHidden = true;
}

function showNativeCursor(): void {
	if (!cursorHidden) return;
	document.documentElement.style.removeProperty("cursor");
	cursorHidden = false;
	if (overlay) overlay.style.display = "none";
}

/** Nearest well by distance to its edge, plus that distance and its reach. */
function nearestWell(): {
	cx: number;
	cy: number;
	edge: number;
	reach: number;
} | null {
	let best: { cx: number; cy: number; edge: number; reach: number } | null =
		null;
	for (const well of wells) {
		const r = well.el.getBoundingClientRect();
		if (r.width === 0 || r.height === 0) continue;
		const cx = r.left + r.width / 2;
		const cy = r.top + r.height / 2;
		const radius = Math.min(r.width, r.height) / 2;
		const edge = Math.hypot(pointerX - cx, pointerY - cy) - radius;
		if (!best || edge < best.edge) best = { cx, cy, edge, reach: well.reach };
	}
	return best;
}

/**
 * Redraw the sprite into `bent` with its body leaning along (ux, uy).
 * Built strip by strip: a strip's offset scales with its distance from the
 * tip raised to `taper`, so the tip stays pinned while the far end swings.
 */
function renderBent(ux: number, uy: number, amount: number): void {
	if (!sprite || !bent) return;
	const w = sprite.width;
	const h = sprite.height;
	bent.width = w;
	bent.height = h;
	const ctx = bent.getContext("2d");
	if (!ctx) return;
	const step = h / BEND_STRIPS;
	for (let i = 0; i < BEND_STRIPS; i++) {
		const y = i * step;
		const frac = (y + step / 2) / h;
		const shift = amount * frac ** tuning.taper * dpr;
		ctx.drawImage(
			sprite,
			0,
			y,
			w,
			step,
			ux * shift,
			y + uy * shift,
			w,
			step,
		);
	}
}

function frame(nowMs: number): void {
	raf = 0;
	if (!overlay || !sprite || !bent) return;
	const ctx = overlay.getContext("2d");
	if (!ctx) return;

	const dt = Math.min(0.05, Math.max(0, (nowMs - lastMs) / 1000));
	lastMs = nowMs;

	const near = Number.isNaN(pointerX) ? null : nearestWell();
	// 1 at the orb's edge, 0 at the limit of that well's reach.
	const proximity = near
		? Math.min(1, Math.max(0, 1 - near.edge / near.reach))
		: 0;
	const pull = proximity ** tuning.curve;

	// enter/leave envelope, then the deformation's own inertia
	const fadeTau = Math.max(1, tuning.fadeMs) / 1000;
	envelope += ((near && proximity > 0 ? 1 : 0) - envelope) * (1 - Math.exp(-dt / fadeTau));
	const lag = 1 - Math.exp(-dt / (0.012 + tuning.inertia * 0.14));
	tailNow += (tuning.tail * pull - tailNow) * lag;
	bendNow += (tuning.bend * pull - bendNow) * lag;

	if (envelope < 0.01 || !near) {
		showNativeCursor();
		schedule();
		return;
	}

	// handover: glide toward a newly-nearest orb instead of snapping
	if (Number.isNaN(targetX)) {
		targetX = near.cx;
		targetY = near.cy;
	} else {
		const swing = 1 - Math.exp(-dt / (0.05 + tuning.handover * 0.6));
		targetX += (near.cx - targetX) * swing;
		targetY += (near.cy - targetY) * swing;
	}

	const dx = targetX - pointerX;
	const dy = targetY - pointerY;
	const dist = Math.hypot(dx, dy) || 1;
	const ux = dx / dist;
	const uy = dy / dist;

	let tailPx = tailNow * envelope;
	let bendPx = bendNow * envelope;

	// The arrow is asymmetric: pulling it back over its own tip shortens
	// the body, so compensate to match the stretch from the other side.
	if (tuning.squash > 0) {
		const bodyLen = Math.hypot(ARROW_W / 2, ARROW_H) || 1;
		const bx = ARROW_W / 2 / bodyLen;
		const by = ARROW_H / bodyLen;
		const behind = Math.max(0, -(ux * bx + uy * by));
		const boost = 1 + tuning.squash * behind;
		tailPx *= boost;
		bendPx *= boost;
	}

	const pad = Math.ceil(tailPx + bendPx + tuning.blur * 3 + 4);
	const cssW = ARROW_W + ARROW_MARGIN * 2 + pad * 2;
	const cssH = ARROW_H + ARROW_MARGIN * 2 + pad * 2;
	const wantW = Math.ceil(cssW * dpr);
	const wantH = Math.ceil(cssH * dpr);
	if (overlay.width !== wantW || overlay.height !== wantH) {
		overlay.width = wantW;
		overlay.height = wantH;
		overlay.style.width = `${cssW}px`;
		overlay.style.height = `${cssH}px`;
	}

	renderBent(ux, uy, bendPx);

	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, overlay.width, overlay.height);
	const ox = pad * dpr;
	const oy = pad * dpr;

	// Crisp copy first, then ghosts painted *behind* it with
	// destination-over so the tip stays sharp and the trail recedes.
	ctx.globalAlpha = 1;
	ctx.drawImage(bent, ox, oy);
	ctx.globalCompositeOperation = "destination-over";
	for (let i = 1; i < TRAIL_STEPS; i++) {
		const a = i / (TRAIL_STEPS - 1);
		ctx.globalAlpha = (1 - a) ** 1.6 * 0.9 * envelope;
		ctx.filter =
			tuning.blur > 0
				? `blur(${(tuning.blur * Math.sqrt(a) * dpr).toFixed(2)}px)`
				: "none";
		ctx.drawImage(bent, ox + ux * tailPx * a * dpr, oy + uy * tailPx * a * dpr);
	}
	ctx.filter = "none";
	ctx.globalAlpha = 1;
	ctx.globalCompositeOperation = "source-over";

	overlay.style.transform = `translate3d(${(pointerX - ARROW_MARGIN - pad).toFixed(2)}px,${(pointerY - ARROW_MARGIN - pad).toFixed(2)}px,0)`;
	overlay.style.display = "";
	hideNativeCursor();
	schedule();
}

function safeFrame(nowMs: number): void {
	try {
		frame(nowMs);
	} catch (err) {
		// Never strand the user without a pointer: give the real cursor
		// back and stay off for the rest of the session.
		disabled = true;
		disabledReason =
			err instanceof Error ? err.message : "cursor gravity failed";
		teardown();
		if (typeof console !== "undefined")
			console.warn("[thinking-orbs] cursor gravity disabled:", err);
	}
}

function schedule(): void {
	if (raf || !listening) return;
	raf = requestAnimationFrame(safeFrame);
}

function onPointerMove(e: PointerEvent): void {
	pointerX = e.clientX;
	pointerY = e.clientY;
	schedule();
}

function onPointerOut(e: PointerEvent): void {
	if (e.relatedTarget) return;
	pointerX = Number.NaN;
	pointerY = Number.NaN;
	showNativeCursor();
}

/**
 * A hidden tab stops rAF, which would freeze the replica mid-frame and
 * leave the real cursor hidden with nothing driving it. Give it back the
 * moment we stop painting, and resume on return.
 */
function onVisibility(): void {
	if (document.visibilityState === "hidden") {
		envelope = 0;
		tailNow = 0;
		bendNow = 0;
		showNativeCursor();
	} else {
		lastMs = performance.now();
		schedule();
	}
}

function start(): void {
	if (listening || !supported()) return;
	ensureNodes();
	listening = true;
	lastMs = performance.now();
	window.addEventListener("pointermove", onPointerMove, { passive: true });
	document.addEventListener("pointerout", onPointerOut, { passive: true });
	document.addEventListener("visibilitychange", onVisibility);
	window.addEventListener("blur", showNativeCursor);
	schedule();
}

function stop(): void {
	if (!listening) return;
	listening = false;
	window.removeEventListener("pointermove", onPointerMove);
	document.removeEventListener("pointerout", onPointerOut);
	document.removeEventListener("visibilitychange", onVisibility);
	window.removeEventListener("blur", showNativeCursor);
	teardown();
}

/**
 * Register an element as a gravity well. Returns the unregister function;
 * the shared overlay stops itself once the last well is gone.
 */
export function registerGravityWell(el: Element, reach?: number): () => void {
	const well: Well = { el, reach: reach ?? CURSOR_GRAVITY_DEFAULTS.reach };
	wells.add(well);
	start();
	return () => {
		wells.delete(well);
		if (wells.size === 0) stop();
	};
}
