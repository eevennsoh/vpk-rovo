import { token } from "@/lib/tokens";

export const chatStyles = {
	loadingWidget: {
		padding: token("space.200"),
		backgroundColor: token("color.background.neutral.subtle"),
		borderRadius: token("radius.large"),
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-start",
		color: token("color.text.subtlest"),
		font: token("font.body"),
		marginLeft: token("space.300"),
		marginRight: token("space.300"),
	},
	chatPanel: {
		width: "100%",
		height: "100%",
		minHeight: 0,
		backgroundColor: token("elevation.surface"),
		borderWidth: "1px",
		borderStyle: "solid",
		borderColor: token("color.border"),
		borderRadius: token("radius.xlarge"),
		display: "flex",
		flexDirection: "column" as const,
		overflow: "hidden" as const,
	},
	scrollContainer: {
		flex: 1,
		minHeight: 0,
		overflowY: "auto" as const,
		display: "flex",
		flexDirection: "column" as const,
	},
	messagesContainer: {
		paddingTop: token("space.150"),
		paddingBottom: token("space.400"), // 32px gap from ChatComposer
		display: "flex",
		flexDirection: "column" as const,
		flex: 1,
		justifyContent: "flex-end",
	},
	thinkingContainer: {
		marginTop: token("space.300"),
		paddingLeft: token("space.150"),
		paddingRight: token("space.150"),
	},
	emptyState: {
		display: "flex",
		flexDirection: "column" as const,
		alignItems: "center",
		width: "100%",
		paddingLeft: token("space.150"),
		paddingRight: token("space.150"),
	},
} as const;

export const HOTEL_LOADING_MESSAGES = ["Accessing calendar...", "Confirming travel policy...", "Searching hotels..."];
