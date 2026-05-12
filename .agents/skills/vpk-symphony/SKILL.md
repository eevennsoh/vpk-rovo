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
- Prefer exact issue keys or internal issue IDs over broad searches. If you
  need identifier-filter semantics, introspect the current Linear schema first;
  some workspaces reject identifier filter fields that look plausible.
- Use team workflow state IDs when moving an issue; do not guess state IDs.
- Prefer `attachmentLinkGitHubPR` over a generic URL attachment when linking a
  GitHub PR.
- Use targeted introspection before using unfamiliar fields, mutations, or
  input objects.

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
    attachments {
      nodes {
        id
        title
        url
        sourceType
      }
    }
  }
}
```

Targeted introspection for an unfamiliar object field:

```graphql
query IssueFieldNames {
  __type(name: "Issue") {
    fields {
      name
    }
  }
}
```

Targeted introspection for an unfamiliar mutation input:

```graphql
query CommentCreateInputShape {
  __type(name: "CommentCreateInput") {
    inputFields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
        }
      }
    }
  }
}
```

Read recent comments when looking for the live workpad:

```graphql
query IssueComments($id: String!) {
  issue(id: $id) {
    id
    comments(first: 25) {
      nodes {
        id
        body
        updatedAt
        user {
          name
          email
        }
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

## Playwright Evidence Uploads

Use this flow when a Symphony worker needs to attach browser evidence from
`playwright-cli` to the existing `## Codex Workpad` comment.

Rules:

- Prefer updating the existing workpad comment over creating a new comment.
- Upload only the artifacts required by the issue, touched surface, or reviewer
  feedback.
- Keep local artifacts under `output/playwright/<issue-identifier>/`.
- Use `video/webm` for `.webm`, `image/png` for `.png`, `image/jpeg` for
  `.jpg` or `.jpeg`, and `application/octet-stream` for Playwright traces when
  no more specific content type is available.
- Do not include signed upload URLs in the workpad. Include only the returned
  `assetUrl`.

Upload one file:

1. Get the local file size:

```bash
wc -c < output/playwright/VEN-123/happy-path.webm
```

2. Request a signed upload URL:

```graphql
mutation FileUpload(
  $filename: String!
  $contentType: String!
  $size: Int!
  $makePublic: Boolean
) {
  fileUpload(
    filename: $filename
    contentType: $contentType
    size: $size
    makePublic: $makePublic
  ) {
    success
    uploadFile {
      uploadUrl
      assetUrl
      headers {
        key
        value
      }
    }
  }
}
```

3. Upload the local bytes with the exact returned headers:

```bash
curl -X PUT \
  -H "Header-Name: Header Value" \
  --data-binary @output/playwright/VEN-123/happy-path.webm \
  "<uploadUrl>"
```

4. Update the existing workpad comment with a scenario table:

```md
### Evidence

| Scenario | Expected result | Actual result | Artifact |
| --- | --- | --- | --- |
| Happy path | User completes the flow | Passed | [video.webm](<assetUrl>) |
| Error state | Error message is visible | Passed | [screenshot.png](<assetUrl>) |
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
