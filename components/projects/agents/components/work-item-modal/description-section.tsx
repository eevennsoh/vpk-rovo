"use client";

import { useState } from "react";
import { token } from "@/lib/tokens";
import Heading from "@/components/blocks/shared-ui/heading";
import { InlineEdit } from "@/components/ui/inline-edit";

export function Description() {
	const [description, setDescription] = useState("");

	return (
		<div style={{ marginBottom: token("space.300") }}>
			<Heading size="small" as="h3">
				Description
			</Heading>
			<div style={{ marginTop: token("space.100") }}>
				<InlineEdit
					value={description}
					placeholder="Edit description"
					onConfirm={setDescription}
					className="-ml-2"
				/>
			</div>
		</div>
	);
}
