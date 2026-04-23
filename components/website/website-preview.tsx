"use client";

import { Suspense, startTransition, type ComponentType, use, useEffect, useRef, useState } from "react";
import {
	loadDemoComponent,
	type DemoCategory,
} from "@/components/website/demo-registry-loader";
import {
	PREVIEW_LOAD_ROOT_MARGIN_PX,
	isPreviewWithinLoadRange,
} from "./website-preview-visibility";

interface WebsitePreviewProps {
	slug: string;
	name: string;
	importPath: string;
	category: Exclude<DemoCategory, "utility">;
}

function WebsitePreviewSkeleton() {
	return (
		<div className="flex h-full w-full items-center justify-center">
			<div className="h-20 w-20 animate-pulse rounded-lg bg-bg-neutral" />
		</div>
	);
}

function TextFallback({ name, importPath }: Readonly<{ name: string; importPath: string }>) {
	return (
		<div className="flex flex-col items-center gap-2">
			<span className="text-2xl font-semibold text-text tracking-tight">
				{name}
			</span>
			<code className="text-[11px] text-text-subtlest font-mono">
				{importPath}
			</code>
		</div>
	);
}

function WebsitePreviewWrapper({ Demo }: Readonly<{ Demo: ComponentType }>) {
	return (
		<Demo />
	);
}

function ResolvedWebsitePreview({
	slug,
	name,
	importPath,
	category,
}: Readonly<WebsitePreviewProps>) {
	const Demo = use(loadDemoComponent(slug, category));

	if (!Demo) {
		return <TextFallback name={name} importPath={importPath} />;
	}

	return <WebsitePreviewWrapper Demo={Demo} />;
}

export function WebsitePreview(props: Readonly<WebsitePreviewProps>) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [shouldLoad, setShouldLoad] = useState(false);

	useEffect(() => {
		if (shouldLoad) {
			return;
		}

		const node = containerRef.current;
		if (!node) {
			return;
		}

		const markReady = () => {
			startTransition(() => {
				setShouldLoad(true);
			});
		};

		if (typeof window !== "undefined" && isPreviewWithinLoadRange(node.getBoundingClientRect(), window.innerHeight)) {
			markReady();
			return;
		}

		if (typeof IntersectionObserver === "undefined") {
			markReady();
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const isNearViewport = entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0);
				if (!isNearViewport) {
					return;
				}

				observer.disconnect();
				markReady();
			},
			{ rootMargin: `${PREVIEW_LOAD_ROOT_MARGIN_PX}px` },
		);

		observer.observe(node);

		return () => {
			observer.disconnect();
		};
	}, [shouldLoad]);

	return (
		<div
			ref={containerRef}
			className="h-full w-full"
			data-website-preview={shouldLoad ? "ready" : "idle"}
		>
			{shouldLoad ? (
				<Suspense fallback={<WebsitePreviewSkeleton />}>
					<ResolvedWebsitePreview {...props} />
				</Suspense>
			) : (
				<WebsitePreviewSkeleton />
			)}
		</div>
	);
}
