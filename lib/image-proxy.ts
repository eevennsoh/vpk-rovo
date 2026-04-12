const FIGMA_MCP_ASSET_PATH_PREFIX = "/api/mcp/asset/";
const IMAGE_PROXY_ENDPOINT = "/api/image-proxy";
const IMAGE_FILE_EXTENSION_PATTERN =
	/\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp)(?:$|[?#])/i;

function isHttpUrl(value: string): boolean {
	return /^https?:\/\//i.test(value);
}

function stripWrappingQuotes(value: string): string {
	return value.replace(/^['"`<]+|['"`>]+$/g, "");
}

function stripTrailingPunctuation(value: string): string {
	// Remove common trailing punctuation from copied markdown/plain-text URLs.
	return value.replace(/[),.;:!?]+$/g, "");
}

function extractMarkdownImageUrl(value: string): string | null {
	const markdownImageMatch = value.match(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/i);
	return markdownImageMatch?.[1] ?? null;
}

export function normalizeImageSource(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	if (!trimmedValue) {
		return null;
	}

	const markdownImageUrl = extractMarkdownImageUrl(trimmedValue);
	const source = markdownImageUrl ?? trimmedValue;
	const normalizedSource = stripTrailingPunctuation(stripWrappingQuotes(source).trim());
	return normalizedSource.length > 0 ? normalizedSource : null;
}

export function isFigmaMcpAssetUrl(value: string): boolean {
	try {
		const parsedUrl = new URL(value);
		const hostname = parsedUrl.hostname.toLowerCase();
		const isFigmaHost = hostname === "figma.com" || hostname === "www.figma.com";
		return isFigmaHost && parsedUrl.pathname.startsWith(FIGMA_MCP_ASSET_PATH_PREFIX);
	} catch {
		return false;
	}
}

function safeDecodeURIComponent(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

function isAtlassianHost(hostname: string): boolean {
	const normalizedHost = hostname.toLowerCase();
	return normalizedHost === "atlassian.net" || normalizedHost.endsWith(".atlassian.net");
}

export function isAtlassianImageUrl(value: string): boolean {
	try {
		const parsedUrl = new URL(value);
		if (!isAtlassianHost(parsedUrl.hostname)) {
			return false;
		}

		if (/\/wiki\/pages\/viewpageattachments\.action$/i.test(parsedUrl.pathname)) {
			const previewValue = safeDecodeURIComponent(
				parsedUrl.searchParams.get("preview") ?? "",
			);
			return IMAGE_FILE_EXTENSION_PATTERN.test(previewValue);
		}

		if (/\/wiki\/download\/attachments\//i.test(parsedUrl.pathname)) {
			return IMAGE_FILE_EXTENSION_PATTERN.test(parsedUrl.pathname);
		}

		return /\/secure\/(?:view|user)avatar/i.test(parsedUrl.pathname);
	} catch {
		return false;
	}
}

export function toImageProxyUrl(sourceUrl: string): string {
	return `${IMAGE_PROXY_ENDPOINT}?src=${encodeURIComponent(sourceUrl)}`;
}

export function resolveImageRenderSrc(value: unknown): string | null {
	const normalizedSource = normalizeImageSource(value);
	if (!normalizedSource) {
		return null;
	}

	// Reject file:// protocol URLs — these are internal MCP resource references
	// that browsers cannot load.
	if (/^file:\/\//i.test(normalizedSource)) {
		return null;
	}

	if (
		isHttpUrl(normalizedSource) &&
		(isFigmaMcpAssetUrl(normalizedSource) || isAtlassianImageUrl(normalizedSource))
	) {
		return toImageProxyUrl(normalizedSource);
	}

	return normalizedSource;
}
