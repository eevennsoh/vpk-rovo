"use strict";

const { SymphonyLinearError } = require("./errors");

const ISSUE_FIELDS = `
	id
	identifier
	title
	description
	url
	branchName
	priority
	estimate
	createdAt
	updatedAt
	state { name type }
	assignee { id name email }
	labels { nodes { id name } }
	comments(last: 25, orderBy: createdAt) {
		nodes {
			id
			body
			createdAt
			updatedAt
			user { id name email }
		}
	}
`;

function normalizeComment(comment) {
	return {
		body: typeof comment?.body === "string" ? comment.body : "",
		createdAt: comment?.createdAt || "",
		id: comment?.id || "",
		updatedAt: comment?.updatedAt || "",
		user: comment?.user || null,
	};
}

function normalizeIssue(issue) {
	return {
		...issue,
		comments: Array.isArray(issue?.comments?.nodes) ? issue.comments.nodes.map(normalizeComment) : [],
		stateName: issue?.state?.name || "",
		labels: Array.isArray(issue?.labels?.nodes) ? issue.labels.nodes.map((label) => label.name).filter(Boolean) : [],
	};
}

function findWorkpadComment(comments = []) {
	return comments.find((comment) => /^## Codex Workpad\b/.test((comment.body || "").trim())) || null;
}

class LinearClient {
	constructor(options) {
		this.apiKey = options.apiKey;
		this.endpoint = options.endpoint || "https://api.linear.app/graphql";
		this.fetchImpl = options.fetchImpl || globalThis.fetch;
		if (!this.fetchImpl) {
			throw new SymphonyLinearError("No fetch implementation is available");
		}
	}

	async request(query, variables = {}) {
		const response = await this.fetchImpl(this.endpoint, {
			method: "POST",
			headers: {
				Authorization: this.apiKey,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ query, variables }),
		});

		const text = await response.text();
		let payload;
		try {
			payload = text ? JSON.parse(text) : {};
		} catch (error) {
			throw new SymphonyLinearError("Linear returned invalid JSON", {
				status: response.status,
				body: text.slice(0, 1000),
				error: error.message,
			});
		}

		if (!response.ok || payload.errors) {
			throw new SymphonyLinearError("Linear GraphQL request failed", {
				status: response.status,
				errors: payload.errors || null,
			});
		}

		return payload.data;
	}

	async searchIssues({ team, activeStates, stateNames, labels = [], first = 25 }) {
		const states = stateNames || activeStates || [];
		const query = `
			query SymphonyIssues($team: String!, $stateNames: [String!], $first: Int!) {
				issues(
					first: $first,
					filter: {
						team: { key: { eq: $team } },
						state: { name: { in: $stateNames } }
					},
					orderBy: updatedAt
				) {
					nodes { ${ISSUE_FIELDS} }
				}
			}
		`;
		const data = await this.request(query, {
			first,
			stateNames: states,
			team,
		});
		const normalized = (data?.issues?.nodes || []).map(normalizeIssue);
		if (!labels.length) {
			return normalized;
		}
		return normalized.filter((issue) => labels.some((label) => issue.labels.includes(label)));
	}

	async getIssue(issueId) {
		const data = await this.request(
			`
				query SymphonyIssue($id: String!) {
					issue(id: $id) { ${ISSUE_FIELDS} }
				}
			`,
			{ id: issueId },
		);
		return normalizeIssue(data?.issue || {});
	}

	async updateIssueState(issueId, stateName) {
		if (!stateName) {
			return null;
		}
		const state = await this.findWorkflowState(stateName);
		if (!state?.id) {
			throw new SymphonyLinearError(`Linear workflow state not found: ${stateName}`);
		}

		const data = await this.request(
			`
				mutation SymphonyIssueState($id: String!, $stateId: String!) {
					issueUpdate(id: $id, input: { stateId: $stateId }) {
						success
						issue { ${ISSUE_FIELDS} }
					}
				}
			`,
			{ id: issueId, stateId: state.id },
		);
		return normalizeIssue(data?.issueUpdate?.issue || {});
	}

	async findWorkflowState(name) {
		const data = await this.request(
			`
				query SymphonyWorkflowState($name: String!) {
					workflowStates(first: 10, filter: { name: { eq: $name } }) {
						nodes { id name type }
					}
				}
			`,
			{ name },
		);
		return data?.workflowStates?.nodes?.[0] || null;
	}

	async createComment(issueId, body) {
		if (!body) {
			return null;
		}
		const data = await this.request(
			`
				mutation SymphonyComment($issueId: String!, $body: String!) {
					commentCreate(input: { issueId: $issueId, body: $body }) {
						success
						comment { id body createdAt }
					}
				}
			`,
			{ body, issueId },
		);
		return data?.commentCreate?.comment || null;
	}

	async updateComment(commentId, body) {
		if (!commentId || !body) {
			return null;
		}
		const data = await this.request(
			`
				mutation SymphonyCommentUpdate($commentId: String!, $body: String!) {
					commentUpdate(id: $commentId, input: { body: $body }) {
						success
						comment { id body createdAt updatedAt }
					}
				}
			`,
			{ body, commentId },
		);
		return data?.commentUpdate?.comment || null;
	}

	async upsertWorkpadComment(issueId, body) {
		if (!body) {
			return null;
		}
		const issue = await this.getIssue(issueId);
		const workpad = findWorkpadComment(issue.comments);
		if (workpad?.id) {
			return this.updateComment(workpad.id, body);
		}
		return this.createComment(issueId, body);
	}

	async linearGraphql(query, variables = {}) {
		return this.request(query, variables);
	}
}

module.exports = {
	findWorkpadComment,
	LinearClient,
	normalizeIssue,
};
