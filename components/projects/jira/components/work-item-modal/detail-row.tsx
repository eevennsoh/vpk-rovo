"use client";

import { ReactNode } from "react";

interface DetailRowProps {
	label: string;
	children: ReactNode;
	noPadding?: boolean;
}

export function DetailRow({ label, children, noPadding }: Readonly<DetailRowProps>) {
	return (
		<div className={noPadding ? "" : "pb-3"}>
			<div className="flex justify-between">
				<div style={{ width: "126px", display: "flex", alignItems: "center" }}>
					<span className="text-sm font-medium text-text-subtlest">
						{label}
					</span>
				</div>
				<div className="px-2" style={{ flex: 1 }}>{children}</div>
			</div>
		</div>
	);
}
