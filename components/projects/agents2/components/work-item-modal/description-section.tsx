"use client";

import { useEffect, useState } from "react";
import { token } from "@/lib/tokens";
import { Field, FieldLabel } from "@/components/ui/field";
import { InlineEdit } from "@/components/ui/inline-edit";
import { useWorkItemData } from "@/app/contexts/context-work-item-modal";

export function Description() {
	const workItem = useWorkItemData();
	const [description, setDescription] = useState(workItem.description ?? "");

	useEffect(() => {
		setDescription(workItem.description ?? "");
	}, [workItem.description]);

	return (
		<Field className="min-w-0">
			<FieldLabel
				htmlFor="agents-description"
				className="text-text"
				style={{ font: token("font.heading.small") }}
			>
				Description
			</FieldLabel>
			<InlineEdit
				value={description}
				placeholder="Add landing-page goals, audience needs, demo proof, and voice notes"
				onConfirm={setDescription}
				editButtonLabel="Edit description"
				inputProps={{ id: "agents-description" }}
				textareaProps={{ variant: "subtle", className: "-ml-1.5" }}
				readViewClassName="-ml-1.5 border-transparent bg-transparent hover:bg-bg-input-hovered active:bg-bg-input-pressed"
				className="min-w-0"
				multiline
			/>
		</Field>
	);
}
