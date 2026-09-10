"use client";

import type { ReactNode } from "react";

import { ScrollFade } from "@/components/ui/scroll-fade";

const CHANGELOG = [
	"v3.1.0 — Scroll-linked edge fades",
	"v3.0.0 — Logical edge utilities",
	"v2.4.0 — RTL mirroring",
	"v2.3.0 — Per-edge fade sizing",
	"v2.2.0 — Reduced-motion fallback",
	"v2.1.0 — Mask compositing fix",
	"v2.0.0 — Registered custom properties",
	"v1.4.0 — Horizontal scroll support",
	"v1.3.0 — Configurable reveal ramp",
	"v1.2.0 — Container-relative sizing",
	"v1.1.0 — Webkit mask prefixes",
	"v1.0.0 — Initial release",
];

const TAGS = [
	"design-tokens",
	"scroll-driven",
	"mask-image",
	"accessibility",
	"tailwind-v4",
	"base-ui",
	"logical-properties",
	"progressive-enhancement",
];

/**
 * `mask-image` clips everything the element paints — including its focus ring.
 * Keeping the ring on an unmasked wrapper is the correct pattern for any
 * keyboard-scrollable ScrollFade, so every demo below uses this frame.
 */
function DemoFrame({
	children,
	className,
}: Readonly<{ children: ReactNode; className?: string }>) {
	return (
		<div
			className={
				"has-[:focus-visible]:ring-ring/50 overflow-hidden rounded-lg border has-[:focus-visible]:ring-2 " +
				(className ?? "")
			}
		>
			{children}
		</div>
	);
}

function ChangelogRows() {
	return (
		<div className="flex flex-col gap-2 p-4 text-sm">
			{CHANGELOG.map((entry) => (
				<p key={entry} className="text-muted-foreground">
					{entry}
				</p>
			))}
		</div>
	);
}

export default function ScrollFadeDemo() {
	return (
		<DemoFrame className="w-64">
			<ScrollFade
				aria-label="Changelog"
				role="group"
				className="h-40 focus-visible:outline-none"
				tabIndex={0}
			>
				<ChangelogRows />
			</ScrollFade>
		</DemoFrame>
	);
}

export function ScrollFadeDemoDefault() {
	return (
		<DemoFrame className="w-72">
			<ScrollFade
				aria-label="Changelog"
				role="group"
				className="h-48 focus-visible:outline-none"
				tabIndex={0}
			>
				<ChangelogRows />
			</ScrollFade>
		</DemoFrame>
	);
}

export function ScrollFadeDemoHorizontal() {
	return (
		<DemoFrame className="w-80">
			<ScrollFade
				aria-label="Tags"
				role="group"
				axis="x"
				className="focus-visible:outline-none"
				tabIndex={0}
			>
				<div className="flex w-max gap-2 p-4">
					{TAGS.map((tag) => (
						<span
							key={tag}
							className="bg-muted text-muted-foreground rounded-md px-3 py-1.5 text-xs whitespace-nowrap"
						>
							{tag}
						</span>
					))}
				</div>
			</ScrollFade>
		</DemoFrame>
	);
}

export function ScrollFadeDemoSingleEdge() {
	return (
		<div className="flex flex-wrap gap-4">
			<div className="flex flex-col gap-2">
				<p className="text-muted-foreground text-xs">{'edge="end"'}</p>
				<DemoFrame className="w-56">
					<ScrollFade
						aria-label="Changelog, bottom fade"
						role="group"
						className="h-40 focus-visible:outline-none"
						edge="end"
						tabIndex={0}
					>
						<ChangelogRows />
					</ScrollFade>
				</DemoFrame>
			</div>
			<div className="flex flex-col gap-2">
				<p className="text-muted-foreground text-xs">{'edge="start"'}</p>
				<DemoFrame className="w-56">
					<ScrollFade
						aria-label="Changelog, top fade"
						role="group"
						className="h-40 focus-visible:outline-none"
						edge="start"
						tabIndex={0}
					>
						<ChangelogRows />
					</ScrollFade>
				</DemoFrame>
			</div>
		</div>
	);
}

export function ScrollFadeDemoSize() {
	return (
		<div className="flex flex-wrap gap-4">
			<div className="flex flex-col gap-2">
				<p className="text-muted-foreground text-xs">default — 12% of 160px = 19px</p>
				<DemoFrame className="w-56">
					<ScrollFade
						aria-label="Changelog, default fade"
						role="group"
						className="h-40 focus-visible:outline-none"
						tabIndex={0}
					>
						<ChangelogRows />
					</ScrollFade>
				</DemoFrame>
			</div>
			<div className="flex flex-col gap-2">
				<p className="text-muted-foreground text-xs">{"size={12} — 48px"}</p>
				<DemoFrame className="w-56">
					<ScrollFade
						aria-label="Changelog, deep fade"
						role="group"
						className="h-40 focus-visible:outline-none"
						size={12}
						tabIndex={0}
					>
						<ChangelogRows />
					</ScrollFade>
				</DemoFrame>
			</div>
		</div>
	);
}

export function ScrollFadeDemoReveal() {
	return (
		<div className="flex flex-wrap gap-4">
			<div className="flex flex-col gap-2">
				<p className="text-muted-foreground text-xs">default — 96px ramp</p>
				<DemoFrame className="w-56">
					<ScrollFade
						aria-label="Changelog, default ramp"
						role="group"
						className="h-40 focus-visible:outline-none"
						tabIndex={0}
					>
						<ChangelogRows />
					</ScrollFade>
				</DemoFrame>
			</div>
			<div className="flex flex-col gap-2">
				<p className="text-muted-foreground text-xs">{"reveal={4} — 16px ramp"}</p>
				<DemoFrame className="w-56">
					<ScrollFade
						aria-label="Changelog, snappy ramp"
						role="group"
						className="h-40 focus-visible:outline-none"
						reveal={4}
						tabIndex={0}
					>
						<ChangelogRows />
					</ScrollFade>
				</DemoFrame>
			</div>
		</div>
	);
}

export function ScrollFadeDemoRender() {
	return (
		<DemoFrame className="w-72">
			<ScrollFade
				render={
					<ol
						aria-label="Changelog list"
						className="h-48 list-decimal focus-visible:outline-none"
						tabIndex={0}
					/>
				}
			>
				{CHANGELOG.map((entry) => (
					<li key={entry} className="text-muted-foreground mx-8 py-1 text-sm">
						{entry}
					</li>
				))}
			</ScrollFade>
		</DemoFrame>
	);
}
