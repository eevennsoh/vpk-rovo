"use client";

import { useEffect, useState } from "react";
import { token } from "@/lib/tokens";
import Heading from "@/components/blocks/shared-ui/heading";
import { InlineEdit } from "@/components/ui/inline-edit";
import { useWorkItemData } from "@/app/contexts/context-work-item-modal";

export function Description() {
	const workItem = useWorkItemData();
	const [description, setDescription] = useState(workItem.description ?? "");

	useEffect(() => {
		setDescription(workItem.description ?? "");
	}, [workItem.description]);

	return (
		<div style={{ marginBottom: token("space.300") }}>
			<Heading size="small" as="h3">
				Description
			</Heading>
			<div style={{ marginTop: token("space.100") }}>
				<InlineEdit
					value={description}
					placeholder="Add RFP requirements, buyer priorities, win themes, and response notes"
					onConfirm={setDescription}
					className="-ml-2"
					multiline
				/>
			</div>
		</div>
	);
}
