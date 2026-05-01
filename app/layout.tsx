/* eslint-disable @next/next/no-page-custom-font -- App Router root layout applies these fonts globally. */
import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import "streamdown/styles.css";
import "leaflet/dist/leaflet.css";
import { getSSRAutoScript, getThemeStyles } from "@atlaskit/tokens";
import { Providers } from "@/app/providers";
import { DevRootTools } from "@/components/utils/dev-root-tools";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const arkEsSolidLight = localFont({
	src: "../public/fonts/ark-es/ARK-ES-SolidLight.woff",
	variable: "--font-ark-es",
	display: "swap",
});

const affigere = localFont({
	src: "../public/fonts/affigere/Affigere-Regular.woff2",
	variable: "--font-affigere",
	display: "swap",
});

const departureMono = localFont({
	src: "../public/fonts/DepartureMono/DepartureMono-Regular.woff2",
	variable: "--font-departure-mono",
	display: "swap",
});

// Prevent @atlaskit/tokens from falling back to uninitialized FeatureGates client.
// Sets the resolver on the same global that @atlaskit/platform-feature-flags uses internally.
// Returns false for all flags — increased-contrast themes stay disabled.
(globalThis as Record<string, unknown>).__PLATFORM_FEATURE_FLAGS__ = {
	booleanResolver: () => false,
};

const THEME_STORAGE_KEY = "ui-theme";
const APP_TITLE = "V—P—K: Venn Prototype Kit";
const APP_DESCRIPTION = "A prototype kit to vibe code Atlassian products";

type FaviconLink = {
	href: string;
	media?: string;
};

const THEME_STATE = {
	colorMode: "auto" as const,
	light: "light" as const,
	dark: "dark" as const,
	spacing: "spacing" as const,
	typography: "typography" as const,
	shape: "shape" as const,
};

function getThemeDefaults() {
	return {
		themeData: `light:${THEME_STATE.light} dark:${THEME_STATE.dark} spacing:${THEME_STATE.spacing} typography:${THEME_STATE.typography} shape:${THEME_STATE.shape}`,
		colorMode: "light" as const,
		contrastMode: undefined as string | undefined,
	};
}

const FAVICON_LINKS: readonly FaviconLink[] = [
	{ href: "/website/favicon-fallback.svg" },
	{ href: "/website/favicon-dark.svg", media: "(prefers-color-scheme: light)" },
	{ href: "/website/favicon-light.svg", media: "(prefers-color-scheme: dark)" },
];

export const metadata: Metadata = {
	title: {
		default: APP_TITLE,
		template: "%s — VPK",
	},
	description: APP_DESCRIPTION,
	openGraph: {
		title: APP_TITLE,
		description: APP_DESCRIPTION,
		type: "website",
	},
	twitter: {
		card: "summary",
		title: APP_TITLE,
		description: APP_DESCRIPTION,
	},
};

