import { expect, test, type Page, type Route } from "@playwright/test";

const PERSONAL_GRAPH_URL = `${
	process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"
}/arts/personal-graph`;

const explorerFixture = {
	edges: [
		{
			id: "wiki_link:wiki:concepts/Ingestion Workflow<->wiki:entities/Graph Vault",
			kind: "wiki_link",
			label: "wikilink",
			metadata: {},
			relationKinds: ["wiki_link"],
			source: "wiki:concepts/Ingestion Workflow",
			target: "wiki:entities/Graph Vault",
		},
	],
	generatedAt: "2026-04-30T00:00:00.000Z",
	nodes: [
		{
			bodyPreview: "",
			connectionCount: 0,
			dangling: false,
			frontmatter: {},
			id: "raw:sample-source",
			kind: "raw",
			label: "sample-source.md",
			missing: false,
			path: "/vault/raw/sample-source.md",
			relativePath: "raw/sample-source.md",
			size: 128,
			slug: "sample-source",
			title: "sample-source.md",
			updatedAt: "2026-04-30T00:00:00.000Z",
		},
		{
			bodyPreview: "# Ingestion Workflow\n\nA mocked workflow page.",
			connectionCount: 1,
			dangling: false,
			frontmatter: { tags: ["wiki/concept"] },
			id: "wiki:concepts/Ingestion Workflow",
			kind: "concept",
			label: "Ingestion Workflow",
			missing: false,
			path: "/vault/wiki/concepts/Ingestion Workflow.md",
			relativePath: "wiki/concepts/Ingestion Workflow.md",
			size: 256,
			slug: "concepts/Ingestion Workflow",
			title: "Ingestion Workflow",
			updatedAt: "2026-04-30T00:00:00.000Z",
			wikiLinks: ["wiki/entities/Graph Vault"],
		},
		{
			bodyPreview: "# Graph Vault\n\nA mocked entity page.",
			connectionCount: 1,
			dangling: false,
			frontmatter: { tags: ["wiki/entity"] },
			id: "wiki:entities/Graph Vault",
			kind: "entity",
			label: "Graph Vault",
			missing: false,
			path: "/vault/wiki/entities/Graph Vault.md",
			relativePath: "wiki/entities/Graph Vault.md",
			size: 192,
			slug: "entities/Graph Vault",
			title: "Graph Vault",
			updatedAt: "2026-04-30T00:00:00.000Z",
			wikiLinks: ["wiki/concepts/Ingestion Workflow"],
		},
	],
	stats: {
		danglingCount: 0,
		edgeCount: 1,
		nodeCount: 3,
		rawCount: 1,
		wikiCount: 2,
	},
};

function fulfillJson(route: Route, body: unknown) {
	return route.fulfill({
		body: JSON.stringify(body),
		contentType: "application/json",
	});
}

