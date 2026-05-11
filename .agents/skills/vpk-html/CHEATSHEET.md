# vpk-html Cheatsheet

`/vpk-html` is required. Optional subcommands may follow it, for example
`/vpk-html deck`, `/vpk-html math`, or `/vpk-html pr-writeup`.

## Route Shortcuts

| User intent | Template |
| --- | --- |
| Compare implementation approaches | `exploration-code-approaches` |
| Compare visual directions | `exploration-visual-designs` |
| Roadmap, milestones, delivery plan | `implementation-plan` |
| Annotated pull request review | `code-review-pr` |
| Reviewer-friendly PR summary | `pr-writeup` |
| Explain a module or code path | `code-understanding` |
| Document tokens or component rules | `design-system` |
| Show component states and variants | `component-variants` |
| Animation controls or timing sandbox | `prototype-animation` |
| Clickable workflow prototype | `prototype-interaction` |
| SVG figure sheet | `svg-illustrations` |
| Annotated flowchart | `flowchart-diagram` |
| Browser-first presentation | `slide-deck` |
| Feature explainer | `research-feature-explainer` |
| Concept explainer | `research-concept-explainer` |
| Weekly status or project report | `status-report` |
| Incident timeline | `incident-report` |
| Ticket triage board | `editor-triage-board` |
| Feature flag matrix | `editor-feature-flags` |
| Prompt tuning worksheet | `editor-prompt-tuner` |
| Executive brief | `one-pager` |
| Long-form report, essay, chapter | `long-doc` |
| Memo or formal letter | `letter` |
| Work samples or case studies | `portfolio` |
| Resume or CV | `resume` |
| Investment memo or valuation note | `equity-report` |
| Release notes | `changelog` |
| Math concept page | `math-knowledge` |
| Proof walkthrough | `math-proof` |
| Worked method | `math-procedure` |
| Print-friendly math sheet | `math-handout` |
| Prerequisite graph | `math-concept-map` |
| Manipulable math demo | `math-interactive` |

## Payload Minimum

```json
{
	"template": "research-concept-explainer",
	"title": "Consistent Hashing",
	"slug": "consistent-hashing",
	"theme": {
		"initialMode": "system",
		"allowToggle": true
	},
	"sections": [],
	"sources": [],
	"assets": [],
	"options": {
		"print": true,
		"interactive": true
	}
}
```
