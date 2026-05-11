export interface PersonalGraphArticleSection {
	body: string;
	heading: string;
}

export interface PersonalGraphArticleMarkdown {
	lede: string;
	sections: PersonalGraphArticleSection[];
	title: string;
}

const DEFAULT_ARTICLE_TITLE = "Personal Graph Summary";

function stripYamlFrontmatter(markdown: string) {
	return markdown.replace(/^---\s*[\r\n]+[\s\S]*?[\r\n]+---\s*[\r\n]+/u, "");
}

function stripWrappingFence(markdown: string) {
	const trimmed = markdown.trim();
	const match = trimmed.match(/^```(?:md|markdown)?\s*[\r\n]+([\s\S]*?)[\r\n]+```$/iu);
	return match ? match[1].trim() : trimmed;
}

function normalizeMarkdown(markdown: string) {
	return stripWrappingFence(stripYamlFrontmatter(markdown)).replace(/\r\n?/gu, "\n").trim();
}

export function parsePersonalGraphSummaryMarkdown(markdown: string): PersonalGraphArticleMarkdown {
	const normalized = normalizeMarkdown(markdown);
	if (!normalized) {
		return {
			lede: "",
			sections: [],
			title: DEFAULT_ARTICLE_TITLE,
		};
	}

	const lines = normalized.split("\n");
	let title = DEFAULT_ARTICLE_TITLE;
	let startIndex = 0;
	const titleLine = lines.findIndex((line) => /^#\s+\S/u.test(line));
	if (titleLine >= 0) {
		title = lines[titleLine].replace(/^#\s+/u, "").trim() || DEFAULT_ARTICLE_TITLE;
		startIndex = titleLine + 1;
	}

	const sections: PersonalGraphArticleSection[] = [];
	const ledeLines: string[] = [];
	let currentHeading: string | null = null;
	let currentBody: string[] = [];

	function flushSection() {
		if (!currentHeading) return;
		sections.push({
			body: currentBody.join("\n").trim(),
			heading: currentHeading,
		});
		currentBody = [];
	}

	for (const line of lines.slice(startIndex)) {
		const sectionMatch = line.match(/^##\s+(.+)$/u);
		if (sectionMatch) {
			flushSection();
			currentHeading = sectionMatch[1].trim();
			currentBody = [];
			continue;
		}
		if (currentHeading) {
			currentBody.push(line);
			continue;
		}
		ledeLines.push(line);
	}
	flushSection();

	const lede = ledeLines.join("\n").trim();
	if (sections.length === 0 && lede) {
		sections.push({
			body: lede,
			heading: "Overview",
		});
		return {
			lede: "",
			sections,
			title,
		};
	}

	return {
		lede,
		sections,
		title,
	};
}
