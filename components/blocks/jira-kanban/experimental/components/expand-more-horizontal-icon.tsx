import type { CSSProperties } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const EXPAND_MASK_STYLE = {
	WebkitMaskImage: "url(/icons/expand.svg)",
	maskImage: "url(/icons/expand.svg)",
	WebkitMaskPosition: "center",
	maskPosition: "center",
	WebkitMaskRepeat: "no-repeat",
	maskRepeat: "no-repeat",
	WebkitMaskSize: "16px 16px",
	maskSize: "16px 16px",
} satisfies CSSProperties;

const EXPAND_MORE_MASK_STYLE = {
	...EXPAND_MASK_STYLE,
	WebkitMaskImage: "url(/icons/expand-more.svg)",
	maskImage: "url(/icons/expand-more.svg)",
} satisfies CSSProperties;

export function ExpandMoreHorizontalIcon({ more }: Readonly<{ more: boolean }>) {
	return (
		<Icon
			className="size-4! text-icon-subtle"
			render={
				<span className="relative size-4">
					<span
						aria-hidden="true"
						className={cn(
							"absolute inset-0 bg-current transition-[opacity,scale] duration-normal ease-in-out",
							"motion-reduce:scale-x-100 motion-reduce:transition-opacity",
							more ? "scale-x-110 opacity-0" : "scale-x-100 opacity-100",
						)}
						style={EXPAND_MASK_STYLE}
					/>
					<span
						aria-hidden="true"
						className={cn(
							"absolute inset-0 bg-current transition-[opacity,scale] duration-normal ease-in-out",
							"motion-reduce:scale-x-100 motion-reduce:transition-opacity",
							more ? "scale-x-100 opacity-100" : "scale-x-75 opacity-0",
						)}
						style={EXPAND_MORE_MASK_STYLE}
					/>
				</span>
			}
		/>
	);
}
