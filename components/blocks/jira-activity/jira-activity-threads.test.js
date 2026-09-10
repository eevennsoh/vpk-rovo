const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

// Thread replies, reactions, and composer contracts split from jira-activity.test.js
// so the parent file stays inside the default file-size budget.

const {
	JIRA_ACTIVITY_ENTRIES,
	JIRA_ACTIVITY_CURRENT_USER,
} = require("./data.ts");

const INDEX_SOURCE = fs.readFileSync(path.join(__dirname, "index.tsx"), "utf8");
const COMPOSER_SOURCE = fs.readFileSync(
	path.join(__dirname, "jira-activity-composer.tsx"),
	"utf8",
);
const COMPOSER_DICTATION_SOURCE = fs.readFileSync(
	path.join(__dirname, "use-jira-activity-composer-dictation.ts"),
	"utf8",
);
const COMMENT_SOURCE = fs.readFileSync(
	path.join(__dirname, "jira-activity-comment.tsx"),
	"utf8",
);
const COMMENT_ACTIONS_SOURCE = fs.readFileSync(
	path.join(__dirname, "jira-activity-comment-actions.tsx"),
	"utf8",
);
const CARD_SOURCE = fs.readFileSync(
	path.join(__dirname, "jira-activity-card.tsx"),
	"utf8",
);
const PROMPT_INPUT_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "..", "ui-custom", "prompt-input.tsx"),
	"utf8",
);

test("controlled timelines can route inline agent replies to their owning session", () => {
	assert.match(INDEX_SOURCE, /onSubmitReply\?: \(entry: JiraActivityCommentEntry, body: string\) => void/u);
	assert.match(INDEX_SOURCE, /onSubmitReply\(entry, body\);/u);
	assert.match(INDEX_SOURCE, /onSubmitReply=\{\(body\) => handleAddReply\(entry, body\)\}/u);
});

test("inline review comments keep one reply level and continue the parent timeline spine", () => {
	assert.match(INDEX_SOURCE, /const isNestedComment = entry\.kind === "comment" && Boolean\(entry\.parentId\);/u);
	assert.match(INDEX_SOURCE, /data-jira-activity-parent-id=/u);
	assert.match(
		INDEX_SOURCE,
		/isNestedComment \? \(\s*<div[\s\S]*?className="flex w-8 shrink-0 justify-center"[\s\S]*?data-jira-activity-spine-continuation[\s\S]*?<div className="w-px self-stretch bg-border" \/>/u,
	);
	assert.match(INDEX_SOURCE, /isNestedComment \? "pt-3 pl-6" : null/u);
	assert.match(COMMENT_SOURCE, /const nested = Boolean\(entry\.parentId\);/u);
	assert.match(
		COMMENT_SOURCE,
		/headerAvatar=\{nested \? <ActivityActorAvatar actor=\{entry\.actor\} \/> : undefined\}/u,
	);
	assert.match(COMMENT_SOURCE, /hideLeadAvatar=\{!nested\}/u);
	assert.match(COMMENT_SOURCE, /<ThreadReplyCard[\s\S]*indented=\{!nested\}/u);
	assert.match(COMMENT_SOURCE, /<ThreadReplyCard[\s\S]*indented=\{!nested\}/u);
});

test("plain comments share the stacked identity header and the flush composer geometry", () => {
	assert.match(COMMENT_SOURCE, /import \{ Avatar, AvatarFallback, AvatarGroup, AvatarImage \}/u);
	assert.match(COMMENT_SOURCE, /headerLayout="stacked"/u);
	assert.doesNotMatch(COMMENT_SOURCE, /entry\.actor\.kind === "person" \? "stacked" : "inline"/u);
	assert.doesNotMatch(COMMENT_SOURCE, /const headerTag = resolved/u);
	assert.match(COMMENT_SOURCE, /tag=\{entry\.tag\}/u);
	assert.match(
		COMMENT_SOURCE,
		/import \{ Lozenge \} from "@\/components\/ui\/lozenge";[\s\S]*showResolvedStatus \? <Lozenge variant="success">Resolved<\/Lozenge>/u,
	);
	assert.match(
		COMMENT_SOURCE,
		/function ReopenThreadAction[\s\S]*aria-label="Reopen"[\s\S]*className="h-auto px-0 text-xs text-text-subtle"[\s\S]*variant="link"[\s\S]*>\s*Reopen\s*<\/Button>/u,
	);
	assert.doesNotMatch(
		COMMENT_SOURCE,
		/aria-label="Reopen"[\s\S]*className="[^"]*(?:px-[1-9]|font-normal)/u,
	);
	assert.doesNotMatch(COMMENT_SOURCE, />\s*Resolved\s*<\/p>/u);
	assert.match(
		COMMENT_SOURCE,
		/<Avatar aria-hidden size=\{sizePx === 16 \? "xs" : "default"\}>/u,
	);
	assert.match(COMMENT_SOURCE, /function ActivityActorAvatar/u);
	assert.match(COMMENT_SOURCE, /<AvatarImage alt="" src=\{actor\.avatarSrc\}/u);
	// Reply is a disclosure the comment owns via `commentActions`, not a callback
	// the consuming surface has to wire up.
	assert.doesNotMatch(COMMENT_SOURCE, /onReplyRequest/u);
	// Flush composer chrome stays on the composer's `flush` surface; the
	// callsite only mounts the composer (no local chrome classNames).
	assert.doesNotMatch(COMMENT_SOURCE, /border-0 rounded-none bg-transparent|FLUSH_COMPOSER_CLASSNAME/u);
	// Pull across the timeline node (w-8) + li gap-2 so the prompt shares the
	// parent avatar edge instead of the nested pl-6 reply column.
	assert.match(
		COMMENT_SOURCE,
		/<div\s+className="-ml-10 w-\[calc\(100%\+2\.5rem\)\]"\s+id=\{composerId\}\s*>/u,
	);
	assert.doesNotMatch(COMMENT_SOURCE, /overflow-visible px-1\.5 pt-1 pb-3/u);
});