async function mockPersonalGraphApi(page: Page) {
	await page.route("**/api/personal-graph/vault", (route) =>
		fulfillJson(route, {
			message: "Personal Graph vault is ready.",
			rawDirectoryExists: true,
			root: "/Users/esoh/Documents/Obsidian Vault/Graph",
			source: "folder-picker",
			status: "ready",
			wikiDirectoryExists: true,
		})
	);
	await page.route("**/api/personal-graph/vault/select", (route) =>
		fulfillJson(route, {
			message: "Personal Graph vault is ready.",
			rawDirectoryExists: true,
			root: "/Users/esoh/Documents/Obsidian Vault/Graph",
			source: "folder-picker",
			status: "ready",
			wikiDirectoryExists: true,
		})
	);
	await page.route("**/api/personal-graph/explorer", (route) =>
		fulfillJson(route, explorerFixture)
	);
	await page.route("**/api/personal-graph/unprocessed-count", (route) =>
		fulfillJson(route, { count: 1, paths: ["raw/sample-source.md"] })
	);
	await page.route("**/api/personal-graph/log", (route) =>
		fulfillJson(route, {
			entries: [
				{
					date: "2026-04-30",
					pagesWritten: ["wiki/concepts/Ingestion Workflow.md"],
					source: "raw/sample-source.md",
					type: "ingest",
				},
			],
		})
	);
	await page.route("**/api/personal-graph/search**", (route) =>
		fulfillJson(route, {
			results: [
				{
					excerpt: "A mocked workflow page.",
					path: "wiki/concepts/Ingestion Workflow.md",
					score: 0.94,
					slug: "concepts/Ingestion Workflow",
					title: "Ingestion Workflow",
				},
			],
		})
	);
	await page.route("**/api/personal-graph/page/**", (route) =>
		fulfillJson(route, {
			body: "# Ingestion Workflow\n\nA mocked workflow page.",
			content: "---\ntags:\n  - wiki/concept\n---\n# Ingestion Workflow\n\nA mocked workflow page.",
			frontmatter: { tags: ["wiki/concept"] },
			path: "/vault/wiki/concepts/Ingestion Workflow.md",
			relativePath: "wiki/concepts/Ingestion Workflow.md",
			slug: "concepts/Ingestion Workflow",
			updatedAt: "2026-04-30T00:00:00.000Z",
		})
	);
	await page.route("**/api/personal-graph/raw", (route) =>
		fulfillJson(route, {
			name: "sample.md",
			path: "/vault/raw/sample.md",
			relativePath: "raw/sample.md",
			size: 32,
			slug: "sample",
			updatedAt: "2026-04-30T00:00:00.000Z",
		})
	);
	await page.route("**/api/personal-graph/ingest**", async (route) => {
		const body = route.request().postDataJSON() as { confirmToken?: string };
		const events = body.confirmToken
			? [
				{
					logEntry: { source: "raw/sample-source.md", type: "ingest" },
					pagesWritten: ["wiki/concepts/Ingestion Workflow.md"],
					stage: "done",
					type: "done",
				},
			]
			: [
				{ stage: "reading", sourcePath: "raw/sample-source.md", type: "stage" },
				{
					stage: "summarizing",
					summary: "A mocked summary.",
					takeaways: ["Keep raw sources immutable", "Confirm before writing"],
					type: "summary",
				},
				{
					related: [
						{
							excerpt: "Existing workflow note.",
							path: "wiki/concepts/Ingestion Workflow.md",
							score: 0.91,
							slug: "concepts/Ingestion Workflow",
							title: "Ingestion Workflow",
						},
					],
					stage: "linking",
					type: "related",
				},
				{ stage: "awaiting-confirmation", token: "confirm-1", type: "confirmation" },
			];

		return route.fulfill({
			body: events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""),
			contentType: "text/event-stream",
		});
	});
}

test("Personal Graph renders graph data, fallback, search, capture, and ingest controls", async ({
	page,
}) => {
	await mockPersonalGraphApi(page);
	await page.goto(PERSONAL_GRAPH_URL, { waitUntil: "domcontentloaded" });

	await expect(page.getByRole("heading", { name: "Personal Graph" })).toBeVisible();
	await expect(page.getByText("2 wiki pages · 1 raw sources")).toBeVisible();
	await expect(page.getByRole("button", { name: "Choose Personal Graph vault folder" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Add raw source" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Ingest" })).toBeEnabled();

	await expect(page.locator("details summary")).toHaveText("Personal Graph text fallback");
	await expect(page.locator("details[open] ul[aria-label='Personal Graph nodes'] li")).toHaveCount(3);
	await expect(page.locator("details[open] ul[aria-label='Personal Graph edges'] li")).toHaveCount(1);
	await expect(page.getByText("Ingestion Workflow to Graph Vault")).toBeAttached();
	await expect(page.locator("canvas")).not.toHaveCount(0);
	await page.getByRole("region", { name: "Drop raw source" }).focus();
	await expect(page.getByRole("region", { name: "Drop raw source" })).toBeFocused();

	await page.getByLabel("Search Personal Graph").fill("ingestion");
	await expect(page.getByText("Ingestion Workflow").first()).toBeVisible();
	await page.getByRole("button", { name: /Ingestion Workflow/i }).click();
	await expect(
		page.getByRole("heading", { level: 1, name: "Ingestion Workflow" })
	).toBeVisible();
	await expect(page.getByText("A mocked workflow page.")).toBeVisible();

	await page
		.locator("input[type='file']")
		.setInputFiles({
			buffer: Buffer.from("# Sample\n\nMock raw source."),
			mimeType: "text/markdown",
			name: "sample.md",
		});
	await expect(page.getByText("Added")).toBeVisible();

	await page.getByRole("button", { name: "Ingest" }).click();
	await expect(page.getByText("Keep raw sources immutable")).toBeVisible();
	await expect(page.getByText("Related pages found by qmd")).toBeVisible();
	await page.getByRole("button", { name: "Confirm" }).click();
	await expect(page.getByText("done").last()).toBeVisible();

	await page.getByRole("button", { name: "Choose Personal Graph vault folder" }).click();
	await expect(page.getByText("Graph").first()).toBeVisible();
});
