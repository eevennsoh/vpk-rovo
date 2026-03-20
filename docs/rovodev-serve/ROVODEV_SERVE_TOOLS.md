# Rovo Dev Serve — Exposed Tools

This document lists all tools available to the agent when running `rovodev serve`, organized by the layer that registers them.

---

## 1. Nautilus Tools (via `filesystem-tools` MCP stdio server)

These are the core workspace/code tools passed to Nautilus at initialization in `AcraMini.__init__` (`packages/code-nemo/src/nemo/agents/acra_mini/agent.py`).

| Tool | Description |
|------|-------------|
| `open_files` | Open multiple files at once |
| `create_file` | Create a new file with content |
| `delete_file` | Delete a file from the workspace |
| `move_file` | Rename or move files |
| `expand_code_chunks` | Expand and view specific code functions/classes |
| `find_and_replace_code` | Search and replace code patterns |
| `grep` | Search for patterns in files and file paths |
| `expand_folder` | Expand folder structure to view contents |
| `bash` | Execute bash shell commands (only if available) |
| `powershell` | Execute PowerShell commands (only if available, Windows) |
| `update_allowed_external_paths` | Manage permitted external file paths |

> **Source**: `packages/code-nautilus/src/nautilus/tools/__init__.py` defines all available Nautilus tools. Only the subset listed above is requested by AcraMini.

---

## 2. Conditional Nautilus Tool (AcraMini)

| Tool | Condition | Description |
|------|-----------|-------------|
| `create_technical_plan` | Only if `enable_deep_plan=True` and `use_planning_subagent=False` | Create a technical plan for solving a problem via a planning subagent |

> **Note**: In serve mode, this tool is dynamically disabled/enabled per request based on the `enable_deep_plan` flag in the chat request.

---

## 3. Nemo Core Tools (AgentDefinition)

Registered in `AgentDefinition.__init__` (`packages/code-nemo/src/nemo/core/agent_definition.py`). These are always registered but dynamically hidden via `prepare` functions when not applicable.

| Tool | Condition | Description |
|------|-----------|-------------|
| `invoke_subagents` | Hidden if no subagents are configured | Delegate tasks to specialized subagents (up to 4 concurrently) |
| `get_skill` | Hidden if no skills are loaded | Load a skill's instructions and tool schemas by name or path |

---

## 4. Nemo Eval Tool (AcraMini)

| Tool | Condition | Description |
|------|-----------|-------------|
| `status` | Only if `prompt_version="eval"` | Mark task status as incomplete/verifying/completed (not used in serve mode) |

---

## 5. RovoDev CLI Tools (BaseRovoDevAgent)

Registered in `BaseRovoDevAgent.__init__` (`packages/cli-rovodev/src/rovodev/common/agent.py`).

| Tool | Condition | Description |
|------|-----------|-------------|
| `exit_plan_mode` | Always registered | Exit plan mode and present an implementation plan for user approval |
| `ask_user_questions` | Always registered | Ask the user clarifying questions with structured options (deferred tool) |
| `update_todo` | Only if todolist is enabled | Create and manage task lists for tracking progress on multi-step tasks |

> **Always-allowed**: `ask_user_questions`, `exit_plan_mode`, and `update_todo` are in the `_always_allowed_tools` list and can never be blocked by permission settings.

> **Deferred tools**: In serve mode, `ask_user_questions` and `exit_plan_mode` are disabled unless `enable_deferred_tools=True` is passed to the `stream_chat` endpoint.

---

## 6. Default MCP Servers and Their Tools

The following MCP servers are configured by default (depending on credentials and feature flags). Each compressed server exposes its tools via `mcp__<name>__get_tool_schema` and `mcp__<name>__invoke_tool`.

### 6a. Atlassian MCP — Jira + Confluence

There are two possible implementations depending on the `enable_atlassian_exp` feature flag.

#### Atlassian EXP (experimental, `packages/mcp-atlassian-exp/`)

Runs as an MCP stdio server. Compressed as `mcp__atlassian__*`.

**Source**: `packages/mcp-atlassian-exp/src/atlassian_exp/tools/__init__.py`

| Tool | Description |
|------|-------------|
| `get_atlassian_site_urls` | Get the user's accessible Atlassian site URLs |
| `get_confluence_page` | Get the content of a Confluence page (ADF JSON or HTML beta) |
| `get_confluence_spaces` | Get details of available Confluence spaces |
| `view_confluence_descendants` | View descendant pages of a specific page or space |
| `view_confluence_ancestors` | View all ancestors of a specific Confluence page |
| `get_adf_documentation` | Get ADF documentation and schema (omitted if beta HTML tools enabled) |
| `create_confluence_page` | Create a new Confluence page (ADF or HTML beta) |
| `update_confluence_page` | Update an existing Confluence page (ADF or HTML beta) |
| `add_confluence_page_comment` | Add a footer or inline comment to a Confluence page |
| `search_confluence_using_cql` | Search Confluence content using CQL |
| `get_jira_issue` | Get details of a Jira issue |
| `get_jira_projects` | Get visible Jira projects |
| `create_jira_issue` | Create a new Jira issue |
| `update_jira_issue` | Update a Jira issue |
| `search_jira_using_jql` | Search Jira issues using JQL |
| `download_jira_issue_attachment` | Download an attachment from a Jira issue |
| `upload_jira_issue_attachment` | Upload a file as an attachment to a Jira issue |

