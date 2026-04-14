/**
 * Keywords to highlight in search results
 */
export const SEARCH_TERMS = ["OKR", "OKRs", "2026", "planning"] as const;

export type SearchTerm = (typeof SEARCH_TERMS)[number];
