"use client";

import SydneyLockscreen from "@/components/arts/sydney-lockscreen";

export default function SydneyLockscreenDemo() {
	return (
		<div
			className="flex h-full min-h-[640px] w-full items-center justify-center"
			style={{ background: "#E9E6E0" }}
		>
			<div
				className="relative w-full overflow-hidden rounded-3xl"
				style={{
					background: "#F4F2EE",
					maxWidth: 820,
					height: 580,
				}}
			>
				<SydneyLockscreen />
			</div>
		</div>
	);
}