function getDevStylesheetGuardScript(): string {
	if (process.env.NODE_ENV !== "development") {
		return "";
	}

	return `
	const appGlobalsChunkPattern = /\\/_next\\/static\\/chunks\\/app_globals_[^/]+\\.css(?:\\?.*)?$/;
	const head = document.head;

	if (head) {
		const toAbsoluteHref = (href) => {
			try {
				return new URL(href, window.location.href).href;
			} catch {
				return href;
			}
		};

		const ensureStylesheetLink = (href) => {
			const targetAbsoluteHref = toAbsoluteHref(href);
			const hasStylesheet = Array.from(
				head.querySelectorAll('link[rel="stylesheet"][href]')
			).some((link) => {
				const existingHref = link.getAttribute("href");
				return (
					typeof existingHref === "string" &&
					(existingHref === href || toAbsoluteHref(existingHref) === targetAbsoluteHref)
				);
			});

			if (hasStylesheet) {
				return;
			}

			const stylesheet = document.createElement("link");
			stylesheet.rel = "stylesheet";
			stylesheet.href = href;
			stylesheet.setAttribute("data-vpk-dev-css-chunk-guard", "head-script");
			head.appendChild(stylesheet);
		};

		const preloadLinks = head.querySelectorAll('link[as="style"][href]');
		for (const preloadLink of Array.from(preloadLinks)) {
			if (!preloadLink.relList.contains("preload")) {
				continue;
			}

			const href = preloadLink.getAttribute("href");
			if (typeof href !== "string" || !appGlobalsChunkPattern.test(href)) {
				continue;
			}

			ensureStylesheetLink(href);
		}
	}
`;
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { themeData, colorMode, contrastMode } = getThemeDefaults();

	let ssrAutoScript = "";
	try {
		ssrAutoScript = getSSRAutoScript("auto") ?? "";
	} catch {
		// Feature gate client may not be initialized
	}

	const devStylesheetGuardScript = getDevStylesheetGuardScript();
	const preHydrationScript = `
(() => {
	const root = document.documentElement;

	// Embedded iframe detection — hide shell chrome before first paint
	try { if (window.self !== window.top) root.dataset.embedded = ""; }
	catch (e) { root.dataset.embedded = ""; }

	let storedTheme = null;

	try {
		storedTheme = window.localStorage.getItem("${THEME_STORAGE_KEY}");
	} catch {}

	if (storedTheme === "light" || storedTheme === "dark") {
		root.setAttribute("data-color-mode", storedTheme);
	} else {
		${ssrAutoScript}
	}

	const resolvedColorMode = root.getAttribute("data-color-mode") === "dark" ? "dark" : "light";
	root.classList.remove("light", "dark");
	root.classList.add(resolvedColorMode);
	root.style.colorScheme = resolvedColorMode;
${devStylesheetGuardScript}

})();
`;

	let themeStyles: Awaited<ReturnType<typeof getThemeStyles>> = [];
	try {
		themeStyles = await getThemeStyles(THEME_STATE);
	} catch {
		// Fallback: theme styles loaded via globals.css
	}

	return (
		<html
			lang="en"
			className={cn(
				colorMode,
				"font-sans",
				geist.variable,
				arkEsSolidLight.variable,
				affigere.variable,
				departureMono.variable,
			)}
			data-theme={themeData}
			data-color-mode={colorMode}
			data-contrast-mode={contrastMode}
			suppressHydrationWarning
		>
			<head>
				<script dangerouslySetInnerHTML={{ __html: preHydrationScript }} />
				{FAVICON_LINKS.map(({ href, media }) => (
					<link
						key={media ?? href}
						rel="icon"
						type="image/svg+xml"
						sizes="any"
						media={media}
						href={href}
					/>
				))}
				{themeStyles.map((themeStyle) => (
					<style
						key={themeStyle.id}
						data-theme={themeStyle.attrs["data-theme"] ?? themeStyle.id}
						dangerouslySetInnerHTML={{ __html: themeStyle.css }}
					/>
				))}
				{/* Atlassian DS-CDN Font Integration */}
				<link rel="preconnect" href="https://ds-cdn.prod-east.frontend.public.atl-paas.net" />
				<link rel="preload" href="https://ds-cdn.prod-east.frontend.public.atl-paas.net/assets/fonts/atlassian-sans/v3/AtlassianSans-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
				<link rel="preload stylesheet" href="https://ds-cdn.prod-east.frontend.public.atl-paas.net/assets/font-rules/v5/atlassian-fonts.css" as="style" crossOrigin="anonymous" />
				{/* Bitcount Grid Single + DotGothic16 + BBH Bartle + JetBrains Mono */}
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link href="https://fonts.googleapis.com/css2?family=BBH+Bartle&family=Bitcount+Grid+Single:wght@100..900&family=DotGothic16&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
			</head>
			<body suppressHydrationWarning className="antialiased">
				<Providers>{children}</Providers>
				{process.env.NODE_ENV === "development" ? <DevRootTools /> : null}
			</body>
		</html>
	);
}
