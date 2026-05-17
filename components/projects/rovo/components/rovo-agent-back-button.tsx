"use client";

import ArrowLeftIcon from "@atlaskit/icon/core/arrow-left";

import { useRovoSelectedAgent } from "@/app/contexts";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function RovoAgentBackButton() {
	const { isCustomAgentSelected, resetAgentToRovo } = useRovoSelectedAgent();

	return isCustomAgentSelected ? (
		<Button aria-label="Back to Rovo" size="icon" variant="ghost" onClick={resetAgentToRovo}>
			<Icon aria-hidden render={<ArrowLeftIcon label="" />} />
		</Button>
	) : null;
}
