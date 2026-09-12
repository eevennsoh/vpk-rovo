/**
 * Connected-repository fixtures for the team-eu26 Repositories section.
 * Kept out of the picker component module so Fast Refresh can treat that file
 * as components-only.
 */

export interface DevelopmentRepositoryOption {
	id: string;
	name: string;
	provider: "bitbucket" | "github";
	url: string;
}

export const DEVELOPMENT_REPOSITORIES: readonly DevelopmentRepositoryOption[] = [
	{ id: "symphony-explainer", name: "symphony-explainer", provider: "github", url: "https://github.com/eevensoh/symphony-explainer" },
	{ id: "proximity", name: "proximity", provider: "github", url: "https://github.com/eevensoh/proximity" },
	{ id: "vpk-rovo", name: "vpk-rovo", provider: "bitbucket", url: "https://bitbucket.org/eevensoh/vpk-rovo" },
	{ id: "vpk-rovodev", name: "vpk-rovodev", provider: "bitbucket", url: "https://bitbucket.org/eevensoh/vpk-rovodev" },
];

/** Connected-repo tally for the Repositories disclosure header (`· N`). */
export const CONNECTED_REPOSITORY_COUNT = DEVELOPMENT_REPOSITORIES.length;

/** Display-only: drop a leading http(s):// so bylines read as host/path. */
export function stripUrlScheme(url: string): string {
	return url.replace(/^https?:\/\//i, "");
}