#### Legacy Atlassian MCP (remote HTTP)

Falls back to this when `enable_atlassian_exp` is disabled. Compressed as `mcp__atlassian__*`.

**Source**: `ATLASSIAN_TOOLS` in `packages/code-nemo/src/nemo/constants.py`

| Tool | Description |
|------|-------------|
| `getAccessibleAtlassianResources` | Get accessible Atlassian resources |
| `getConfluenceSpaces` | Get Confluence spaces |
| `getConfluencePage` | Get a Confluence page |
| `getPagesInConfluenceSpace` | Get pages in a Confluence space |
| `getConfluencePageFooterComments` | Get footer comments on a Confluence page |
| `getConfluencePageInlineComments` | Get inline comments on a Confluence page |
| `getConfluencePageDescendants` | Get descendant pages |
| `getConfluencePageAncestors` | Get ancestor pages |
| `createConfluencePage` | Create a Confluence page |
| `updateConfluencePage` | Update a Confluence page |
| `createConfluenceFooterComment` | Create a footer comment |
| `createConfluenceInlineComment` | Create an inline comment |
| `searchConfluenceUsingCql` | Search Confluence using CQL |
| `getJiraIssue` | Get a Jira issue |
| `editJiraIssue` | Edit a Jira issue |
| `createJiraIssue` | Create a Jira issue |
| `getTransitionsForJiraIssue` | Get available transitions for a Jira issue |
| `transitionJiraIssue` | Transition a Jira issue |
| `lookupJiraAccountId` | Look up a Jira account ID |
| `searchJiraIssuesUsingJql` | Search Jira issues using JQL |
| `addCommentToJiraIssue` | Add a comment to a Jira issue |
| `getJiraIssueRemoteIssueLinks` | Get remote issue links on a Jira issue |
| `getVisibleJiraProjects` | Get visible Jira projects |
| `getJiraProjectIssueTypesMetadata` | Get issue type metadata for a Jira project |

**Condition**: Requires user credentials (email + API token or OAuth token).

---

### 6b. Bitbucket Cloud MCP

Remote HTTP MCP server. Compressed as `mcp__bitbucket__*`.

**Source**: `BITBUCKET_TOOLS` in `packages/code-nemo/src/nemo/constants.py`
**Condition**: Enabled when `enable_bbc_mcp` feature flag is true.

| Tool | Description |
|------|-------------|
| `bitbucketWorkspace` | Workspace operations (list, get) |
| `bitbucketRepository` | Repository operations (list, get) |
| `bitbucketPullRequest` | Pull request operations (create, get, list, merge, approve, comment, diff) |
| `bitbucketRepoContent` | Repo content operations (branch, commit, file contents) |
| `bitbucketPipeline` | Pipeline operations (list, run, get, steps, step log) |
| `bitbucketDeployment` | Deployment operations (list, get) |
| `bitbucketEnvironment` | Environment operations (list, get, create, delete, update) |

> The server also includes legacy tool names (e.g. `getBitbucketWorkspaces`, `createBitbucketPullRequest`, etc.) that map to the same functionality.

---

### 6c. Compass MCP

Remote HTTP MCP server. Compressed as `mcp__compass__*`.

**Source**: `COMPASS_TOOLS` in `packages/code-nemo/src/nemo/constants.py`
**Condition**: Enabled when `enable_compass_mcp` feature flag is true.

| Tool | Description |
|------|-------------|
| `getCompassComponent` | Get a Compass component |
| `getCompassComponents` | Get multiple Compass components |

---

### 6d. Scout MCP

Local stdio server (via `uvx`). Compressed as `mcp__scout__*`.

**Source**: `packages/mcp-scout/src/scout/tools/`
**Condition**: Internal users only, when `enable_rovodev_mcp` is not enabled and `uvx` is available.

Tools are dynamically loaded from the `tools/` directory — every `.py` file whose filename matches a function name inside it is registered as a tool.

| Tool | Description |
|------|-------------|
| `analyze_issue_image_attachments` | Analyze image attachments on a Jira issue |
| `atlassian_docs_search` | Search across Atlassian's public documentation (developer docs, KB articles, community) |
| `atlassian_search` | Search and retrieve content from Atlassian and Atlassian-connected apps |
| `atlassian_search_orchestrated` | Orchestrated search across Atlassian products |
| `atlassian_search_relationships` | Search relationships in Atlassian data |
| `get_linked_content_from_similar_issues` | Get content linked from semantically similar Jira issues |
| `get_loom_video` | Retrieve Loom video information including metadata and transcript |
| `get_pr_diff` | Fetch code diffs from a Bitbucket pull request |
| `get_pr_links_from_issue_link` | Get associated Bitbucket PR links from a Jira issue (max 10 PRs) |
| `get_recent_prs` | Fetch the user's recent merged PRs and their code diffs |
| `get_similar_issue_diffs` | Get git diffs for PRs associated with semantically similar Jira issues |
| `get_similar_issues` | Retrieve semantically similar Jira issues |
| `search_pr` | Search for pull requests |

