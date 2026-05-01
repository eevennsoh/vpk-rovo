import { cn } from "@/lib/utils";

interface PersonalGraphTitleProps {
	className?: string;
	style?: React.CSSProperties;
}

const PERSONAL_GRAPH_TITLE_TEXT = "PERSONAL\nGRAPH";

export function PersonalGraphTitle({ className, style }: Readonly<PersonalGraphTitleProps>) {
	return (
		<h1 aria-label="PERSONAL GRAPH" className={cn("whitespace-pre-line", className)} style={style}>
			{PERSONAL_GRAPH_TITLE_TEXT}
		</h1>
	);
}
