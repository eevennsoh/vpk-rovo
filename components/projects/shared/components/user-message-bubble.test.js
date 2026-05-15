const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const USER_MESSAGE_BUBBLE_SOURCE = fs.readFileSync(
	path.join(__dirname, "user-message-bubble.tsx"),
	"utf8",
);
const THREAD_MESSAGE_ROOT_SOURCE = fs.readFileSync(
	path.join(__dirname, "../thread-message/thread-message-root.tsx"),
	"utf8",
);
const SIDEBAR_MESSAGE_BUBBLE_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../sidebar-chat/components/message-bubble.tsx"),
	"utf8",
);
const CHAT_PANEL_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../sidebar-chat/page.tsx"),
	"utf8",
);
const ROVO_CHAT_CONTEXT_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "app/contexts/context-rovo-chat.tsx"),
	"utf8",
);

test("shared user message bubble exposes copy and edit prompt actions", () => {
	assert.match(USER_MESSAGE_BUBBLE_SOURCE, /MessageCopyAction/);
	assert.match(USER_MESSAGE_BUBBLE_SOURCE, /MessageEditAction/);
	assert.match(USER_MESSAGE_BUBBLE_SOURCE, /MessageResponse/);
	assert.match(USER_MESSAGE_BUBBLE_SOURCE, /<InlineEdit/);
	assert.match(USER_MESSAGE_BUBBLE_SOURCE, /showPromptActions/);
	assert.match(USER_MESSAGE_BUBBLE_SOURCE, /onConfirm=\{\(nextValue\) => void onEdit\(nextValue\)\}/);
	assert.match(
		USER_MESSAGE_BUBBLE_SOURCE,
		/<MessageResponse className="font-medium text-inherit \[&_\*\]:text-inherit">[\s\S]*\{messageText\}[\s\S]*<\/MessageResponse>/u,
	);
	assert.match(USER_MESSAGE_BUBBLE_SOURCE, /fitContent=\{!isEditing\}/);
});

test("sidebar and floating chat thread messages wire compact edit state", () => {
	assert.match(THREAD_MESSAGE_ROOT_SOURCE, /editingMessageId\?: string \| null;/);
	assert.match(THREAD_MESSAGE_ROOT_SOURCE, /showUserMessagePromptActions\?: boolean;/);
	assert.match(THREAD_MESSAGE_ROOT_SOURCE, /isEditing=\{editingMessageId === message\.id\}/);
	assert.match(THREAD_MESSAGE_ROOT_SOURCE, /showPromptActions=\{showUserMessagePromptActions\}/);

	assert.match(SIDEBAR_MESSAGE_BUBBLE_SOURCE, /showUserMessagePromptActions/);
	assert.match(CHAT_PANEL_SOURCE, /const \{[\s\S]*editMessage,[\s\S]*editingMessageId,[\s\S]*setEditingMessageId,[\s\S]*\} = useRovoChat\(\);/u);
	assert.match(CHAT_PANEL_SOURCE, /ConversationScrollButton/);
	assert.match(
		CHAT_PANEL_SOURCE,
		/<ConversationScrollButton className="z-10 transition-all" \/>/u,
	);
	assert.match(
		CHAT_PANEL_SOURCE,
		/onEditMessage=\{\(messageId, nextText\) =>\s*editMessage\(messageId, nextText, resolvedSendPromptOptions\)\s*\}/u,
	);
});

test("compact chat edit uses AI SDK message replacement semantics", () => {
	assert.match(
		ROVO_CHAT_CONTEXT_SOURCE,
		/editMessage: \(messageId: string, nextText: string, options\?: SendPromptOptions\) => Promise<void>;/,
	);
	assert.match(
		ROVO_CHAT_CONTEXT_SOURCE,
		/await sendMessage\(messagePayload, bodyPayload\);/,
	);
	assert.match(
		ROVO_CHAT_CONTEXT_SOURCE,
		/messageId,\s*\};/u,
	);
	assert.match(
		ROVO_CHAT_CONTEXT_SOURCE,
		/setQueuedPrompts\(\[\]\);/,
	);
});