test("only the latest third-level reply owns Reopen", () => {
	assert.match(
		COMMENT_SOURCE,
		/onReopen=\{\s*resolved && index === replies\.length - 1 && allowResolve && onResolve[\s\S]*\? handleResolveToggle[\s\S]*: undefined\s*\}/u,
	);
	assert.match(
		COMMENT_SOURCE,
		/resolved \? \(\s*onReopen \? <ReopenThreadAction onReopen=\{onReopen\} \/> : undefined/u,
	);
	assert.doesNotMatch(COMMENT_SOURCE, /\bfollowsReplies\b/u);
	assert.doesNotMatch(COMMENT_SOURCE, /<ReopenThreadAction[^>]*indented=/u);
});

test("the activity card hosts the action row in the body grid, not the footer", () => {
	// `action` is a header slot, so the reply/reaction row gets its own slot that
	// lands last in the body grid and inherits the card's gap for both geometries.
	assert.match(CARD_SOURCE, /footerActions\?: ReactNode;/u);
	assert.match(CARD_SOURCE, /^\tfooterActions,$/mu);
	assert.match(CARD_SOURCE, /\{detailsContent\}[\s\S]*\{footerActions\}[\s\S]*\{showFooter \? \(/u);
	// Nothing renders it inside the footer branch.
	assert.doesNotMatch(CARD_SOURCE, /\{showFooter \? \([\s\S]*\{footerActions\}/u);
	assert.match(CARD_SOURCE, /hasExpandedLayout \? "gap-3" : "gap-2"/u);
	assert.doesNotMatch(CARD_SOURCE, /\bp-3\b/u);
	assert.match(CARD_SOURCE, /className="grid gap-3"/u);
	assert.doesNotMatch(CARD_SOURCE, /className="grid gap-3 overflow-visible"/u);
});

test("parent comments keep Reply and reactions while resolved threads label the latest reply", () => {
	assert.match(
		COMMENT_ACTIONS_SOURCE,
		/import ReplyLeftIcon from "@atlaskit\/icon-lab\/core\/reply-left";/u,
	);
	assert.match(
		COMMENT_ACTIONS_SOURCE,
		/import \{ EmojiReactionBar \} from "@\/components\/blocks\/emoji-picker\/components\/emoji-reaction-bar";/u,
	);
	assert.match(COMMENT_ACTIONS_SOURCE, /<EmojiReactionBar/u);
	assert.match(COMMENT_ACTIONS_SOURCE, /aria-label="Comment actions"/u);
	// Reply is an icon button: label on the Button, empty label on the icon.
	assert.match(COMMENT_ACTIONS_SOURCE, /aria-label="Reply"/u);
	assert.match(COMMENT_ACTIONS_SOURCE, /aria-expanded=\{replyExpanded\}/u);
	assert.match(COMMENT_ACTIONS_SOURCE, /aria-controls=\{replyComposerId\}/u);
	assert.match(COMMENT_ACTIONS_SOURCE, /className="rounded-sm"/u);
	assert.doesNotMatch(COMMENT_ACTIONS_SOURCE, /shape="circle"/u);
	assert.match(COMMENT_ACTIONS_SOURCE, /<ReplyLeftIcon color="currentColor" label="" \/>/u);
	// Always visible — never a hover-reveal.
	assert.doesNotMatch(COMMENT_ACTIONS_SOURCE, /opacity-0|group-hover/u);
	// Omitting `onReply` is how `allowReply: false` drops the button.
	assert.match(COMMENT_ACTIONS_SOURCE, /onReply\?: \(\) => void;/u);
	assert.match(COMMENT_ACTIONS_SOURCE, /onReply \? \(/u);
	// Resolve is a subtle text control for active SCM review threads; resolved
	// state belongs beside the latest reply timestamp, with Reopen owned by that reply.
	assert.match(COMMENT_ACTIONS_SOURCE, /onResolve\?: \(\) => void;/u);
	assert.doesNotMatch(COMMENT_ACTIONS_SOURCE, /Reopen|Unresolve|aria-pressed/u);
	assert.match(COMMENT_ACTIONS_SOURCE, /aria-label="Resolve"/u);
	assert.match(
		COMMENT_ACTIONS_SOURCE,
		/<EmojiReactionBar[\s\S]*trailing=\{[\s\S]*aria-label="Resolve"[\s\S]*className="h-auto px-0 text-xs text-text-subtle"[\s\S]*variant="link"/u,
	);
	assert.doesNotMatch(
		COMMENT_ACTIONS_SOURCE,
		/aria-label="Resolve"[\s\S]*className="[^"]*(?:px-[1-9]|font-normal)/u,
	);
	assert.match(COMMENT_SOURCE, /<JiraActivityCommentActions/u);
	assert.match(COMMENT_SOURCE, /footerActions=\{/u);
	assert.match(COMMENT_SOURCE, /const commentActionControls = commentActions === "none" \? null/u);
	assert.match(COMMENT_SOURCE, /!resolved && allowResolve && onResolve \? handleResolveToggle/u);
	assert.match(
		COMMENT_SOURCE,
		/replies\.map\(\(reply, index\) => \([\s\S]*onReopen=\{[\s\S]*index === replies\.length - 1[\s\S]*showResolvedStatus=\{resolved && index === replies\.length - 1\}/u,
	);
	assert.match(COMMENT_SOURCE, /parentResolvedStatus = resolved && !hasReplies/u);
	assert.match(COMMENT_SOURCE, /className="text-sm leading-5 text-text"/u);
	assert.doesNotMatch(COMMENT_SOURCE, /resolved \? "text-text-subtlest" : "text-text"/u);
});

test("active thread replies have actions while only the latest resolved reply can reopen", () => {
	assert.match(COMMENT_SOURCE, /function ThreadReplyCard/u);
	assert.match(COMMENT_SOURCE, /<div className=\{cn\("pt-3", indented \? "pl-6" : null\)\}>\s*<JiraActivityCard[\s\S]*className="rounded-none"/u);
	assert.doesNotMatch(COMMENT_SOURCE, /className="rounded-none border-0"/u);
	assert.doesNotMatch(COMMENT_SOURCE, /<div className="pl-6">/u);
	assert.doesNotMatch(COMMENT_SOURCE, /<div className="pl-3">/u);
	assert.match(COMMENT_SOURCE, /headerLayout="stacked"/u);
	assert.match(COMMENT_SOURCE, /activityGroup="activity-reply"/u);
	assert.match(COMMENT_SOURCE, /item=\{reply\.sessionItem\}/u);
	assert.match(COMMENT_SOURCE, /onView=\{onViewSession\}/u);
	assert.match(COMMENT_SOURCE, /<JiraActivityCommentActions[\s\S]*onToggleReaction=\{toggleReaction\}/u);
	assert.match(
		COMMENT_SOURCE,
		/resolved \? \(\s*onReopen \? <ReopenThreadAction onReopen=\{onReopen\} \/> : undefined\s*\) : commentActions === "none" \? undefined/u,
	);
	assert.match(COMMENT_SOURCE, /\? \(\) => onReply\(replyButtonRef\.current\)/u);
	assert.match(COMMENT_SOURCE, /<ThreadReplyCard[\s\S]*allowReply=\{allowReply\}/u);
	assert.match(COMMENT_SOURCE, /<ThreadReplyCard[\s\S]*resolved=\{resolved\}/u);
	assert.match(COMMENT_SOURCE, /<ThreadReplyCard[\s\S]*showResolvedStatus=\{resolved && index === replies\.length - 1\}/u);
	assert.match(COMMENT_SOURCE, /replies=\{[\s\S]*aria-label="Replies"[\s\S]*className=\{cn\("grid gap-2", repliesExpanded \? null : "hidden"\)\}[\s\S]*role="group"[\s\S]*replies\.map\(\(reply, index\) => \([\s\S]*<ThreadReplyCard/u);
	assert.doesNotMatch(COMMENT_SOURCE, /divide-y divide-border/u);
	assert.doesNotMatch(COMMENT_SOURCE, /before:-top-3|before:left-4|before:w-px|ml-8/u);
	assert.doesNotMatch(COMMENT_SOURCE, /import \{ Comment \} from "@\/components\/ui\/comment";/u);
});

test("a thread owns one bottom reply composer and targets the clicked author", () => {
	assert.equal(
		(COMMENT_SOURCE.match(/<JiraActivityComposer/gu) ?? []).length,
		1,
		"the parent and nested replies must not mount independent composers",
	);
	assert.match(
		COMMENT_SOURCE,
		/function toggleReply\(key: string, actor: JiraActivityActor, button: HTMLButtonElement \| null\)[\s\S]*setReplyTarget\(\{ key, actor \}\);\s*setReplyDraft\(""\);/u,
	);
	assert.match(COMMENT_SOURCE, /onReply=\{\(button\) => toggleReply\(reply\.id, reply\.actor, button\)\}/u);
	assert.match(
		COMMENT_SOURCE,
		/composerVisible \? \([\s\S]*?<div\s+className="-ml-10 w-\[calc\(100%\+2\.5rem\)\]"\s+id=\{composerId\}\s*>/u,
	);
	assert.doesNotMatch(
		COMMENT_SOURCE,
		/className=\{hasReplies && repliesExpanded \? "border-t border-border" : undefined\}/u,
	);
	assert.match(COMMENT_SOURCE, /key=\{replyTarget\?\.key \?\? "thread-reply"\}/u);
	assert.match(COMMENT_SOURCE, /onValueChange=\{setReplyDraft\}/u);
	assert.match(COMMENT_SOURCE, /value=\{replyDraft\}/u);
});

test("comments with nested replies expose one shared header control to collapse the thread", () => {
	assert.match(COMMENT_SOURCE, /import GrowVerticalIcon from "@atlaskit\/icon\/core\/grow-vertical"/u);
	assert.match(
		COMMENT_SOURCE,
		/const \[repliesExpanded, setRepliesExpanded\] = useState\(\s*entry\.defaultRepliesExpanded \?\? !nested,\s*\)/u,
	);
	assert.match(COMMENT_SOURCE, /const hasReplies = replies\.length > 0/u);
	assert.match(COMMENT_SOURCE, /repliesExpanded \? "Hide all replies" : "Show all replies"/u);
	assert.match(COMMENT_SOURCE, /aria-controls=\{repliesId\}[\s\S]*aria-expanded=\{repliesExpanded\}[\s\S]*size="icon-compact"[\s\S]*variant="outline"[\s\S]*<GrowVerticalIcon label="" \/>/u);
	assert.match(COMMENT_SOURCE, /className="aria-expanded:border-border aria-expanded:bg-bg-neutral-subtle/u);
	assert.doesNotMatch(COMMENT_SOURCE, /aria-expanded:border-transparent|aria-expanded:bg-transparent/u);
	assert.doesNotMatch(COMMENT_SOURCE, /opacity-0[\s\S]*group-hover\/activity-card:opacity-100/u);
	assert.match(
		COMMENT_SOURCE,
		/const headerAction = action \|\| repliesToggle \|\| addToChatAction \? \(\s*<div className="flex shrink-0 items-center gap-1">[\s\S]*\{action\}[\s\S]*\{addToChatAction\}[\s\S]*\{repliesToggle\}/u,
	);
	// The shared control rides the card's hover scope, but stays in the tab order:
	// a `display: none` wrapper could never satisfy its own focus-visible reveal.
	assert.match(
		CARD_SOURCE,
		/\{action \? \([\s\S]*"relative z-10 pointer-events-none flex shrink-0 items-center gap-1 opacity-0[\s\S]*actionVisibilityClass/u,
	);
	assert.doesNotMatch(CARD_SOURCE, /"hidden shrink-0 items-center gap-1/u);
	assert.match(COMMENT_SOURCE, /action=\{headerAction\}/u);
	assert.match(COMMENT_SOURCE, /hidden=\{!repliesExpanded\}[\s\S]*id=\{repliesId\}/u);
	assert.match(
		COMMENT_SOURCE,
		/className=\{cn\("grid gap-2", repliesExpanded \? null : "hidden"\)\}/u,
	);
	assert.doesNotMatch(COMMENT_SOURCE, /repliesHidden=/u);
	assert.doesNotMatch(CARD_SOURCE, /repliesHidden/u);
});

test("agent session cards keep header actions and replies toggle on the shared hover group", () => {
	// Agent headers receive the same action cluster (Add to chat + expand) as
	// human cards; the card-level group keeps those controls clickable over the
	// full thread, including while the pointer is on nested replies.
	assert.match(COMMENT_SOURCE, /item=\{entry\.sessionItem\}/u);
	assert.match(COMMENT_SOURCE, /action=\{headerAction\}/u);
	assert.match(COMMENT_SOURCE, /onClick=\{\(\) => setRepliesExpanded\(\(expanded\) => !expanded\)\}/u);
	assert.match(
		CARD_SOURCE,
		/Hover\/focus group wraps the full card[\s\S]*activityGroupClass,[\s\S]*"w-full min-w-0 overflow-visible bg-transparent"/u,
	);
});

test("collapsed threads show a Slack-like participant, count, and timestamp summary", () => {
	assert.match(COMMENT_SOURCE, /function CollapsedThreadSummary/u);
	assert.match(
		COMMENT_SOURCE,
		/\{resolved \? <Lozenge variant="success">Resolved<\/Lozenge> : null\}\s*<span aria-hidden className="text-text-subtlest">·<\/span>/u,
	);
	assert.match(COMMENT_SOURCE, /new Map\(replies\.map\(\(reply\) => \[reply\.actor\.id, reply\.actor\]\)\)/u);
	assert.match(COMMENT_SOURCE, /<AvatarGroup[\s\S]*Reply participants:[\s\S]*actors\.slice\(0, 3\)\.map/u);
	assert.match(COMMENT_SOURCE, /sizePx=\{16\}/u);
	assert.match(COMMENT_SOURCE, /replyCountLabel[\s\S]*latestTimestamp/u);
	assert.match(COMMENT_SOURCE, /text-xs font-normal text-text hover:underline/u);
	assert.doesNotMatch(COMMENT_SOURCE, /font-medium text-link[\s\S]*replyCountLabel/u);
	assert.doesNotMatch(COMMENT_SOURCE, /hover:no-underline/u);
	assert.match(COMMENT_SOURCE, /group\/thread-summary h-auto min-w-0 gap-1\.5/u);
	assert.match(COMMENT_SOURCE, /shrink-0 text-text-subtle">\{replyCountLabel\}/u);
	assert.match(
		COMMENT_SOURCE,
		/shrink-0 text-text-subtle">\{replyCountLabel\}<\/span>\s*\{latestTimestamp \? \(\s*<>\s*<span aria-hidden className="shrink-0 text-text-subtlest">·<\/span>/u,
	);
	assert.match(COMMENT_SOURCE, /truncate text-text-subtlest group-hover\/thread-summary:hidden[\s\S]*latestTimestamp/u);
	assert.match(COMMENT_SOURCE, /group-hover\/thread-summary:hidden[\s\S]*latestTimestamp/u);
	assert.match(COMMENT_SOURCE, /group-hover\/thread-summary:inline[\s\S]*View all comments/u);
	assert.match(COMMENT_SOURCE, /collapsedThreadSummary = hasReplies && !repliesExpanded/u);
	assert.match(
		COMMENT_SOURCE,
		/<CollapsedThreadSummary[\s\S]*onExpand=\{\(\) => setRepliesExpanded\(true\)\}[\s\S]*replies=\{replies\}[\s\S]*resolved=\{resolved\}/u,
	);
});

test("Reply discloses the single thread composer, defaulting to reply-and-reactions", () => {
	assert.match(
		INDEX_SOURCE,
		/commentActions\?: "none" \| "reactions" \| "reply-and-reactions";/u,
	);
	assert.match(INDEX_SOURCE, /commentActions = "reply-and-reactions",/u);
	assert.match(INDEX_SOURCE, /commentActions=\{commentActions\}/u);
	// The comment stands alone with the same default.
	assert.match(COMMENT_SOURCE, /commentActions = "reply-and-reactions",/u);
	assert.match(COMMENT_SOURCE, /const allowReply = entry\.allowReply \?\? true;/u);
	assert.match(
		COMMENT_SOURCE,
		/const collapsible = commentActions === "reply-and-reactions";/u,
	);
	assert.match(
		COMMENT_SOURCE,
		/const composerVisible = allowReply && \(!collapsible \|\| replyTarget !== null\);/u,
	);
	assert.match(
		COMMENT_SOURCE,
		/function handleResolveToggle\(\) \{\s*if \(!resolved\) \{\s*setReplyTarget\(null\);\s*setReplyDraft\(""\);\s*\}\s*onResolve\?\.\(\);\s*\}/u,
	);
	// The composer only mounts when visible, and aria-controls never dangles.
	assert.match(
		COMMENT_SOURCE,
		/composerVisible \? \([\s\S]*?<div\s+className="-ml-10 w-\[calc\(100%\+2\.5rem\)\]"\s+id=\{composerId\}\s*>/u,
	);
	assert.match(COMMENT_SOURCE, /replyComposerId=\{replyTarget\?\.key === entry\.id \? composerId : undefined\}/u);
	assert.match(COMMENT_SOURCE, /const composerId = useId\(\);/u);
	// "none" drops the row entirely; Reply is withheld when the entry opted out.
	assert.match(COMMENT_SOURCE, /commentActions === "none" \? undefined : \(/u);
	assert.match(COMMENT_SOURCE, /\? \(\) => toggleReply\(entry\.id, entry\.actor, replyButtonRef\.current\)/u);
});

test("toggling a reaction routes through the reducer with the current user's id", () => {
	assert.match(
		INDEX_SOURCE,
		/onToggleReaction\?: \(entry: JiraActivityCommentEntry, emoji: string\) => void/u,
	);
	assert.match(
		INDEX_SOURCE,
		/function handleToggleReaction\([\s\S]*if \(onToggleReaction\) \{[\s\S]*onToggleReaction\(entry, emoji\);[\s\S]*return;[\s\S]*applyAction\(\{[\s\S]*type: "toggle-reaction",[\s\S]*entryId: entry\.id,[\s\S]*emoji,[\s\S]*actorId: currentUser\.id,/u,
	);
	assert.match(
		INDEX_SOURCE,
		/onToggleReaction=\{\(emoji\) => handleToggleReaction\(entry, emoji\)\}/u,
	);
	assert.match(INDEX_SOURCE, /\bJiraActivityReaction,/u);
	// Stored actor ids are normalized into the picker block's count view model.
	assert.match(
		COMMENT_SOURCE,
		/\(entry\.reactions \?\? \[\]\)\.map\(\(reaction\) => \(\{[\s\S]*emoji: reaction\.emoji,[\s\S]*count: reaction\.actorIds\.length,[\s\S]*reacted: reaction\.actorIds\.includes\(currentUser\.id\),/u,
	);
});

test("the sample feed seeds reactions on a human comment", () => {
	const seeded = JIRA_ACTIVITY_ENTRIES.filter(
		(entry) => entry.kind === "comment" && (entry.reactions?.length ?? 0) > 0,
	);
	assert.ok(seeded.length > 0, "expected at least one comment with seeded reactions");
	const [comment] = seeded;
	assert.equal(comment.actor.kind, "person");
	assert.ok(comment.reactions.length >= 2, "expected more than one reaction glyph");
	// One reaction the viewer has pressed (count > 1) and one they have not, so
	// the demo shows both pill states.
	const pressed = comment.reactions.filter((reaction) =>
		reaction.actorIds.includes(JIRA_ACTIVITY_CURRENT_USER.id),
	);
	const unpressed = comment.reactions.filter(
		(reaction) => !reaction.actorIds.includes(JIRA_ACTIVITY_CURRENT_USER.id),
	);
	assert.ok(pressed.length > 0, "expected a reaction the current user has pressed");
	assert.ok(unpressed.length > 0, "expected a reaction the current user has not pressed");
	assert.ok(pressed[0].actorIds.length > 1, "pressed reaction should aggregate actors");
	for (const reaction of comment.reactions) {
		assert.equal(new Set(reaction.actorIds).size, reaction.actorIds.length);
	}
});

test("the sample feed includes a human activity snapshot comment", () => {
	const humanComments = JIRA_ACTIVITY_ENTRIES.filter(
		(entry) => entry.kind === "comment" && entry.actor.kind === "person",
	);
	assert.ok(
		humanComments.length > 0,
		"expected at least one human-authored comment card",
	);
	const snapshot = humanComments[0];
	// A human snapshot is a plain comment (no agent session summary) so it renders
	// the stacked avatar/name/timestamp header rather than the agent-session card.
	assert.equal(snapshot.sessionItem, undefined);
	assert.ok(snapshot.actor.avatarSrc, "human snapshot should carry a photo avatar");
	assert.ok(snapshot.body.length > 0, "human snapshot should have a body");
	// The prompt composer is exposed for human comments (allowReply defaults to true).
	assert.notEqual(snapshot.allowReply, false);
});

test("the exported comment composer uses the shared floating Rovo prompt", () => {
	assert.match(INDEX_SOURCE, /export \{ JiraActivityComposer, type JiraActivityComposerProps \}/u);
	assert.match(COMPOSER_SOURCE, /value\?: string/u);
	assert.match(COMPOSER_SOURCE, /onValueChange\?: \(value: string\) => void/u);
	assert.match(COMPOSER_SOURCE, /textareaRef\?: Ref<HTMLTextAreaElement>/u);
	assert.match(COMPOSER_SOURCE, /inputContext\?: ReactNode/u);
	assert.match(COMPOSER_SOURCE, /inputContextSubmitText\?: string/u);
	assert.match(COMPOSER_SOURCE, /inputContext=\{expandedToolbar\}/u);
	assert.match(COMPOSER_SOURCE, /const canSubmit = trimmed\.length > 0 \|\| hasInputContext/u);
	assert.match(COMPOSER_SOURCE, /<FloatingComposer/u);
	assert.match(COMPOSER_SOURCE, /<PromptInputTextarea/u);
	assert.match(COMPOSER_SOURCE, /<RovoComposerActionButton/u);
	assert.match(COMPOSER_SOURCE, /showSubmitWhenEmpty/u);
	assert.match(COMPOSER_SOURCE, /onStartDictation=\{onStartDictation\}/u);
	assert.match(COMPOSER_SOURCE, /onStopDictation=\{onStopDictation\}/u);
	assert.match(COMPOSER_SOURCE, /dictationState=\{dictationState\}/u);
	// Plain reply row still owns a local Send control; floating surfaces use the
	// shared action button (mic + send) instead.
	assert.match(COMPOSER_SOURCE, /aria-label="Send"/u);
	assert.match(COMPOSER_SOURCE, /disabled=\{!canSubmit\}/u);
});

test("the floating activity composer reuses shared dictation via browser transcription", () => {
	assert.match(
		COMPOSER_SOURCE,
		/import \{ useJiraActivityComposerDictation \} from "\.\/use-jira-activity-composer-dictation"/u,
	);
	assert.match(
		COMPOSER_DICTATION_SOURCE,
		/realtime\.connect\(\{ transcriptionOnly: true \}\)/u,
	);
	assert.match(
		COMPOSER_DICTATION_SOURCE,
		/appendDictationTranscript\(/u,
	);
	assert.match(
		COMPOSER_DICTATION_SOURCE,
		/resolveComposerDictationState\(/u,
	);
});

test("the two floating surfaces are separated by variant, not by callsite classNames", () => {
	assert.match(COMPOSER_SOURCE, /variant\?: "reply" \| "comment" \| "flush"/u);
	assert.match(COMPOSER_SOURCE, /const surface = COMPOSER_SURFACES\[variant\];/u);
	// Both floating surfaces keep PromptInput's bordered chrome and the shared
	// compact `p-2` (space.100) inset. Flush drops the floating backdrop shadow;
	// comment keeps it. Control size also separates them.
	assert.match(
		COMPOSER_SOURCE,
		/comment: \{[\s\S]*?chrome: "p-2",[\s\S]*?controlClassName: "",/u,
	);
	assert.match(
		COMPOSER_SOURCE,
		/flush: \{[\s\S]*?chrome: "p-2 shadow-none",[\s\S]*?controlClassName: "size-6",/u,
	);
	assert.match(COMPOSER_SOURCE, /controlClassName: "size-6"/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /border-0 rounded-none bg-transparent/u);
	// Only flush opts out of the floating backdrop; comment keeps PromptInput's shadow.
	assert.match(COMPOSER_SOURCE, /chrome: "p-2 shadow-none"/u);
	assert.equal((COMPOSER_SOURCE.match(/chrome: "p-2"/gu) ?? []).length, 1);
	// The floating comment bar keeps the default 16px ADS glyph; only the 24px
	// in-card controls step down to the purpose-drawn small one.
	assert.match(COMPOSER_SOURCE, /comment: \{[\s\S]*?iconSize: "medium",/u);
	assert.match(COMPOSER_SOURCE, /flush: \{[\s\S]*?iconSize: "small",/u);
	assert.match(COMPOSER_SOURCE, /<AddIcon label="" size=\{surface\.iconSize\} \/>/u);
	// Floating send/mic chrome comes from RovoComposerActionButton; flush can
	// still shrink the submit CTA via `submitButtonClassName`.
	assert.match(
		COMPOSER_SOURCE,
		/<RovoComposerActionButton[\s\S]*?submitButtonClassName=\{surface\.controlClassName\}/u,
	);
	assert.match(
		COMPOSER_SOURCE,
		/aria-label="Add"\s*className=\{surface\.controlClassName\}\s*size="icon"/u,
	);
	assert.doesNotMatch(COMPOSER_SOURCE, /icon-xs|icon-sm/u);
	assert.match(
		COMPOSER_SOURCE,
		/className=\{cn\([\s\S]*"w-full",[\s\S]*surface\.chrome,[\s\S]*className,[\s\S]*\)\}/u,
	);
	// The editor gutter is the floating shell's job, not this composer's.
	assert.doesNotMatch(COMPOSER_SOURCE, /input-group-control-container|prompt-input-placeholder/u);
});

test("the comment composer expands into the shared rich editor toolbar", () => {
	assert.match(
		COMPOSER_SOURCE,
		/import \{ EditorToolbar \} from "@\/components\/blocks\/editor-toolbar";/u,
	);
	assert.match(COMPOSER_SOURCE, /expandOnFocus\?: boolean;/u);
	assert.match(COMPOSER_SOURCE, /const isExpandableComment = variant === "comment" && expandOnFocus;/u);
	assert.match(
		COMPOSER_SOURCE,
		/<EditorToolbar[\s\S]*leadingSlot=\{<JiraCommentEditorToolbarLeading editor=\{editor\} \/>\}/u,
	);
	assert.match(COMPOSER_SOURCE, /showFormattingControls=\{false\}/u);
	assert.match(COMPOSER_SOURCE, /onFocusCapture=\{\(\) => \{[\s\S]*setIsExpanded\(true\)/u);
	assert.match(COMPOSER_SOURCE, /layout=\{isExpandableComment && isExpanded \? "stacked" : "auto"\}/u);
	assert.match(COMPOSER_SOURCE, /Type \/ai to ask Rovo or @ to mention someone…/u);
	assert.match(COMPOSER_SOURCE, /isExpandableComment && isExpanded && "min-h-36 py-3"/u);
	assert.match(COMPOSER_SOURCE, /insertEditorCommand\(editor, "\/Improve description "\)/u);
	assert.match(COMPOSER_SOURCE, /isExpandableComment && isExpanded \? null : \(/u);
});

test("disclosing Reply focuses the composer through the editor's own autofocus", () => {
	// The comment variant is a contentEditable tiptap editor that initialises
	// asynchronously (prompt-input.tsx maps `autoFocus` onto tiptap's
	// `autofocus: "end"`). Focusing a ref from a parent effect races that
	// initialisation and silently no-ops, so the disclosure must not try.
	assert.match(COMPOSER_SOURCE, /autoFocus\?: boolean;/u);
	assert.match(COMPOSER_SOURCE, /autoFocus = false,/u);
	assert.match(COMPOSER_SOURCE, /<PromptInputTextarea[\s\S]*autoFocus=\{autoFocus\}/u);
	// Only mounts on a Reply click in collapsible mode, so mounting is the moment
	// to take focus; in the always-mounted modes it must never steal focus.
	assert.match(COMMENT_SOURCE, /autoFocus=\{collapsible\}/u);
	assert.match(COMMENT_SOURCE, /key=\{replyTarget\?\.key \?\? "thread-reply"\}/u);
	assert.doesNotMatch(COMMENT_SOURCE, /textareaRef/u);
	// Collapsing still returns focus to the Reply button, which is a plain button.
	assert.match(
		COMMENT_SOURCE,
		/if \(!replyToggledRef\.current \|\| replyTarget !== null\) return;\s*activeReplyButtonRef\.current\?\.focus\(\);/u,
	);
});

test("disclosing Reply prefills a rich mention token for the target actor", () => {
	assert.match(COMPOSER_SOURCE, /prefillMentionRequest\?: \{ mention: RichTextMentionItem; requestKey: number \}/u);
	assert.match(COMPOSER_SOURCE, /prefillMentionRequest=\{prefillMentionRequest\}/u);
	assert.match(COMMENT_SOURCE, /function getReplyMention\(actor: JiraActivityActor\): RichTextMentionItem/u);
	assert.match(COMMENT_SOURCE, /category === "human"|actor\.kind === "person"/u);
	assert.match(COMMENT_SOURCE, /prefillMentionRequest=\{/u);
	assert.match(COMMENT_SOURCE, /replyMention \? \{ mention: replyMention, requestKey: 1 \}/u);
	assert.doesNotMatch(COMMENT_SOURCE, /setReplyDraft\(`@\$\{actor\.name\} `\)/u);
	assert.match(COMMENT_SOURCE, /setReplyTarget\(\{ key, actor \}\);\s*setReplyDraft\(""\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /prefillValueSyncGuardKeyRef\.current = requestKey;/u);
	assert.match(PROMPT_INPUT_SOURCE, /editor\.createNodeViews\(\);/u);
	assert.match(
		PROMPT_INPUT_SOURCE,
		/if \(initial && !prefillMentionRequestRef\.current\) \{\s*setComposerPlainText\(activeEditor, initial\);/u,
	);
	assert.match(
		PROMPT_INPUT_SOURCE,
		/prefillMentionRequest\?\.requestKey === prefillValueSyncGuardKeyRef\.current[\s\S]*currentText !== resolvedValue[\s\S]*return;/u,
	);
});
