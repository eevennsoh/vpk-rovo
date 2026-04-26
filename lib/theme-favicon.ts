export const THEME_FAVICON_LINK_ATTR = "data-vpk-theme-favicon";
export const THEME_FAVICON_FALLBACK_PATH = "/favicon.ico";
const THEME_FAVICON_OBSERVER_KEY = "__vpkThemeFaviconObserver";

type ThemeFaviconWindow = Window & {
	[THEME_FAVICON_OBSERVER_KEY]?: MutationObserver;
};

export const THEME_FAVICON_LINKS = [
	{
		id: "vpk-favicon-browser-light",
		href: "/website/favicon-dark.svg",
		media: "(prefers-color-scheme: light)",
	},
	{
		id: "vpk-favicon-browser-dark",
		href: "/website/favicon-light.svg",
		media: "(prefers-color-scheme: dark)",
	},
] as const;

type ThemeFaviconLink = (typeof THEME_FAVICON_LINKS)[number];

function isThemeFaviconLink(iconLink: Element) {
	return iconLink.getAttribute(THEME_FAVICON_LINK_ATTR) === "true";
}

function isThemeFaviconFallbackLink(iconLink: Element) {
	const href = iconLink.getAttribute("href");

	if (!href) {
		return false;
	}

	try {
		return new URL(href, window.location.href).pathname === THEME_FAVICON_FALLBACK_PATH;
	} catch {
		return href === THEME_FAVICON_FALLBACK_PATH;
	}
}

function removeCompetingFavicons() {
	for (const iconLink of Array.from(document.querySelectorAll('link[rel~="icon"]'))) {
		if (!isThemeFaviconLink(iconLink) && !isThemeFaviconFallbackLink(iconLink)) {
			iconLink.remove();
		}
	}
}

function applyThemeFaviconLink(linkConfig: ThemeFaviconLink) {
	let faviconLink = document.getElementById(linkConfig.id);

	if (!faviconLink || faviconLink.tagName !== "LINK") {
		faviconLink = document.createElement("link");
		faviconLink.id = linkConfig.id;
		document.head.appendChild(faviconLink);
	}

	faviconLink.setAttribute(THEME_FAVICON_LINK_ATTR, "true");
	faviconLink.setAttribute("rel", "icon");
	faviconLink.setAttribute("type", "image/svg+xml");
	faviconLink.setAttribute("sizes", "any");
	faviconLink.setAttribute("href", linkConfig.href);
	faviconLink.setAttribute("media", linkConfig.media);
}

function ensureThemeFaviconObserver() {
	if (typeof window === "undefined" || typeof MutationObserver === "undefined") {
		return;
	}

	const faviconWindow = window as ThemeFaviconWindow;

	if (faviconWindow[THEME_FAVICON_OBSERVER_KEY]) {
		return;
	}

	faviconWindow[THEME_FAVICON_OBSERVER_KEY] = new MutationObserver(() => {
		removeCompetingFavicons();
	});

	faviconWindow[THEME_FAVICON_OBSERVER_KEY]?.observe(document.head, {
		childList: true,
	});
}

export function ensureThemeFavicons() {
	if (typeof document === "undefined") {
		return;
	}

	removeCompetingFavicons();
	THEME_FAVICON_LINKS.forEach(applyThemeFaviconLink);
	ensureThemeFaviconObserver();
}
