import AttachmentIcon from "@atlaskit/icon/core/attachment";
import BoardIcon from "@atlaskit/icon/core/board";
import CalendarIcon from "@atlaskit/icon/core/calendar";
import FormIcon from "@atlaskit/icon/core/form";
import GlobeIcon from "@atlaskit/icon/core/globe";
import PageIcon from "@atlaskit/icon/core/page";
import TableIcon from "@atlaskit/icon/core/table";

export interface TabDefinition {
	label: string;
	icon: typeof GlobeIcon;
	hasContent: boolean;
}

export const JIRA_TABS: readonly TabDefinition[] = [
	{ label: "Summary", icon: GlobeIcon, hasContent: false },
	{ label: "Board", icon: BoardIcon, hasContent: true },
	{ label: "List", icon: TableIcon, hasContent: false },
	{ label: "Forms", icon: FormIcon, hasContent: false },
	{ label: "Pages", icon: PageIcon, hasContent: false },
	{ label: "Attachments", icon: AttachmentIcon, hasContent: false },
	{ label: "Calendar", icon: CalendarIcon, hasContent: false },
] as const;
