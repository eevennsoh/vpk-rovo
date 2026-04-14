"use client";

import React from "react";
import { token } from "@/lib/tokens";

import { Button } from "@/components/ui/button";
import { RovoIcon } from "@/components/ui/logo";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import MagicWandIcon from "@atlaskit/icon/core/magic-wand";

export function AIToolsSection(): React.ReactElement {
	return (
		<div
			style={{
				padding: `${token("space.050")} ${token("space.050")}`,
				borderRight: `1px solid ${token("color.border")}`,
			}}
		>
			<div className="flex items-center">
				<Button className="gap-2" size="sm" variant="ghost">
					<RovoIcon label="Rovo" size="xxsmall" />
					Ask Rovo
					<ChevronDownIcon label="" size="small" />
				</Button>

				<Button className="gap-2" size="sm" variant="ghost">
					<MagicWandIcon label="" size="small" />
					Improve writing
				</Button>
			</div>
		</div>
	);
}
