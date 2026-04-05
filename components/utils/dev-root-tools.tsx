"use client";

import { DevReactGrabMount } from "@/components/utils/dev-react-grab-mount";
import { DevTurbopackCssChunkGuard } from "@/components/utils/dev-turbopack-css-chunk-guard";

export function DevRootTools() {
	return (
		<>
			<DevReactGrabMount />
			<DevTurbopackCssChunkGuard />
		</>
	);
}
