import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

type PersonalGraphProps = React.ComponentProps<"main">;

export default function PersonalGraph({
	className,
	...props
}: Readonly<PersonalGraphProps>) {
	return (
		<main
			aria-label="Personal Graph"
			className={cn(
				"flex min-h-svh items-center justify-center bg-surface px-6 text-text",
				className,
			)}
			{...props}
		>
			<h1 style={{ font: token("font.heading.xxlarge") }}>
				Personal Graph
			</h1>
		</main>
	);
}
