export const FUTURE_CHAT_SIDEBAR_THREAD_RUN_INDICATOR_PADDING_CLASS = "pr-8";
export const FUTURE_CHAT_SIDEBAR_THREAD_ACTION_PADDING_CLASS = [
	"max-md:pr-8",
	"md:group-hover/menu-item:pr-8",
	"md:group-focus-within/menu-item:pr-8",
	"group-has-[[data-sidebar=menu-action][aria-expanded=true]]/menu-item:pr-8",
	"group-has-[[data-sidebar=menu-action][data-state=open]]/menu-item:pr-8",
].join(" ");

export function getFutureChatSidebarThreadContentPaddingClass(
	{
		showRunIndicator = false,
	}: Readonly<{
		showRunIndicator?: boolean;
	}>,
): string {
	return showRunIndicator
		? FUTURE_CHAT_SIDEBAR_THREAD_RUN_INDICATOR_PADDING_CLASS
		: FUTURE_CHAT_SIDEBAR_THREAD_ACTION_PADDING_CLASS;
}
