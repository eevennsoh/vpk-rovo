export const ROVO_APP_SIDEBAR_THREAD_RUN_INDICATOR_PADDING_CLASS = "pr-6";
export const ROVO_APP_SIDEBAR_THREAD_ACTION_PADDING_CLASS = [
	"max-md:pr-6",
	"md:group-hover/menu-item:pr-6",
	"md:group-focus-within/menu-item:pr-6",
	"group-has-[[data-sidebar=menu-action][aria-expanded=true]]/menu-item:pr-6",
	"group-has-[[data-sidebar=menu-action][data-state=open]]/menu-item:pr-6",
].join(" ");

export function getRovoAppSidebarThreadContentPaddingClass(
	{
		showRunIndicator = false,
	}: Readonly<{
		showRunIndicator?: boolean;
	}>,
): string {
	return showRunIndicator
		? ROVO_APP_SIDEBAR_THREAD_RUN_INDICATOR_PADDING_CLASS
		: ROVO_APP_SIDEBAR_THREAD_ACTION_PADDING_CLASS;
}

/** Rounded row surfaces; list horizontal inset remains on the thread list wrapper (`px-3`). */
export function getRovoAppSidebarThreadSidebarNavItemClassName(
	{
		showRunIndicator = false,
	}: Readonly<{
		showRunIndicator?: boolean;
	}>,
): string {
	const base = ["rounded-md", "p-1"].join(" ");

	const buttonPad = showRunIndicator
		? "[&>button]:pr-6"
		: ROVO_APP_SIDEBAR_THREAD_ACTION_PADDING_CLASS.split(/\s+/)
				.filter(Boolean)
				.map((c) => `[&>button]:${c}`)
				.join(" ");

	return `${base} ${buttonPad}`;
}