> **Note**: The `SCOUT_TOOLS` constant in `packages/code-nemo/src/nemo/constants.py` uses abbreviated names (`search`, `search_orchestrated`, `search_relationships`) and omits `atlassian_docs_search` and `search_pr`. However, the actual Scout server dynamically loads all 13 tools from the directory.

---

### 6e. RovoDev MCP

Remote HTTP MCP server. Compressed as `mcp__rovodev__*`.

**Condition**: Enabled when `enable_rovodev_mcp` feature flag is true (replaces Scout MCP).

> This is a remote server — its tools are fetched dynamically at runtime from `ROVO_DEV_MCP_URL`. The tool list is a superset of Scout MCP tools.

---

### 6f. Integrations MCP Servers

Remote stateless HTTP MCP servers. Each integration is a separate compressed server instance.

**Source**: `INTEGRATIONS` in `packages/cli-rovodev/src/rovodev/modules/mcp_utils.py`
**Condition**: Enabled when `enable_integrations_mcp` feature flag is true. Individual integrations may be filtered by `available_integrations`.

| Integration | Compressed Prefix | Display Name | Product Key |
|-------------|-------------------|--------------|-------------|
| Google Calendar | `mcp__google_calendar__*` | `google_calendar` | `google-calendar` |
| Google Drive | `mcp__google_drive__*` | `google_drive` | `google-drive` |
| Google Cloud (GCP) | `mcp__gcp__*` | `gcp` | `gcp` |
| Gmail | `mcp__gmail__*` | `gmail` | `gmail` |
| Atlassian Tenant | `mcp__atlassian_tenant__*` | `atlassian_tenant` | `tenant` |
| Atlassian Project | `mcp__atlassian_project__*` | `atlassian_project` | `atlassian-project` |
| Atlassian Goal | `mcp__atlassian_goal__*` | `atlassian_goal` | `atlassian-goal` |
| Atlassian Team | `mcp__atlassian_team__*` | `atlassian_team` | `atlassian-team` |
| Teamwork Graph | `mcp__teamwork_graph__*` | `teamwork_graph` | `twg` |
| S360 | `mcp__s360__*` | `s360` | `s360` |
| Slack | `mcp__slack__*` | `slack` | `slack` |
| Compass (via integrations) | `mcp__compass__*` | `compass` | `compass` |

> Integration tool names are dynamically fetched from the integrations MCP endpoint. Each integration strips vendor-specific prefixes from tool names before exposing them to the agent.

---

### 6g. User-Configured MCP Servers

Users can add custom third-party MCP servers via `mcp.json` configuration file.

**Condition**: Servers require user review and acceptance before tools become available. Accepted server signatures are persisted in `config.yml` under `mcp.allowed_mcp_servers`.

---

## Serve-Specific Tool Disabling

In the v3 `stream_chat` endpoint (`packages/cli-rovodev/src/rovodev/commands/serve/v2/endpoints.py`), tools are conditionally disabled per request:

```python
for tool, enabled in [
    ("create_technical_plan", request.enable_deep_plan),
    ("ask_user_questions", enable_deferred_tools),
    ("exit_plan_mode", enable_deferred_tools),
]:
    (disabled_tools.discard if enabled else disabled_tools.add)(tool)
```

---

## Unregistered Tool Functions

The following tool functions are defined in `packages/code-nemo/src/nemo/utils/tools.py` but are **not registered** by any agent in the serve flow:

| Function | Purpose |
|----------|---------|
| `complete` | Mark a task as complete (used in other agent flows) |
| `think` | Log a thought for complex reasoning (Claude "think tool" pattern) |

These are available for use in other agent definitions but are not part of the `rovodev serve` tool set.

---

## Summary

| Layer | Tools |
|-------|-------|
| **Nautilus (always)** | `open_files`, `create_file`, `delete_file`, `move_file`, `expand_code_chunks`, `find_and_replace_code`, `grep`, `expand_folder`, `bash`, `powershell`, `update_allowed_external_paths` |
| **Nautilus (conditional)** | `create_technical_plan` |
| **Nemo Core (conditional)** | `invoke_subagents`, `get_skill` |
| **RovoDev CLI (always)** | `exit_plan_mode`, `ask_user_questions` |
| **RovoDev CLI (conditional)** | `update_todo` |
| **Atlassian EXP MCP** | 16–17 Jira + Confluence tools (see §6a) |
| **Legacy Atlassian MCP** | 24 Jira + Confluence tools (see §6a) |
| **Bitbucket MCP** | 7 consolidated + legacy tool names (see §6b) |
| **Compass MCP** | 2 tools (see §6c) |
| **Scout MCP** | 13 tools (see §6d) |
| **RovoDev MCP** | Dynamic, remote (superset of Scout, see §6e) |
| **Integrations MCP** | 12 integration servers (see §6f) |
| **User 3P MCP** | Custom (see §6g) |
