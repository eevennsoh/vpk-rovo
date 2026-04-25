import type { Experimental_GeneratedImage } from "ai";

import { cn } from "@/lib/utils";

export interface ImageProps extends Experimental_GeneratedImage {
	className?: string;
	alt?: string;
}

export function Image({
	base64,
	uint8Array: _uint8Array,
	mediaType,
	className,
	alt = "",
	...props
}: Readonly<ImageProps>) {
	return (
		<img
			alt={alt}
			src={`data:${mediaType};base64,${base64}`}
			className={cn("h-auto max-w-full overflow-hidden rounded-md", className)}
			{...props}
		/>
	);
}
