"use strict";

/**
 * Pure text analysis heuristic to detect prompts complex enough to
 * warrant plan mode before execution.
 *
 * Scoring signals (1 point each):
 *  - Ambiguous / underspecified requirements
 *  - 3+ files / components / modules likely affected
 *  - Cross-module or cross-system change
 *  - High-risk domain (auth, billing, data models, API contracts, security, permissions)
 *  - New feature or refactor intent
 *  - Non-trivial migration or data-contract change
 *  - Tradeoffs the user may want to approve
 *
 * Score >= 2 → shouldPlan: true
 *
 * Designed to be synchronous and fast (< 5 ms).
 */

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

/** Keywords that signal architecture / refactor / new-feature scope. */
const FEATURE_REFACTOR_PATTERN = /\b(?:design|refactor|restructure|overhaul|architect|migrate|migration|introduce|implement\s+(?:a\s+)?feature|add\s+support\s+for|end[- ]to[- ]end|full[- ]?stack)\b/i;

/** Keywords that signal high-risk domains. */
const HIGH_RISK_DOMAIN_PATTERN = /\b(?:auth(?:entication|orization)?|permissions?|roles?|billing|payment|security|encryption|data\s*model|api\s*contract|infra(?:structure)?|database|schema|deploy|ci\/?cd|analytics|shared\s*librar(?:y|ies))\b/i;

/** Keywords that signal multi-step / multi-system scope. */
const MULTI_SYSTEM_PATTERN = /\b(?:backend|frontend|api|server|client|database|ui|admin|dashboard|endpoints?|routes?|middleware|hooks?|components?|modules?|services?|workers?)\b/gi;

/** Keywords that suggest the prompt lists multiple deliverables. */
const DELIVERABLE_SEPARATOR_PATTERN = /(?:,\s*(?:and\s+)?|\band\b\s+)/gi;

/** Keywords that suggest tradeoffs or decisions. */
const TRADEOFF_PATTERN = /\b(?:tradeoff|trade[- ]off|should\s+(?:we|i)|pros?\s+(?:and|&)\s+cons?|compare|versus|vs\.?|alternatively|option(?:s|al)?|approach(?:es)?|strategy|rollout\s*plan)\b/i;

/** Keywords that signal planning / coordination scope. */
const PLANNING_KEYWORD_PATTERN = /\b(?:plan|workflow|pipeline|system|architecture|roadmap|multi[- ]?step|phased|coordinated?|sequenc(?:e|ing)|rollout|strategy)\b/i;

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * @param {string} prompt  The user's prompt text.
 * @returns {{ shouldPlan: boolean, score: number, reasons: string[] }}
 */
function assessPromptComplexityForPlanMode(prompt) {
	if (typeof prompt !== "string" || prompt.trim().length === 0) {
		return { shouldPlan: false, score: 0, reasons: [] };
	}

	const text = prompt.trim();
	let score = 0;
	const reasons = [];

	// 1. Feature / refactor / architecture intent
	if (FEATURE_REFACTOR_PATTERN.test(text)) {
		score += 1;
		reasons.push("feature_or_refactor_intent");
	}

	// 2. High-risk domain
	if (HIGH_RISK_DOMAIN_PATTERN.test(text)) {
		score += 1;
		reasons.push("high_risk_domain");
	}

	// 3. Multiple systems / modules mentioned (3+ distinct matches)
	const systemMatches = text.match(MULTI_SYSTEM_PATTERN);
	const uniqueSystems = systemMatches
		? new Set(systemMatches.map((m) => m.toLowerCase())).size
		: 0;
	if (uniqueSystems >= 3) {
		score += 1;
		reasons.push(`cross_module_${uniqueSystems}_systems`);
	}

	// 4. Multiple deliverables (3+ items in a comma/and-separated list)
	const deliverableParts = text.split(DELIVERABLE_SEPARATOR_PATTERN);
	if (deliverableParts.length >= 4) {
		score += 1;
		reasons.push(`multiple_deliverables_${deliverableParts.length}`);
	}

	// 5. Tradeoff / decision language
	if (TRADEOFF_PATTERN.test(text)) {
		score += 1;
		reasons.push("tradeoff_language");
	}

	// 6. Planning / coordination keywords
	if (PLANNING_KEYWORD_PATTERN.test(text)) {
		score += 1;
		reasons.push("planning_keywords");
	}

	// 7. Long prompt (200+ characters) — suggests non-trivial scope
	if (text.length >= 200) {
		score += 1;
		reasons.push("long_prompt");
	}

	return {
		shouldPlan: score >= 2,
		score,
		reasons,
	};
}

module.exports = { assessPromptComplexityForPlanMode };
