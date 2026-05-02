---
name: vpk-symphony
description: |
  Use VPK-rovo's Symphony `linear_graphql` client tool for raw Linear GraphQL
  operations such as issue lookup, state changes, comment editing, PR
  attachments, and workpad maintenance during upstream Symphony app-server
  sessions.
---

# VPK Symphony

Use this skill for VPK-rovo Symphony control-plane work that needs raw Linear
GraphQL during Symphony app-server sessions. It expects the `linear_graphql`
client tool exposed by upstream Symphony. That tool reuses Symphony's configured
Linear authentication for the session.

Tool input:

```json
{
  "query": "query or mutation document",
  "variables": {
    "optional": "GraphQL variables object"
  }
}
```

Rules:

- Send one GraphQL operation per tool call.
- Treat a top-level `errors` array as a failed GraphQL operation even if the
  tool call itself completed.
- Keep queries and mutations narrowly scoped.
- Prefer exact issue IDs or identifiers over broad searches.
- Use team workflow state IDs when moving an issue; do not guess state IDs.
- Prefer `attachmentLinkGitHubPR` over a generic URL attachment when linking a
  GitHub PR.

## Common Queries

Lookup by issue key:

```graphql
query IssueByKey($key: String!) {
  issue(id: $key) {
    id
    identifier
    title
    url
    description
    branchName
    state {
      id
      name
      type
    }
    project {
      id
      name
    }
    links {
      nodes {
        id
        url
        title
      }
    }
  }
}
```

Read team states before moving an issue:

```graphql
query IssueTeamStates($id: String!) {
  issue(id: $id) {
    id
    team {
      id
      key
      name
      states {
        nodes {
          id
          name
          type
        }
      }
    }
  }
}
```

Move an issue to a state by ID:

```graphql
mutation MoveIssueToState($id: String!, $stateId: String!) {
  issueUpdate(id: $id, input: { stateId: $stateId }) {
    success
    issue {
      id
      identifier
      state {
        id
        name
      }
    }
  }
}
```

Create a comment:

```graphql
mutation CreateComment($issueId: String!, $body: String!) {
  commentCreate(input: { issueId: $issueId, body: $body }) {
    success
    comment {
      id
      url
      body
    }
  }
}
```

Update a comment:

```graphql
mutation UpdateComment($id: String!, $body: String!) {
  commentUpdate(id: $id, input: { body: $body }) {
    success
    comment {
      id
      body
    }
  }
}
```

Attach a GitHub PR:

```graphql
mutation AttachGitHubPR($issueId: String!, $url: String!, $title: String) {
  attachmentLinkGitHubPR(
    issueId: $issueId
    url: $url
    title: $title
    linkKind: links
  ) {
    success
    attachment {
      id
      title
      url
    }
  }
}
```

If GitHub-specific attachment metadata is unavailable, use a URL attachment:

```graphql
mutation AttachURL($issueId: String!, $url: String!, $title: String) {
  attachmentLinkURL(issueId: $issueId, url: $url, title: $title) {
    success
    attachment {
      id
      title
      url
    }
  }
}
```
